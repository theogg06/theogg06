/** Keyboard-only flows: chart navigation, filters, saved views, table toggle, skip link, dialogs. */
import { expect, test } from '@playwright/test';
import { highlighted, lastAnnouncement, ready } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await ready(page);
});

test('skip link is the first tab stop and moves focus to main', async ({ page }) => {
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#main')).toBeFocused();
});

test.describe('chart keyboard navigation', () => {
  const enterChart = async (page: import('@playwright/test').Page, widget = 'inflation') => {
    await page.locator(`[data-widget=${widget}]`).getByRole('button', { name: /More actions/ }).focus();
    await page.keyboard.press('Tab');
  };

  test('Tab enters the chart; arrows, Home/End, PageDown move between points', async ({ page }) => {
    await enterChart(page);
    expect(await highlighted(page, 'inflation')).toBe('Euro area#0');
    await page.keyboard.press('ArrowRight');
    expect(await highlighted(page, 'inflation')).toBe('Euro area#1');
    await page.keyboard.press('End');
    const end = await highlighted(page, 'inflation');
    expect(Number(end!.split('#')[1])).toBeGreaterThan(20);
    await page.keyboard.press('Home');
    expect(await highlighted(page, 'inflation')).toBe('Euro area#0');
    await page.keyboard.press('PageDown');
    expect(await highlighted(page, 'inflation')).toBe('Euro area#12');
  });

  test('Up/Down move to the same date in the adjacent series', async ({ page }) => {
    await enterChart(page);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    expect(await highlighted(page, 'inflation')).toBe('Germany#1');
    await page.keyboard.press('ArrowUp');
    expect(await highlighted(page, 'inflation')).toBe('Euro area#1');
  });

  test('S announces the series summary', async ({ page }) => {
    await enterChart(page);
    await page.keyboard.press('s');
    expect(await lastAnnouncement(page)).toMatch(/^Euro area: (rising|falling|broadly flat), from .*values?, (none|\d+) missing\.$/);
  });

  test('tooltip shows on focus; Esc closes it, second Esc leaves the chart', async ({ page }) => {
    await enterChart(page);
    const tipVisible = () => page.evaluate(() => {
      const H = (window as unknown as { __Highcharts: { charts: (null | { renderTo: HTMLElement; tooltip: { isHidden: boolean } })[] } }).__Highcharts;
      return !H.charts.find((x) => x && x.renderTo.closest('[data-widget=inflation]'))!.tooltip.isHidden;
    });
    expect(await tipVisible()).toBe(true);
    await page.keyboard.press('Escape');
    expect(await tipVisible()).toBe(false);
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-widget=inflation] .view-toggle__btn').first()).toBeFocused();
  });

  test('T switches to the table and keeps focus on the toggle', async ({ page }) => {
    await enterChart(page);
    await page.keyboard.press('t');
    await expect(page.locator('[data-widget=inflation] table')).toBeVisible();
    await expect(page.locator('[data-widget=inflation] .view-toggle__btn').nth(1)).toBeFocused();
    expect(page.url()).toContain('t.inflation=table');
  });

  test('Enter on a country point opens its drill-down', async ({ page }) => {
    await enterChart(page);
    await page.keyboard.press('ArrowDown'); // Germany
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Germany: inflation compared with the euro area/);
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  });

  test('? opens the shortcuts dialog from inside a chart', async ({ page }) => {
    await enterChart(page);
    await page.keyboard.press('?');
    await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('bar and heatmap charts are keyboard reachable too', async ({ page }) => {
    for (const w of ['unemployment', 'heatmap']) {
      await enterChart(page, w);
      expect(await highlighted(page, w)).not.toBeNull();
      await page.keyboard.press('ArrowRight');
      expect(await highlighted(page, w)).not.toBeNull();
    }
  });
});

test('table toggle by keyboard: arrow keys in the group, state announced', async ({ page }) => {
  const chartBtn = page.locator('[data-widget=unemployment] .view-toggle__btn').first();
  await chartBtn.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space');
  await expect(page.locator('[data-widget=unemployment] table')).toBeVisible();
  expect(await lastAnnouncement(page)).toBe('Table view shown for Unemployment by country.');
  await expect(page.locator('[data-widget=unemployment] table caption')).toContainText('Unemployment rate (%)');
  await expect(page.locator('[data-widget=unemployment] th[scope=col]').first()).toBeVisible();
});

