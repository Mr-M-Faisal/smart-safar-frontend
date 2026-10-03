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

async function rawRequest(path, options, token) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);
  try {
    response = await fetch(`${serverOrigin}/api${normalizedPath}`, { ...options, headers, cache: "no-store", signal: controller.signal });
  } catch (error) {
    throw new ApiError("Could not reach the transit server. Check the connection and try again.", 0, error);
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = response.headers.get("content-type") || "";
  let payload = null;
  if (contentType.includes("application/json")) { try { payload = await response.json(); } catch { payload = null; } }
  return { response, payload };
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
      }
    }
  }
  if (retriedAfterRefresh && response.status === 401) throw new ApiError("The refreshed session was not accepted. Please retry; your session was kept.", 503, { code: "REFRESHED_ACCESS_REJECTED" });
  if (!response.ok) {
    throw new ApiError(payload?.message || "The request could not be completed.", response.status, payload);
  }
  return payload;
}

export async function getBackendStatus() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${serverOrigin}/`, { cache: "no-store", signal: controller.signal });
    return response.ok ? "online" : "error";
  } catch {
    return "offline";
  } finally {
    clearTimeout(timeoutId);
  }
}
