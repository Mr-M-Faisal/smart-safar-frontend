const KEY = 'smart-safar-booking-selection';
export function saveBookingSelection(value) {
  if (typeof window === 'undefined') return;
  const current = readBookingSelection();
  const next = { ...current, ...value };
  window.sessionStorage.setItem(KEY, JSON.stringify(next));
  const url = new URL(window.location.href);
  if (next.routeId) url.searchParams.set('route', next.routeId);
  if (next.busId) url.searchParams.set('bus', next.busId); else url.searchParams.delete('bus');
  window.history.replaceState({}, '', url);
}
export function readBookingSelection() {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(window.sessionStorage.getItem(KEY) || '{}'); } catch { return {}; }
}
