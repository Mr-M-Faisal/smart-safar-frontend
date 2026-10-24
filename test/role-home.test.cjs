const { test } = require("node:test");
const assert = require("node:assert/strict");
const { homeForRole } = require("../src/lib/auth/roleHome.js");

test("role home links preserve each workspace in web and app modes", () => {
  assert.equal(homeForRole("admin", false), "/admin");
  assert.equal(homeForRole("admin", true), "/m/admin");
  assert.equal(homeForRole("driver", false), "/driver");
  assert.equal(homeForRole("driver", true), "/m/driver");
  assert.equal(homeForRole("commuter", false), "/");
  assert.equal(homeForRole("commuter", true), "/m");
});
