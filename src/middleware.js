import { NextResponse } from "next/server";
import { mapAppToWeb, mapWebToApp } from "@/lib/appModeRedirect";

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
  if (navigation && !request.nextUrl.searchParams.has("_r")) {
    const preferred = request.cookies.get("ss-view")?.value;
    const userAgent = request.headers.get("user-agent") || "";
    const mobileHint = request.headers.get("sec-ch-ua-mobile") === "?1" || /Android.*Mobile|iPhone|iPod|Windows Phone|Mobile Safari/i.test(userAgent);
    const phone = mobileHint;
    let destination = null;
    if (preferred === "app") destination = mapWebToApp(pathname, search);
    else if (preferred === "web") destination = mapAppToWeb(pathname, search);
    else if (phone) destination = mapWebToApp(pathname, search);
    else destination = mapAppToWeb(pathname, search);
    if (destination) {
      const target = request.nextUrl.clone();
      const parsedTarget = new URL(destination, target.origin);
      target.pathname = parsedTarget.pathname;
      target.search = parsedTarget.search;
      return NextResponse.redirect(target, 307);
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
  response.headers.set("Content-Security-Policy-Report-Only", policy);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sw.js|build-id.js|prepaint.js|images|icons|splash).*)"],
};
