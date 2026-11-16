/**
 * axe-core (WCAG 2.0/2.1/2.2 A+AA rules) on every page, every simulated
 * state and every theme. Target: zero violations.
 */
import { test } from '@playwright/test';
import { expectNoAxeViolations, ready, setTheme } from './helpers';

const THEMES = ['light', 'dark', 'hc'] as const;
const WIDGETS = ['inflation', 'unemployment', 'lending', 'heatmap', 'table', 'kpi-hicp'];
const STATES = ['loading', 'empty-first', 'empty-no-results', 'error', 'partial', 'stale', 'out-of-range'] as const;

for (const theme of THEMES) {
  test.describe(`theme: ${theme}`, () => {
    test.beforeEach(async ({ page }) => setTheme(page, theme));

    test('overview (real data)', async ({ page }) => {
      await page.goto('./');
      await ready(page);
      await expectNoAxeViolations(page, `overview ${theme}`);
    });

    test('drill-down', async ({ page }) => {
      await page.goto('./?page=detail&geo=ES');
      await ready(page);
      await expectNoAxeViolations(page, `detail ${theme}`);
    });

    test('table views', async ({ page }) => {
      await page.goto('./?t.inflation=table&t.unemployment=table&t.lending=table&t.heatmap=table');
      await ready(page);
      await expectNoAxeViolations(page, `tables ${theme}`);
    });

    for (const state of STATES) {
      test(`state: ${state}`, async ({ page }) => {
        const q = WIDGETS.map((w) => `sim.${w}=${state}`).join('&');
        await page.goto(`./?${q}`);
        if (state === 'loading') await page.waitForTimeout(500); else await ready(page);
        await expectNoAxeViolations(page, `${state} ${theme}`);
      });
    }
  });
}

test('compact density', async ({ page }) => {
  await setTheme(page, 'light', 'compact');
  await page.goto('./');
  await ready(page);
  await expectNoAxeViolations(page, 'compact');
});

test('dialogs: save, saved views, export, shortcuts, prototype controls', async ({ page }) => {
  await page.goto('./');
  await ready(page);
  for (const name of ['Save view', 'Saved views', 'Export', 'Shortcuts']) {
    await page.getByRole('button', { name, exact: true }).first().click();
    await page.getByRole('dialog').waitFor();
    await expectNoAxeViolations(page, `dialog ${name}`);
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'detached' });
  }
  await page.getByRole('button', { name: /Prototype controls/ }).click();
  await expectNoAxeViolations(page, 'prototype controls');
});

test('filter popovers open', async ({ page }) => {
  await page.goto('./');
  await ready(page);
  await page.getByRole('button', { name: /Countries/ }).click();
  await page.getByRole('dialog').waitFor();
  await expectNoAxeViolations(page, 'countries popover');
});
