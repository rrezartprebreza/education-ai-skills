import { test, expect } from '@playwright/test';
const base = '/education-ai-skills/';

test('audience, search, URL state and reset', async ({ page }) => {
  await page.goto(base);
  await expect(page.locator('.skill-card:visible')).toHaveCount(10);
  await page.getByRole('button', { name: 'Students' }).click();
  await expect(page.locator('.skill-card:visible')).toHaveCount(6);
  await page.getByRole('searchbox').fill('source');
  await expect(page.locator('.skill-card:visible')).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole('searchbox')).toHaveValue('source');
  await expect(page.getByRole('button', { name: 'Students' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('searchbox').fill('no-match-123');
  await expect(page.getByRole('heading', { name: 'No matching skills' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('.skill-card:visible')).toHaveCount(10);
});

test('installation choices and clipboard', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(base);
  await page.locator('.install summary').click();
  await page.locator('#install-agent').selectOption('codex');
  await page.locator('#install-audience').selectOption('student');
  await expect(page.locator('#install-command')).toContainText('codex plugin add education-student-skills@education-ai-skills');
  await page.getByRole('button', { name: 'Copy installation commands' }).click();
  await expect(page.locator('.copy-status')).toHaveText('Copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('codex plugin add education-student-skills');
});

test('skill page examples and prompt copying', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(`${base}skills/lecture-planning/`);
  await expect(page.locator('h1')).toHaveText('Lecture Planning');
  await page.locator('.example').filter({ hasText: 'good-plan.json' }).locator('summary').click();
  await expect(page.locator('.example[open] pre')).toContainText('duration_minutes');
  await page.getByRole('button', { name: 'Copy prompt' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('lecture-planning');
});

test('responsive pages and real maintainer image', async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const path of ['', 'skills/research-source-checking/', 'skills/assessment-design/', 'guide/']) {
    await page.goto(`${base}${path}`);
    await expect(page.locator('h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  expect(await page.locator('.maintainer img').evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
  await page.goto(base);
  await page.screenshot({ path: info.outputPath('catalog.png'), fullPage: true, animations: 'disabled', scale: 'css' });
});

test('all skill routes resolve', async ({ page, request }) => {
  await page.goto(base);
  const links = await page.locator('.skill-card').evaluateAll(cards => cards.map(card => card.getAttribute('href')));
  expect(links).toHaveLength(10);
  for (const link of links) {
    const response = await request.get(link);
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('View SKILL.md');
  }
});
