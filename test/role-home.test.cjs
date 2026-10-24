const { test } = require("node:test");
const assert = require("node:assert/strict");
const { homeForRole } = require("../src/lib/auth/roleHome.js");

test("role home links always use shared website routes", () => {
  assert.equal(homeForRole("admin", false), "/admin");
  assert.equal(homeForRole("admin", true), "/admin");
  assert.equal(homeForRole("driver", false), "/driver");
  assert.equal(homeForRole("driver", true), "/driver");
  assert.equal(homeForRole("commuter", false), "/");
  assert.equal(homeForRole("commuter", true), "/");
});
