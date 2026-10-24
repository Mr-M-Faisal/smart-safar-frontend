function isInstalledApp(environment = {}) {
  const browserWindow = environment.window || (typeof window !== "undefined" ? window : null);
  const browserNavigator = environment.navigator || (typeof navigator !== "undefined" ? navigator : null);
  const browserDocument = environment.document || (typeof document !== "undefined" ? document : null);
  const browserLocation = environment.location || browserWindow?.location || null;
  let standaloneDisplay = false;
  try { standaloneDisplay = Boolean(browserWindow?.matchMedia?.("(display-mode: standalone)")?.matches); } catch (_error) {}
  let sourceLaunch = false;
  try { sourceLaunch = new URLSearchParams(browserLocation?.search || "").get("source") === "pwa"; } catch (_error) {}
  let capacitorApp = false;
  try { capacitorApp = Boolean(browserWindow?.Capacitor?.isNativePlatform?.()); } catch (_error) {}
  return standaloneDisplay || browserNavigator?.standalone === true || Boolean(browserDocument?.referrer?.startsWith("android-app://")) || capacitorApp || sourceLaunch;
}

function isPhoneViewport(environment = {}) {
  const browserWindow = environment.window || (typeof window !== "undefined" ? window : null);
  const browserScreen = environment.screen || (typeof screen !== "undefined" ? screen : null);
  const match = (query) => {
    try { return Boolean(browserWindow?.matchMedia?.(query)?.matches); } catch (_error) { return false; }
  };
  if (match("(max-width: 767px)")) return true;
  const width = Number(browserScreen?.width || 0);
  const height = Number(browserScreen?.height || 0);
  return match("(pointer: coarse)") && Math.min(width, height) > 0 && Math.min(width, height) < 768;
}

function getPreferredView(cookieValue, environment = {}) {
  if (cookieValue === "app" || cookieValue === "web") return cookieValue;
  const phone = isPhoneViewport(environment);
  if (isInstalledApp(environment)) return phone ? "app" : "web";
  return phone ? "app" : "web";
}

module.exports = { getPreferredView, isInstalledApp, isPhoneViewport };
