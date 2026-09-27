# Smart Safar Frontend

Frontend for the Smart Safar public transit tracking system.

## Stack

- Next.js 14 and React 18
- Tailwind CSS 3
- Leaflet.js, Socket.IO Client, and Workbox Window (proposal libraries reserved for upcoming modules)

## Getting started

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_API_URL` to the backend server origin (omit `/api`).
3. To enable Google passenger sign-in, set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to the Google Web Client ID also configured as `GOOGLE_CLIENT_ID` on the backend. See the staged backend's `GOOGLE_AUTH_SETUP.md`.
4. Install dependencies with `pnpm install`.
5. Start the development server with `pnpm dev`.

For a local Driver/Admin walkthrough with the optional credential-free test panel, set `NEXT_PUBLIC_ENABLE_LOCAL_TEST_LOGIN=true` only after enabling `ALLOW_LOCAL_TEST_LOGIN=true` and `NODE_ENV=development` on the backend. Restart both servers after changing environment values. See the backend's `LOCAL_TESTING.md`. Do not enable this on a deployed service.

The home page is the public landing experience. The Routes screen reads active routes and their ordered stops from the backend. Do not put secrets in `NEXT_PUBLIC_*` variables; they are exposed to browsers.

## Phase 2: Route discovery

The public route explorer renders local Faisalabad demo data immediately, then checks `GET /api/routes` in the background. When the backend is available, it uses `GET /api/routes`, `GET /api/stops/route/:routeId`, and `GET /api/buses?route=:routeId`. Demo routes, buses, stop sequences, seat counts, and ETAs are illustrative and are not live transit service information. Backend requests time out after seven seconds.

The live map is built with Leaflet. It displays demo route paths and simulated bus markers immediately, then replaces them with `GET /api/routes`, `GET /api/buses`, and route-stop data when the backend is available. In backend mode it listens for the Socket.IO `locationUpdate` event. OpenStreetMap raster tiles require an internet connection; map attribution is shown on the map.

## Phase 3: Driver sign-in and shifts

The shared sign-in screen uses `POST /api/auth/login`, accepts administrator and driver accounts, and redirects each role to its workspace. It stores the returned JWT using the existing browser session helper. The driver workspace restores the authenticated profile from `GET /api/auth/profile`, including its assigned bus and active shift, and loads assigned vehicle details from `GET /api/buses/:id`. Drivers can start or end shifts through `POST /api/buses/assigned/start-shift` and `POST /api/buses/assigned/end-shift`; these endpoints derive the bus from the authenticated profile, so the frontend does not submit a bus ID. The server remains the source of truth for shift state. Driver accounts must be provisioned by an administrator; public sign-up remains commuter-only.

## Phase 4: Administrator dashboard

The administrator area requires an admin JWT and loads fleet overview, buses, active routes, driver accounts, shifts, booking analytics, occupancy, report summaries, and route alerts from the backend. It includes fleet status and shift tables, seven-day booking and seat-occupancy summaries, and admin-only forms for creating driver accounts, routes, route stops, buses, and passenger-facing route alerts, plus synchronized driver-to-bus assignment. Driver, route, stop, bus, and route-alert mutations use the existing protected backend APIs. The shared sign-in page redirects administrator and driver accounts to their respective workspaces; commuters cannot enter either role dashboard.

## Phase 5 and 6: Passenger bookings and tools

Passengers can create accounts with `POST /api/auth/register`, sign in with email/password or (when configured) Google, browse route alerts, reserve a route and seat, review/cancel bookings, share pickup location with the assigned driver, create private trip-sharing links, and file bus condition or safety reports. Shared trip links open the frontend tracking page and refresh the bus location while active. Drivers see opted-in booking pickup locations only during their assigned active shift; Socket.IO updates stop when consent is withdrawn or the shift ends. Administrators can publish/remove route alerts and review, resolve, or reopen passenger reports. Passenger bookings load from `GET /api/bookings/me`; personal sharing history loads from `GET /api/safety/sessions/me`. The booking screen guides passengers through route, seat number, and payment choice. Cash-at-boarding is available; the exact fare is server-owned and shown in the booking confirmation. EasyPaisa and JazzCash are shown as unavailable until backend checkout is connected. The backend accepts only `cash` or generic `online`, checks seat conflicts during booking, and does not expose seat-by-seat availability. Booking availability remains server-validated and requires a route with stops, an active assigned driver shift, and a free seat. Google sign-in requires the backend Google verification endpoint and matching Web Client IDs on both services. QR ticket creation/validation is not available in the backend.

## Phase 7: usability polish

Public pages use a mobile bottom navigation through tablet widths and switch to the desktop navigation at large breakpoints. Role workspaces keep their section navigation scrollable on phones and constrain wide admin tables to their own scroll containers. Map controls have larger mobile touch targets; search and form fields have accessible labels and visible keyboard focus. Demo route/map data is labeled as simulated, and successful online payment or QR-ticket support is not represented as available before the backend provides those integrations.

## Homepage visual asset

The hero background uses a Faisalabad bus photograph by Mzainmehdi, available under CC0 on Wikimedia Commons: https://commons.wikimedia.org/wiki/File:Buses_of_Punjab_Medical_College.JPG. The photo is loaded from Wikimedia's image host.

