import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const build = spawnSync(process.execPath, ['scripts/build.mjs'], { encoding: 'utf8' });
test('static build completes', () => assert.equal(build.status, 0, build.stdout + build.stderr));
test('all local assets are published byte-for-byte', async () => {
  const assets = await readdir('assets', { recursive: true });
  assert.ok(assets.includes('favicon.svg'));
  for (const file of assets) {
    if (!(await stat(`assets/${file}`)).isFile()) continue;
    const source = await readFile(`assets/${file}`);
    let output = null;
    try { output = await readFile(`dist/assets/${file}`); } catch {}
    assert.deepEqual(output, source, `asset omitted or changed: ${file}`);
  }
});
test('source and built HTML stay identical', async () => {
  assert.equal(await readFile('dist/index.html', 'utf8'), await readFile('index.html', 'utf8'));
});
