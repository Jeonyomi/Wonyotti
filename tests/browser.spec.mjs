import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';

for (const width of [320, 390, 768, 1440]) {
  test(`public overview is accessible with no overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    const response = await page.goto('/');
    expect(response.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#overview')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const violations = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations;
    expect(violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
    expect(errors).toEqual([]);
    await mkdir('artifacts', { recursive: true });
    await page.screenshot({ path: `artifacts/overview-${width}.png` });
    if (width === 1440 || width === 390) await page.screenshot({ path: `artifacts/full-${width}.png`, fullPage: true });
  });
}

test('source search/category/reset work including empty and hostile queries', async ({ page }) => {
  await page.goto('/#sources');
  const cards = page.locator('[data-source-category]');
  const total = await cards.count();
  expect(total).toBeGreaterThanOrEqual(6);
  await page.locator('#source-search').fill('duckdb');
  await expect(page.locator('[data-source-category]:visible')).toHaveCount(1);
  await page.locator('#source-category').selectOption('exchange');
  await expect(page.locator('[data-source-category]:visible')).toHaveCount(0);
  await expect(page.locator('#source-empty')).toBeVisible();
  await page.locator('#source-search').fill('<img src=x onerror=alert(1)>');
  await expect(page.locator('[data-source-category]:visible')).toHaveCount(0);
  await page.locator('#source-reset').click();
  await expect(page.locator('[data-source-category]:visible')).toHaveCount(total);
});

test('share text strips query/hash and includes research caveats', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/?private_token=example#sources');
  await page.locator('#share-button').click();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toMatch(/미확보/);
  expect(text).toMatch(/미실행/);
  expect(text).not.toContain('private_token');
  expect(text).not.toContain('#sources');
});

test('clipboard failure provides manually selectable text, not a success claim', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('Denied')) }, configurable: true }));
  await page.goto('/');
  await page.locator('#share-button').click();
  await expect(page.locator('#share-fallback')).toBeVisible();
  await expect(page.locator('#share-fallback')).toHaveValue(/미확보/);
});

test('keyboard skip link, native FAQ and print action work', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  await expect(focused).toHaveAttribute('href', '#main');
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => document.activeElement.id)).toBe('main');
  const summary = page.locator('#faq summary').first();
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#faq details').first()).toHaveAttribute('open', '');
  await page.evaluate(() => { window.print = () => { window.__printed = true; }; });
  await page.locator('#print-button').click();
  expect(await page.evaluate(() => window.__printed)).toBe(true);
});

test('primary content and source directory remain available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
  for (const id of ['overview', 'methodology', 'data', 'sources', 'faq']) await expect(page.locator(`#${id}`)).toBeVisible();
  await expect(page.locator('#share-button')).toBeHidden();
  await expect(page.locator('#source-search')).toBeHidden();
  await expect(page.locator('[data-source-category]:visible')).not.toHaveCount(0);
  await context.close();
});

test('print view preserves evidence/FAQ content even after filtering', async ({ page }) => {
  await page.goto('/');
  await page.locator('#source-search').fill('no result for print');
  await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  await expect(page.locator('[data-source-category]:visible')).toHaveCount(await page.locator('[data-source-category]').count());
  await expect(page.locator('#faq details').first().locator('p').first()).toBeVisible();
  await page.pdf({ path: 'artifacts/research-brief.pdf', format: 'A4', printBackground: true });
});
