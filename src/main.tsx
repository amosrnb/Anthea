import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import type { WalletProps } from './useWallet';
import './styles.css';

// Prototype switches (the design's tweak props), e.g. ?start=home&testnet=0&privacy=1
const params = new URLSearchParams(window.location.search);
const start = params.get('start');
const props: WalletProps = {
  startScreen: start === 'lock' || start === 'home' ? start : 'welcome',
  testnet: params.get('testnet') !== '0',
  privacyMode: params.get('privacy') === '1'
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App {...props} />
  </StrictMode>
);
