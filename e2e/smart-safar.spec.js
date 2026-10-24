const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const routeId = '64b000000000000000000001';
const busId = '64b000000000000000000002';
const testAccessToken = `eyJhbGciOiJub25lIn0.${Buffer.from(JSON.stringify({ role: 'commuter', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.test-signature`;

test('desktop keeps the existing website while phones open the separate app shell', async ({ page }, testInfo) => {
  await page.goto('/');
  if (testInfo.project.name === 'desktop-chromium') {
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    await expect(page.getByRole('button', { name: /navigation menu/i })).toBeHidden();
  } else {
    await expect(page).toHaveURL(/\/m(?:\?|$)/);
    await expect(page.getByRole('navigation', { name: 'Mobile app navigation' })).toBeVisible();
    await expect(page.getByRole('contentinfo')).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(0);
  }
});

test('production pages send a nonce CSP report and no inline application scripts', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Phone navigation first receives a device-routing redirect.');
  const response = await page.goto('/');
  const policy = response.headers()['content-security-policy-report-only'];
  expect(policy).toContain("script-src 'self' 'nonce-");
  const scriptPolicy = policy.split(';').find((directive) => directive.trim().startsWith('script-src'));
  expect(scriptPolicy).not.toContain("'unsafe-inline'");
  expect(policy.match(/'nonce-([^']+)'/)?.[1]).toBeTruthy();
  const prepaintScript = page.locator('script[src="/prepaint.js"]');
  await expect(prepaintScript).toHaveCount(1);
  const inlineScripts = await page.locator('script:not([src])').evaluateAll((scripts) => scripts.filter((script) => !script.type || /javascript|ecmascript/i.test(script.type)).map((script) => script.textContent || ''));
  expect(inlineScripts.length).toBeGreaterThan(0);
  expect(inlineScripts.every((script) => script.includes('self.__next_f'))).toBeTruthy();
});

test('mobile app shell has its own bottom navigation and no public footer', async ({ page }) => {
  await page.goto(page.viewportSize()?.width >= 1000 ? '/m?preview=1' : '/m');
  await expect(page.getByRole('navigation', { name: 'Mobile app navigation' })).toBeVisible();
  await expect(page.getByRole('contentinfo')).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(0);
});

test('splash appears on the first launch and is skipped on later navigation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'pixel-7', 'Launch lifecycle is checked once on a phone-sized browser.');
  await page.addInitScript(() => { localStorage.setItem('ss-onboarded', '1'); sessionStorage.removeItem('ss-splash-shown'); });
  await page.goto('/m');
  await expect(page.locator('.ss-splash')).toHaveClass(/is-visible/);
  await expect(page.locator('.ss-splash')).toHaveClass(/is-hidden/, { timeout: 5000 });
  await page.goto('/m/routes');
  await expect(page.locator('.ss-splash')).toHaveClass(/is-hidden/);
});

test('splash honors reduced-motion preference', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'pixel-7', 'Reduced-motion launch is checked once on a phone-sized browser.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => { localStorage.setItem('ss-onboarded', '1'); sessionStorage.removeItem('ss-splash-shown'); });
  await page.goto('/m');
  await expect(page.locator('.ss-splash')).toHaveClass(/is-visible/);
  const duration = await page.locator('.ss-splash-brand').evaluate((element) => getComputedStyle(element).animationDuration);
  expect(duration.split(',').every((value) => parseFloat(value) <= 0.15)).toBeTruthy();
  await expect(page.locator('.ss-splash')).toHaveClass(/is-hidden/, { timeout: 5000 });
});

test('map location primer explains use before requesting location', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'pixel-7', 'Location primer is checked once on a phone-sized browser.');
  await page.route('**/api/health', (route) => route.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript(() => { localStorage.setItem('ss-onboarded', '1'); sessionStorage.setItem('ss-splash-shown', '1'); localStorage.removeItem('ss-map-location-primer-seen'); });
  await page.goto('/m/map');
  await page.getByRole('button', { name: 'Locate me' }).click();
  await expect(page.getByRole('dialog', { name: 'Show your place on the map?' })).toBeVisible();
  await page.getByRole('button', { name: 'Not now' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('map details sheet can be dragged taller', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'pixel-7', 'Map sheet gesture is checked once on a phone-sized browser.');
  await page.route('**/api/health', (route) => route.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript(() => { localStorage.setItem('ss-onboarded', '1'); sessionStorage.setItem('ss-splash-shown', '1'); });
  await page.goto('/m/map');
  const handle = page.getByRole('button', { name: 'Resize map details' });
  await expect(page.locator('.app-map-sheet')).toHaveClass(/is-peek/);
  await handle.dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch', clientY: 120 });
  await handle.dispatchEvent('pointerup', { pointerId: 1, pointerType: 'touch', clientY: 60 });
  await expect(page.locator('.app-map-sheet')).toHaveClass(/is-half/);
});

test('installed launch redirects a website route to its app route before hydration', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'desktop-chromium', 'Installed routing redirects only phone-sized experiences.');
  await page.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = (query) => query === '(display-mode: standalone)' ? { matches: true } : original(query);
  });
  await page.goto('/routes?source=installed-check');
  await expect(page).toHaveURL(/\/m\/routes\?source=installed-check$/);
});

