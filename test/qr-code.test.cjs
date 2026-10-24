const test = require("node:test");
const assert = require("node:assert/strict");
const { createQrMatrix } = require("../src/lib/pwa/qrCode.cjs");

test("compact QR encoder creates a version 4 matrix for the app handoff link", () => {
  const matrix = createQrMatrix("https://smart-safar.amplifyapp.com/app");
  assert.equal(matrix.length, 33);
  assert.ok(matrix.every((row) => row.length === 33));
  assert.equal(matrix[0][0], true);
  assert.equal(matrix[3][3], true);
  assert.throws(() => createQrMatrix("x".repeat(79)), RangeError);
});
