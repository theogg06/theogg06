import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** Wait until every widget has left the loading state and charts have rendered. */
export async function ready(page: Page) {
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 15_000 }).catch(() => undefined);
  await page.waitForTimeout(300);
}

export async function setTheme(page: Page, theme: 'light' | 'dark' | 'hc', density: 'comfortable' | 'compact' = 'comfortable') {
  await page.addInitScript(([t, d]) => localStorage.setItem('add.prefs.v1', JSON.stringify({ theme: t, density: d })), [theme, density]);
}

export async function expectNoAxeViolations(page: Page, context = '') {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join('\n  ')}`).join('\n');
  expect(results.violations, `axe violations ${context}:\n${summary}`).toEqual([]);
}

/** Latest polite live-region message (debounced in the app). */
export async function lastAnnouncement(page: Page) {
  await page.waitForTimeout(650);
  return page.getByTestId('live-polite').innerText();
}

export async function highlighted(page: Page, widget: string) {
  return page.evaluate((w) => {
    const H = (window as unknown as { __Highcharts: { charts: (null | { renderTo: HTMLElement; highlightedPoint?: { series: { name: string }; index: number } })[] } }).__Highcharts;
    const c = H.charts.find((x) => x && x.renderTo.closest(`[data-widget=${w}]`));
    const p = c?.highlightedPoint;
    return p ? `${p.series.name}#${p.index}` : null;
  }, widget);
}
