const SERVICE_AREA_BOUNDS = [[30.9, 72.6], [32.0, 73.7]];
const warned = new Set();

function normalizeServiceCoordinate(latitude, longitude, { label = "map point", id = "" } = {}) {
  let lat = Number(latitude);
  let lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 60 && Math.abs(lng) <= 90) [lat, lng] = [lng, lat];
  const [[south, west], [north, east]] = SERVICE_AREA_BOUNDS;
  if (lat >= south && lat <= north && lng >= west && lng <= east) return [lat, lng];
  if (process.env.NODE_ENV !== "production") {
    const key = `${label}:${id || `${latitude},${longitude}`}`;
    if (!warned.has(key)) {
      warned.add(key);
      console.warn(`[Smart Safar] Ignoring ${label} outside Faisalabad service area:`, { id, latitude, longitude, normalized: [lat, lng] });
    }
  }
  return null;
}

function isInServiceArea(latitude, longitude) {
  return normalizeServiceCoordinate(latitude, longitude) !== null;
}

module.exports = { SERVICE_AREA_BOUNDS, normalizeServiceCoordinate, isInServiceArea };
