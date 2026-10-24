const assert = require('node:assert/strict');
const { test } = require('node:test');
const { getPreferredView, isPhoneViewport } = require('../src/lib/viewMode.cjs');
const { mapAppToWeb, mapWebToApp } = require('../src/lib/appModeRedirect.cjs');

function environment({ width, height, coarse = false, standalone = false } = {}) {
  return {
    screen: { width, height },
    window: { matchMedia: (query) => ({ matches: query === '(max-width: 767px)' ? width <= 767 : query === '(pointer: coarse)' ? coarse : query === '(display-mode: standalone)' ? standalone : false }) },
    navigator: { standalone },
    location: { search: '' },
    document: { referrer: '' },
  };
}

test('view mode honors a saved preference before phone and desktop defaults', () => {
  assert.equal(isPhoneViewport(environment({ width: 390, height: 844 })), true);
  assert.equal(isPhoneViewport(environment({ width: 1024, height: 768, coarse: true })), false);
  assert.equal(isPhoneViewport(environment({ width: 768, height: 1024, coarse: true })), false);
  assert.equal(getPreferredView(undefined, environment({ width: 390, height: 844 })), 'app');
  assert.equal(getPreferredView(undefined, environment({ width: 768, height: 1024 })), 'web');
  assert.equal(getPreferredView('web', environment({ width: 390, height: 844 })), 'web');
  assert.equal(getPreferredView('app', environment({ width: 1440, height: 900 })), 'app');
  assert.equal(getPreferredView(undefined, environment({ width: 390, height: 844, standalone: true })), 'app');
  assert.equal(getPreferredView(undefined, environment({ width: 1024, height: 768, standalone: true })), 'web');
});

test('web-to-app route mapping preserves query parameters and safely filters returnTo', () => {
  assert.equal(mapWebToApp('/routes', '?q=clock&returnTo=%2Fpassenger%3Ftab%3Dhistory'), '/m/routes?q=clock&returnTo=%2Fpassenger%3Ftab%3Dhistory');
  assert.equal(mapWebToApp('/passenger', '?tab=history'), '/m/trips?tab=history');
  assert.equal(mapWebToApp('/passenger', '?route=abc'), '/m/book?route=abc');
  assert.equal(mapWebToApp('/login', '?returnTo=https%3A%2F%2Fevil.example'), '/m/login');
  assert.equal(mapWebToApp('/admin'), null);
  assert.equal(mapWebToApp('/safety/track', '?token=shared'), null);
});

test('app-to-web route mapping and preview mode are stable', () => {
  assert.equal(mapAppToWeb('/m/routes', '?source=pwa'), '/routes?source=pwa');
  assert.equal(mapAppToWeb('/m/trips', '?tab=history'), '/passenger?tab=history');
  assert.equal(mapAppToWeb('/m', '?preview=1'), null);
  assert.equal(mapAppToWeb('/m/map', '?returnTo=%2F'), '/live-map?returnTo=%2F');
});
