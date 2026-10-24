const { randomBytes } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');

const buildId = `${Date.now().toString(36)}-${randomBytes(5).toString('hex')}`;
const builtAt = new Date().toISOString();
const packageInfo = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf8'));
const target = resolve(__dirname, '../public/build-id.js');
writeFileSync(target, `self.SMART_SAFAR_BUILD_ID = ${JSON.stringify(buildId)};\n`, 'utf8');
writeFileSync(resolve(__dirname, '../public/version.json'), `${JSON.stringify({ version: packageInfo.version, buildId, builtAt }, null, 2)}\n`, 'utf8');
console.log(`Prepared Smart Safar ${packageInfo.version} build ${buildId}`);
