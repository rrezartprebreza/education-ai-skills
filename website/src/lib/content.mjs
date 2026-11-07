import { readFile, readdir } from 'node:fs/promises';
import { resolve, posix } from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { parse as yaml } from 'yaml';
import { REPO } from './commands.mjs';

// Astro bundles this module before prerendering; resolve from the website build directory.
export const ROOT = resolve(process.cwd(), '..');
export const catalog = JSON.parse(await readFile(resolve(ROOT, 'catalog.json'), 'utf8'));

export function sourceLink(target, source) {
  if (target.startsWith('#') || /^https:\/\//i.test(target)) return target;
  if (/^[a-z][a-z\d+.-]*:/i.test(target) || target.startsWith('/')) return '#';
  const [path, hash] = target.split('#', 2);
  const resolved = posix.normalize(posix.join(posix.dirname(source), path));
  if (resolved.startsWith('../')) return '#';
  return `${REPO}/blob/main/${resolved}${hash ? `#${hash}` : ''}`;
}

export async function renderMarkdown(text, source) {
  return String(await unified().use(remarkParse).use(remarkGfm).use(() => tree => {
    tree.children = tree.children.filter(node => !(node.type === 'heading' && node.depth === 1));
    function walk(node) {
      if (node.type === 'link') node.url = sourceLink(node.url, source);
      for (const child of node.children ?? []) walk(child);
    }
    walk(tree);
  }).use(remarkRehype).use(rehypeSanitize).use(rehypeStringify).process(text));
}

export async function getSkill(id) {
  const entry = catalog.skills.find(skill => skill.id === id);
  if (!entry) throw new Error('Unknown skill');
  const source = `skills/${id}/SKILL.md`;
  const text = await readFile(resolve(ROOT, source), 'utf8');
  const lines = text.split('\n');
  const end = lines.indexOf('---', 1);
  if (lines[0] !== '---' || end < 1) throw new Error('Missing frontmatter');
  const meta = yaml(lines.slice(1, end).join('\n'));
  if (meta.name !== id || typeof meta.description !== 'string') throw new Error('Bad skill metadata');
  const files = [];
  for (const folder of ['examples', 'templates']) {
    for (const file of (await readdir(resolve(ROOT, 'skills', id, folder))).sort()) {
      const path = `skills/${id}/${folder}/${file}`;
      files.push({ name: file, folder, source: path, text: await readFile(resolve(ROOT, path), 'utf8') });
    }
  }
  return { ...entry, source, trigger: meta.description.trim(), html: await renderMarkdown(lines.slice(end + 1).join('\n'), source), files };
}
