const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync(require.resolve("../public/navigation-policy.js"), "utf8");
const self = {};
vm.runInNewContext(source, { self });

test("service worker keeps account and workspace navigation out of the shared cache", () => {
  for (const path of ["/passenger", "/driver", "/admin", "/m/login", "/m/driver", "/m/account", "/m/trips", "/m/admin/reports", "/m/book"]) {
    assert.equal(self.SmartSafarNavigationPolicy.isPrivateNavigation(path), true, path);
  }
  for (const path of ["/", "/routes", "/m", "/m/routes", "/m/map"]) {
    assert.equal(self.SmartSafarNavigationPolicy.isPrivateNavigation(path), false, path);
  }
});
