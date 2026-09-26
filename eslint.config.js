// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettier,
  {
    files: ['jest.setup.js', '**/__tests__/**'],
    languageOptions: { globals: { jest: 'readonly' } },
  },
  {
    // server/ has its own dependencies, installed only in the CI server job; its typecheck verifies imports.
    files: ['server/**'],
    rules: { 'import/no-unresolved': 'off' },
  },
  {
    ignores: ['dist/**', 'prototype/**', 'server/node_modules/**', 'server/.wrangler/**', 'android/**', 'ios/**', 'project/**', 'coverage/**'],
  },
]);
