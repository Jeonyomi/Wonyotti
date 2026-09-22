import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const html = await readFile('index.html', 'utf8');
const document = new JSDOM(html).window.document;
test('all executable scripts and styles are local files under strict CSP', () => {
  assert.equal(document.querySelectorAll('script:not([src]),style,[style]').length, 0);
  assert.ok(document.querySelector('script[src]'));
  assert.ok(document.querySelector('link[rel=stylesheet]'));
  for (const node of document.querySelectorAll('*')) {
    for (const attr of node.attributes) assert.ok(!/^on/i.test(attr.name), `Inline event: ${attr.name}`);
  }
});
test('share image and metadata are useful without inventing results', async () => {
  assert.equal(document.querySelector('meta[property="og:image"]')?.content, 'https://wonyotti.vercel.app/assets/social-card.png');
  assert.equal(document.querySelector('meta[name="twitter:card"]')?.content, 'summary_large_image');
  const png = await readFile('assets/social-card.png');
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert.match(document.querySelector('meta[name=robots]')?.content || '', /noindex/);
});
test('local anchors resolve and external links use HTTPS safely', () => {
  const ids = [...document.querySelectorAll('[id]')].map(node => node.id);
  assert.equal(new Set(ids).size, ids.length, 'IDs must be unique');
  for (const a of document.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href');
    if (href.startsWith('#')) assert.ok(document.getElementById(href.slice(1)), `Broken anchor: ${href}`);
    else assert.ok(href.startsWith('https://'), `Unsafe/nonexistent link: ${href}`);
    if (a.target === '_blank') assert.match(a.rel, /noopener/);
  }
});
test('readers can reach information policy and public correction channel', () => {
  const footer = document.querySelector('footer');
  assert.ok(footer.querySelector('a[href="https://github.com/Jeonyomi/Wonyotti/blob/main/docs/INFORMATION-POLICY.md"]'));
  assert.ok(footer.querySelector('a[href="https://github.com/Jeonyomi/Wonyotti/issues"]'));
});
