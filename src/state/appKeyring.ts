import { scryptKdf } from '../platform/crypto';
import { createExpoSecureStore } from '../platform/secureStore';
import { createKeyring, type Keyring } from './keyring';

let instance: Keyring | undefined;

/** The app's keyring: Keychain/Keystore storage and native scrypt. Created on first use. */
export function appKeyring(): Keyring {
  instance ??= createKeyring({ store: createExpoSecureStore(), kdf: scryptKdf });
  return instance;
}
