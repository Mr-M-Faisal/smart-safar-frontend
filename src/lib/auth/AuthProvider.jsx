"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { clearSessionToken, readCachedProfile, readRefreshToken, readSessionRole, readSessionToken, storeCachedProfile } from "@/lib/session";
import safeReturnTo from "@/lib/auth/safeReturnTo.cjs";
import authState from "@/lib/auth/authState.cjs";

const AuthContext = createContext({ status: "loading", user: null, role: null, token: null });
let lastProfileValidationAt = 0;
const SERVER_AUTH_STATE = { status: "loading", user: null, role: null, token: null, validated: false };
let authSnapshot = SERVER_AUTH_STATE;
let hasReadLocalAuth = false;
const authListeners = new Set();

function getAuthSnapshot() {
  if (typeof window === "undefined") return SERVER_AUTH_STATE;
  if (!hasReadLocalAuth) {
    authSnapshot = readLocalAuth();
    hasReadLocalAuth = true;
  }
  return authSnapshot;
}

function subscribeAuth(listener) {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

function updateAuthSnapshot(update) {
  authSnapshot = typeof update === "function" ? update(authSnapshot) : update;
  authListeners.forEach((listener) => listener());
}

function readLocalAuth() {
  const token = readSessionToken();
  const storedRole = token ? readSessionRole(token) : null;
  const resolved = authState.resolveAuthState({ token, profile: null, storedRole, hasRefreshToken: Boolean(storedRole && readRefreshToken(storedRole)) });
  if (resolved.status === "guest") {
    if (storedRole) clearSessionToken(storedRole);
    return { status: "guest", user: null, role: null, token: null, validated: true };
  }
  return { ...resolved, user: readCachedProfile(resolved.role), validated: false };
}

export function AuthProvider({ children }) {
  const auth = useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => SERVER_AUTH_STATE);
  const setAuth = useCallback((update) => updateAuthSnapshot(update), []);
  const authRef = useRef(auth);
  authRef.current = auth;

  const validateProfile = useCallback(async ({ force = false } = {}) => {
    const local = readLocalAuth();
    if (local.status !== "authenticated") { setAuth(local); return local; }
    if (!force && local.validated && local.token === authRef.current.token && Date.now() - lastProfileValidationAt < 5 * 60 * 1000) {
      setAuth({ ...local, user: local.user || authRef.current.user, validated: authRef.current.validated });
      return local;
    }
    setAuth(local);
    lastProfileValidationAt = Date.now();
    try {
      const profile = await apiRequest("/auth/profile", { token: local.token });
      if (profile?.role !== local.role) {
        clearSessionToken(local.role);
        setAuth({ status: "guest", user: null, role: null, token: null, validated: true });
        return null;
      }
      storeCachedProfile(profile);
      setAuth({ status: "authenticated", user: profile, role: profile.role, token: readSessionToken(profile.role) || local.token, validated: true });
      return profile;
    } catch (error) {
      if (error.status === 401) {
        if (error.code !== "REFRESH_REJECTED") clearSessionToken(local.role);
        setAuth({ status: "guest", user: null, role: null, token: null, validated: true, message: error.message });
        return null;
      }
      setAuth((current) => ({ ...current, validated: true }));
      return local.user;
    }
    return null;
  }, [setAuth]);

  useEffect(() => {
    void apiRequest("/routes/overview").catch(() => {});
    void validateProfile({ force: true });
    const onExpired = (event) => {
      const role = event.detail?.role;
      if (!role || authRef.current.role === role) {
        window.localStorage.removeItem("ss-profile");
        setAuth({ status: "guest", user: null, role: null, token: null, validated: true });
      }
    };
    const onSessionChanged = () => void validateProfile({ force: true });
    const onStorage = (event) => {
      if (authState.isSessionStorageChange(event.key, event.newValue)) onSessionChanged();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible" && Date.now() - lastProfileValidationAt >= 5 * 60 * 1000) void validateProfile();
    };
    window.addEventListener("smart-safar:auth-expired", onExpired);
    window.addEventListener("smart-safar:session-changed", onSessionChanged);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("smart-safar:auth-expired", onExpired);
      window.removeEventListener("smart-safar:session-changed", onSessionChanged);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [validateProfile]);

  const refreshAuth = useCallback(() => validateProfile({ force: true }), [validateProfile]);
  const value = useMemo(() => ({ ...auth, refreshAuth }), [auth, refreshAuth]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }

export function updateAuthUser(profile, accessToken = null) {
  updateAuthSnapshot((current) => current.status === "authenticated" && profile?.role === current.role ? { ...current, ...(accessToken ? { token: accessToken } : {}), user: profile } : current);
}

export function RequireAuth({ children, roles }) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const roleList = Array.isArray(roles) ? roles : roles ? [roles] : [];

  useEffect(() => {
    if (auth.status === "guest") {
      const requested = `${pathname || "/"}${typeof window !== "undefined" ? window.location.search : ""}`;
      router.replace(`/login?returnTo=${encodeURIComponent(safeReturnTo(requested, "/"))}`);
    } else if (auth.status === "authenticated" && roleList.length && !roleList.includes(auth.role)) {
      router.replace("/");
    }
  }, [auth.status, auth.role, pathname, router, roleList.join("|")]);

  if (auth.status !== "authenticated" || (roleList.length && !roleList.includes(auth.role))) return <div aria-hidden="true" className="min-h-10" />;
  return children;
}

export function RequireRole(props) { return <RequireAuth {...props} roles={props.roles} />; }