test('filters by keyboard: countries checkbox popover updates URL and announces', async ({ page }) => {
  const trigger = page.getByRole('button', { name: /Countries/ });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dlg = page.getByRole('dialog');
  await expect(dlg).toBeVisible();
  await expect(dlg.getByRole('checkbox', { name: 'Germany' })).toBeFocused();
  await page.keyboard.press('Space'); // uncheck Germany
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(page).toHaveURL(/c=FR%2CIT%2CES|c=FR,IT,ES/);
  expect(await lastAnnouncement(page)).toBe('Countries: France, Italy, Spain.');
  await expect(page.getByTestId('filter-summary')).toContainText('euro area + 3');
});

test('date range preset and sort by keyboard', async ({ page }) => {
  await page.getByRole('button', { name: '1Y' }).focus();
  await page.keyboard.press('Enter');
  expect(await lastAnnouncement(page)).toMatch(/^Date range set to /);
  const sortBtn = page.getByRole('button', { name: /^Unemployment \(%\)/ });
  await sortBtn.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('th[aria-sort]')).toHaveCount(1);
  await expect(page.locator('th[aria-sort="descending"]')).toContainText('Unemployment');
  expect(await lastAnnouncement(page)).toBe('Table sorted by Unemployment (%), descending.');
});

test('saved views: create, apply, rename, delete with undo — keyboard only', async ({ page }) => {
  // Create
  await page.getByRole('button', { name: 'Save view', exact: true }).focus();
  await page.keyboard.press('Enter');
  const save = page.getByRole('dialog', { name: 'Save this view' });
  await expect(save.getByLabel('View name')).toBeFocused();
  await page.keyboard.press('Enter'); // submit empty → validation
  await expect(save.getByText('Enter a name for this view.')).toBeVisible();
  await page.keyboard.type('Monthly check');
  await page.keyboard.press('Enter');
  await expect(save).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Save view', exact: true })).toBeFocused();
  expect(await lastAnnouncement(page)).toBe('View "Monthly check" saved.');

  // Change filters, then apply the saved view from the manager
  await page.goto('./?c=NL');
  await ready(page);
  await page.getByRole('button', { name: 'Saved views', exact: true }).focus();
  await page.keyboard.press('Enter');
  const mgr = page.getByRole('dialog', { name: 'Saved views' });
  await mgr.getByRole('button', { name: 'Apply' }).focus();
  await page.keyboard.press('Enter');
  await expect(mgr).toHaveCount(0);
  await expect(page).not.toHaveURL(/c=NL/);

  // Rename
  await page.getByRole('button', { name: 'Saved views', exact: true }).focus();
  await page.keyboard.press('Enter');
  await mgr.getByRole('button', { name: 'Rename Monthly check' }).focus();
  await page.keyboard.press('Enter');
  await expect(mgr.getByLabel(/New name for/)).toBeFocused();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('Inflation watch');
  await page.keyboard.press('Enter');
  await expect(mgr.getByText('Inflation watch')).toBeVisible();

  // Delete: confirmation opens with focus on the safe action
  await mgr.getByRole('button', { name: 'Delete Inflation watch' }).focus();
  await page.keyboard.press('Enter');
  const confirm = page.getByRole('alertdialog', { name: 'Delete "Inflation watch"?' });
  await expect(confirm.getByRole('button', { name: 'Keep view' })).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.locator('.toast')).toContainText('View "Inflation watch" deleted.');
  // The manager closes so the Undo toast is not behind an inert modal; Undo persists (has an action).
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await page.waitForTimeout(8500); // longer than the auto-dismiss time for plain toasts
  await page.locator('.toast').getByRole('button', { name: 'Undo' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Saved views', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Saved views' }).getByText('Inflation watch')).toBeVisible();
});

test('shareable URL reproduces the view', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('./?c=DE,ES&from=2024-01&t.inflation=table');
  await ready(page);
  await page.getByRole('button', { name: 'Copy link' }).click();
  const url = await page.evaluate(() => navigator.clipboard.readText());
  expect(url).toContain('c=DE%2CES');
  expect(url).toContain('t.inflation=table');
  expect(url).not.toContain('sim.');
  const p2 = await context.newPage();
  await p2.goto(url);
  await expect(p2.locator('[data-widget=inflation] table')).toBeVisible();
});

test('facilitator reset clears saved views, preferences and filters', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('add.savedViews.v1', JSON.stringify([{ id: 'x', name: 'Old', query: '?c=NL', createdAt: '', lastUsedAt: '', isDefault: false }])));
  await page.goto('./?c=NL&sim.inflation=error');
  await ready(page);
  await page.getByRole('button', { name: /Prototype controls/ }).click();
  await page.getByRole('button', { name: 'Reset prototype (facilitator)' }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => localStorage.getItem('add.savedViews.v1'))).toBeNull();
});
