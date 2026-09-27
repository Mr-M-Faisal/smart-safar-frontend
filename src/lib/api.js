const serverOrigin = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export async function apiRequest(path, { token, ...options } = {}) {
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
  const payload = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    throw new ApiError(payload?.message || "The request could not be completed.", response.status, payload);
  }
  return payload;
}

export async function getBackendStatus() {
  try {
    const response = await fetch(`${serverOrigin}/`, { cache: "no-store" });
    return response.ok ? "online" : "error";
  } catch {
    return "offline";
  }
}
