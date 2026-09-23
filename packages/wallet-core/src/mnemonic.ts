/**
 * BIP39 mnemonic generation/validation and seed derivation.
 *
 * Chain-specific key derivation (BIP44 paths, curves) lives in `./chains/*`
 * — this module only handles the mnemonic itself, since Ethereum (secp256k1)
 * and Solana (ed25519) derive from the same seed via different paths/curves.
 */
import { english, generateMnemonic as viemGenerateMnemonic } from "viem/accounts";
import { mnemonicToSeedSync, validateMnemonic as scureValidateMnemonic } from "@scure/bip39";
import { wordlist as englishWordlist } from "@scure/bip39/wordlists/english";

export type MnemonicStrength = 128 | 256; // 12-word or 24-word mnemonic

/** Generate a new BIP39 mnemonic. Defaults to 12 words (128 bits of entropy). */
export function generateMnemonic(strength: MnemonicStrength = 128): string {
  return viemGenerateMnemonic(english, strength);
}

/** Normalize user-entered mnemonic text before validation/derivation. */
export function normalizeMnemonic(mnemonic: string): string {
  return mnemonic.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Validate that a mnemonic is well-formed BIP39 (correct wordlist + checksum). */
export function validateMnemonic(mnemonic: string): boolean {
  return scureValidateMnemonic(normalizeMnemonic(mnemonic), englishWordlist);
}

/** Raw BIP39 seed bytes (PBKDF2 over the mnemonic), used for non-EVM (e.g. Solana) key derivation. */
export function mnemonicToSeed(mnemonic: string): Uint8Array {
  if (!validateMnemonic(mnemonic)) {
    throw new Error("Invalid mnemonic");
  }
  return mnemonicToSeedSync(normalizeMnemonic(mnemonic));
}
