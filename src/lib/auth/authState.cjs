const ROLES = new Set(["commuter", "driver", "admin"]);

function decodePayload(token) {
  try {
    const encoded = token.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/");
    if (!encoded) return null;
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch { return null; }
}

function resolveAuthState({ token, profile, storedRole, now = Date.now() }) {
  if (!token) return { status: "guest", role: null, user: null, token: null };
  const payload = decodePayload(token);
  if (!payload || !ROLES.has(payload.role) || (storedRole && storedRole !== payload.role) || !Number.isFinite(payload.exp) || payload.exp * 1000 <= now) {
    return { status: "guest", role: null, user: null, token: null };
  }
  return { status: "authenticated", role: payload.role, user: profile?.role === payload.role ? profile : null, token };
}

function isSessionStorageChange(key, newValue) {
  return key === null || key === "ss-profile" || (typeof key === "string" && key.startsWith("smart-safar-token"));
}

module.exports = { decodePayload, isSessionStorageChange, resolveAuthState };
