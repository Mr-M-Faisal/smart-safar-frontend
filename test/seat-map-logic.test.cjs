const test = require("node:test");
const assert = require("node:assert/strict");
const { allowedActions, buildSeatRows, seatNumberValue } = require("../src/components/driver/seatMapLogic.cjs");
test("seat actions only allow a homogeneous status group", () => {
  assert.deepEqual(allowedActions([{ status: "available" }, { status: "available" }]), [["occupy", "Mark occupied (2)"]]);
  assert.deepEqual(allowedActions([{ status: "occupied" }]), [["release", "Passenger got off (1)"]]);
  assert.deepEqual(allowedActions([{ status: "reserved" }]), [["board", "Mark boarded (1)"], ["no_show", "No-show (1)"]]);
  assert.deepEqual(allowedActions([{ status: "available" }, { status: "occupied" }]), []);
  assert.deepEqual(allowedActions([]), []);
});
test("seat map rows preserve the 2 + aisle + 2 floor plan and partial rows", () => {
  const forty = buildSeatRows(40);
  assert.equal(forty.length, 10);
  assert.deepEqual(forty[0], [1, 2, null, 3, 4]);
  assert.deepEqual(forty[9], [37, 38, null, 39, 40]);
  const thirtyEight = buildSeatRows(38);
  assert.deepEqual(thirtyEight.at(-1), [37, 38, null, null, null]);
  const seven = buildSeatRows(7);
  assert.deepEqual(seven.at(-1), [5, 6, null, 7, null]);
  assert.equal(seatNumberValue({ seatNumber: "12A" }), 12);
});
