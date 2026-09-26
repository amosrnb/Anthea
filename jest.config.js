/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/src'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  // React Native loads its components lazily, so the first render of a test file triggers Babel transforms. On a cold
  // cache (CI) under load that alone can exceed Jest's 5 s default; the tests themselves take well under 1 s.
  testTimeout: 30000,
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
};
