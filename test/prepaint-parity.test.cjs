const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { mapAppToWeb, mapWebToApp } = require("../src/lib/appModeRedirect.cjs");
const source = fs.readFileSync(require.resolve("../public/prepaint.js"), "utf8");

function runPrepaint(urlValue, { device = "desktop", cookie = "", installed = false, includeState = false } = {}) {
  const url = new URL(urlValue, "https://smartsafar.test");
  let destination = null;
  const classes = new Set();
  const root = { classList: { add: (name) => classes.add(name) }, dataset: {} };
  const document = { cookie: cookie ? "ss-view=" + cookie : "", referrer: "", documentElement: root };
  const location = { pathname: url.pathname, search: url.search, hash: url.hash, protocol: url.protocol, replace: (value) => { destination = value; } };
  const window = {
    __smartSafarInstallPrompt: null,
    addEventListener() {}, dispatchEvent() {},
    matchMedia(query) { return { matches: query === "(max-width: 767px)" ? device === "phone" : query === "(pointer: coarse)" ? device === "phone" : query === "(display-mode: standalone)" ? installed : false }; },
  };
  const sandbox = {
    window, document, location,
    navigator: { userAgent: device === "phone" ? "Android" : "Desktop", standalone: installed },
    screen: { width: device === "phone" ? 390 : 1280, height: device === "phone" ? 844 : 800 },
    URLSearchParams, Event: class Event {}, CustomEvent: class CustomEvent {},
    sessionStorage: { getItem: () => null },
  };
  vm.runInNewContext(source, sandbox, { timeout: 100 });
  return includeState ? { destination, cookie: document.cookie } : destination;
}

test("prepaint route choices match the shared mapping", () => {
  const urls = [
    "/admin", "/admin?tab=drivers", "/m/admin", "/m/admin/stops",
    "/booking-preview", "/passenger?tab=history", "/routes/",
    "/login?returnTo=https%3A%2F%2Fevil.example", "/safety/track?token=abc",
    "/m/trips", "/m/book", "/m/account", "/m/routes?preview=1", "/app", "/web", "/account/profile", "/account/settings",
  ];
  const modes = [{ device: "phone" }, { device: "desktop" }, { device: "desktop", cookie: "app" }, { device: "phone", cookie: "web" }];
  for (const path of urls) for (const mode of modes) {
    const url = new URL(path, "https://smartsafar.test");
    const preference = mode.cookie || (mode.device === "phone" ? "app" : "web");
    const expected = preference === "app" ? mapWebToApp(url.pathname, url.search) : mapAppToWeb(url.pathname, url.search);
    const actual = runPrepaint(url.href, mode);
    assert.equal(actual, expected ? expected + url.hash : null, path + " / " + JSON.stringify(mode));
  }
});

test('prepaint keeps installed phones on shared website routes', () => {
  const actual = runPrepaint('https://smartsafar.test/routes?ref=home', { device: 'phone', cookie: 'web', installed: true, includeState: true });
  assert.equal(actual.destination, null);
  assert.match(actual.cookie, /ss-view=;.*Max-Age=0/);
  assert.equal(runPrepaint('https://smartsafar.test/routes?ref=home', { device: 'phone', cookie: 'web' }), null);
});

test('prepaint cleans view escape-hatch URLs and stores their preference', () => {
  const app = runPrepaint('https://smartsafar.test/routes?view=app&sort=name', { includeState: true });
  assert.equal(app.destination, '/routes?sort=name');
  assert.match(app.cookie, /ss-view=app/);
  const web = runPrepaint('https://smartsafar.test/m?view=web', { includeState: true });
  assert.equal(web.destination, '/m');
  assert.match(web.cookie, /ss-view=web/);
});
