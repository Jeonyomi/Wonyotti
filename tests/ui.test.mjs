import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const makePage = (url = 'https://research.example/notes/?private=value#sources') => new JSDOM(html, {
  url,
  runScripts: 'outside-only',
});

async function enhance(dom) {
  const script = await readFile(new URL('../assets/app.js', import.meta.url), 'utf8').catch(error => {
    if (error.code === 'ENOENT') return ''; // Initial RED: the enhancement does not exist yet.
    throw error;
  });
  dom.window.eval(script);
}
const visibleSources = document => [...document.querySelectorAll('[data-source-category]')].filter(card => !card.hidden);
const change = (dom, id, value, event = 'input') => {
  const control = dom.window.document.getElementById(id);
  control.value = value;
  control.dispatchEvent(new dom.window.Event(event, { bubbles: true }));
};

// Content must remain readable without JavaScript or a network connection.
test('static Korean research note exposes honest evidence state without JavaScript', () => {
  const dom = makePage();
  const { document } = dom.window;
  assert.equal(document.documentElement.lang, 'ko');
  assert.equal(document.title, 'Wonyotti Research | 공개 거래내역 연구 노트');
  assert.equal(document.querySelectorAll('h1').length, 1);
  assert.ok(document.querySelector('a.skip-link[href="#main"]'));
  assert.equal(document.getElementById('main').getAttribute('tabindex'), '-1');
  for (const id of ['overview', 'methodology', 'data', 'sources', 'faq']) {
    const section = document.getElementById(id);
    assert.ok(section, `${id} is readable in the original HTML`);
    assert.ok(section.querySelector('h2'));
    assert.equal(section.closest('[hidden]'), null);
  }
  const content = document.querySelector('main').textContent;
  for (const state of ['NOT_ACQUIRED', 'UNVERIFIED', 'NOT_RUN', 'HISTORICAL_REVIEW', 'BLOCKED_SOURCE']) {
    assert.ok(content.includes(state), `${state} is explicit`);
  }
  assert.match(content, /2026-09-22/);
  assert.match(content, /수동/);
  assert.match(document.body.textContent, /비공식.*독립/s);
  assert.match(document.body.textContent, /투자 조언이 아닙니다/);
  const stages = [...document.querySelectorAll('[data-review-stage]')];
  assert.deepEqual(stages.map(stage => stage.dataset.reviewStage), ['source', 'structure', 'reconcile', 'report']);
  assert.equal(document.querySelectorAll('[data-candidate],[data-gate]').length, 0);
  assert.match(document.getElementById('usage-boundary').textContent, /자동매매 알고리즘 학습.*사용하지 않습니다/s);
  const claims = document.querySelector('details#unverified-claims');
  assert.ok(claims);
  assert.equal(claims.open, false);
  for (const claim of ['14.4 BTC', '3,537 BTC', '24,400%', '140만', '600MB']) {
    assert.ok(claims.textContent.includes(claim));
    assert.equal(document.querySelector('#overview').textContent.includes(claim), false);
  }
  assert.match(claims.textContent, /사용자 제공/);
  assert.match(claims.textContent, /원문.*미확인/s);
  assert.equal(document.querySelectorAll('[data-source-category]').length, 6);
  assert.equal(document.querySelectorAll('#faq details').length, 5);
  for (const selector of ['#share-button', '#print-button', '#source-controls']) {
    assert.ok(document.querySelector(selector).hidden, `${selector} is not a dead no-JS control`);
  }
  assert.equal(document.querySelectorAll('script:not([src]), style, [style], [onclick]').length, 0);
  assert.ok(document.querySelector('script[src="assets/app.js"][defer]'));
  assert.ok(document.querySelector('link[rel="stylesheet"][href="assets/styles.css"]'));
  assert.equal(document.querySelector('meta[name="robots"]').content, 'noindex,nofollow,noarchive');
  assert.equal(document.querySelector('meta[property="og:image"]').content, 'https://wonyotti.vercel.app/assets/social-card.png');
  assert.equal(document.querySelector('meta[name="twitter:card"]').content, 'summary_large_image');
  assert.equal(document.querySelector('link[rel="canonical"]'), null);
  dom.window.close();
});

