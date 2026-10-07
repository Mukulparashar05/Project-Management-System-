// Live tests need a running API (see __tests__/live/crossPlatform.live.js), so they are kept
// out of the default `npm test` run.
const { jest: baseConfig } = require('./package.json');

module.exports = {
  ...baseConfig,
  testMatch: ['<rootDir>/__tests__/live/**/*.live.js'],
  testTimeout: 60_000,
};
