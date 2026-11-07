import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
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
  for (const path of ['', 'skills/research-source-checking/', 'skills/assessment-design/', 'guide/', 'downloads/', 'start/']) {
    await page.goto(`${base}${path}`);
    await expect(page.locator('h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  expect(await page.locator('.maintainer img').evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
  await page.goto(base);
  await page.screenshot({ path: info.outputPath('catalog.png'), fullPage: true, animations: 'disabled', scale: 'css' });
  await page.goto(`${base}downloads/`);
  await page.screenshot({ path: info.outputPath('downloads.png'), fullPage: true, animations: 'disabled', scale: 'css' });
  await page.goto(`${base}start/`);
  await page.screenshot({ path: info.outputPath('start.png'), animations: 'disabled', scale: 'css' });
});

test('beginner guide connects both application routes to downloads', async ({ page }) => {
  await page.goto(base);
  await page.getByRole('link', { name: 'Choose your AI application', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('Start Here');
  await expect(page.getByRole('heading', { name: 'Claude Code setup', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Codex setup', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'official desktop quickstart', exact: true })).toHaveAttribute('href', 'https://code.claude.com/docs/en/desktop-quickstart');
  await expect(page.getByRole('link', { name: 'official desktop setup', exact: true })).toHaveAttribute('href', 'https://learn.chatgpt.com/docs/quickstart');
  await expect(page.getByRole('row').filter({ hasText: 'Local AI assistant' })).toContainText('Planned, not available');
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    for (const link of await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link').all()) {
      await expect(link).toBeVisible();
    }
  }
  await page.getByRole('link', { name: 'Get the skill bundles', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('Download Skills');
  await page.getByRole('link', { name: 'New to Claude Code or Codex? Start here', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('Start Here');
});

test('both ZIP downloads match their published checksums', async ({ page, request }, info) => {
  await page.goto(base);
  await page.getByRole('link', { name: 'Download a skills bundle', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('Download Skills');
  const response = await request.get(`${base}downloads/manifest.json`);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest).toHaveLength(2);
  for (const bundle of manifest) {
    const pending = page.waitForEvent('download');
    await page.getByRole('link', { name: `Download ${bundle.audience} ZIP`, exact: true }).click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe(bundle.filename);
    const path = info.outputPath(bundle.filename);
    await download.saveAs(path);
    expect(await download.failure()).toBeNull();
    const bytes = await readFile(path);
    expect(bytes.subarray(0, 4).toString('hex')).toBe('504b0304');
    expect(bytes.length).toBe(bundle.bytes);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(bundle.sha256);
  }
  const checksums = await request.get(`${base}downloads/SHA256SUMS.txt`);
  expect(checksums.ok()).toBe(true);
  for (const bundle of manifest) expect(await checksums.text()).toContain(`${bundle.sha256}  ${bundle.filename}`);
});

test('download links and setup guide work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:4337${base}downloads/`);
    await expect(page.getByRole('link', { name: 'Download professor ZIP', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: '2. Add skills to a teaching or study project' })).toBeVisible();
    await page.locator('.checksum summary').first().click();
    await expect(page.locator('.checksum[open] code')).toBeVisible();
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Start Here', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Claude Code setup', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Codex setup', exact: true })).toBeVisible();
  } finally {
    await context.close();
  }
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
