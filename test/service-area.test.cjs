const test = require("node:test");
const assert = require("node:assert/strict");
const { SERVICE_AREA_BOUNDS, normalizeServiceCoordinate, isInServiceArea } = require("../src/data/serviceArea.cjs");

test("service area coordinates accept Faisalabad and swapped lat/lng but reject distant points", () => {
  assert.deepEqual(SERVICE_AREA_BOUNDS, [[30.9, 72.6], [32.0, 73.7]]);
  assert.deepEqual(normalizeServiceCoordinate(31.4181, 73.0776), [31.4181, 73.0776]);
  assert.deepEqual(normalizeServiceCoordinate(73.0776, 31.4181), [31.4181, 73.0776]);
  assert.equal(isInServiceArea(40.7128, -74.006), false);
  assert.equal(normalizeServiceCoordinate("bad", 73), null);
});
