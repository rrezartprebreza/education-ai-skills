import { createAssistantServer } from '../server.mjs';
const encoder = new TextEncoder();
const fakeFetch = async (url, options) => {
  if (url.endsWith('/api/tags')) return Response.json({ models: ['test:small', 'test:other'].map(name => ({ name, size: 1000, details: { format: 'gguf' } })) });
  if (url.endsWith('/api/show')) return Response.json({ details: { format: 'gguf' }, capabilities: ['completion'] });
  const input = JSON.parse(options.body);
  const prompt = input.messages.at(-1).content;
  if (prompt.includes('SIMULATE_ERROR')) return new Response('unavailable', { status: 503 });
  const slow = prompt.includes('SIMULATE_SLOW');
  const parts = ['**Practice question**\n\n', 'What stops a recursive function from calling itself forever?', '\n\n<img src="https://evil.test/pixel" onerror="alert(1)">'];
  let timer;
  return new Response(new ReadableStream({
    start(controller) {
      let index = 0;
      timer = setInterval(() => {
        if (index < parts.length) controller.enqueue(encoder.encode(JSON.stringify({ message: { content: parts[index++] }, done: false }) + '\n'));
        else { controller.enqueue(encoder.encode('{"done":true}\n')); clearInterval(timer); controller.close(); }
      }, slow ? 2000 : 40);
      options.signal.addEventListener('abort', () => { clearInterval(timer); try { controller.error(options.signal.reason); } catch {} }, { once: true });
    },
    cancel() { clearInterval(timer); },
  }));
};
const server = await createAssistantServer({ fetchImpl: fakeFetch });
server.listen(4311, '127.0.0.1', () => console.log('Test fixture: http://127.0.0.1:4311'));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => { server.closeAllConnections(); server.close(); });
