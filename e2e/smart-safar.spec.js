const { test, expect } = require('@playwright/test');

const routeId = '64b000000000000000000001';
const busId = '64b000000000000000000002';

test('public site keeps desktop navigation and uses a mobile menu with a footer', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('banner')).toBeVisible();
  if (testInfo.project.name === 'desktop-chromium') {
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    await expect(page.getByRole('button', { name: /navigation menu/i })).toHaveCount(0);
  } else {
    await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toHaveCount(0);
  }
});

test('production pages send a nonce CSP report and no inline application scripts', async ({ page }) => {
  const response = await page.goto('/');
  const policy = response.headers()['content-security-policy-report-only'];
  expect(policy).toContain("script-src 'self' 'nonce-");
  const scriptPolicy = policy.split(';').find((directive) => directive.trim().startsWith('script-src'));
  expect(scriptPolicy).not.toContain("'unsafe-inline'");
  const nonce = policy.match(/'nonce-([^']+)'/)?.[1];
  expect(nonce).toBeTruthy();
  const prepaintScript = page.locator('script[src="/prepaint.js"]');
  await expect(prepaintScript).toHaveCount(1);
  const inlineScriptNonces = await page.locator('script:not([src])').evaluateAll((scripts) => scripts.map((script) => script.nonce));
  expect(inlineScriptNonces.length).toBeGreaterThan(0);
  expect(inlineScriptNonces.every((value) => value === nonce)).toBeTruthy();
});

test('mobile app shell has its own bottom navigation and no public footer', async ({ page }) => {
  await page.goto('/m');
  await expect(page.getByRole('navigation', { name: 'Mobile app navigation' })).toBeVisible();
  await expect(page.getByRole('contentinfo')).toHaveCount(0);
});

test('installed launch redirects a website route to its app route before hydration', async ({ page }) => {
  await page.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = (query) => query === '(display-mode: standalone)' ? { matches: true } : original(query);
  });
  await page.goto('/routes?source=installed-check');
  await expect(page).toHaveURL(/\/m\/routes\?source=installed-check$/);
});

test('booking preview supports route, bus, seat, and sign-in handoff with mocked API', async ({ page }) => {
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

test('unsafe return target stays on this site', async ({ page }) => {
  await page.route('**/api/auth/login', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ token: 'test-access-token', refreshToken: 'test-refresh-token', role: 'commuter', user: { name: 'Test Passenger', email: 'test@example.com' } }),
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

function testInfoProjectIsDesktop(page) {
  return page.viewportSize()?.width >= 1000;
}
