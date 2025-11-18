module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'], // SOLO test, non server!
  testMatch: ['**/?(*.)+(test).js'],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Moduli da non trasformare
  transformIgnorePatterns: [
    'node_modules/(?!(supertest)/)'
  ],
  
  // Coverage
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/db/**',
    '!server/index.js',
    '!server/swagger.js'
  ],
  
  // Importante: reset tra i test
  resetModules: true,
};