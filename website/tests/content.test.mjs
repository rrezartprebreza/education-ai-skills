import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { catalog, getSkill, renderMarkdown, sourceLink, ROOT } from '../src/lib/content.mjs';
import { installCommand, REPO } from '../src/lib/commands.mjs';

test('all canonical skills render and have examples and templates', async () => {
  assert.equal(catalog.skills.length, 10);
  assert.equal(new Set(catalog.skills.map(s => s.id)).size, catalog.skills.length);
  for (const item of catalog.skills) {
    const skill = await getSkill(item.id);
    assert.ok(skill.trigger.startsWith('Use when'));
    assert.ok(skill.html.includes('<h2>'));
    assert.ok(!skill.html.includes('<h1>'));
    assert.ok(skill.files.some(file => file.name === 'good.md'));
    assert.ok(skill.files.some(file => file.name === 'bad.md'));
    assert.ok(skill.files.some(file => file.folder === 'templates'));
  }
  await assert.rejects(getSkill('../private'));
});

test('audience bundles match the marketplace commands', async () => {
  for (const agent of ['claude', 'codex']) {
    const path = agent === 'claude' ? '.claude-plugin/marketplace.json' : '.agents/plugins/marketplace.json';
    const marketplace = JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
    for (const audience of ['professor', 'student']) {
      const name = `education-${audience}-skills`;
      assert.ok(marketplace.plugins.some(p => p.name === name));
      assert.ok(installCommand(agent, audience).includes(`${name}@education-ai-skills`));
      assert.equal(catalog.skills.filter(s => [audience, 'shared'].includes(s.audience)).length, 6);
    }
  }
  assert.throws(() => installCommand('invalid', 'student'));
  assert.throws(() => installCommand('codex', 'invalid'));
});

test('Markdown excludes scripts and unsafe URLs', async () => {
  const html = await renderMarkdown('# Title\n## Section\n<script>alert(1)</script>\n\n[bad](javascript:alert)\n\n[good](examples/good.md)', 'skills/socratic-tutor/SKILL.md');
  assert.ok(!html.includes('<script'));
  assert.ok(!html.includes('javascript:'));
  assert.ok(html.includes(`${REPO}/blob/main/skills/socratic-tutor/examples/good.md`));
});

test('source paths stay inside the repository', () => {
  assert.equal(sourceLink('../../../../private', 'skills/x/SKILL.md'), '#');
  assert.equal(sourceLink('//evil.example', 'skills/x/SKILL.md'), '#');
  assert.equal(sourceLink('data:text/html,x', 'skills/x/SKILL.md'), '#');
  assert.equal(sourceLink('#checks', 'skills/x/SKILL.md'), '#checks');
});
