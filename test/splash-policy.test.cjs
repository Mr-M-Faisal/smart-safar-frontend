const assert = require('node:assert/strict');
const { test } = require('node:test');
const { shouldShowSplash } = require('../src/lib/splashPolicy.cjs');

test('splash is shown once per tab session', () => {
  assert.equal(shouldShowSplash(null), true);
  assert.equal(shouldShowSplash(''), true);
  assert.equal(shouldShowSplash('1'), false);
});
