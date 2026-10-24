const { test } = require("node:test");
const assert = require("node:assert/strict");
const store = require("../src/lib/settings.js");

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: (key) => values.has(key) ? values.get(key) : null, setItem: (key, value) => values.set(key, String(value)), values };
}

test("settings store reads SSR defaults and safely persists appearance and Data Saver", () => {
  assert.equal(store.readSettings(null).theme, "system");
  const storage = memoryStorage();
  const saved = store.saveSettings({ theme: "dark", accent: "#16866f", dataSaver: true }, storage);
  assert.deepEqual({ theme: saved.theme, accent: saved.accent, dataSaver: saved.dataSaver }, { theme: "dark", accent: "#16866f", dataSaver: true });
  assert.deepEqual(store.readSettings(storage), saved);
});

test("settings store migrates a legacy theme without losing its value", () => {
  const storage = memoryStorage({ "smart-safar-theme": "dark" });
  assert.equal(store.readSettings(storage).theme, "dark");
});
