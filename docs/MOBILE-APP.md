# Smart Safar mobile app

## Delivery notes

The frontend now serves two experiences from the same Next.js application. Phone-sized views use `/m/*`; desktop defaults to the existing website. The tablet default is the desktop website. The `ss-view=app|web` cookie stores an explicit user choice for one year (`Path=/`, `SameSite=Lax`); `Use desktop site` and `Open mobile app` update that preference. `/admin` and shared `/safety/track` links remain on the website. Desktop app previews remain available at `/m?preview=1`.

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

The app shell provides its own top bar and bottom tabs, safe-area and keyboard-aware viewport sizing, onboarding, a per-session animated splash, connectivity feedback, and Home-only install guidance. The service worker continues to bypass private HTML and authenticated API content.

## PWA assets

`npm run generate:splash` renders the iOS startup images from `public/logo.svg` using the Sharp development dependency. The script creates current iPhone/iPad splash dimensions under `public/splash/`. The manifest starts at `/?source=pwa`, maps phone launches to the app, and includes map, route, and trip shortcuts plus narrow and wide screenshots.

## Verification

- Unit tests cover view selection, route mapping and return-target filtering, auth/data helpers, booking display state, and splash visibility once per tab session.
- Playwright covers desktop/mobile routing, the app shell, installed launch routing, booking preview, authenticated mobile booking with mocked API responses, offline app shell, safe login return paths, CSP nonce behavior, manifest screenshot capture, splash first/subsequent launches and reduced motion, and map location/drag interactions.
- Latest full Playwright run reported 18 passing cases and 12 device-specific skips across desktop, Pixel 7, and iPhone 14. The runner stayed active after the last case during Windows process shutdown, so it was stopped after all case results had been emitted.
- The production build uses the configured `NEXT_PUBLIC_API_URL`; no deployment domain or AWS setting is embedded in this feature.
- Verify live API integration, Apple/Android installation behavior, GPS permission flows, and update/reload behavior against the deployed test environment. Lighthouse CI has not produced a reliable local report on this host; run `npm run lighthouse` in CI or a supported Chrome environment before release.

## Known validation note

Desktop visual comparison should use captures from the release baseline at 1280×800. This workspace did not have pre-change desktop captures available, so the screenshots here document the new mobile experience and do not claim pixel-diff proof of desktop identity.
