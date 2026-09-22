import { test, expect } from '@playwright/test';

for (const width of [390, 1440]) {
  test(`research explanations and form fields stay readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(process.env.DESIGN_URL || '/');
    for (const selector of ['.gate-list p', '.source-card > p', '.readiness-list p', '.current-note p', '.details-body']) {
      const size = await page.locator(selector).first().evaluate(node => parseFloat(getComputedStyle(node).fontSize));
      expect(size, selector).toBeGreaterThanOrEqual(14);
    }
    const inputSize = await page.locator('#source-search').evaluate(node => parseFloat(getComputedStyle(node).fontSize));
    expect(inputSize).toBeGreaterThanOrEqual(16);
  });
}
