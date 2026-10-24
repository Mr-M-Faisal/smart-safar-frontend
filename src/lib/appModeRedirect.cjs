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
  if (path === "/app") return `/m${safeQuery(params)}`;
  if (path === "/web") return `/${safeQuery(params)}`;
  if (path === "/account/profile") return `/m/account/profile${safeQuery(params)}`;
  if (path === "/account/settings") return `/m/account${safeQuery(params)}`;
  if (path === "/admin" || path.startsWith("/admin/")) {
    const tabPath = { drivers: "/m/admin/drivers", buses: "/m/admin/buses", routes: "/m/admin/routes", stops: "/m/admin/stops", bookings: "/m/admin/bookings", reports: "/m/admin/reports", settings: "/m/admin/settings" };
    return `${tabPath[params.get("tab")] || (path.startsWith("/admin/") ? `/m/admin/${path.slice("/admin/".length)}` : "/m/admin")}${safeQuery(params)}`;
  }
  if (path === "/safety/track" || path.startsWith("/safety/track/")) return null;
  if (path === "/passenger" || path.startsWith("/passenger/") || path === "/booking-preview" || path.startsWith("/booking-preview/")) {
    return params.get("tab") === "history" ? `/m/trips${safeQuery(params)}` : `/m/book${safeQuery(params)}`;
  }
  const mappings = [["/routes", "/m/routes"], ["/live-map", "/m/map"], ["/login", "/m/login"], ["/driver", "/m/driver"], ["/", "/m"]];
  const found = mappings.find(([from]) => path === from || (from !== "/" && path.startsWith(`${from}/`)));
  return found ? `${found[1]}${path.slice(found[0].length)}${safeQuery(params)}` : null;
}

function mapAppToWeb(pathname = "/", search = "") {
  const params = parseSearch(search);
  const path = pathname.replace(/\/+$/, "") || "/";
  if (params.get("preview") === "1") return null;
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
