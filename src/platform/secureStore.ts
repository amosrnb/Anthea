/**
 * Secure storage for the vault, the device secret and other protected values (BUILD_PLAN 5.2, 7).
 * iOS: Keychain with WHEN_UNLOCKED_THIS_DEVICE_ONLY (no iCloud sync, not restored to other devices).
 * Android: Keystore-backed encrypted storage; app data is excluded from backup (allowBackup=false).
 */
import * as ExpoSecureStore from 'expo-secure-store';

export interface SecureStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

const OPTIONS: ExpoSecureStore.SecureStoreOptions = { keychainAccessible: ExpoSecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export function createExpoSecureStore(): SecureStore {
  return {
    get: (key) => ExpoSecureStore.getItemAsync(key, OPTIONS),
    set: (key, value) => ExpoSecureStore.setItemAsync(key, value, OPTIONS),
    delete: (key) => ExpoSecureStore.deleteItemAsync(key, OPTIONS),
  };
}

/** In-memory store for tests only. Never use it in the app: nothing is protected or persisted. */
export function createMemorySecureStore(initial: Record<string, string> = {}): SecureStore & { dump(): Record<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    get: async (key) => data.get(key) ?? null,
    set: async (key, value) => void data.set(key, value),
    delete: async (key) => void data.delete(key),
    dump: () => Object.fromEntries(data),
  };
}
