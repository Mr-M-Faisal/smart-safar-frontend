const test = require('node:test');
const assert = require('node:assert/strict');
const { createRefreshCoordinator, refreshRejected, shouldRefreshAfter401 } = require('../src/lib/refreshPolicy.cjs');

test('parallel 401s share one refresh in flight', async () => {
  const coordinator = createRefreshCoordinator(); let calls = 0;
  const refresh = async () => { calls += 1; await new Promise(resolve => setTimeout(resolve, 10)); return 'new-token'; };
  const results = await Promise.all([coordinator.run('commuter', refresh), coordinator.run('commuter', refresh), coordinator.run('commuter', refresh)]);
  assert.deepEqual(results, ['new-token', 'new-token', 'new-token']); assert.equal(calls, 1);
});
test('only an explicit rejected refresh clears the session', () => {
  assert.equal(refreshRejected(401, {}), true);
  assert.equal(refreshRejected(403, {}), true);
  assert.equal(refreshRejected(503, { code: 'SERVICE_DOWN' }), false);
  assert.equal(refreshRejected(0, null), false);
});
test('expired protected requests refresh once; auth requests and non-401s do not refresh', () => {
  assert.equal(shouldRefreshAfter401(401, 'access', '/bookings/me'), true);
  assert.equal(shouldRefreshAfter401(500, 'access', '/bookings/me'), false);
  assert.equal(shouldRefreshAfter401(401, 'access', '/auth/login'), false);
});
