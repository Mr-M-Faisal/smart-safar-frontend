# Smart Safar release QA checklist

Run this on a low-end Android phone using current Chrome and a throttled 4G connection. Record the device model, Android/Chrome versions, build ID, network profile, date, and each result.

## Website and installed app

- [ ] On the public website, open and close the menu with touch and keyboard; verify Escape closes it, links work, the footer remains reachable, and no fixed tab bar covers content.
- [ ] Open `/m` in a browser and confirm the app preview banner, app-specific bottom navigation, safe-area padding, and current-tab indicator.
- [ ] Install the PWA, launch it from the home screen, and confirm `/`, `/routes`, `/live-map`, `/passenger`, and `/login` open their matching `/m` routes without a website flash.
- [ ] Check home, route list, map, and booking preview at phone width, text zoom, and dark-mode preference. Confirm labels, focus rings, and loading/error states are readable and remain in the navy/indigo/teal palette.

## Offline, updates, and privacy

- [ ] Load `/`, `/m`, and `/m/routes` online, then enable airplane mode. Confirm the public/app shell opens from cache and clearly labels saved data; live data and booking must say that a connection is needed.
- [ ] While offline, open a protected passenger, driver, or administrator route. Confirm no cached private page appears and the Retry connection state is shown.
- [ ] Deploy or simulate a newer build. Confirm the update notice waits for the user to choose Reload, then changes controller and reloads.
- [ ] Inspect browser console for Content Security Policy report-only violations on the production domains. Investigate each report; do not add unsafe inline script or eval permissions to hide it.
- [ ] Confirm browser storage contains no credentials in URLs; sign out and verify session tokens are cleared/revoked. Do not capture or share token values in QA evidence.

## Location and booking

- [ ] Deny and then grant location permission. Verify driver help explains the browser steps and status describes the last valid fix honestly.
- [ ] Simulate weak GPS accuracy, offline movement, app backgrounding, and reconnect. Confirm weak points are discarded, only the latest queued point is sent, and location updates resume without flooding.
- [ ] Mock or use a test backend to select a route, active bus, and available seat. Confirm occupied seats cannot be chosen and sign-in handoff preserves route/bus/seat.
- [ ] With an authorized test account, confirm sign-out and booking flows; never use real passenger data in screenshots or reports.

## Release evidence

- [ ] Run the frontend verification command from the security guide and backend unit checks.
- [ ] Record three mobile Lighthouse runs for the home screen, `/m`, and `/m/map`; compare median LCP, TBT, CLS, and transferred JavaScript to the checked-in budget.
- [ ] Capture any issue with a redacted screenshot, route, viewport, build ID, and steps to reproduce.

## Phase 5 local verification (2026-10-24)

- Frontend production build passed; 12 frontend unit checks and 7 backend unit checks passed.
- Playwright passed 20 browser journeys across desktop Chrome, Pixel-sized Chrome, and iPhone-sized Chrome. The desktop-only offline case is intentionally skipped.
- Lighthouse CI started and found Chrome, but this host stalled after `Run #1...`; no budget result is recorded. Rerun `npm run lighthouse` in CI or a machine where Lighthouse completes.
- Backend dependency audit was clean after safe fixes. Frontend runtime audit still reports a critical Next.js 14 issue and its bundled PostCSS finding; see `SECURITY.md` before release.
