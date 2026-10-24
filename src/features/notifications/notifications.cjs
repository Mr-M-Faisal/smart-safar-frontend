const STORAGE_KEY = "ss-notif-read";
const READ_LIMIT = 100;
function readIds(storage) {
  try { const value = JSON.parse(storage?.getItem(STORAGE_KEY) || "[]"); return new Set(Array.isArray(value) ? value.filter((id) => typeof id === "string").slice(-READ_LIMIT) : []); }
  catch { return new Set(); }
}
function unreadCount(items, read) { const ids = read instanceof Set ? read : new Set(read || []); return items.reduce((count, item) => count + (ids.has(String(item.id)) ? 0 : 1), 0); }
function markRead(read, id) { const next = new Set(read); next.add(String(id)); return new Set([...next].slice(-READ_LIMIT)); }
function markAllRead(read, items) { const next = new Set(read); items.forEach((item) => next.add(String(item.id))); return new Set([...next].slice(-READ_LIMIT)); }
module.exports = { READ_LIMIT, STORAGE_KEY, markAllRead, markRead, readIds, unreadCount };
