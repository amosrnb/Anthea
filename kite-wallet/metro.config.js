// Learn more https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// @anthea/wallet-core is linked from ../packages/wallet-core; its own
// dependencies (viem, @noble/*, …) are installed in the monorepo root.
config.watchFolders = [path.join(monorepoRoot, 'packages/wallet-core'), path.join(monorepoRoot, 'node_modules')];
config.resolver.nodeModulesPaths = [path.join(projectRoot, 'node_modules'), path.join(monorepoRoot, 'node_modules')];

module.exports = config;
