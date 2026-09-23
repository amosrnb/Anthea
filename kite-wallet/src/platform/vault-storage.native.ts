import { setVaultStorage } from '@anthea/wallet-core';
import * as SecureStore from 'expo-secure-store';

// The vault is already encrypted with the user's password; on iOS/Android it
// is additionally kept in the Keychain / Keystore, readable only while the
// device is unlocked and never synced or restored to another device (the
// seed phrase is the way to move a wallet).
const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};
const PREFIX = 'anthea.';

setVaultStorage({
  async get<T>(key: string) {
    const raw = await SecureStore.getItemAsync(PREFIX + key, options);
    return raw === null ? undefined : (JSON.parse(raw) as T);
  },
  async set<T>(key: string, value: T) {
    await SecureStore.setItemAsync(PREFIX + key, JSON.stringify(value), options);
  },
  async delete(key: string) {
    await SecureStore.deleteItemAsync(PREFIX + key, options);
  },
});
