// App entry. Order matters: native WebCrypto must be installed before any
// module that captures `globalThis.crypto` at load time (@noble/hashes, used
// by @anthea/wallet-core for key generation) is evaluated.
require('./src/platform/install-crypto');
require('./src/platform/vault-storage');
require('expo-router/entry');
