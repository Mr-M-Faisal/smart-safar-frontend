const test = require("node:test");
const assert = require("node:assert/strict");
const pull = require("../src/lib/pullRefreshLogic.cjs");
test("pull refresh resistance and activation threshold", () => {
  assert.equal(pull.resistedDistance(-5), 0);
  assert.equal(pull.resistedDistance(1000), 90);
  assert.equal(pull.shouldRefresh(69), false);
  assert.equal(pull.shouldRefresh(70), true);
});
