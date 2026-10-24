const STORAGE_KEY = "smart-safar-settings";
const DEFAULT_SETTINGS = Object.freeze({ theme: "system", accent: "#536bb7", dataSaver: false, notifications: {} });

function readSettings(storage = typeof window === "undefined" ? null : window.localStorage) {
  if (!storage) return { ...DEFAULT_SETTINGS };
  try {
    const value = JSON.parse(storage.getItem(STORAGE_KEY) || "{}");
    const legacyTheme = storage.getItem("smart-safar-theme");
    return { ...DEFAULT_SETTINGS, ...value, theme: value.theme || (legacyTheme === "dark" || legacyTheme === "light" ? legacyTheme : DEFAULT_SETTINGS.theme), notifications: { ...DEFAULT_SETTINGS.notifications, ...(value.notifications || {}) } };
  } catch { return { ...DEFAULT_SETTINGS }; }
}

function saveSettings(patch, storage = typeof window === "undefined" ? null : window.localStorage) {
  const next = { ...readSettings(storage), ...patch };
  if (storage) {
    try { storage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("smart-safar:settings-changed", { detail: next }));
  }
  return next;
}

module.exports = { DEFAULT_SETTINGS, STORAGE_KEY, readSettings, saveSettings };
