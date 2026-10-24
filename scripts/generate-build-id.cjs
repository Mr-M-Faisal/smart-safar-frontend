const { randomBytes } = require('node:crypto');
const { writeFileSync } = require('node:fs');
const { resolve } = require('node:path');

const buildId = `${Date.now().toString(36)}-${randomBytes(5).toString('hex')}`;
const target = resolve(__dirname, '../public/build-id.js');
writeFileSync(target, `self.SMART_SAFAR_BUILD_ID = ${JSON.stringify(buildId)};\n`, 'utf8');
console.log(`Prepared service worker build ${buildId}`);
