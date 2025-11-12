module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/server', '<rootDir>/test'], // dove cercare codice e test
  testMatch: ['**/?(*.)+(test).js'],            // trova *.test.js ovunque sotto roots
  clearMocks: true,
};
