/**
 * Encrypted local vault: persists every wallet's (encrypted) mnemonic to
 * IndexedDB under one password. Only the decrypted vault ever lives in
 * memory, and only while unlocked.
 */
import { type EncryptedPayload, decryptWithPassword, encryptWithPassword } from "./crypto.js";
import { idbDelete, idbGet, idbSet } from "./storage/indexeddb.js";

const VAULT_KEY = "vault";
const VAULT_FORMAT_VERSION = 1;

export interface WalletEntry {
  id: string;
  name: string;
  mnemonic: string;
  createdAt: number;
}

interface VaultContents {
  version: number;
  wallets: WalletEntry[];
}

interface VaultRecord extends EncryptedPayload {
  version: number;
}

/** Whether an encrypted vault already exists on this device. */
export async function keystoreExists(): Promise<boolean> {
  const record = await idbGet<VaultRecord>(VAULT_KEY);
  return record !== undefined;
}

/** Create a brand-new, empty vault protected by `password`. Throws if one already exists. */
export async function createVault(password: string): Promise<VaultContents> {
  if (await keystoreExists()) {
    throw new Error("A wallet vault already exists on this device");
  }
  const contents: VaultContents = { version: VAULT_FORMAT_VERSION, wallets: [] };
  await writeVault(contents, password);
  return contents;
}

/** Decrypt and parse the persisted vault. Throws if none exists or the password is wrong. */
export async function readVault(password: string): Promise<VaultContents> {
  const record = await idbGet<VaultRecord>(VAULT_KEY);
  if (!record) {
    throw new Error("No wallet vault found on this device");
  }
  if (record.version !== VAULT_FORMAT_VERSION) {
    throw new Error(`Unsupported vault version: ${record.version}`);
  }
  const plaintext = await decryptWithPassword(record, password);
  return JSON.parse(plaintext) as VaultContents;
}

/** Encrypt and persist `contents`, replacing any existing vault. */
export async function writeVault(contents: VaultContents, password: string): Promise<void> {
  const payload = await encryptWithPassword(JSON.stringify(contents), password);
  const record: VaultRecord = { ...payload, version: VAULT_FORMAT_VERSION };
  await idbSet(VAULT_KEY, record);
}

/** Permanently delete the local vault. This does not affect on-chain funds, only local access. */
export async function deleteVault(): Promise<void> {
  await idbDelete(VAULT_KEY);
}

export type { VaultContents };
