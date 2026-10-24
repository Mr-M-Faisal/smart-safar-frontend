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
  if (path === "/admin" || path.startsWith("/admin/") || path === "/safety/track" || path.startsWith("/safety/track/")) return null;
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
  if (path === "/m") return `/${safeQuery(params)}`;
  if (path === "/m/book" || path.startsWith("/m/book/")) return `/passenger${safeQuery(params)}`;
  if (path === "/m/trips" || path === "/m/account") return `/passenger${safeQuery(params)}`;
  const mappings = [["/m/routes", "/routes"], ["/m/map", "/live-map"], ["/m/login", "/login"], ["/m/driver", "/driver"]];
  const found = mappings.find(([from]) => path === from || path.startsWith(`${from}/`));
  return found ? `${found[1]}${path.slice(found[0].length)}${safeQuery(params)}` : null;
}

module.exports = { mapAppToWeb, mapWebToApp };
