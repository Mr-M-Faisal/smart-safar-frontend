const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const outputDirectory = path.join(__dirname, '..', 'public', 'splash');
const sizes = [
  [750, 1334], [828, 1792], [1125, 2436], [1242, 2208], [1242, 2688],
  [1170, 2532], [1179, 2556], [1284, 2778], [1290, 2796], [1206, 2622],
  [1320, 2868], [1668, 2388], [2048, 2732],
];
const mark = `<g fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path d="M24 4.8c-7.3 0-13.2 5.8-13.2 13.1C10.8 28.1 24 42.7 24 42.7s13.2-14.6 13.2-24.8C37.2 10.6 31.3 4.8 24 4.8Z" stroke="#fff" stroke-width="2.1"/>
  <path d="m16.8 25.7 5.1-5.1 4.4 3.3 5-7" stroke="#83ead4" stroke-width="2.7"/>
  <circle cx="16.8" cy="25.7" r="2.1" fill="#fff"/><circle cx="31.3" cy="16.9" r="2.4" fill="#ffbd83" stroke="#fff" stroke-width="1.2"/><circle cx="26.3" cy="23.9" r="1.7" fill="#83ead4"/>
</g>`;

async function main() {
  await fs.mkdir(outputDirectory, { recursive: true });
  await Promise.all(sizes.map(async ([width, height]) => {
    const iconSize = Math.round(Math.min(width, height) * 0.16);
    const scale = iconSize / 48;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#111d3d"/><stop offset=".62" stop-color="#1b2b54"/><stop offset="1" stop-color="#2a4077"/></linearGradient><radialGradient id="glow"><stop stop-color="#536bb7" stop-opacity=".4"/><stop offset="1" stop-color="#536bb7" stop-opacity="0"/></radialGradient></defs>
      <rect width="100%" height="100%" fill="url(#bg)"/><circle cx="${width / 2}" cy="${height * 0.41}" r="${Math.min(width, height) * 0.46}" fill="url(#glow)"/>
      <g transform="translate(${(width - iconSize) / 2} ${height * 0.35}) scale(${scale})">${mark}</g>
      <text x="50%" y="${height * 0.35 + iconSize * 0.75 + 55}" fill="#fff" font-family="Arial, sans-serif" font-weight="700" font-size="${Math.max(28, Math.min(width, height) * 0.035)}" text-anchor="middle">Smart Safar</text>
      <text x="50%" y="${height * 0.35 + iconSize * 0.75 + 95}" fill="#a8efdf" font-family="Arial, sans-serif" font-weight="600" letter-spacing="4" font-size="${Math.max(12, Math.min(width, height) * 0.012)}" text-anchor="middle">FAISALABAD TRANSIT</text>
    </svg>`;
    await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path.join(outputDirectory, `apple-splash-${width}x${height}.png`));
  }));
  console.log(`Generated ${sizes.length} Smart Safar splash images.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
