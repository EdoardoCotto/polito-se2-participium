module.exports = {
  testEnvironment: 'node',
  roots: ['test'],
  testMatch: ['**/?(*.)+(test).js'],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  transformIgnorePatterns: ['node_modules/(?!(supertest)/)'],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage', 
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/db/**',
    '!server/index.js',
    '!server/swagger.js'
  ],
  resetModules: true,
};
