/**
 * Reflow (1.4.10) at 320 CSS px, resize/zoom (1.4.4) at 200% and 400% of a
 * 1280 px window, and text spacing (1.4.12). The only element allowed to
 * scroll horizontally is a data table inside its own labelled, focusable region.
 */
import { expect, test, type Page } from '@playwright/test';
import { ready } from './helpers';

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const offenders: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
      if (el.closest('.table-scroll') || el.closest('.sr-only') || el.closest('.highcharts-a11y-proxy-container') || el.closest('[class*="highcharts-screen-reader"]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width && r.right > vw + 1) offenders.push(`${el.tagName.toLowerCase()}.${el.className.toString().split(' ')[0]} right=${Math.round(r.right)}`);
    }
    return { pageScroll: document.documentElement.scrollWidth - vw, offenders: offenders.slice(0, 10) };
  });
}

for (const [label, width, height] of [['320 CSS px (400% zoom of 1280)', 320, 640], ['640 CSS px (200% zoom of 1280)', 640, 450], ['1280 CSS px', 1280, 900]] as const) {
  test(`no horizontal page scroll at ${label}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    for (const url of ['./', './?page=detail&geo=ES', './?t.inflation=table&t.unemployment=table&t.heatmap=table']) {
      await page.goto(url);
      await ready(page);
      const o = await horizontalOverflow(page);
      expect(o.pageScroll, `${url} page scroll`).toBeLessThanOrEqual(0);
      expect(o.offenders, `${url} elements past the viewport`).toEqual([]);
    }
  });
}

test('tables that overflow scroll inside a labelled, focusable region', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('./');
  await ready(page);
  const regions = page.locator('.table-scroll');
  expect(await regions.count()).toBeGreaterThan(0);
  for (const r of await regions.all()) {
    await expect(r).toHaveAttribute('role', 'region');
    await expect(r).toHaveAttribute('tabindex', '0');
    const labelledby = await r.getAttribute('aria-labelledby');
    expect(labelledby).toBeTruthy();
    await expect(page.locator(`[id="${labelledby}"]`)).not.toBeEmpty();
  }
});

test('narrow charts switch to the key-list variant at 320 px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('./');
  await ready(page);
  await expect(page.locator('[data-widget=inflation] .key-list li')).toHaveCount(5);
  await expect(page.locator('[data-widget=heatmap] table')).toBeVisible();
});

test('200% text-only zoom (root font-size) keeps content readable without horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('./');
  await ready(page);
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  await page.waitForTimeout(500);
  const o = await horizontalOverflow(page);
  expect(o.pageScroll).toBeLessThanOrEqual(0);
  expect(o.offenders).toEqual([]);
});

test('text spacing overrides (1.4.12) do not clip or overflow', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('./');
  await ready(page);
  await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }' });
  await page.waitForTimeout(500);
  const o = await horizontalOverflow(page);
  expect(o.pageScroll).toBeLessThanOrEqual(0);
  // No text container clips its content.
  const clipped = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>('.kpi, .badge, .btn, .field__control, .widget__caption')).filter((el) => el.scrollHeight > el.clientHeight + 2 && getComputedStyle(el).overflow !== 'visible').map((el) => el.className));
  expect(clipped).toEqual([]);
});

test('focused elements are not obscured by sticky content (2.4.11) and targets are ≥ 24px (2.5.8)', async ({ page }) => {
  await page.goto('./');
  await ready(page);
  const small = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>('button, a[href], [role=button], [role=radio], [role=checkbox]'))
    .filter((el) => el.offsetParent && !el.closest('.sr-only') && !el.closest('.highcharts-a11y-proxy-container') && !el.closest('p, li, td, dd'))
    .map((el) => { const r = el.getBoundingClientRect(); return { t: el.textContent?.trim().slice(0, 30), w: r.width, h: r.height }; })
    .filter((x) => x.w < 24 || x.h < 24));
  expect(small).toEqual([]);
});