test('reference search combines normalized text with category and reset restores the directory', async () => {
  const dom = makePage();
  const { document } = dom.window;
  await enhance(dom);
  assert.equal(document.getElementById('source-controls').hidden, false);
  assert.equal(visibleSources(document).length, 6);
  assert.equal(document.getElementById('source-count').getAttribute('aria-live'), 'polite');
  change(dom, 'source-search', '  BITMEX   ');
  assert.equal(visibleSources(document).length, 4);
  assert.equal(document.getElementById('source-count').textContent, '4개 자료 · 전체 6개');
  change(dom, 'source-category', 'engineering', 'change');
  assert.equal(visibleSources(document).length, 0);
  assert.equal(document.getElementById('source-empty').hidden, false);
  change(dom, 'source-search', 'parquet');
  assert.equal(visibleSources(document).length, 1);
  assert.match(visibleSources(document)[0].textContent, /DuckDB/);
  assert.equal(document.getElementById('source-empty').hidden, true);
  change(dom, 'source-search', '엑셀');
  assert.equal(visibleSources(document).length, 1);
  change(dom, 'source-search', '<script>alert(1)</script>');
  assert.equal(visibleSources(document).length, 0);
  assert.equal(document.getElementById('source-count').textContent, '0개 자료 · 전체 6개');
  assert.equal(document.querySelectorAll('script').length, 1);
  document.getElementById('source-reset').click();
  assert.equal(document.getElementById('source-search').value, '');
  assert.equal(document.getElementById('source-category').value, 'all');
  assert.equal(visibleSources(document).length, 6);
  assert.equal(document.activeElement.id, 'source-search');
  change(dom, 'source-category', 'engineering', 'change');
  assert.equal(visibleSources(document).length, 2);
  assert.equal(document.getElementById('source-count').textContent, '2개 자료 · 전체 6개');
  dom.window.close();
});

