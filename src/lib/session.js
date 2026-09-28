const TOKEN_KEY = "smart-safar-token";
const REFRESH_KEY = `${TOKEN_KEY}:refresh`;
const ACTIVE_ROLE_KEY = `${TOKEN_KEY}:active-role`;
const ROLES = new Set(["commuter", "driver", "admin"]);

function roleTokenKey(role) {
  return `${TOKEN_KEY}:${role}`;
}
function roleRefreshKey(role) { return `${REFRESH_KEY}:${role || "default"}`; }

export function saveSessionToken(token, role, refreshToken = null) {
  if (typeof window === "undefined") return;
  if (ROLES.has(role)) {
    window.localStorage.setItem(roleTokenKey(role), token);
    if (refreshToken) window.localStorage.setItem(roleRefreshKey(role), refreshToken);
    window.localStorage.setItem(ACTIVE_ROLE_KEY, role);
    return;
  }
  window.localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) window.localStorage.setItem(roleRefreshKey("default"), refreshToken);
}

export function readRefreshToken(role) { return typeof window === "undefined" ? null : window.localStorage.getItem(roleRefreshKey(role)); }
export function readSessionRole(token) {
  if (typeof window === "undefined") return null;
  for (const role of ROLES) if (window.localStorage.getItem(roleTokenKey(role)) === token) return role;
  return null;
}
export function storeRotatedSession(role, accessToken, refreshToken) {
  if (typeof window === "undefined" || !ROLES.has(role)) return;
  window.localStorage.setItem(roleTokenKey(role), accessToken);
  window.localStorage.setItem(roleRefreshKey(role), refreshToken);
}

export function readSessionToken(role) {
  if (typeof window === "undefined") return null;
  if (ROLES.has(role)) {
    const roleToken = window.localStorage.getItem(roleTokenKey(role));
    if (roleToken) return roleToken;
    const legacyRole = window.localStorage.getItem(ACTIVE_ROLE_KEY);
    if (legacyRole && legacyRole !== role) return null;
  }
  if (!role) {
    const activeRole = window.localStorage.getItem(ACTIVE_ROLE_KEY);
    if (ROLES.has(activeRole)) return window.localStorage.getItem(roleTokenKey(activeRole));
  }
  return window.localStorage.getItem(TOKEN_KEY);
}

export function clearSessionToken(role) {
  if (typeof window === "undefined") return;
  if (ROLES.has(role)) {
    const activeRole = window.localStorage.getItem(ACTIVE_ROLE_KEY);
    const hasOtherRoleToken = ["commuter", "driver", "admin"].some((candidate) => candidate !== role && window.localStorage.getItem(roleTokenKey(candidate)));
    window.localStorage.removeItem(roleTokenKey(role));
    window.localStorage.removeItem(roleRefreshKey(role));
    if (activeRole === role) {
      window.localStorage.removeItem(TOKEN_KEY);
      const nextRole = ["commuter", "driver", "admin"].find((candidate) => window.localStorage.getItem(roleTokenKey(candidate)));
      if (nextRole) window.localStorage.setItem(ACTIVE_ROLE_KEY, nextRole);
      else window.localStorage.removeItem(ACTIVE_ROLE_KEY);
    } else if (!activeRole && !hasOtherRoleToken) {
      window.localStorage.removeItem(TOKEN_KEY);
    }
    return;
  }
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.localStorage.removeItem(ACTIVE_ROLE_KEY);
}

export async function revokeAndClearSession(role) {
  const refreshToken = readRefreshToken(role);
  clearSessionToken(role);
  try {
    if (refreshToken) {
      const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 5000);
      try { await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "")}/api/auth/logout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken }), cache: "no-store", signal: controller.signal }); }
      finally { clearTimeout(timer); }
    }
  } catch { /* Local sign-out still completes when the API is offline. */ }
}
