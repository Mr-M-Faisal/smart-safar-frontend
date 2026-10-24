const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { mapAppToWeb, mapWebToApp } = require("../src/lib/appModeRedirect.cjs");
const source = fs.readFileSync(require.resolve("../public/prepaint.js"), "utf8");

function runPrepaint(urlValue, { device = "desktop", cookie = "" } = {}) {
  const url = new URL(urlValue, "https://smartsafar.test");
  let destination = null;
  const classes = new Set();
  const root = { classList: { add: (name) => classes.add(name) }, dataset: {} };
  const document = { cookie: cookie ? "ss-view=" + cookie : "", referrer: "", documentElement: root };
  const location = { pathname: url.pathname, search: url.search, hash: url.hash, replace: (value) => { destination = value; } };
  const window = {
    __smartSafarInstallPrompt: null,
    addEventListener() {}, dispatchEvent() {},
    matchMedia(query) { return { matches: query === "(max-width: 767px)" ? device === "phone" : query === "(pointer: coarse)" ? device === "phone" : false }; },
  };
  const sandbox = {
    window, document, location,
    navigator: { userAgent: device === "phone" ? "Android" : "Desktop", standalone: false },
    screen: { width: device === "phone" ? 390 : 1280, height: device === "phone" ? 844 : 800 },
    URLSearchParams, Event: class Event {}, CustomEvent: class CustomEvent {},
    sessionStorage: { getItem: () => null },
  };
  vm.runInNewContext(source, sandbox, { timeout: 100 });
  return destination;
}

test("prepaint route choices match the shared mapping", () => {
  const urls = [
    "/admin", "/admin?tab=drivers", "/m/admin", "/m/admin/stops",
    "/booking-preview", "/passenger?tab=history", "/routes/",
    "/login?returnTo=https%3A%2F%2Fevil.example", "/safety/track?token=abc",
    "/m/trips", "/m/book", "/m/account", "/m/routes?preview=1",
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