test('booking preview supports route, bus, seat, and sign-in handoff with mocked API', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Phone booking uses the app stepper.');
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    let body = {};
    if (url.pathname.endsWith('/routes/overview')) body = [{ _id: routeId, routeName: 'Clock Tower Express', startPoint: 'Clock Tower', endPoint: 'D Ground', fare: 80 }];
    else if (url.pathname.endsWith(`/buses/route/${routeId}/active`)) body = [{ _id: busId, busNumber: 'SS-21', availableSeats: 2, fare: 80 }];
    else if (url.pathname.endsWith(`/buses/${busId}/seats`)) body = { capacity: 2, seats: [{ seatNumber: 1, status: 'available' }, { seatNumber: 2, status: 'booked' }] };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.goto('/booking-preview');
  await page.getByLabel(/choose a route/i).selectOption(routeId);
  await page.getByRole('button', { name: /SS-21/ }).waitFor();
  await expect(page.getByRole('button', { name: 'Seat 1, available' })).toBeEnabled();
  await page.getByRole('button', { name: 'Seat 1, available' }).click();
  await page.getByRole('link', { name: /sign in to reserve seat 1/i }).click();
  await expect(page).toHaveURL(/\/login\?bookingRoute=.*bookingBus=.*bookingSeat=1$/);
});

test('mobile booking stepper reserves a mocked seat after passenger sign-in', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'desktop-chromium', 'Mobile stepper runs on phone-sized browsers.');
  await page.addInitScript(() => localStorage.setItem('ss-onboarded', '1'));
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    let body = {};
    if (url.pathname.endsWith('/auth/login')) body = { token: testAccessToken, refreshToken: 'test-refresh-token', role: 'commuter', user: { name: 'Test Passenger', email: 'test@example.com', role: 'commuter' } };
    else if (url.pathname.endsWith('/auth/profile')) body = { name: 'Test Passenger', email: 'test@example.com', role: 'commuter' };
    else if (url.pathname.endsWith('/routes/overview')) body = [{ _id: routeId, routeName: 'Clock Tower Express', startPoint: 'Clock Tower', endPoint: 'D Ground', fare: 80 }];
    else if (url.pathname.endsWith(`/buses/route/${routeId}/active`)) body = [{ _id: busId, busNumber: 'SS-21', availableSeats: 2, capacity: 2, fare: 80 }];
    else if (url.pathname.endsWith(`/buses/${busId}/seats`)) body = { capacity: 2, seats: [{ seatNumber: 1, status: 'available' }, { seatNumber: 2, status: 'reserved' }] };
    else if (url.pathname.endsWith('/bookings')) body = { booking: { _id: 'booking-test', seatNumber: '1', status: 'confirmed' } };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.goto(`/m/book?route=${routeId}`);
  await expect(page).toHaveURL(/\/m\/login\?returnTo=/);
  await expect(page.locator('.ss-splash')).toHaveClass(/is-hidden/);
  await page.getByLabel('Email address').fill('test@example.com');
  await page.getByLabel('Password').fill('test-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click({ noWaitAfter: true });
  await expect(page.getByRole('heading', { name: 'Choose a route' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Choose an operating bus' })).toBeVisible();
  await page.getByRole('button', { name: /SS-21/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Pick a seat' })).toBeVisible();
  await page.getByRole('button', { name: 'Seat 1', exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Review your booking' })).toBeVisible();
  await page.getByRole('button', { name: 'Reserve seat' }).click();
  await expect(page.getByRole('heading', { name: 'Your seat is reserved' })).toBeVisible();
});

test('desktop redirects mobile routes unless the app preview is requested', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Only desktop needs reverse app routing.');
  await page.goto('/m');
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/m?preview=1');
  await expect(page.getByRole('navigation', { name: 'Mobile app navigation' })).toBeVisible();
  await expect(page.locator('.m-app-stage.is-preview')).toBeVisible();
});

test('unsafe return target stays on this site', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'The phone login flow returns to its app route.');
  await page.route('**/api/auth/login', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ token: testAccessToken, refreshToken: 'test-refresh-token', role: 'commuter', user: { name: 'Test Passenger', email: 'test@example.com', role: 'commuter' } }),
  }));
  await page.goto('/login?returnTo=https%3A%2F%2Fevil.example%2Fsteal');
  await page.getByLabel('Email address').fill('test@example.com');
  await page.getByLabel('Password').fill('test-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/(?:passenger(?:\?|$)|login\?returnTo=%2Fpassenger$)/);
  expect(page.url()).not.toContain('evil.example');
});

