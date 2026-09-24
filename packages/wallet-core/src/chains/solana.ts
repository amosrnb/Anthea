/**
 * Solana chain adapter (Mainnet, or Devnet for testing): ed25519, BIP44 (SLIP-0010, fully hardened)
 * path m/44'/501'/{account}'/0'. Direct client-to-RPC access via
 * @solana/web3.js — no Anthea backend in the path.
 *
 * ed25519 has no defined non-hardened child derivation (SLIP-0010), so every
 * path segment here is hardened — this cannot reuse the secp256k1 HD scheme
 * used for Ethereum.
 *
 * Key derivation and signing use only pure-JS audited primitives
 * (@noble/hashes, @noble/curves) so they run unchanged in browsers, Node and
 * React Native. @solana/web3.js is used only for RPC calls (balance, fees,
 * send, status); its browser and React Native builds bring their own
 * `buffer` package. It is imported statically: a dynamic import() becomes a
 * separate lazy bundle in Metro's dev server, which fails to resolve when
 * web3.js lives outside the app's folder (as in this monorepo).
 */
import { ed25519 } from "@noble/curves/ed25519";
import { hmac } from "@noble/hashes/hmac";
import { sha512 } from "@noble/hashes/sha2";
import * as solanaWeb3 from "@solana/web3.js";
import bs58 from "bs58";
import { formatUnits, parseUnits } from "viem";
import { mnemonicToSeed } from "../mnemonic.js";
import type { ChainAccount, Network, RpcConfig, TransactionStatus } from "./types.js";

export const SOLANA_DECIMALS = 9;
export const SOLANA_DEFAULT_RPC = "https://api.mainnet-beta.solana.com";
export const SOLANA_DEVNET_RPC = "https://api.devnet.solana.com";

/** Fee for a single-signature transaction; used if the RPC can't quote one. */
const BASE_FEE_LAMPORTS = 5000n;
/** How much the public Devnet faucet hands out per request, at most. */
const MAX_AIRDROP_SOL = 2;

/** Public RPC endpoint for a network (rate-limited; pass `rpcUrl` for production use). */
export function solanaDefaultRpc(network: Network = "mainnet"): string {
  return network === "testnet" ? SOLANA_DEVNET_RPC : SOLANA_DEFAULT_RPC;
}

/** Block explorer link for a transaction signature. */
export function solanaExplorerTxUrl(signature: string, network: Network = "mainnet"): string {
  return `https://explorer.solana.com/tx/${signature}${network === "testnet" ? "?cluster=devnet" : ""}`;
}

const HARDENED_OFFSET = 0x80000000;

export function solanaDerivationPath(accountIndex: number): string {
  return `m/44'/501'/${accountIndex}'/0'`;
}

/** An ed25519 keypair in the same layout as @solana/web3.js `Keypair`. */
export interface SolanaKeypair {
  /** 32-byte ed25519 public key (the account address, before base58 encoding). */
  readonly publicKey: Uint8Array;
  /** 64 bytes: 32-byte private seed followed by the 32-byte public key. */
  readonly secretKey: Uint8Array;
}

/** SLIP-0010 ed25519 derivation. Every segment of `path` must be hardened. */
function slip10DeriveEd25519(seed: Uint8Array, path: string): Uint8Array {
  let I = hmac(sha512, new TextEncoder().encode("ed25519 seed"), seed);
  let key = I.slice(0, 32);
  let chainCode = I.slice(32);
  for (const segment of path.split("/").slice(1)) {
    if (!segment.endsWith("'")) {
      throw new Error(`ed25519 derivation requires hardened path segments: ${path}`);
    }
    const index = Number(segment.slice(0, -1)) + HARDENED_OFFSET;
    const data = new Uint8Array(37); // 0x00 || key || ser32(index)
    data.set(key, 1);
    new DataView(data.buffer).setUint32(33, index);
    I = hmac(sha512, chainCode, data);
    key = I.slice(0, 32);
    chainCode = I.slice(32);
  }
  return key;
}

/** Derive the SLIP-0010 ed25519 keypair at m/44'/501'/{accountIndex}'/0'. */
export function deriveSolanaKeypair(mnemonic: string, accountIndex: number): SolanaKeypair {
  const seed = mnemonicToSeed(mnemonic); // throws on invalid mnemonic
  const privateSeed = slip10DeriveEd25519(seed, solanaDerivationPath(accountIndex));
  const publicKey = ed25519.getPublicKey(privateSeed);
  const secretKey = new Uint8Array(64);
  secretKey.set(privateSeed, 0);
  secretKey.set(publicKey, 32);
  return { publicKey, secretKey };
}

async function loadWeb3() {
  return solanaWeb3;
}

function assertValidAddress(web3: Awaited<ReturnType<typeof loadWeb3>>, address: string) {
  try {
    return new web3.PublicKey(address);
  } catch {
    throw new Error(`Invalid Solana address: ${address}`);
  }
}

