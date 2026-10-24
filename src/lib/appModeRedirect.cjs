const safeReturnTo = require("./auth/safeReturnTo.cjs");

function parseSearch(search) {
  if (search instanceof URLSearchParams) return new URLSearchParams(search);
  return new URLSearchParams(String(search || "").replace(/^\?/, ""));
}

function safeQuery(params) {
  if (params.has("returnTo")) {
    const safe = safeReturnTo(params.get("returnTo"), null);
    if (safe) params.set("returnTo", safe);
    else params.delete("returnTo");
  }
  const value = params.toString();
  return value ? `?${value}` : "";
}

function mapWebToApp(pathname = "/", search = "") {
  const params = parseSearch(search);
  const path = pathname.replace(/\/+$/, "") || "/";
  // The PWA now uses the same responsive routes as the website. Keep legacy
  // /m links working by sending them to their corresponding shared route.
  if (path === "/app") return `/${safeQuery(params)}`;
  if (path === "/web") return `/${safeQuery(params)}`;
  if (path === "/safety/track" || path.startsWith("/safety/track/")) return null;
  return path === "/m" || path.startsWith("/m/") ? mapAppToWeb(path, search) : null;
}

function mapAppToWeb(pathname = "/", search = "") {
  const params = parseSearch(search);
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/m/account/profile") return `/account/profile${safeQuery(params)}`;
  if (path === "/m/admin/settings") return `/account/settings${safeQuery(params)}`;
  if (path === "/m") return `/${safeQuery(params)}`;
  if (path === "/m/book" || path.startsWith("/m/book/")) return `/passenger${safeQuery(params)}`;
  if (path === "/m/trips") return `/passenger${safeQuery(params)}`;
  if (path === "/m/account") return `/account/settings${safeQuery(params)}`;
  if (path === "/m/admin" || path.startsWith("/m/admin/")) {
    const tabFromPath = { "/m/admin": "overview", "/m/admin/drivers": "drivers", "/m/admin/buses": "buses", "/m/admin/routes": "routes", "/m/admin/stops": "routes", "/m/admin/bookings": "bookings", "/m/admin/reports": "reports", "/m/admin/settings": "overview" };
    if (!Object.hasOwn(tabFromPath, path)) return null;
    params.set("tab", tabFromPath[path]);
    return `/admin${safeQuery(params)}`;
  }
  const mappings = [["/m/routes", "/routes"], ["/m/map", "/live-map"], ["/m/login", "/login"], ["/m/driver", "/driver"]];
  const found = mappings.find(([from]) => path === from || path.startsWith(`${from}/`));
  return found ? `${found[1]}${path.slice(found[0].length)}${safeQuery(params)}` : null;
}

module.exports = { mapAppToWeb, mapWebToApp };
