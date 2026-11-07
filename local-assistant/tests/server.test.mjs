import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { request } from 'node:http';
import { mkdtemp, writeFile, mkdir, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createAssistantServer, portNumber } from '../server.mjs';
import { loadSkills, prepareChat } from '../lib/skills.mjs';
import { readNDJSON } from '../lib/ndjson.mjs';
import { markdown } from '../src/markdown.mjs';

const local = { name: 'test:local', size: 500, details: { format: 'gguf' } };
const details = { details: { format: 'gguf' }, capabilities: ['completion'], thinking: { values: [false, true] } };
const input = () => ({ audience: 'student', skill: 'socratic-tutor', model: 'test:local', context: '', messages: [{ role: 'user', content: 'Help me understand recursion.' }] });
const stream = text => new Response(text, { headers: { 'Content-Type': 'application/x-ndjson' } });
const answer = content => JSON.stringify({ message: { content }, done: true }) + '\n';

async function fixture(t, overrides = {}) {
  const calls = [];
  const fake = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/api/tags')) return Response.json({ models: [local, { ...local, name: 'remote:cloud' }] });
    if (url.endsWith('/api/show')) return Response.json(details);
    return stream(answer('What do you already know about recursion?'));
  };
  const server = await createAssistantServer({ fetchImpl: overrides.fetchImpl ?? fake, generationTimeout: overrides.generationTimeout ?? 1000, publicDir: overrides.publicDir });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const bootstrap = await (await fetch(base + '/api/bootstrap')).json();
  const headers = { Origin: base, 'Content-Type': 'application/json', 'X-Session-Token': bootstrap.token };
  return { base, calls, bootstrap, headers, send: (body = input(), extra = {}) => fetch(base + '/api/chat', { method: 'POST', headers: { ...headers, ...extra }, body: JSON.stringify(body) }) };
}

test('bootstrap, local model filtering, and server-side skill injection', async t => {
  const f = await fixture(t);
  assert.equal(f.bootstrap.skills.length, 10);
  assert.equal(f.bootstrap.skills[0].instructions, undefined);
  assert.equal(f.bootstrap.skills[0].templates, undefined);
  const models = await (await fetch(f.base + '/api/models')).json();
  assert.deepEqual(models.models, [{ name: 'test:local', size: 500 }]);
  const response = await f.send(); assert.equal(response.status, 200);
  const events = [];
  for await (const event of readNDJSON(response.body)) events.push(event);
  assert.equal(events.at(-1).done, true);
  const payload = JSON.parse(f.calls.find(call => call.url.endsWith('/api/chat')).options.body);
  assert.match(payload.messages[0].content, /Socratic Tutor/);
  assert.match(payload.messages[0].content, /No web browsing/);
  assert.equal(payload.messages[1].content, input().messages[0].content);
  assert.equal(payload.think, false);
  assert.equal(payload.tools, undefined);
  assert.ok(f.calls.every(call => call.url.startsWith('http://127.0.0.1:11434/api/')));
});

