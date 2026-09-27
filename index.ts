import { registerRootComponent } from 'expo';

import App from './src/App';
import { registerKdfBenchmark } from './src/dev/kdfBenchmark';
import { installCrypto } from './src/platform/crypto';

// Native crypto.getRandomValues and scrypt must be in place before any key material is created.
installCrypto();
registerKdfBenchmark();

registerRootComponent(App);
