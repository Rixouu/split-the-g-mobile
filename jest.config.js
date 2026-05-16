/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  modulePathIgnorePatterns: ['<rootDir>/e2e/'],
  clearMocks: true,
};