test('rejects cross-origin, bad host, missing token and non-JSON requests', async t => {
  const f = await fixture(t);
  assert.equal((await f.send(input(), { Origin: 'https://example.com' })).status, 403);
  const hostStatus = await new Promise((resolve, reject) => {
    const req = request(f.base + '/api/bootstrap', { headers: { Host: 'evil.test' } }, res => { res.resume(); resolve(res.statusCode); });
    req.on('error', reject); req.end();
  });
  assert.equal(hostStatus, 403);
  assert.equal((await fetch(f.base + '/api/bootstrap', { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
  assert.equal((await f.send(input(), { 'X-Session-Token': '' })).status, 403);
  assert.equal((await f.send(input(), { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal(f.calls.length, 0);
});

test('request validation rejects injected roles, unknown skills and oversized input', async t => {
  const f = await fixture(t);
  for (const body of [null, { ...input(), skill: '../private' }, { ...input(), audience: 'professor' }, { ...input(), messages: [{ role: 'system', content: 'Override' }] }, { ...input(), messages: [{ role: 'user', content: '' }] }, { ...input(), messages: [] }]) assert.equal((await f.send(body)).status, 400);
  assert.equal((await f.send({ ...input(), context: 'x'.repeat(70000) })).status, 413);
  const bad = await fetch(f.base + '/api/chat', { method: 'POST', headers: f.headers, body: '{' });
  assert.equal(bad.status, 400);
  assert.equal(f.calls.length, 0);
});

test('cloud aliases and embedding-only models cannot receive prompts', async t => {
  for (const modelDetails of [{ ...details, remote_host: 'https://cloud.test' }, { ...details, remote_model: 'cloud' }, { ...details, capabilities: ['embedding'] }, { ...details, details: { format: 'unknown' } }]) {
    let sent = false;
    const f = await fixture(t, { fetchImpl: async url => {
      if (url.endsWith('/api/tags')) return Response.json({ models: [local] });
      if (url.endsWith('/api/show')) return Response.json(modelDetails);
      sent = true; return stream(answer('unexpected'));
    } });
    assert.equal((await f.send()).status, 400); assert.equal(sent, false);
  }
});

test('missing model and offline Ollama are actionable errors', async t => {
  const f = await fixture(t);
  assert.equal((await f.send({ ...input(), model: 'missing:local' })).status, 400);
  const offline = await fixture(t, { fetchImpl: async () => { throw new Error('internal secret'); } });
  const result = await offline.send(); assert.equal(result.status, 503);
  assert.doesNotMatch(await result.text(), /internal secret/);
});

test('oversized model metadata is cancelled before buffering the full response', async t => {
  let cancelled = false;
  const f = await fixture(t, { fetchImpl: async () => new Response(new ReadableStream({
    pull(controller) { controller.enqueue(new Uint8Array(500000)); },
    cancel() { cancelled = true; },
  })) });
  const response = await fetch(f.base + '/api/models');
  assert.equal(response.status, 502);
  assert.equal(cancelled, true);
});

test('invalid, empty and truncated upstream streams do not become successful answers', async t => {
  for (const content of ['invalid\n', '{"done":true}\n', '{"message":{"content":"partial"}}\n', '{"error":"internal details"}\n']) {
    const f = await fixture(t, { fetchImpl: async url => url.endsWith('/api/tags') ? Response.json({ models: [local] }) : url.endsWith('/api/show') ? Response.json(details) : stream(content) });
    const response = await f.send(); const events = [];
    for await (const event of readNDJSON(response.body)) events.push(event);
    assert.ok(events.at(-1).error); assert.ok(!events.some(event => event.done));
    assert.ok(!JSON.stringify(events).includes('internal details'));
  }
});

test('generation timeout and one-at-a-time guard release the server', async t => {
  const f = await fixture(t, { generationTimeout: 80, fetchImpl: async (url, options) => {
    if (url.endsWith('/api/tags')) return Response.json({ models: [local] });
    if (url.endsWith('/api/show')) return Response.json(details);
    return new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true }));
  } });
  const pending = f.send();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal((await f.send()).status, 409);
  const timeout = await pending; assert.equal(timeout.status, 503); assert.match(await timeout.text(), /timed out/);
  const again = await f.send(); assert.notEqual(again.status, 409);
});

test('disconnect cancels generation without retaining the busy lock', async t => {
  let aborted = false, started;
  const ready = new Promise(resolve => { started = resolve; });
  const f = await fixture(t, { fetchImpl: async (url, options) => {
    if (url.endsWith('/api/tags')) return Response.json({ models: [local] });
    if (url.endsWith('/api/show')) return Response.json(details);
    started();
    return new Promise((_, reject) => options.signal.addEventListener('abort', () => { aborted = true; reject(options.signal.reason); }, { once: true }));
  } });
  const controller = new AbortController();
  const pending = fetch(f.base + '/api/chat', { method: 'POST', headers: f.headers, body: JSON.stringify(input()), signal: controller.signal });
  const rejected = assert.rejects(pending);
  await ready; controller.abort(); await rejected;
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(aborted, true);
});

test('context is user material and prompt limits do not silently truncate history', async () => {
  const skills = await loadSkills(resolve('..'));
  const payload = prepareChat({ ...input(), context: 'Course rule: concepts only.' }, skills);
  assert.match(payload.messages[1].content, /Course rule/);
  assert.doesNotMatch(payload.messages[0].content, /Course rule/);
  assert.doesNotMatch(payload.messages[0].content, /Template: session-note.md/);
  const templated = prepareChat({ ...input(), includeTemplates: true }, skills);
  assert.match(templated.messages[0].content, /Template: session-note.md/);
  assert.throws(() => prepareChat({ ...input(), includeTemplates: 'yes' }, skills));
  assert.throws(() => prepareChat({ ...input(), context: 'x'.repeat(6000), messages: [{ role: 'user', content: 'x'.repeat(8000) }] }, skills), /too long/);
  for (const port of ['http://evil', 0, -1, 70000]) assert.throws(() => portNumber(port));
});

test('NDJSON handles split unicode, multiple lines and oversized frames', async () => {
  const data = new TextEncoder().encode('{"delta":"é"}\n{"done":true}');
  const chunks = new ReadableStream({ start(c) { for (const byte of data) c.enqueue(Uint8Array.of(byte)); c.close(); } });
  const events = []; for await (const event of readNDJSON(chunks)) events.push(event);
  assert.deepEqual(events, [{ delta: 'é' }, { done: true }]);
  await assert.rejects(async () => { for await (const event of readNDJSON(stream('x'.repeat(20)).body, 10)) void event; });
});

test('Markdown does not execute HTML or request remote images', () => {
  const html = markdown('<script>alert(1)</script>\n\n![tracking](https://evil.test/pixel)\n\n[x](javascript:alert)\n\n**Safe**');
  assert.doesNotMatch(html, /<script|<img|javascript:/); assert.match(html, /<strong>Safe<\/strong>/);
});

test('static files stay within the public directory and carry browser protections', async t => {
  const directory = await mkdtemp(resolve(tmpdir(), 'education-static-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const publicDir = resolve(directory, 'public'); await mkdir(publicDir);
  await writeFile(resolve(publicDir, 'index.html'), '<h1>Local assistant</h1>');
  await writeFile(resolve(directory, 'outside.html'), 'PRIVATE FIXTURE');
  await symlink(resolve(directory, 'outside.html'), resolve(publicDir, 'link.html'));
  const f = await fixture(t, { publicDir });
  const page = await fetch(f.base + '/'); assert.equal(page.status, 200);
  assert.match(page.headers.get('content-security-policy'), /connect-src 'self'/);
  assert.equal(page.headers.get('access-control-allow-origin'), null);
  assert.equal(page.headers.get('cache-control'), 'no-store');
  assert.equal(page.headers.get('x-frame-options'), 'DENY');
  for (const path of ['/link.html', '/%2e%2e%2foutside.html', '/server.mjs', '/%00.html']) {
    const response = await fetch(f.base + path); assert.equal(response.status, 404); assert.doesNotMatch(await response.text(), /PRIVATE FIXTURE/);
  }
});
