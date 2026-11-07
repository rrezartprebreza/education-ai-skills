import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function ready(page) {
  await page.goto('/');
  await expect(page.locator('#connection')).toContainText('2 local models');
  await page.locator('#settings').evaluate(element => { element.open = true; });
  await page.getByLabel('Local model', { exact: true }).selectOption('test:small');
}

test('audience skills, model selection and example prompt', async ({ page }) => {
  await ready(page);
  await expect(page.locator('#skill option')).toHaveCount(6);
  await page.getByRole('button', { name: 'Student', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('Socratic Tutor');
  await expect(page.locator('#skill option')).toHaveCount(6);
  await page.locator('#settings').evaluate(element => { element.open = false; });
  await page.getByRole('button', { name: 'Use example prompt' }).click();
  expect(await page.getByLabel('Your message').inputValue()).toContain('recursion');
});

test('streaming, safe markdown, export and clearing', async ({ page, context }, info) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const external = [];
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4311')) external.push(request.url()); });
  await ready(page);
  await page.locator('#settings').evaluate(element => { element.open = false; });
  await page.getByLabel('Your message').fill('Explain recursion.');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.locator('#notice')).toContainText('Response complete');
  await expect(page.locator('.message.assistant strong').last()).toHaveText('Practice question');
  await expect(page.locator('.message-content img, .message-content script')).toHaveCount(0);
  await page.locator('.message.assistant .copy').click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('Practice question');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export conversation' }).click();
  const download = await pending; const path = info.outputPath('conversation.md'); await download.saveAs(path);
  expect(await readFile(path, 'utf8')).toContain('Explain recursion.');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'New chat' }).click();
  await expect(page.locator('.message')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  expect(external).toEqual([]);
});

test('stop and retry recover without treating partial output as completed', async ({ page }) => {
  await ready(page);
  await page.locator('#settings').evaluate(element => { element.open = false; });
  await page.getByLabel('Your message').fill('SIMULATE_SLOW');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Stop', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  await expect(page.locator('#error')).toHaveText('Response stopped.');
  await expect(page.getByRole('button', { name: 'Retry last request' })).toBeVisible();
  await page.getByRole('button', { name: 'Retry last request' }).click();
  await expect(page.locator('#notice')).toContainText('Response complete', { timeout: 15000 });
  await expect(page.locator('.message')).toHaveCount(2);
});

test('server failure stays visible and does not become a completed response', async ({ page }) => {
  await ready(page);
  await page.locator('#settings').evaluate(element => { element.open = false; });
  await page.getByLabel('Your message').fill('SIMULATE_ERROR');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.locator('#error')).toContainText('could not generate');
  await expect(page.locator('.message.assistant .message-state')).toContainText('Interrupted');
  await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeEnabled();
});

test('responsive workspace and settings remain usable', async ({ page }, info) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await ready(page);
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 850 });
    await page.locator('#settings').evaluate(element => { element.open = false; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await expect(page.getByLabel('Your message')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeInViewport();
  }
  await page.setViewportSize(info.project.name === 'mobile' ? { width: 390, height: 844 } : { width: 1280, height: 850 });
  if (info.project.name === 'desktop') await page.locator('#settings').evaluate(element => { element.open = true; });
  await page.screenshot({ path: info.outputPath('local-assistant.png'), fullPage: true });
  expect(errors).toEqual([]);
});
