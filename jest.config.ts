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
    '!**/ormconfig.cli.ts',
    '!**/database/**',
    '!**/scripts/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
