module.exports = {
  'roots': ['<rootDir>'],
  'testMatch': [
    '**/tests/**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  'transform': {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  setupFilesAfterEnv: ['./tests/setup/jest.setup.ts'],
};
