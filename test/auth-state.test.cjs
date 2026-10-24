const { test } = require("node:test");
const assert = require("node:assert/strict");
const { isSessionStorageChange, resolveAuthState } = require("../src/lib/auth/authState.cjs");
const safeReturnTo = require("../src/lib/auth/safeReturnTo.cjs");

function token(payload) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none" })}.${encode(payload)}.signature`;
}

test("expired token is treated as a guest", () => {
  const result = resolveAuthState({ token: token({ role: "commuter", exp: 100 }), now: 101_000 });
  assert.equal(result.status, "guest");
});

test("expired access token stays authenticated when a refresh token exists", () => {
  const result = resolveAuthState({ token: token({ role: "driver", exp: 100 }), storedRole: "driver", hasRefreshToken: true, now: 101_000 });
  assert.equal(result.status, "authenticated");
  assert.equal(result.role, "driver");
});

test("malformed token is treated as a guest", () => {
  assert.equal(resolveAuthState({ token: "not-a-jwt" }).status, "guest");
});

test("stored role mismatch is treated as a guest", () => {
  const result = resolveAuthState({ token: token({ role: "driver", exp: 9_999_999_999 }), storedRole: "commuter" });
  assert.equal(result.status, "guest");
});

test("cross-tab token removal refreshes the auth state", () => {
  assert.equal(isSessionStorageChange("smart-safar-token:commuter", null), true);
  assert.equal(isSessionStorageChange("smart-safar-theme", null), false);
});

test("return paths reject external and malformed destinations", () => {
  for (const value of ["//evil.example", "/\\evil.example", "https://evil.example", "javascript:alert(1)", "/\u0000evil"]) {
    assert.equal(safeReturnTo(value), "/");
  }
  assert.equal(safeReturnTo("/routes?query=bus"), "/routes?query=bus");
});
