/**
 * Key derivation (BUILD_PLAN 5.1). Public data (addresses) and private keys are produced by separate functions so
 * that code which only needs addresses never touches private keys. No I/O.
 *
 * - EVM: m/44'/60'/0'/0/{i}, one address for all EVM networks
 * - Solana: m/44'/501'/{i}'/0' (SLIP-0010 ed25519; account 0 = Phantom/Solflare default)
 * - Bitcoin: BIP84 native SegWit m/84'/{0'|1'}/0'/{0 receive|1 change}/{i}
 */
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { ripemd160 } from '@noble/hashes/legacy.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { base58, bech32 } from '@scure/base';
import { HDKey } from '@scure/bip32';
import { mnemonicToSeed } from '@scure/bip39';
import { HDKey as Slip10Key } from 'micro-key-producer/slip10.js';
import { toChecksumAddress, type Family, type Network } from './address';
import { wipe } from './bytes';
import { toMnemonic } from './mnemonic';

export type BtcChain = 'receive' | 'change';

export const paths = {
  evm: (index: number) => `m/44'/60'/0'/0/${index}`,
  sol: (index: number) => `m/44'/501'/${index}'/0'`,
  btc: (network: Network, chain: BtcChain, index: number) => `m/84'/${network === 'mainnet' ? 0 : 1}'/0'/${chain === 'receive' ? 0 : 1}/${index}`,
};

/** Addresses only; what the unlocked session keeps (BUILD_PLAN 5.3). */
export interface AccountPublic {
  network: Network;
  evm: string;
  sol: string;
  btc: { receive: string[]; change: string[] };
}

/** BIP39 seed (64 bytes, PBKDF2) from the vault's entropy. The caller must wipe it. */
export async function seedFromEntropy(entropy: Uint8Array): Promise<Uint8Array> {
  return mnemonicToSeed(toMnemonic(entropy));
}

export function evmAddressFromPublicKey(publicKey: Uint8Array): string {
  const uncompressed = secp256k1.Point.fromBytes(publicKey).toBytes(false);
  return toChecksumAddress('0x' + bytesToHex(keccak_256(uncompressed.subarray(1)).subarray(-20)));
}

export function btcAddressFromPublicKey(publicKey: Uint8Array, network: Network): string {
  const hash160 = ripemd160(sha256(publicKey));
  return bech32.encode(network === 'mainnet' ? 'bc' : 'tb', [0, ...bech32.toWords(hash160)]);
}

export const solAddressFromPublicKey = (publicKey: Uint8Array): string => base58.encode(publicKey);

/** A private key with its public key and address. Only created inside `withSigner`, wiped right after. */
export interface KeyMaterial {
  family: Family;
  path: string;
  address: string;
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

/** Derives one private key. Intermediate HD nodes are wiped; the returned `privateKey` is a copy the caller wipes. */
export function deriveKey(seed: Uint8Array, family: Family, network: Network, index: number, chain: BtcChain = 'receive'): KeyMaterial {
  if (family === 'sol') {
    const path = paths.sol(index);
    const root = Slip10Key.fromMasterSeed(seed);
    const node = root.derive(path);
    const key: KeyMaterial = {
      family,
      path,
      address: solAddressFromPublicKey(node.publicKeyRaw),
      publicKey: node.publicKeyRaw,
      privateKey: node.privateKey.slice(),
    };
    wipe(root.privateKey, root.chainCode, node.privateKey, node.chainCode);
    return key;
  }
  const path = family === 'evm' ? paths.evm(index) : paths.btc(network, chain, index);
  const root = HDKey.fromMasterSeed(seed);
  const node = root.derive(path);
  const publicKey = node.publicKey!;
  const key: KeyMaterial = {
    family,
    path,
    address: family === 'evm' ? evmAddressFromPublicKey(publicKey) : btcAddressFromPublicKey(publicKey, network),
    publicKey,
    privateKey: node.privateKey!.slice(),
  };
  root.wipePrivateData();
  node.wipePrivateData();
  return key;
}

/** All public addresses of the wallet. Private keys are derived internally and wiped before returning. */
export function derivePublic(seed: Uint8Array, network: Network, btcCount: { receive: number; change: number } = { receive: 1, change: 1 }): AccountPublic {
  const address = (family: Family, index = 0, chain: BtcChain = 'receive') => {
    const key = deriveKey(seed, family, network, index, chain);
    wipe(key.privateKey);
    return key.address;
  };
  const range = (n: number) => Array.from({ length: n }, (_, i) => i);
  return {
    network,
    evm: address('evm'),
    sol: address('sol'),
    btc: {
      receive: range(btcCount.receive).map((i) => address('btc', i, 'receive')),
      change: range(btcCount.change).map((i) => address('btc', i, 'change')),
    },
  };
}
