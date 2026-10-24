const test = require("node:test");
const assert = require("node:assert/strict");
const { resolveActiveTab } = require("../src/components/app/tabLogic.cjs");
const passenger = [
  { label: "Home", href: "/m", exact: true, matchPaths: ["/m/book"] },
  { label: "Map", href: "/m/map", exact: true },
  { label: "Routes", href: "/m/routes", exact: true, matchPaths: ["/m/routes"] },
  { label: "Trips", href: "/m/trips", exact: true },
  { label: "Account", href: "/m/account", exact: true, matchPaths: ["/m/account"] },
];
const admin = [
  { label: "Dashboard", href: "/m/admin", exact: true },
  { label: "Drivers", href: "/m/admin/drivers", exact: true },
];
test("tab matching selects exact roots, explicit detail parents and no arbitrary fallback", () => {
  assert.equal(resolveActiveTab(passenger, "/m"), 0);
  assert.equal(resolveActiveTab(passenger, "/m/map"), 1);
  assert.equal(resolveActiveTab(passenger, "/m/routes/abc"), 2);
  assert.equal(resolveActiveTab(passenger, "/m/trips"), 3);
  assert.equal(resolveActiveTab(passenger, "/m/account/profile"), 4);
  assert.equal(resolveActiveTab(admin, "/m/admin"), 0);
  assert.equal(resolveActiveTab(admin, "/m/admin/drivers"), 1);
  assert.equal(resolveActiveTab(admin, "/m/admin/settings"), -1);
  assert.equal(resolveActiveTab(passenger, "/unknown"), -1);
});
