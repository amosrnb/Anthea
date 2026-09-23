import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// @anthea/wallet-core's Solana derivation (ed25519-hd-key) and
// @solana/web3.js expect Node's Buffer to exist; polyfill it for the browser.
export default defineConfig({
  plugins: [react(), nodePolyfills({ include: ["buffer"] })],
});
