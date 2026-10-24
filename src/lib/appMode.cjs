function isInstalledApp(environment = {}) {
  const browserWindow = environment.window || (typeof window !== "undefined" ? window : null);
  const browserNavigator = environment.navigator || (typeof navigator !== "undefined" ? navigator : null);
  const browserDocument = environment.document || (typeof document !== "undefined" ? document : null);
  const browserLocation = environment.location || browserWindow?.location || null;

  let standaloneDisplay = false;
  try { standaloneDisplay = Boolean(browserWindow?.matchMedia?.("(display-mode: standalone)")?.matches); }
  catch (_error) { standaloneDisplay = false; }

  let sourceLaunch = false;
  try { sourceLaunch = new URLSearchParams(browserLocation?.search || "").get("source") === "pwa"; }
  catch (_error) { sourceLaunch = false; }

  let capacitorApp = false;
  try { capacitorApp = Boolean(browserWindow?.Capacitor?.isNativePlatform?.()); }
  catch (_error) { capacitorApp = false; }

  return standaloneDisplay
    || browserNavigator?.standalone === true
    || Boolean(browserDocument?.referrer?.startsWith("android-app://"))
    || capacitorApp
    || sourceLaunch;
}

module.exports = { isInstalledApp };