function connectionFor(web3: Awaited<ReturnType<typeof loadWeb3>>, config?: RpcConfig) {
  return new web3.Connection(config?.rpcUrl ?? solanaDefaultRpc(config?.network), "confirmed");
}

function parsePositiveAmount(amount: string): bigint {
  const lamports = parseUnits(amount, SOLANA_DECIMALS);
  if (lamports <= 0n) {
    throw new Error("Amount must be greater than zero");
  }
  return lamports;
}

export class SolanaAccount implements ChainAccount {
  readonly chainId = "solana" as const;
  readonly #keypair: SolanaKeypair;
  readonly address: string;

  constructor(keypair: SolanaKeypair) {
    this.#keypair = keypair;
    this.address = bs58.encode(keypair.publicKey);
  }

  /** Sign an arbitrary message with ed25519 without broadcasting anything. Returns a base58-encoded signature. */
  async signMessage(message: string): Promise<string> {
    const signature = ed25519.sign(new TextEncoder().encode(message), this.#keypair.secretKey.slice(0, 32));
    return bs58.encode(signature);
  }

  async getNativeBalance(config?: RpcConfig): Promise<string> {
    const web3 = await loadWeb3();
    const lamports = await connectionFor(web3, config).getBalance(new web3.PublicKey(this.#keypair.publicKey));
    return formatUnits(BigInt(lamports), SOLANA_DECIMALS);
  }

  async estimateNativeFee(to: string, amount: string, config?: RpcConfig): Promise<string> {
    const web3 = await loadWeb3();
    const destination = assertValidAddress(web3, to);
    const lamports = parsePositiveAmount(amount);
    const connection = connectionFor(web3, config);
    const transaction = this.#transfer(web3, destination, lamports);
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new web3.PublicKey(this.#keypair.publicKey);
    const { value } = await connection.getFeeForMessage(transaction.compileMessage());
    return formatUnits(value == null ? BASE_FEE_LAMPORTS : BigInt(value), SOLANA_DECIMALS);
  }

  async sendNative(to: string, amount: string, config?: RpcConfig): Promise<string> {
    const web3 = await loadWeb3();
    const destination = assertValidAddress(web3, to);
    const lamports = parsePositiveAmount(amount);
    const connection = connectionFor(web3, config);

    // A transfer that would create a new account below the rent-exempt
    // minimum is rejected by the network; say so up front.
    const [recipientBalance, rentExempt] = await Promise.all([
      connection.getBalance(destination),
      connection.getMinimumBalanceForRentExemption(0),
    ]);
    if (recipientBalance === 0 && lamports < BigInt(rentExempt)) {
      throw new Error(
        `This address has no SOL yet, so the first transfer to it must be at least ${formatUnits(BigInt(rentExempt), SOLANA_DECIMALS)} SOL`,
      );
    }

    const signer = web3.Keypair.fromSecretKey(this.#keypair.secretKey);
    const transaction = this.#transfer(web3, destination, lamports);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = signer.publicKey;
    transaction.sign(signer);
    // Preflight simulation rejects e.g. an insufficient balance before anything is broadcast.
    return connection.sendRawTransaction(transaction.serialize());
  }

  async getTransactionStatus(signature: string, config?: RpcConfig): Promise<TransactionStatus> {
    const web3 = await loadWeb3();
    const { value } = await connectionFor(web3, config).getSignatureStatuses([signature], {
      searchTransactionHistory: true,
    });
    const status = value[0];
    if (!status) return "pending";
    if (status.err) return "failed";
    return status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized" ? "confirmed" : "pending";
  }

  /**
   * Ask the public Devnet faucet for free test SOL (at most 2 per request).
   * Testnet only. The faucet is heavily rate-limited, so this often fails
   * with a 429; https://faucet.solana.com is the fallback.
   */
  async requestTestnetAirdrop(amount: string, config?: RpcConfig): Promise<string> {
    if (config?.network !== "testnet") {
      throw new Error("Airdrops are only available on the test network");
    }
    const lamports = parsePositiveAmount(amount);
    if (lamports > parseUnits(String(MAX_AIRDROP_SOL), SOLANA_DECIMALS)) {
      throw new Error(`The Devnet faucet gives at most ${MAX_AIRDROP_SOL} SOL per request`);
    }
    const web3 = await loadWeb3();
    return connectionFor(web3, config).requestAirdrop(new web3.PublicKey(this.#keypair.publicKey), Number(lamports));
  }

  #transfer(web3: Awaited<ReturnType<typeof loadWeb3>>, destination: InstanceType<typeof web3.PublicKey>, lamports: bigint) {
    return new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: new web3.PublicKey(this.#keypair.publicKey),
        toPubkey: destination,
        lamports,
      }),
    );
  }
}
