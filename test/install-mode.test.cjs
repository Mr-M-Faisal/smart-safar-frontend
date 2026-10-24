const test = require("node:test");
const assert = require("node:assert/strict");
const { installInstructions, resolveInstallMode } = require("../src/lib/pwa/installMode.cjs");
test("install mode covers installed, native prompt, iOS, Android and desktop", () => {
  assert.equal(resolveInstallMode({ standalone: true, userAgent: "Android" }), "installed");
  assert.equal(resolveInstallMode({ relatedAppInstalled: true }), "installed");
  assert.equal(resolveInstallMode({ hasPromptEvent: true }), "prompt");
  assert.equal(resolveInstallMode({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1" }), "ios-safari");
  assert.equal(resolveInstallMode({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/120 Mobile/15E148 Safari/604.1" }), "ios-other");
  assert.equal(resolveInstallMode({ userAgent: "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 SamsungBrowser/23.0 Chrome/115.0 Mobile Safari/537.36" }), "android-manual");
  assert.equal(resolveInstallMode({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0" }), "desktop-manual");
});
test("install help uses browser-specific instructions", () => {
  assert.match(installInstructions({ mode: "android-manual", userAgent: "SamsungBrowser" }).join(" "), /Add page to/);
  assert.match(installInstructions({ mode: "desktop-manual" }).join(" "), /address bar/);
  assert.match(installInstructions({ mode: "ios-other" }).join(" "), /Safari/);
});