test('mobile app shell is available offline after its production shell is cached', async ({ page, context }) => {
  test.skip(testInfoProjectIsDesktop(page), 'Offline mobile shell check runs on phone-sized browsers.');
  await page.goto('/m');
  await expect(page.getByRole('navigation', { name: 'Mobile app navigation' })).toBeVisible();
  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return;
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
  });
  await page.reload();
  await expect(page.getByRole('navigation', { name: 'Mobile app navigation' })).toBeVisible();
  await expect.poll(() => page.evaluate(async () => {
    const names = await caches.keys();
    for (const name of names.filter((key) => key.startsWith('smart-safar-static-'))) {
      if (await (await caches.open(name)).match(new URL('/m', location.origin))) return true;
    }
    return false;
  })).toBeTruthy();
  await context.setOffline(true);
  await page.goto('/m');
  await expect(page.getByRole('navigation', { name: 'Mobile app navigation' })).toBeVisible();
});

test('captures narrow and wide app screenshots for the install manifest', async ({ page }, testInfo) => {
  const isPhone = testInfo.project.name === 'pixel-7';
  test.skip(!isPhone && testInfo.project.name !== 'desktop-chromium', 'One narrow phone and one wide preview screenshot are sufficient.');
  await page.addInitScript(() => {
    localStorage.setItem('ss-onboarded', '1');
    localStorage.setItem('smart-safar-install-dismissed-until', String(Date.now() + 60 * 60 * 1000));
    sessionStorage.setItem('ss-splash-shown', '1');
  });
  await page.route('**/api/**', (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const body = pathname.endsWith('/routes/overview')
      ? [{ _id: routeId, routeName: 'Clock Tower Express', startPoint: 'Clock Tower', endPoint: 'D Ground', fare: 80, buses: [{ _id: busId }] }]
      : { status: 'ok' };
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  const output = path.join(process.cwd(), 'public', 'screenshots');
  fs.mkdirSync(output, { recursive: true });
  await page.goto(isPhone ? '/m' : '/m?preview=1');
  await expect(page.getByRole('navigation', { name: 'Mobile app navigation' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Find your way through Faisalabad/ })).toBeVisible();
  await expect(page.locator('.ss-splash')).toHaveClass(/is-hidden/);
  await page.screenshot({ path: path.join(output, isPhone ? 'smart-safar-app-narrow.png' : 'smart-safar-app-wide.png'), animations: 'disabled' });
});

test('mobile transit map ignores out-of-area stop and bus coordinates', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'pixel-7', 'Service-area map bounds are checked on a phone-sized browser.');
  await page.route('**/tile.openstreetmap.org/**', (route) => route.abort());
  await page.route('**/api/routes/overview', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ _id: routeId, routeName: 'Clock Tower Express', startPoint: 'Clock Tower', endPoint: 'D Ground', stops: [
      { _id: 'inside', stopName: 'Clock Tower', latitude: 31.4181, longitude: 73.0776 },
      { _id: 'outside', stopName: 'Distant point', latitude: 40.7128, longitude: -74.006 },
    ], buses: [{ _id: busId, busNumber: 'SS-21', currentLocation: { latitude: 40.7128, longitude: -74.006 }, status: 'active' }] }]),
  }));
  await page.addInitScript(() => { localStorage.setItem('ss-onboarded', '1'); sessionStorage.setItem('ss-splash-shown', '1'); });
  await page.goto('/m/map');
  const map = page.locator('.leaflet-route-map');
  await expect(map).toHaveAttribute('data-center-lat', /31\./, { timeout: 10000 });
  const center = await map.evaluate((element) => [Number(element.dataset.centerLat), Number(element.dataset.centerLng)]);
  expect(Math.abs(center[0] - 31.4181)).toBeLessThan(0.5);
  expect(Math.abs(center[1] - 73.0776)).toBeLessThan(0.5);
  await expect(map.locator('.ss-leaflet-marker')).toHaveCount(0);
});

function testInfoProjectIsDesktop(page) {
  return page.viewportSize()?.width >= 1000;
}
