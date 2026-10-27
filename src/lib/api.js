import { clearSessionToken, readRefreshToken, readSessionRole, storeRotatedSession } from "@/lib/session";
import refreshPolicy from "@/lib/refreshPolicy.cjs";
const serverOrigin = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");
const { createRefreshCoordinator, refreshRejected, shouldRefreshAfter401 } = refreshPolicy;
const refreshCoordinator = createRefreshCoordinator();

function expireRoleSession(role) {
  clearSessionToken(role);
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("smart-safar:auth-expired", { detail: { role } }));
}

export class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.code = details?.code || null;
    this.requestId = details?.requestId || null;
  }
}

const CACHE_KEY_PREFIX = "ss-cache-v1:";
const CACHE_MAX_TOTAL_BYTES = 4 * 1024 * 1024;
const inFlightRequests = new Map();
const lastRevalidatedAt = new Map();
let routeCacheEpoch = 0;

function isRouteCachePath(path) {
  return path === "/routes" || path === "/routes/overview" || path.startsWith("/stops/route/");
}

function cacheTtl(path) {
  return path.startsWith("/buses") ? 30 * 1000 : 24 * 60 * 60 * 1000;
}

export function isEligibleForCache(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const pathname = normalized.split("?", 1)[0];
  return (
    pathname === "/routes" ||
    pathname === "/routes/overview" ||
    pathname.startsWith("/stops/route/") ||
    pathname === "/buses"
  );
}

