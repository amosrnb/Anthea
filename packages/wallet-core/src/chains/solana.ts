/**
 * Solana Mainnet chain adapter: ed25519, BIP44 (SLIP-0010, fully hardened)
 * path m/44'/501'/{account}'/0'. Direct client-to-RPC access via
 * @solana/web3.js — no Anthea backend in the path.
 *
 * ed25519 has no defined non-hardened child derivation (SLIP-0010), so every
 * path segment here is hardened — this cannot reuse the secp256k1 HD scheme
 * used for Ethereum.
 */
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { derivePath } from "ed25519-hd-key";
import bs58 from "bs58";
import nacl from "tweetnacl";
import { formatUnits, parseUnits } from "viem";
import { mnemonicToSeed } from "../mnemonic.js";
import type { ChainAccount, RpcConfig } from "./types.js";

export const SOLANA_DECIMALS = 9;
export const SOLANA_DEFAULT_RPC = "https://api.mainnet-beta.solana.com";

export function solanaDerivationPath(accountIndex: number): string {
  return `m/44'/501'/${accountIndex}'/0'`;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Derive the SLIP-0010 ed25519 keypair at m/44'/501'/{accountIndex}'/0'. */
export function deriveSolanaKeypair(mnemonic: string, accountIndex: number): Keypair {
  const seed = mnemonicToSeed(mnemonic); // throws on invalid mnemonic
  const { key } = derivePath(solanaDerivationPath(accountIndex), bytesToHex(seed));
  return Keypair.fromSeed(key);
}

function connectionFor(config?: RpcConfig): Connection {
  return new Connection(config?.rpcUrl ?? SOLANA_DEFAULT_RPC, "confirmed");
}

function assertValidAddress(address: string): PublicKey {
  try {
    return new PublicKey(address);
  } catch {
    throw new Error(`Invalid Solana address: ${address}`);
  }
}

export class SolanaAccount implements ChainAccount {
  readonly chainId = "solana" as const;
  readonly #keypair: Keypair;

  constructor(keypair: Keypair) {
    this.#keypair = keypair;
  }

  get address(): string {
    return this.#keypair.publicKey.toBase58();
  }

  /** Sign an arbitrary message with ed25519 without broadcasting anything. Returns a base58-encoded signature. */
  async signMessage(message: string): Promise<string> {
    const signature = nacl.sign.detached(new TextEncoder().encode(message), this.#keypair.secretKey);
    return bs58.encode(signature);
  }

  async getNativeBalance(config?: RpcConfig): Promise<string> {
    const connection = connectionFor(config);
    const lamports = await connection.getBalance(this.#keypair.publicKey);
    return formatUnits(BigInt(lamports), SOLANA_DECIMALS);
  }

  async sendNative(to: string, amount: string, config?: RpcConfig): Promise<string> {
    const destination = assertValidAddress(to);
    const lamports = parseUnits(amount, SOLANA_DECIMALS);
    if (lamports <= 0n) {
      throw new Error("Amount must be greater than zero");
    }
    const connection = connectionFor(config);
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: this.#keypair.publicKey,
        toPubkey: destination,
        lamports,
      }),
    );
    return sendAndConfirmTransaction(connection, transaction, [this.#keypair]);
  }
}
