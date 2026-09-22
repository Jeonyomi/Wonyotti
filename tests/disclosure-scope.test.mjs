import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const forbidden = /Coin\s+Quant\s+Bot|\b(?:Shadow|Canary|Champion|Challenger|PolicyIntent|RegimeEntryFilter|ExposureScalingPolicy|PartialExitPolicy|LossCooldownFilter|DAgger)\b|coin_quant_research|expert_actions|market_opportunities|candidate_policy_backtest|백테스트|후보 전략|전략 추출|봇 통합|모방 학습|행동 가설/;

test('public page is restricted to historical verification, not future automation', async () => {
  const html = await readFile('index.html', 'utf8');
  const dom = new JSDOM(html);
  const d = dom.window.document;
  assert.doesNotMatch(html, forbidden);
  const boundary = d.querySelector('#usage-boundary');
  assert.ok(boundary, 'a prominent purpose/usage notice is required');
  assert.equal(boundary.closest('details,[hidden]'), null);
  assert.match(boundary.textContent, /과거 거래/);
  assert.match(boundary.textContent, /자동매매 알고리즘 학습/);
  assert.match(boundary.textContent, /사용하지 않습니다/);
  assert.match(boundary.textContent, /원문.*미확인/s);
  assert.match(d.querySelector('#methodology').textContent, /취소|보류/);
  assert.equal(d.querySelectorAll('[data-review-stage]').length, 4);
  assert.equal(d.querySelectorAll('[data-candidate],[data-gate]').length, 0);
  assert.equal(d.querySelectorAll('[data-source-category]').length, 6);
  dom.window.close();
});

async function markdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(e => e.isDirectory() ? markdownFiles(`${dir}/${e.name}`) : e.name.endsWith('.md') ? [`${dir}/${e.name}`] : []));
  return nested.flat();
}

test('every public document and share asset contains no retired development roadmap', async () => {
  const files = ['README.md', ...await markdownFiles('docs'), 'assets/social-card.svg', 'assets/app.js'];
  for (const file of files) assert.doesNotMatch(await readFile(file, 'utf8'), forbidden, file);
  const readme = await readFile('README.md', 'utf8');
  assert.match(readme, /purpose: "historical_review"/);
  assert.match(readme, /자동매매 알고리즘 학습/);
  assert.match(readme, /취소|보류/);
  assert.match(readme, /원문.*미확인/s);
});