export function readSavedCache(path) {
  if (typeof window === "undefined" || !window.localStorage) return null;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  try {
    const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}${normalized}`) || localStorage.getItem(`smart-safar:cache:${normalized}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.timestamp || !parsed.data) return null;
    if (Date.now() - parsed.timestamp > cacheTtl(normalized)) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${normalized}`);
      localStorage.removeItem(`smart-safar:cache:${normalized}`);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeSavedCache(path, data) {
  if (typeof window === "undefined" || !window.localStorage) return;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  try {
    const storageKey = `${CACHE_KEY_PREFIX}${normalized}`;
    const value = JSON.stringify({ timestamp: Date.now(), data });
    localStorage.setItem(storageKey, value);
    let totalBytes = 0;
    const keys = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith(CACHE_KEY_PREFIX)) continue;
      const entry = localStorage.getItem(key) || "";
      totalBytes += (key.length + entry.length) * 2;
      keys.push({ key, entry, timestamp: Number(JSON.parse(entry)?.timestamp) || 0 });
    }
    keys.sort((left, right) => left.timestamp - right.timestamp);
    while (totalBytes > CACHE_MAX_TOTAL_BYTES && keys.length > 1) {
      const oldest = keys.shift();
      totalBytes -= (oldest.key.length + oldest.entry.length) * 2;
      if (oldest.key !== storageKey) localStorage.removeItem(oldest.key);
    }
    if (totalBytes > CACHE_MAX_TOTAL_BYTES && keys.length === 1 && keys[0].key === storageKey) localStorage.removeItem(storageKey);
  } catch (_e) {
    // ignore quota errors
  }
}

function invalidateRouteDataCaches() {
  routeCacheEpoch += 1;
  for (const key of inFlightRequests.keys()) {
    const separator = key.indexOf("\u0000");
    if (separator >= 0 && isRouteCachePath(key.slice(0, separator))) inFlightRequests.delete(key);
  }
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      const prefix = key?.startsWith(CACHE_KEY_PREFIX) ? CACHE_KEY_PREFIX : "smart-safar:cache:";
      if (!key?.startsWith(prefix)) continue;
      const path = key.slice(prefix.length);
      if (path === "/routes" || path === "/routes/overview" || path.startsWith("/stops/route/")) {
        window.localStorage.removeItem(key);
        window.localStorage.removeItem(`${CACHE_KEY_PREFIX}${path}`);
        window.localStorage.removeItem(`smart-safar:cache:${path}`);
      }
    }
  } catch {
    // Cache invalidation must never turn a successful save into a failed action.
  }
  window.dispatchEvent(new CustomEvent("smart-safar:cache-invalidated", {
    detail: { paths: ["/routes", "/routes/overview"], prefixes: ["/stops/route/"] },
  }));
}

async function rawRequest(path, options, token, { bypassCache = false } = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const requestRouteCacheEpoch = routeCacheEpoch;
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const isGet = !options.method || options.method.toUpperCase() === "GET";
  const isPublicGet = !token && isGet;
  const canCache = isPublicGet && isEligibleForCache(normalizedPath);
  const key = isGet && !options.signal ? `${normalizedPath}\u0000${token || "guest"}` : null;

  let response;
  if (canCache && !bypassCache) {
    const cached = readSavedCache(normalizedPath);
    if (cached) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("smart-safar:stale-data", { detail: { path: normalizedPath, timestamp: cached.timestamp } }));
      }
      if (!inFlightRequests.has(key) && Date.now() - (lastRevalidatedAt.get(key) || 0) >= 5000) {
        lastRevalidatedAt.set(key, Date.now());
        const revalidationEpoch = routeCacheEpoch;
        void rawRequest(path, options, token, { bypassCache: true }).then(({ response: freshResponse, payload: fresh }) => {
          if (freshResponse.ok && routeCacheEpoch === revalidationEpoch && typeof window !== "undefined") window.dispatchEvent(new CustomEvent("smart-safar:cache-updated", { detail: { path: normalizedPath, data: fresh, timestamp: Date.now() } }));
        }).catch(() => {});
      }
      return { response: { ok: true, status: 200, headers: new Headers({ "content-type": "application/json" }) }, payload: cached.data };
    }
  }

  if (key && inFlightRequests.has(key)) return inFlightRequests.get(key);
  const request = (async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 7000);
  const abortFromCaller = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener("abort", abortFromCaller, { once: true });
  try {
    const requestOptions = { ...options, headers, signal: controller.signal };
    delete requestOptions.timeoutMs;
    if (options.signal) delete requestOptions.signal;
    response = await fetch(`${serverOrigin}/api${normalizedPath}`, { ...requestOptions, ...(!isPublicGet ? { cache: "no-store" } : {}) });
  } catch (error) {
    if (canCache) {
      const cached = readSavedCache(normalizedPath);
      if (cached) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("smart-safar:stale-data", { detail: { path: normalizedPath, timestamp: cached.timestamp } }));
        }
        return { response: { ok: true, status: 200, headers: new Headers({ "content-type": "application/json" }) }, payload: cached.data };
      }
    }
    throw new ApiError("Could not reach the transit server. Check the connection and try again.", 0, error);
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener("abort", abortFromCaller);
  }

  const contentType = response.headers.get("content-type") || "";
  let payload = null;
  if (contentType.includes("application/json")) { try { payload = await response.json(); } catch { payload = null; } }

  if (response.ok && payload && canCache && (!isRouteCachePath(normalizedPath) || routeCacheEpoch === requestRouteCacheEpoch)) {
    writeSavedCache(normalizedPath, payload);
  } else if (!response.ok && canCache && response.status >= 500) {
    const cached = readSavedCache(normalizedPath);
    if (cached) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("smart-safar:stale-data", { detail: { path: normalizedPath, timestamp: cached.timestamp } }));
      }
      return { response: { ok: true, status: 200, headers: new Headers({ "content-type": "application/json" }) }, payload: cached.data };
    }
  }

  return { response, payload };
  })();
  if (key) {
    inFlightRequests.set(key, request);
    try {
      const result = await request;
      if (canCache && result.response.ok) lastRevalidatedAt.set(key, Date.now());
      return result;
    }
    finally { if (inFlightRequests.get(key) === request) inFlightRequests.delete(key); }
  }
  return request;
}

function refreshForRole(role) {
  if (!role) return Promise.resolve(null);
  return refreshCoordinator.run(role, async () => {
      const refreshToken = readRefreshToken(role);
      if (!refreshToken) { expireRoleSession(role); return { rejected: true }; }
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);
        let response;
        try { response = await fetch(`${serverOrigin}/api/auth/refresh`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken }), cache: "no-store", signal: controller.signal }); }
        finally { clearTimeout(timeoutId); }
        const payload = await response.json().catch(() => null);
        if (refreshRejected(response.status, payload)) {
          expireRoleSession(role);
          return { rejected: true };
        }
        if (!response.ok) throw new ApiError("Connection problem while restoring your session. Please retry.", response.status, payload);
        if (!payload?.token || !payload?.refreshToken) throw new ApiError("The session refresh response was incomplete. Please retry.", 503, payload);
        storeRotatedSession(role, payload.token, payload.refreshToken);
        return { token: payload.token };
      } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError("Connection problem while restoring your session. Please retry.", 0, error);
      }
  });
}

export async function apiRequest(path, { token, ...options } = {}) {
  let { response, payload } = await rawRequest(path, options, token);
  let retriedAfterRefresh = false;
  if (!response.ok) {
    if (shouldRefreshAfter401(response.status, token, path)) {
      const role = readSessionRole(token);
      const refreshed = await refreshForRole(role);
      if (refreshed?.token) {
        ({ response, payload } = await rawRequest(path, options, refreshed.token));
        retriedAfterRefresh = true;
      } else if (refreshed?.rejected) {
        throw new ApiError("Your session expired. Please sign in again.", 401, { code: "REFRESH_REJECTED" });
      }
    }
  }
  if (retriedAfterRefresh && response.status === 401) throw new ApiError("The refreshed session was not accepted. Please retry; your session was kept.", 503, { code: "REFRESHED_ACCESS_REJECTED" });
  if (!response.ok) {
    throw new ApiError(payload?.message || "The request could not be completed.", response.status, payload);
  }
  if (options.method && options.method.toUpperCase() !== "GET") {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    if (/^\/(routes|stops)(\/|$)/.test(normalizedPath)) invalidateRouteDataCaches();
  }
  return payload;
}

export async function getBackendStatus() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${serverOrigin}/api/health`, { cache: "no-store", signal: controller.signal });
    return response.ok ? "online" : "error";
  } catch {
    return "offline";
  } finally {
    clearTimeout(timeoutId);
  }
}
