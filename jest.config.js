const preset = require('jest-expo/jest-preset');

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  // React Native loads its components lazily, so the first render of a test file triggers Babel transforms. On a cold
  // cache (CI) under load that alone can exceed Jest's 5 s default; the tests themselves take well under 1 s.
  testTimeout: 30000,
  // @noble/*, @scure/* and micro-* ship ES modules only; let Babel transform them like the React Native packages.
  transformIgnorePatterns: [
    preset.transformIgnorePatterns[0].replace('(?!(', '(?!(@noble|@scure|micro-key-producer|micro-packed|uqr|'),
    ...preset.transformIgnorePatterns.slice(1),
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/__tests__/**'],
  // BUILD_PLAN Phase 1: the crypto core must stay fully tested.
  coverageThreshold: { './src/core/': { statements: 95, branches: 95, functions: 95, lines: 95 } },
};
