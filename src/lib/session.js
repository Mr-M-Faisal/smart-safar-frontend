const TOKEN_KEY = "smart-safar-token";
const ACTIVE_ROLE_KEY = `${TOKEN_KEY}:active-role`;
const ROLES = new Set(["commuter", "driver", "admin"]);

function roleTokenKey(role) {
  return `${TOKEN_KEY}:${role}`;
}

export function saveSessionToken(token, role) {
  if (typeof window === "undefined") return;
  if (ROLES.has(role)) {
    window.localStorage.setItem(roleTokenKey(role), token);
    window.localStorage.setItem(ACTIVE_ROLE_KEY, role);
    return;
  }
  window.localStorage.setItem(TOKEN_KEY, token);
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
  window.localStorage.removeItem(ACTIVE_ROLE_KEY);
}
