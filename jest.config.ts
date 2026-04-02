module.exports = {
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@root/(.*)$': '<rootDir>/src/$1',
    '^@util/(.*)$': '<rootDir>/src/util/$1'
  },
};