function seatNumberValue(seat) { return Number.parseInt(seat?.seatNumber, 10) || 0; }
function allowedActions(selectedSeats) {
  const statuses = new Set(selectedSeats.map((seat) => seat.status));
  if (statuses.size !== 1) return [];
  const status = [...statuses][0];
  const count = selectedSeats.length;
  if (status === "available") return [["occupy", "Mark occupied (" + count + ")"]];
  if (status === "occupied") return [["release", "Passenger got off (" + count + ")"]];
  if (status === "reserved") return [["board", "Mark boarded (" + count + ")"], ["no_show", "No-show (" + count + ")"]];
  return [];
}
function buildSeatRows(capacity) {
  const count = Math.max(0, Math.floor(Number(capacity) || 0));
  const rows = [];
  for (let number = 1; number <= count; number += 4) rows.push([number, number + 1 <= count ? number + 1 : null, null, number + 2 <= count ? number + 2 : null, number + 3 <= count ? number + 3 : null]);
  return rows;
}
module.exports = { allowedActions, buildSeatRows, seatNumberValue };
