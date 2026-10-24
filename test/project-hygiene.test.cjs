const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const ignoreFiles = [path.join(root, '.gitignore'), path.resolve(root, '..', 'backend', '.gitignore')];
for (const filename of ignoreFiles) {
  const contents = fs.readFileSync(filename, 'utf8');
  for (const entry of ['node_modules/', '.env*', '!.env.example']) {
    assert.ok(contents.split(/\r?\n/).includes(entry), `${path.basename(path.dirname(filename))}/.gitignore must contain ${entry}`);
  }
}

const securityGuide = fs.readFileSync(path.join(root, 'docs', 'SECURITY.md'), 'utf8');
for (const required of ['localStorage', 'different domains', '.env.example', 'node_modules', '.next', 'report-only']) {
  assert.ok(securityGuide.includes(required), `Security guide should document ${required}`);
}

const nextConfig = fs.readFileSync(path.join(root, 'next.config.js'), 'utf8');
assert.match(nextConfig, /source:\s*'\/build-id\.js'[\s\S]*?no-cache, no-store, must-revalidate/, 'PWA build id must not be cached by the CDN');

const mobileHome = fs.readFileSync(path.join(root, 'src', 'app', 'm', 'page.jsx'), 'utf8');
assert.match(mobileHome, /aria-label="Open live transit map" className="relative block h-\[190px\]/, 'Mobile home map preview must stay positioned inside its card');

console.log('project hygiene tests passed');
