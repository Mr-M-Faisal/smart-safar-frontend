const test = require("node:test");
const assert = require("node:assert/strict");
const pkg = require("../package.json");
const changelog = require("../src/content/changelog.json");

test("newest changelog entry matches the app package version", () => {
  assert.ok(changelog.length > 0, "changelog must have a release entry");
  assert.equal(changelog[0].version, pkg.version);
  assert.ok(Array.isArray(changelog[0].notes) && changelog[0].notes.length > 0);
});
