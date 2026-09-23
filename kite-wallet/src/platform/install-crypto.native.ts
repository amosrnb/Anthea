import { install } from 'react-native-quick-crypto';

// Native (OpenSSL-backed) WebCrypto for iOS/Android: secure randomness for
// seed phrases, and PBKDF2 + AES-GCM for the password-encrypted vault.
install();
