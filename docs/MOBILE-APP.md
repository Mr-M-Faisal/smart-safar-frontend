# Smart Safar mobile app

## Delivery notes

The frontend now serves two experiences from the same Next.js application. Phone-sized views use `/m/*`; desktop defaults to the existing website. The tablet default is the desktop website. `ss-view=app` persists for one year, while `ss-view=web` is a session preference. An installed phone launch always opens the app, even if the browser previously chose the website. Use `/app` to reset the preference and open the app; reinstalling does not clear it because the preference is a browser cookie. `/web` opens the website for the current browser session. The `?view=app` and `?view=web` URL options set the same preferences. Shared `/safety/track` links are never redirected. Desktop app previews remain available at `/m?preview=1`.

No backend or AWS deployment configuration was changed. Existing API, session, booking, map, and driver tracking logic is reused. The mobile screens use the existing navy, indigo, and teal palette; shared desktop page layouts were not redesigned. Browser screenshots for the install manifest are in `public/screenshots/`.

## Mobile routes

| Route | Screen |
| --- | --- |
| `/m` | Home, route search, quick actions, active routes, and map preview |
| `/m/map` | Lazy-loaded live Leaflet map, draggable route/bus details, and a location-use primer |
| `/m/routes` and `/m/routes/[routeId]` | Search/filter, route cards, stops, buses, and booking entry |
| `/m/book` | Route → bus → seat → payment → confirmation; preserves a safe sign-in return path |
| `/m/trips` | Bookings, safety sessions, and incident reporting |
| `/m/account` | Profile, theme, install help, desktop switch, and sign-out |
| `/m/login` | Passenger sign-in/registration and configured Google sign-in |
| `/m/driver` | Reuses the driver shift and location tracking screen |

The app shell provides its own top bar and bottom tabs, safe-area and keyboard-aware viewport sizing, onboarding, a per-session animated splash, connectivity feedback, and a shared install action where the browser supports installation. The service worker continues to bypass private HTML and authenticated API content.

## Install on a phone

The app is installable from `localhost` during local development and from an HTTPS deployment or HTTPS tunnel. A plain LAN address such as `http://192.168.x.x` is not a secure install context. On Android Chrome/Edge, use **Install** and confirm the browser prompt. On iOS Safari, use **Install**, then Share → Add to Home Screen → Add; iOS does not expose a programmatic install dialog. The browser always asks the user before installing. APK packaging with Trusted Web Activity or Capacitor is a separate future option if a downloadable package is needed.

## PWA assets

`npm run generate:splash` renders the iOS startup images from `public/logo.svg` using the Sharp development dependency. The script creates current iPhone/iPad splash dimensions under `public/splash/`. The manifest starts at `/?source=pwa`, maps phone launches to the app, and includes map, route, and trip shortcuts plus narrow and wide screenshots.

## Release versions

The prebuild step generates a unique build id and `public/version.json`; the app compares that metadata with the running build to report available updates. Add a newest-first entry to `src/content/changelog.json` for each release. The unit suite verifies its newest version matches `package.json`.

- `npm run release:patch` increments the patch version and regenerates release metadata.
- `npm run release:minor` increments the minor version and regenerates release metadata.
- Both release scripts avoid creating a Git tag or commit; review and commit the resulting version files normally.

## Verification

- Unit tests cover view selection, route mapping and return-target filtering, auth/data helpers, booking display state, and splash visibility once per tab session.
- Playwright covers desktop/mobile routing, the app shell, installed launch routing, booking preview, authenticated mobile booking with mocked API responses, offline app shell, safe login return paths, CSP nonce behavior, manifest screenshot capture, splash first/subsequent launches and reduced motion, and map location/drag interactions.
- Latest full Playwright run reported 18 passing cases and 12 device-specific skips across desktop, Pixel 7, and iPhone 14. The runner stayed active after the last case during Windows process shutdown, so it was stopped after all case results had been emitted.
- The production build uses the configured `NEXT_PUBLIC_API_URL`; no deployment domain or AWS setting is embedded in this feature.
- Verify live API integration, Apple/Android installation behavior, GPS permission flows, and update/reload behavior against the deployed test environment. Lighthouse CI has not produced a reliable local report on this host; run `npm run lighthouse` in CI or a supported Chrome environment before release.

## Known validation note

Desktop visual comparison should use captures from the release baseline at 1280×800. This workspace did not have pre-change desktop captures available, so the screenshots here document the new mobile experience and do not claim pixel-diff proof of desktop identity.
