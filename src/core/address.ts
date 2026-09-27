/**
 * Address formats (BUILD_PLAN Phase 1.7): EVM with EIP-55 checksum, Bitcoin SegWit (bech32 for v0, bech32m for
 * v1+, `bc1`/`tb1`), Solana base58 with exactly 32 bytes. Pure format checks; the warning logic (own address, known
 * recipient, look-alikes) lives on top of these in Phase 7. No I/O.
 */
import { base58, bech32, bech32m } from '@scure/base';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { utf8 } from './bytes';

export type Family = 'evm' | 'sol' | 'btc';
export type Network = 'mainnet' | 'testnet';

const HEX40 = /^0x[0-9a-fA-F]{40}$/;

/** EIP-55 mixed-case checksum encoding of a 20-byte hex address. */
export function toChecksumAddress(address: string): string {
  if (!HEX40.test(address)) throw new Error('Not a 20-byte hex address');
  const lower = address.slice(2).toLowerCase();
  const hash = bytesToHex(keccak_256(utf8(lower)));
  let out = '0x';
  for (let i = 0; i < 40; i++) out += parseInt(hash[i]!, 16) >= 8 ? lower[i]!.toUpperCase() : lower[i];
  return out;
}

/** All-lower and all-upper hex are accepted without checksum; mixed case must match EIP-55 exactly. */
export function isValidEvmAddress(address: string): boolean {
  if (!HEX40.test(address)) return false;
  const body = address.slice(2);
  if (body === body.toLowerCase() || body === body.toUpperCase()) return true;
  return toChecksumAddress(address) === address;
}

export interface SegwitAddress {
  network: Network;
  version: number;
  program: Uint8Array;
}

const HRP: Record<string, Network> = { bc: 'mainnet', tb: 'testnet' };

/** Decodes a native SegWit address (BIP173/BIP350) or returns null. Legacy and P2SH addresses are not supported in v1. */
export function parseBitcoinAddress(address: string): SegwitAddress | null {
  // Mixed case is invalid in bech32; all-upper is valid and decoded as lower case.
  if (address !== address.toLowerCase() && address !== address.toUpperCase()) return null;
  const a = address.toLowerCase();
  for (const codec of [bech32, bech32m]) {
    let decoded: { prefix: string; words: number[] };
    try {
      decoded = codec.decode(a as `${string}1${string}`, 90);
    } catch {
      continue;
    }
    const network = HRP[decoded.prefix];
    const [version, ...data] = decoded.words;
    if (!network || version === undefined || version > 16) return null;
    // v0 must use bech32, v1+ bech32m (BIP350).
    if ((version === 0) !== (codec === bech32)) return null;
    let program: Uint8Array;
    try {
      program = codec.fromWords(data);
    } catch {
      return null;
    }
    if (program.length < 2 || program.length > 40) return null;
    if (version === 0 && program.length !== 20 && program.length !== 32) return null;
    if (version === 1 && program.length !== 32) return null;
    return { network, version, program };
  }
  return null;
}

export const isValidBitcoinAddress = (address: string, network: Network): boolean => parseBitcoinAddress(address)?.network === network;

/** Solana addresses are base58 encodings of exactly 32 bytes. */
export function isValidSolanaAddress(address: string): boolean {
  if (address.length < 32 || address.length > 44) return false;
  try {
    return base58.decode(address).length === 32;
  } catch {
    return false;
  }
}

/** The family an address belongs to, or null if it is none of the supported formats. */
export function detectFamily(address: string): Family | null {
  if (isValidEvmAddress(address)) return 'evm';
  if (parseBitcoinAddress(address)) return 'btc';
  if (isValidSolanaAddress(address)) return 'sol';
  return null;
}
