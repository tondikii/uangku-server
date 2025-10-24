export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.spec.ts',
    '!main.ts',
    '!**/*.module.ts',
    '!**/ormconfig.ts',
    '!**/database/migrations/**',
    '!**/database/entities/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
