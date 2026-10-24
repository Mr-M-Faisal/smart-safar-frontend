// The threshold is measured in the resisted distance shown to the user.
const TRIGGER_DISTANCE = 70;
function resistedDistance(distance) { return Math.max(0, Math.min(90, Number(distance || 0) * 0.52)); }
function shouldRefresh(distance) { return Number(distance || 0) >= TRIGGER_DISTANCE; }
module.exports = { TRIGGER_DISTANCE, resistedDistance, shouldRefresh };
