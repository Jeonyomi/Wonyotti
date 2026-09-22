import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<style>html,body{margin:0;width:1200px;height:630px;overflow:hidden}</style>${await readFile('assets/social-card.svg', 'utf8')}`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'assets/social-card.png' });
  console.log('Generated assets/social-card.png (1200x630) from the committed SVG.');
} finally { await browser.close(); }
