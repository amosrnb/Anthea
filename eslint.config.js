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
    ignores: ['dist/**', 'prototype/**', 'server/node_modules/**', 'server/.wrangler/**', 'android/**', 'ios/**', 'project/**', 'coverage/**'],
  },
]);
