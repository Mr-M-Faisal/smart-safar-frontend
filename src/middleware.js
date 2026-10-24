import { NextResponse } from "next/server";
import { mapAppToWeb, mapWebToApp } from "@/lib/appModeRedirect";
import viewMode from "@/lib/viewMode.cjs";

const apiOrigin = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").origin; }
  catch (_error) { return "http://localhost:5000"; }
})();
const websocketOrigin = apiOrigin.replace(/^https:/, "wss:").replace(/^http:/, "ws:");

export function middleware(request) {
  const { pathname, search } = request.nextUrl;
  const method = request.method;
  const acceptsHtml = request.headers.get("accept")?.includes("text/html");
  const navigation = method === "GET" && (request.headers.get("sec-fetch-mode") === "navigate" || acceptsHtml);
  if (navigation && method === "GET" && (pathname === "/app" || pathname === "/web")) {
    const response = NextResponse.redirect(new URL("/", request.url), 307);
    if (pathname === "/app") response.cookies.set("ss-view", "app", { path: "/", maxAge: 31536000, sameSite: "lax", secure: request.nextUrl.protocol === "https:" });
    else response.cookies.set("ss-view", "web", { path: "/", sameSite: "lax", secure: request.nextUrl.protocol === "https:" });
    return response;
  }
  const safetyTrackingPath = pathname === "/safety/track" || pathname.startsWith("/safety/track/");
  if (navigation && method === "GET" && !safetyTrackingPath && request.nextUrl.searchParams.get("view") && ["app", "web"].includes(request.nextUrl.searchParams.get("view"))) {
    const requestedView = request.nextUrl.searchParams.get("view");
    const target = request.nextUrl.clone();
    target.searchParams.delete("view");
    const response = NextResponse.redirect(target, 307);
    if (requestedView === "app") response.cookies.set("ss-view", "app", { path: "/", maxAge: 31536000, sameSite: "lax", secure: request.nextUrl.protocol === "https:" });
    else response.cookies.set("ss-view", "web", { path: "/", sameSite: "lax", secure: request.nextUrl.protocol === "https:" });
    return response;
  }
  let clearInstalledWebPreference = false;
  if (navigation && !request.nextUrl.searchParams.has("_r") && !safetyTrackingPath) {
    const preferred = request.cookies.get("ss-view")?.value;
    const userAgent = request.headers.get("user-agent") || "";
    const mobileHint = request.headers.get("sec-ch-ua-mobile") === "?1" || /Android.*Mobile|iPhone|iPod|Windows Phone|Mobile Safari/i.test(userAgent);
    const phone = mobileHint;
    const environment = {
      window: { matchMedia: (query) => ({ matches: query === "(display-mode: standalone)" ? /standalone/.test(search) : query === "(max-width: 767px)" || query === "(pointer: coarse)" ? phone : false }) },
      navigator: { userAgent }, document: { referrer: request.headers.get("referer") || "" },
      location: request.nextUrl,
    };
    const installedPhone = viewMode.isInstalledApp(environment) && phone;
    const desiredView = viewMode.getPreferredView(preferred, environment);
    clearInstalledWebPreference = installedPhone && preferred === "web";
    let destination = null;
    if (desiredView === "app") destination = mapWebToApp(pathname, search);
    else destination = mapAppToWeb(pathname, search);
    if (destination) {
      const target = request.nextUrl.clone();
      const parsedTarget = new URL(destination, target.origin);
      target.pathname = parsedTarget.pathname;
      target.search = parsedTarget.search;
      const response = NextResponse.redirect(target, 307);
      if (clearInstalledWebPreference) response.cookies.set("ss-view", "", { path: "/", maxAge: 0, sameSite: "lax", secure: request.nextUrl.protocol === "https:" });
      return response;
    }
  }
  const nonce = btoa(crypto.randomUUID());
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://accounts.google.com`,
    "frame-src 'self' https://accounts.google.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://tile.openstreetmap.org https://*.tile.openstreetmap.org",
    "font-src 'self' data:",
    `connect-src 'self' ${apiOrigin} ${websocketOrigin} https://accounts.google.com https://tile.openstreetmap.org https://*.tile.openstreetmap.org`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next reads this request policy and applies its nonce to framework scripts.
  // Only the report-only policy is sent to the browser during the initial audit.
  requestHeaders.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (clearInstalledWebPreference) response.cookies.set("ss-view", "", { path: "/", maxAge: 0, sameSite: "lax", secure: request.nextUrl.protocol === "https:" });
  response.headers.set("Content-Security-Policy-Report-Only", policy);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sw.js|build-id.js|version.json|prepaint.js|images|icons|splash).*)"],
};
