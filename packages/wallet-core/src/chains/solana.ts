/**
 * Solana Mainnet chain adapter: ed25519, BIP44 (SLIP-0010, fully hardened)
 * path m/44'/501'/{account}'/0'. Direct client-to-RPC access via
 * @solana/web3.js — no Anthea backend in the path.
 *
 * ed25519 has no defined non-hardened child derivation (SLIP-0010), so every
 * path segment here is hardened — this cannot reuse the secp256k1 HD scheme
 * used for Ethereum.
 *
 * Key derivation and signing use only pure-JS audited primitives
 * (@noble/hashes, @noble/curves) so they run unchanged in browsers, Node and
 * React Native. @solana/web3.js is loaded lazily, and only for RPC calls
 * (balance, send), so key handling never depends on Node's `Buffer`.
 */
import { ed25519 } from "@noble/curves/ed25519";
import { hmac } from "@noble/hashes/hmac";
import { sha512 } from "@noble/hashes/sha2";
import bs58 from "bs58";
import { formatUnits, parseUnits } from "viem";
import { mnemonicToSeed } from "../mnemonic.js";
import type { ChainAccount, RpcConfig } from "./types.js";

export const SOLANA_DECIMALS = 9;
export const SOLANA_DEFAULT_RPC = "https://api.mainnet-beta.solana.com";

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
  return import("@solana/web3.js");
}

function assertValidAddress(web3: Awaited<ReturnType<typeof loadWeb3>>, address: string) {
  try {
    return new web3.PublicKey(address);
  } catch {
    throw new Error(`Invalid Solana address: ${address}`);
  }
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
    const connection = new web3.Connection(config?.rpcUrl ?? SOLANA_DEFAULT_RPC, "confirmed");
    const lamports = await connection.getBalance(new web3.PublicKey(this.#keypair.publicKey));
    return formatUnits(BigInt(lamports), SOLANA_DECIMALS);
  }

  async sendNative(to: string, amount: string, config?: RpcConfig): Promise<string> {
    const web3 = await loadWeb3();
    const destination = assertValidAddress(web3, to);
    const lamports = parseUnits(amount, SOLANA_DECIMALS);
    if (lamports <= 0n) {
      throw new Error("Amount must be greater than zero");
    }
    const connection = new web3.Connection(config?.rpcUrl ?? SOLANA_DEFAULT_RPC, "confirmed");
    const signer = web3.Keypair.fromSecretKey(this.#keypair.secretKey);
    const transaction = new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: signer.publicKey,
        toPubkey: destination,
        lamports,
      }),
    );
    return web3.sendAndConfirmTransaction(connection, transaction, [signer]);
  }
}
