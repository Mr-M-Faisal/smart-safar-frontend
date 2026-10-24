# Phase 4 manual QA

Use this checklist after a production build is deployed to a test environment. Keep the existing navy, indigo, and teal Smart Safar styles when recording or fixing visual issues.

## Navigation and accessibility (C4)

| Check | Expected result |
| --- | --- |
| Open every admin sidebar item | URL tab query changes, active item follows the URL, and browser Back restores the prior tab. |
| Open every passenger dashboard tab | `?tab=` follows the selected tab and Back/Forward restores it. |
| Open a booking link while signed out | Sign-in retains route, bus, and seat selection; return targets stay on this site. |
| Open `/m`, `/m/routes`, `/m/map`, `/m/book`, `/m/trips`, `/m/account`, and `/m/driver` | Each is a route with the correct active mobile tab. |
| Navigate with keyboard and screen reader | Focus moves to the new page heading and the live region announces its title. |
| Use browser Back after scrolling a long route/list page | Previous scroll position is restored. |
| Disable network and open a protected passenger, driver, or admin page | A branded no-connection page offers Retry; protected HTML is never served from cache. |

## Driver location (C1)

1. Sign in as a driver assigned to a bus and start its shift. Open the driver screen on a device/browser with location permission.
2. Confirm the status chip changes from Searching to Good or Weak, the last-send age updates, and a valid location appears on the map.
3. Deny location permission, then grant it in browser site settings and retry. Confirm the inline help explains how to grant permission.
4. Simulate a weak fix (>100 m accuracy); it must not be sent. Confirm updates are rate-limited to a maximum of one per five seconds and require >15 m movement or 15 seconds elapsed.
5. Go offline, move the simulated device, then reconnect. Only the latest queued position should be sent.
6. Background the page and return. GPS may be paused by the browser; the screen wake lock should be reacquired and the UI should show freshness honestly.
7. Stop the shift and confirm location updates are rejected by the backend. Submit an older timestamp and malformed coordinates/speed; expect a 4xx response.
8. Optional API simulator (start a shift first): set `SIMULATOR_DRIVER_EMAIL`, `SIMULATOR_DRIVER_PASSWORD`, and `SIMULATOR_BUS_ID`, then run `npm run simulate:driver` from `backend/`.

## Service worker update and offline (B6)

1. Build and deploy release A. Visit `/`, `/m`, and `/m/routes` once while online.
2. Build and deploy release B with a changed build ID. Keep the original page open; confirm a Smart Safar update toast appears and no reload happens automatically.
3. Select Reload in the toast. Confirm the page reloads only after the new worker activates.
4. Go offline and reload `/` and `/m`; the cached shell or branded offline page should appear.
5. While offline, open a protected page. It must show a no-connection state, never prior authenticated content.
6. Inspect Cache Storage: no `/api/`, `/socket.io/`, `/admin`, `/driver`, `/passenger`, or authorization-bearing response may be cached. Old Smart Safar build caches should be removed after activation.
7. Confirm `/sw.js` and `/manifest.webmanifest` respond with no-cache/no-store headers.

## Performance (B8)

On the same device, browser version, network profile, and production build, record three Lighthouse runs for `/`, `/routes`, `/live-map`, `/booking-preview`, `/admin`, and `/m`. Report the median for LCP, INP, CLS, total blocking time, and transferred JS. Record the date and device; do not compare dev-server runs with production. To open webpack bundle reports, set `ANALYZE=true` before `npm run build` (PowerShell: `$env:ANALYZE='true'; npm run build`).

Post-change build snapshot (2026-10-23, Next.js 14.2.35 production build; Node 24 runtime despite the project's Node 18–20 engine declaration): shared first-load JS 87.9 KB; route first-load JS 88–122 KB (largest: `/passenger` 122 KB). The original pre-change build was unavailable, so this is a current baseline rather than a before/after comparison. Lighthouse Core Web Vitals still need measurement on a target device/network before using the budgets below as a release gate.

Largest emitted client chunks from the post-change build (gzip level 9, rounded):

| Chunk | Raw | Gzip |
| --- | ---: | ---: |
| `fd9d1056-040d14e71efbeeaf.js` | 169 KB | 52 KB |
| `framework-a63c59c368572696.js` | 137 KB | 44 KB |
| `d0deef33.e0722780845cf21c.js` | 145 KB | 41 KB |
| `polyfills-42372ed130431b0a.js` | 110 KB | 39 KB |
| `main-cc58df4a6616e76c.js` | 114 KB | 33 KB |
| `2117-9fb0ae56233da9da.js` | 121 KB | 31 KB |
| `app/admin/page-c5b15fc5bb334f72.js` | 59 KB | 14 KB |
| `app/passenger/page-8e3b2a4d32f29957.js` | 46 KB | 13 KB |
| `8680.b56188d40e20a6f0.js` | 42 KB | 13 KB |
| `app/(public)/live-map/page-a0df5b1416077ed9.js` | 37 KB | 12 KB |

Suggested initial budgets: LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1; initial-route JS <= 250 KB compressed; no route JS increase >10% without a recorded reason. Use Lighthouse's mobile configuration and enforce the Core Web Vitals thresholds after collecting a valid baseline.
