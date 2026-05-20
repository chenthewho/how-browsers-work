module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages'],
  testMatch: ['**/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^@browser/shared$': '<rootDir>/packages/shared/src',
    '^@browser/dom$': '<rootDir>/packages/dom/src',
    '^@browser/html-parser$': '<rootDir>/packages/html-parser/src',
    '^@browser/css-parser$': '<rootDir>/packages/css-parser/src',
    '^@browser/style$': '<rootDir>/packages/style/src',
    '^@browser/layout$': '<rootDir>/packages/layout/src',
    '^@browser/network$': '<rootDir>/packages/network/src',
    '^@browser/js-engine$': '<rootDir>/packages/js-engine/src',
    '^@browser/output$': '<rootDir>/packages/output/src'
  }
};
