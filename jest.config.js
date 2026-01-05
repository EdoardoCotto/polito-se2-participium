const common = {
  testEnvironment: 'node',
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  transformIgnorePatterns: ['node_modules/(?!(supertest)/)'],
  resetModules: true,
  testTimeout: 30000, // 30 seconds timeout per test to prevent hanging
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/db/**/*.js',
    '!server/index.js',
    '!server/swagger.js',
    '!server/routes/**/*.js',
    '!**/__mock__/**',
  ],
};

module.exports = {
  collectCoverage: true,
  coverageReporters: ["text", "text-summary", "lcov", "clover"],
  coverageDirectory: '<rootDir>/coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__mock__/',
    '/server/db/',
    '/server/index.js',
    '/server/swagger.js',
    '/server/routes/',
  ],
  projects: [
    {
      displayName: 'unit',
      ...common,
      roots: ['<rootDir>/test/unit'],
      testMatch: ['<rootDir>/test/unit/**/*.test.js'],
      moduleNameMapper: {
        '^sqlite3$': '<rootDir>/__mock__/sqlite3.js',
        '^bcrypt$': '<rootDir>/__mock__/bcrypt.js',
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
      testTimeout: 30000, // 30 seconds timeout per test to prevent hanging
      collectCoverageFrom: [
        'client/**/*.{js,jsx}',
        '!client/**/*.test.{js,jsx}',
        '!client/main.jsx',
        '!client/cypress/**',
        '!client/components/**/*.jsx',
        '!client/App.jsx',
      ],
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
