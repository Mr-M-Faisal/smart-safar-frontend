// Small, dependency-free QR encoder for version 4 / error correction L.
// This covers the Smart Safar /app share URL (up to 78 UTF-8 bytes).
function multiply(a, b) {
  let result = 0;
  while (b) {
    if (b & 1) result ^= a;
    a <<= 1;
    if (a & 0x100) a ^= 0x11d;
    b >>>= 1;
  }
  return result;
}

function encodeBytes(input) {
  const bytes = Array.from(new TextEncoder().encode(String(input)));
  if (bytes.length > 78) throw new RangeError("QR text is too long for the compact encoder.");
  const bits = [];
  const append = (value, length) => { for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1); };
  append(0b0100, 4); append(bytes.length, 8); bytes.forEach((byte) => append(byte, 8));
  const maxBits = 80 * 8;
  for (let i = 0, count = Math.min(4, maxBits - bits.length); i < count; i += 1) bits.push(0);
  while (bits.length % 8) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((value, bit) => value * 2 + bit, 0));
  for (let pad = 0; data.length < 80; pad += 1) data.push(pad % 2 ? 0x11 : 0xec);
  return data;
}

function errorCorrection(data) {
  let generator = [1];
  let root = 1;
  for (let i = 0; i < 20; i += 1) {
    const next = Array(generator.length + 1).fill(0);
    generator.forEach((value, index) => { next[index] ^= value; next[index + 1] ^= multiply(value, root); });
    generator = next;
    root = multiply(root, 2);
  }
  const remainder = Array(20).fill(0);
  data.forEach((byte) => {
    const factor = byte ^ remainder.shift();
    remainder.push(0);
    for (let i = 0; i < remainder.length; i += 1) remainder[i] ^= multiply(generator[i + 1], factor);
  });
  return remainder;
}

function formatBits(mask) {
  const data = (0b01 << 3) | mask;
  let remainder = data << 10;
  for (let bit = 14; bit >= 10; bit -= 1) if ((remainder >>> bit) & 1) remainder ^= 0x537 << (bit - 10);
  return ((data << 10) | remainder) ^ 0x5412;
}

function createQrMatrix(value) {
  const size = 33;
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved = Array.from({ length: size }, () => Array(size).fill(false));
  const set = (x, y, dark, reserve = true) => { if (x >= 0 && x < size && y >= 0 && y < size) { matrix[y][x] = Boolean(dark); if (reserve) reserved[y][x] = true; } };
  const finder = (left, top) => {
    for (let dy = -1; dy <= 7; dy += 1) for (let dx = -1; dx <= 7; dx += 1) {
      const x = left + dx; const y = top + dy;
      const within = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6;
      const dark = within && (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
      set(x, y, dark);
    }
  };
  finder(0, 0); finder(size - 7, 0); finder(0, size - 7);
  for (let i = 8; i < size - 8; i += 1) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) set(26 + dx, 26 + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  for (let i = 0; i < 15; i += 1) {
    const coordsA = i < 6 ? [8, i] : i === 6 ? [8, 7] : i === 7 ? [8, 8] : i === 8 ? [7, 8] : [14 - i, 8];
    const coordsB = i < 8 ? [size - 1 - i, 8] : [8, size - 15 + i];
    set(coordsA[0], coordsA[1], false); set(coordsB[0], coordsB[1], false);
  }
  set(8, size - 8, true);

  const codewords = [...encodeBytes(value), ...errorCorrection(encodeBytes(value))];
  const bits = codewords.flatMap((byte) => Array.from({ length: 8 }, (_, index) => (byte >>> (7 - index)) & 1));
  let bitIndex = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1;
    const upward = ((right + 1) & 2) === 0;
    for (let vert = 0; vert < size; vert += 1) {
      const y = upward ? size - 1 - vert : vert;
      for (let offset = 0; offset < 2; offset += 1) {
        const x = right - offset;
        if (reserved[y][x]) continue;
        const raw = bits[bitIndex++] || 0;
        set(x, y, raw ^ (((x + y) % 2) === 0), false);
      }
    }
  }
  const format = formatBits(0);
  for (let i = 0; i < 15; i += 1) {
    const a = i < 6 ? [8, i] : i === 6 ? [8, 7] : i === 7 ? [8, 8] : i === 8 ? [7, 8] : [14 - i, 8];
    const b = i < 8 ? [size - 1 - i, 8] : [8, size - 15 + i];
    set(a[0], a[1], ((format >>> i) & 1) !== 0); set(b[0], b[1], ((format >>> i) & 1) !== 0);
  }
  set(8, size - 8, true);
  return matrix;
}

module.exports = { createQrMatrix };
