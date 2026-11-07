import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { loadSkills, prepareChat, RequestError } from './lib/skills.mjs';
import { readNDJSON } from './lib/ndjson.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const security = {
  'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
};
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
const json = (res, status, body) => { res.writeHead(status, { ...security, 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };

export function portNumber(value) {
  if (!/^\d+$/.test(String(value)) || Number(value) < 1 || Number(value) > 65535) throw new Error('Port must be between 1 and 65535');
  return Number(value);
}
async function readBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > 65536) { req.resume(); throw new RequestError('Request too large.', 413); }
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new RequestError('Invalid JSON.'); }
}

export async function createAssistantServer({ root = resolve(here, '..'), publicDir = resolve(here, 'dist'), ollamaPort = 11434, fetchImpl = fetch, generationTimeout = 180000 } = {}) {
  const skills = await loadSkills(root);
  const token = randomBytes(32).toString('hex');
  const upstream = `http://127.0.0.1:${portNumber(ollamaPort)}`;
  let busy = false;
  async function ollama(path, body, signal) {
    const response = await fetchImpl(`${upstream}${path}`, {
      method: body ? 'POST' : 'GET', headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined, redirect: 'error',
      signal: AbortSignal.any([signal ?? new AbortController().signal, AbortSignal.timeout(10000)]),
    });
    if (!response.ok) throw new RequestError('Ollama could not load this model. Check that it is installed locally.', 503);
    const reader = response.body.getReader();
    const chunks = [];
    let bytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 2_000_000) throw new RequestError('Invalid Ollama metadata.', 502);
        chunks.push(value);
      }
      return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  }
  async function models(signal) {
    const data = await ollama('/api/tags', undefined, signal);
    if (!Array.isArray(data.models)) throw new Error('Invalid model list');
    return data.models.filter(model => typeof model.name === 'string' && model.name.length <= 150 && model.size > 0 && model.details?.format === 'gguf' && !model.remote_host && !model.remote_model && !model.name.endsWith(':cloud')).map(model => ({ name: model.name, size: model.size }));
  }
  const server = createServer(async (req, res) => {
    const port = server.address()?.port;
    const hosts = [`127.0.0.1:${port}`, `localhost:${port}`];
    if (!hosts.includes(req.headers.host)) return json(res, 403, { error: 'Invalid host.' });
    const origin = `http://${req.headers.host}`;
    if ((req.headers.origin && req.headers.origin !== origin) || req.headers['sec-fetch-site'] === 'cross-site') return json(res, 403, { error: 'Cross-origin requests are blocked.' });
    let url;
    try { url = new URL(req.url, origin); } catch { return json(res, 400, { error: 'Invalid URL.' }); }
    if (url.origin !== origin) return json(res, 403, { error: 'Invalid origin.' });
    try {
      if (url.pathname === '/api/bootstrap' && req.method === 'GET') {
        return json(res, 200, { token, skills: [...skills.values()].map(({ instructions, templates, ...entry }) => entry) });
      }
      if (url.pathname === '/api/models' && req.method === 'GET') return json(res, 200, { models: await models() });
      if (url.pathname === '/api/chat' && req.method === 'POST') {
        if (req.headers.origin !== origin || req.headers['x-session-token'] !== token) throw new RequestError('Refresh the page before sending a message.', 403);
        if (req.headers['content-type']?.split(';')[0] !== 'application/json') throw new RequestError('JSON is required.', 415);
        const payload = prepareChat(await readBody(req), skills);
        if (busy) throw new RequestError('Another response is running. Wait or stop it first.', 409);
        busy = true;
        const controller = new AbortController();
        const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(generationTimeout)]);
        res.once('close', () => controller.abort());
        try {
          if (!(await models(signal)).some(model => model.name === payload.model)) throw new RequestError('Select a downloaded local model, not a cloud model.', 400);
          const details = await ollama('/api/show', { model: payload.model }, signal);
          if (details.remote_host || details.remote_model || details.details?.format !== 'gguf' || !details.capabilities?.includes('completion')) throw new RequestError('Only local text-generation models are supported.', 400);
          if (details.thinking?.values?.includes(false) || (!details.thinking && details.capabilities.includes('thinking'))) payload.think = false;
          const response = await fetchImpl(`${upstream}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), redirect: 'error', signal });
          if (!response.ok || !response.body) throw new RequestError('Ollama could not generate a response. Check the model and available memory.', 502);
          res.writeHead(200, { ...security, 'Content-Type': 'application/x-ndjson' });
          let length = 0, complete = false, content = '';
          for await (const event of readNDJSON(response.body)) {
            if (signal.aborted) throw signal.reason;
            if (event.error) throw new RequestError('Ollama stopped with an error. Check available memory and retry.', 502);
            const delta = typeof event.message?.content === 'string' ? event.message.content : '';
            length += delta.length;
            if (length > 64000) throw new RequestError('Response exceeded the size limit.', 502);
            content += delta;
            if (delta && !res.write(JSON.stringify({ delta }) + '\n')) await once(res, 'drain', { signal });
            if (event.done) {
              if (!content.trim()) throw new RequestError('No answer was returned. Try another local model or a shorter prompt.', 502);
              res.write(JSON.stringify({ done: true, truncated: event.done_reason === 'length' }) + '\n');
              complete = true;
              break;
            }
          }
          if (!complete) throw new RequestError('The response was interrupted. Retry when Ollama is ready.', 502);
          res.end();
        } catch (error) {
          const message = error instanceof RequestError ? error.message : signal.aborted ? 'Response stopped or timed out. Try a shorter request.' : 'Cannot reach Ollama. Start it locally and retry.';
          if (!res.destroyed) {
            if (res.headersSent) res.end(JSON.stringify({ error: message }) + '\n');
            else json(res, error.status ?? 503, { error: message });
          }
        } finally { busy = false; controller.abort(); }
        return;
      }
      if (url.pathname.startsWith('/api/')) return json(res, 404, { error: 'Unknown endpoint.' });
      if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Method not allowed.' });
      const path = decodeURIComponent(url.pathname);
      if (path.includes('\\') || path.includes('\0')) return json(res, 404, { error: 'Not found.' });
      const directory = await realpath(publicDir);
      const file = await realpath(resolve(directory, `.${path === '/' ? '/index.html' : path}`));
      if (!file.startsWith(directory + sep) || !(await stat(file)).isFile() || !mime[extname(file)]) return json(res, 404, { error: 'Not found.' });
      const content = req.method === 'HEAD' ? undefined : await readFile(file);
      res.writeHead(200, { ...security, 'Content-Type': mime[extname(file)] });
      res.end(content);
    } catch (error) {
      if (!res.destroyed) json(res, error instanceof RequestError ? error.status : error.code === 'ENOENT' ? 404 : 503, { error: error instanceof RequestError ? error.message : url.pathname.startsWith('/api/') ? 'Cannot reach Ollama. Start it locally and refresh models.' : 'Page not available. Build the application first.' });
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const server = await createAssistantServer({ ollamaPort: portNumber(process.env.OLLAMA_PORT ?? 11434) });
  const port = portNumber(process.env.PORT ?? 4310);
  server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `Port ${port} is busy. Set PORT to another unused port.` : 'Unable to start the local server.'); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`Education Local Assistant: http://127.0.0.1:${port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { server.closeAllConnections(); server.close(); });
}
