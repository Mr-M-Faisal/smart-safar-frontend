const assert = require('node:assert/strict');
const { isInstalledApp } = require('../src/lib/appMode.cjs');

function environment(overrides = {}) {
  return {
    window: { matchMedia: () => ({ matches: false }), location: { search: '' } },
    navigator: {},
    document: { referrer: '' },
    ...overrides,
  };
}

assert.equal(isInstalledApp(environment()), false, 'regular browser is website mode');
assert.equal(isInstalledApp(environment({ window: { matchMedia: () => ({ matches: true }), location: { search: '' } } })), true, 'standalone display mode is app mode');
assert.equal(isInstalledApp(environment({ navigator: { standalone: true } })), true, 'iOS standalone is app mode');
assert.equal(isInstalledApp(environment({ document: { referrer: 'android-app://com.example.app' } })), true, 'Android app referrer is app mode');
assert.equal(isInstalledApp(environment({ window: { matchMedia: () => ({ matches: false }), location: { search: '' }, Capacitor: { isNativePlatform: () => true } } })), true, 'Capacitor native runtime is app mode');
assert.equal(isInstalledApp(environment({ window: { matchMedia: () => ({ matches: false }), location: { search: '?source=pwa' } } })), true, 'PWA launch query is app mode');

console.log('app-mode tests passed');

const viewMode = require('../src/lib/viewMode.cjs');
assert.equal(viewMode.isPhoneViewport({ window: { matchMedia: () => ({ matches: true }) } }), true);
