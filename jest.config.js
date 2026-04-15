module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/reactive_resume/', '\\reactive_resume\\'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
