(() => {
  'use strict';

  const byId = id => document.getElementById(id);
  const cards = [...document.querySelectorAll('[data-source-category]')];
  const search = byId('source-search');
  const category = byId('source-category');
  const count = byId('source-count');
  const empty = byId('source-empty');
  const normalize = value => value.trim().toLowerCase().replace(/\s+/g, ' ');
  const searchable = cards.map(card => normalize([
    card.dataset.sourceSearch, card.dataset.sourceCategory, card.textContent,
  ].join(' ')));

  function filterSources() {
    const query = normalize(search.value);
    let visible = 0;
    cards.forEach((card, index) => {
      card.hidden = !((category.value === 'all' || card.dataset.sourceCategory === category.value)
        && searchable[index].includes(query));
      if (!card.hidden) visible += 1;
    });
    count.textContent = `${visible}개 자료 · 전체 ${cards.length}개`;
    empty.hidden = visible !== 0;
  }

  search.addEventListener('input', filterSources);
  category.addEventListener('change', filterSources);
  byId('source-reset').addEventListener('click', () => {
    search.value = '';
    category.value = 'all';
    filterSources();
    search.focus();
  });
  filterSources();
  byId('source-controls').hidden = false;

  const shareButton = byId('share-button');
  const shareStatus = byId('share-status');
  const fallbackPanel = byId('share-fallback-panel');
  const fallback = byId('share-fallback');
  function shareBrief() {
    const page = new URL(window.location.href);
    page.search = '';
    page.hash = '';
    const url = ['http:', 'https:'].includes(page.protocol)
      ? page.href : 'https://wonyotti.vercel.app';
    const date = document.querySelector('time[datetime]').dateTime;
    return [
      'Wonyotti Research — 비공식 독립 연구 노트',
      `기준일: ${date} (수동 기록 · 실시간 갱신 아님)`,
      '원본 데이터 미확보 (NOT_ACQUIRED) · 출처 미검증 (unverified)',
      '검증·백테스트 미실행 (NOT_RUN) · 실거래 비활성화 (DISABLED)',
      '실제 전략이나 성과를 확인한 결과가 아니며 투자 조언이 아닙니다.',
      url,
    ].join('\n');
  }
  shareButton.addEventListener('click', async () => {
    shareStatus.textContent = '';
    const text = shareBrief();
    try {
      await navigator.clipboard.writeText(text);
      fallbackPanel.hidden = true;
      shareStatus.textContent = '연구 요약을 복사했습니다.';
    } catch {
      fallback.value = text;
      fallbackPanel.hidden = false;
      shareStatus.textContent = '자동 복사를 사용할 수 없습니다. 아래 요약을 직접 복사해 주세요.';
      fallback.focus();
      fallback.select();
    }
  });
  shareButton.hidden = false;

  // Native Ctrl+P and the button share the same reversible print lifecycle.
  let printSnapshot = null;
  window.addEventListener('beforeprint', () => {
    if (printSnapshot) return;
    const details = [...document.querySelectorAll('details')];
    printSnapshot = {
      details: details.map(item => [item, item.open]),
      hidden: [...cards, empty, count].map(item => [item, item.hidden]),
    };
    details.forEach(item => { item.open = true; });
    cards.forEach(item => { item.hidden = false; });
    empty.hidden = true;
    count.hidden = true;
  });
  window.addEventListener('afterprint', () => {
    if (!printSnapshot) return;
    printSnapshot.details.forEach(([item, open]) => { item.open = open; });
    printSnapshot.hidden.forEach(([item, hidden]) => { item.hidden = hidden; });
    printSnapshot = null;
  });
  const printButton = byId('print-button');
  printButton.addEventListener('click', () => window.print());
  printButton.hidden = false;
})();