const settle = () => new Promise(resolve => setImmediate(resolve));
const clipboard = (dom, value) => Object.defineProperty(dom.window.navigator, 'clipboard', {
  value, configurable: true,
});
const assertBrief = text => {
  for (const state of ['NOT_ACQUIRED', 'unverified', 'NOT_RUN', 'HISTORICAL_REVIEW']) {
    assert.ok(text.includes(state), `${state} survives sharing`);
  }
  for (const phrase of ['미확보', '미실행', '비공식', '독립', '투자 조언이 아닙니다', '2026-09-22']) {
    assert.ok(text.includes(phrase), `${phrase} survives sharing`);
  }
  assert.match(text, /자동매매 알고리즘 학습.*사용하지 않습니다/s);
  assert.doesNotMatch(text, /private|value|#sources|\?/);
};

test('share copies an honest brief only after clipboard resolves and removes URL query/hash', async () => {
  const dom = makePage();
  const { document } = dom.window;
  let copied;
  let finish;
  clipboard(dom, { writeText: text => {
    copied = text;
    return new Promise(resolve => { finish = resolve; });
  } });
  await enhance(dom);
  assert.equal(document.getElementById('share-button').hidden, false);
  assert.equal(document.getElementById('share-status').getAttribute('role'), 'status');
  document.getElementById('share-button').click();
  assertBrief(copied);
  assert.ok(copied.endsWith('https://research.example/notes/'));
  assert.doesNotMatch(document.getElementById('share-status').textContent, /복사했습니다|완료|성공/);
  finish();
  await settle();
  assert.match(document.getElementById('share-status').textContent, /복사했습니다/);
  assert.equal(document.getElementById('share-fallback-panel').hidden, true);
  dom.window.close();
});

for (const mode of ['absent', 'rejected']) {
  test(`clipboard ${mode} reveals selected manual text without claiming success, then recovers`, async () => {
    const dom = makePage();
    const { document } = dom.window;
    clipboard(dom, mode === 'absent' ? undefined : {
      writeText: () => Promise.reject(new Error('Permission denied')),
    });
    await enhance(dom);
    document.getElementById('share-button').click();
    await settle();
    const field = document.getElementById('share-fallback');
    assert.equal(document.getElementById('share-fallback-panel').hidden, false);
    assert.equal(field.readOnly, true);
    assert.equal(document.activeElement, field);
    assert.equal(field.selectionStart, 0);
    assert.equal(field.selectionEnd, field.value.length);
    assertBrief(field.value);
    assert.ok(field.value.endsWith('https://research.example/notes/'));
    assert.match(document.getElementById('share-status').textContent, /직접 복사/);
    assert.doesNotMatch(document.getElementById('share-status').textContent, /복사했습니다|완료|성공/);
    let copied;
    clipboard(dom, { writeText: async text => { copied = text; } });
    document.getElementById('share-button').click();
    await settle();
    assertBrief(copied);
    assert.equal(document.getElementById('share-fallback-panel').hidden, true);
    assert.match(document.getElementById('share-status').textContent, /복사했습니다/);
    dom.window.close();
  });
}

test('file-page sharing uses the public project URL instead of exposing a local path', async () => {
  const dom = makePage('file:///C:/private/research/index.html?secret=token#sources');
  const { document } = dom.window;
  await enhance(dom);
  document.getElementById('share-button').click();
  await settle();
  const text = document.getElementById('share-fallback').value;
  assertBrief(text);
  assert.ok(text.endsWith('https://wonyotti.vercel.app'));
  assert.doesNotMatch(text, /file:|C:|secret|token/);
  dom.window.close();
});

test('native print events reveal every source and disclosure then restore filtered and open state', async () => {
  const dom = makePage();
  const { document } = dom.window;
  await enhance(dom);
  const details = [...document.querySelectorAll('details')];
  const cards = [...document.querySelectorAll('[data-source-category]')];
  details[0].open = true;
  details[3].open = true;
  change(dom, 'source-category', 'engineering', 'change');
  change(dom, 'source-search', 'duckdb');
  const opens = details.map(item => item.open);
  const hidden = cards.map(item => item.hidden);
  const count = document.getElementById('source-count');
  const countText = count.textContent;
  const empty = document.getElementById('source-empty');
  dom.window.dispatchEvent(new dom.window.Event('afterprint'));
  assert.deepEqual(details.map(item => item.open), opens, 'unmatched afterprint is harmless');
  for (let attempt = 0; attempt < 2; attempt += 1) {
    dom.window.dispatchEvent(new dom.window.Event('beforeprint'));
    assert.ok(details.every(item => item.open));
    assert.equal(visibleSources(document).length, 6);
    assert.equal(empty.hidden, true);
    assert.equal(count.hidden, true);
    dom.window.dispatchEvent(new dom.window.Event('beforeprint'));
    dom.window.dispatchEvent(new dom.window.Event('afterprint'));
    assert.deepEqual(details.map(item => item.open), opens, 'duplicate beforeprint preserves original snapshot');
    assert.deepEqual(cards.map(item => item.hidden), hidden);
    assert.equal(count.hidden, false);
    assert.equal(count.textContent, countText);
    assert.equal(document.getElementById('source-search').value, 'duckdb');
    assert.equal(document.getElementById('source-category').value, 'engineering');
  }
  change(dom, 'source-search', 'no matching source');
  assert.equal(empty.hidden, false);
  dom.window.dispatchEvent(new dom.window.Event('beforeprint'));
  assert.equal(empty.hidden, true);
  assert.equal(visibleSources(document).length, 6);
  dom.window.dispatchEvent(new dom.window.Event('afterprint'));
  assert.equal(empty.hidden, false);
  assert.equal(visibleSources(document).length, 0);
  dom.window.close();
});

test('enhanced print button invokes the native print action', async () => {
  const dom = makePage();
  const { document } = dom.window;
  let calls = 0;
  dom.window.print = () => { calls += 1; };
  await enhance(dom);
  const button = document.getElementById('print-button');
  assert.equal(button.hidden, false);
  button.click();
  assert.equal(calls, 1);
  dom.window.close();
});
