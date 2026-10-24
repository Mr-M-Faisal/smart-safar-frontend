const { spawnSync } = require('node:child_process');

process.env.NEXT_PUBLIC_API_URL ||= 'https://api.smartsafar.invalid';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

for (const args of [['run', 'test:unit'], ['run', 'build'], ['run', 'test:e2e'], ['run', 'lighthouse']]) {
  console.log(`\n> npm ${args.join(' ')}`);
  const result = spawnSync(npm, args, { stdio: 'inherit', env: process.env, shell: process.platform === 'win32' });
  if (result.error) { console.error(result.error.message); process.exit(result.status || 1); }
  if (result.status !== 0) process.exit(result.status || 1);
}
