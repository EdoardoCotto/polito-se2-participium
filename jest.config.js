const common = {
  testEnvironment: 'node',
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  transformIgnorePatterns: ['node_modules/(?!(supertest)/)'],
  resetModules: true,
};

module.exports = {
  collectCoverage: true,
  coverageReporters: ["text", "text-summary", "lcov", "clover"],
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/db/**',
    '!server/index.js',
    '!server/swagger.js',
    '!server/routes/**',
    'client/**/*.{js,jsx}',
    '!client/**/*.test.{js,jsx}',
    '!client/src/main.jsx',
    '!client/cypress/**',
  ],
  projects: [
    {
      displayName: 'unit',
      ...common,
      roots: ['<rootDir>/test/unit'],
      testMatch: ['<rootDir>/test/unit/**/*.test.js'],
      moduleNameMapper: {
        '^sqlite3$': '<rootDir>/__mock__/sqlite3.js',
      },
    },
    {
      displayName: 'e2e',
      ...common,
      roots: ['<rootDir>/test/e2e'],
      testMatch: ['<rootDir>/test/e2e/**/*.test.js'],
      // No sqlite3 mapping here: use real sqlite3
    },
    {
      displayName: 'client',
      testEnvironment: 'jsdom',
      clearMocks: true,
      resetMocks: true,
      restoreMocks: true,
      resetModules: true,
      roots: ['<rootDir>/test/client'],
      testMatch: ['<rootDir>/test/client/**/*.test.{js,jsx}'],
      transform: {
        '^.+\\.(js|jsx)$': ['babel-jest', { configFile: './babel.config.js' }],
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': '<rootDir>/__mock__/styleMock.js',
      },
    },
  ],
};
