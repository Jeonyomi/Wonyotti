import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import { once } from 'node:events';

const request = (port, path, method = 'GET') => new Promise((resolve, reject) => {
  const req = http.request({ hostname: '127.0.0.1', port, path, method }, res => {
    let body = ''; res.setEncoding('utf8'); res.on('data', d => body += d);
    res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
  });
  req.on('error', reject); req.end();
});

test('local preview serves only the built directory with release headers', async () => {
  const proc = spawn(process.execPath, ['scripts/preview.mjs', '--port', '0'], { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  const ready = new Promise((resolve, reject) => {
    proc.stdout.on('data', d => { output += d; const match = output.match(/http:\/\/127\.0\.0\.1:(\d+)/); if (match) resolve(Number(match[1])); });
    proc.on('exit', code => reject(new Error(`Preview exited ${code}`)));
  });
  try {
    const port = await ready;
    const home = await request(port, '/?source=test');
    assert.equal(home.status, 200);
    assert.match(home.headers['content-type'], /text\/html/);
    assert.equal(home.headers['x-frame-options'], 'DENY');
    assert.match(home.headers['content-security-policy'], /connect-src 'none'/);
    assert.match(home.body, /NOT_ACQUIRED/);
    const icon = await request(port, '/assets/favicon.svg');
    assert.equal(icon.status, 200);
    assert.match(icon.headers['content-type'], /image\/svg\+xml/);
    assert.equal((await request(port, '/', 'HEAD')).body, '');
    assert.equal((await request(port, '/', 'POST')).status, 405);
    for (const path of ['/../package.json', '/%2e%2e/package.json', '/assets/../../README.md', '/%2e%2e%5cpackage.json', '/.env', '/README.md', '/not-found']) {
      const result = await request(port, path);
      assert.ok([400, 403, 404].includes(result.status), `${path}: ${result.status}`);
      assert.doesNotMatch(result.body, /wonyotti-research-console/);
    }
    assert.equal((await request(port, '/%ZZ')).status, 400);
  } finally {
    const exited = once(proc, 'exit');
    if (proc.exitCode === null) { proc.kill(); await exited; }
  }
});
