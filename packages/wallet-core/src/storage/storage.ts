/**
 * Where the encrypted vault record is persisted. Defaults to IndexedDB
 * (browsers); other platforms (e.g. React Native) plug in their own secure
 * store via `setVaultStorage` before any vault operation. Only the
 * already-encrypted record ever passes through here.
 */
import { idbDelete, idbGet, idbSet } from "./indexeddb.js";

export interface VaultStorage {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
}

const indexedDbStorage: VaultStorage = { get: idbGet, set: idbSet, delete: idbDelete };

let current: VaultStorage = indexedDbStorage;

/** Replace the vault storage backend for this process. Call once at startup. */
export function setVaultStorage(storage: VaultStorage): void {
  current = storage;
}

export function getVaultStorage(): VaultStorage {
  return current;
}
