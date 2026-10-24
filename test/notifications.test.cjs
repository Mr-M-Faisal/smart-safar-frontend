const test = require("node:test");
const assert = require("node:assert/strict");
const state = require("../src/features/notifications/notifications.cjs");
test("notification unread count and mark-all state", () => {
  const items = [{ id: "a" }, { id: "b" }];
  const read = state.markRead(new Set(), "a");
  assert.equal(state.unreadCount(items, read), 1);
  assert.equal(state.unreadCount(items, state.markAllRead(read, items)), 0);
});
test("notification read ids are capped", () => {
  const items = Array.from({ length: state.READ_LIMIT + 5 }, (_, index) => ({ id: String(index) }));
  const read = state.markAllRead(new Set(), items);
  assert.equal(read.size, state.READ_LIMIT);
  assert.equal(read.has("0"), false);
});
