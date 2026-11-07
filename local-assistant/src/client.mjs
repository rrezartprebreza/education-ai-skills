import { readNDJSON } from '../lib/ndjson.mjs';
import { markdown } from './markdown.mjs';

const $ = selector => document.querySelector(selector);
let catalog = [], token = '', audience = 'professor', messages = [], controller = null, failedPrompt = '', previousModel = '', previousSkill = '', modelsReady = false, conversationModel = '';
const settings = $('#settings');
if (matchMedia('(max-width: 700px)').matches) settings.open = false;
const selected = () => catalog.find(skill => skill.id === $('#skill').value);
const notice = text => { $('#notice').textContent = text; };
const error = text => { $('#error').hidden = !text; $('#error').textContent = text; };

function controls() {
  const busy = Boolean(controller);
  for (const selector of ['#skill', '#model', '#context', '#refresh', '#clear', '#example', '[data-audience="professor"]', '[data-audience="student"]']) {
    $(selector).disabled = busy || !catalog.length || (selector === '#model' && !modelsReady);
  }
  $('#context').disabled = busy || messages.some(message => message.state === 'complete');
  $('#templates').disabled = busy || messages.some(message => message.state === 'complete');
  $('#send').disabled = busy || !token || !$('#model').value || !selected();
  $('#stop').hidden = !busy;
  $('#export').disabled = !messages.length || busy;
  $('#retry').hidden = !failedPrompt || busy;
  $('#prompt').disabled = busy;
  $('#session-status').textContent = busy ? 'Generating locally...' : 'Session only';
  $('#active-model').textContent = $('#model').value || (modelsReady ? 'No model selected' : 'Ollama unavailable');
}
function render() {
  const nearBottom = $('#transcript').scrollHeight - $('#transcript').scrollTop - $('#transcript').clientHeight < 120;
  $('#empty').hidden = messages.length > 0;
  $('#messages').replaceChildren();
  for (const message of messages) {
    const element = $('#message-template').content.firstElementChild.cloneNode(true);
    element.classList.add(message.role);
    element.querySelector('strong').textContent = message.role === 'user' ? 'You' : 'Assistant';
    const content = element.querySelector('.message-content');
    if (message.role === 'assistant') content.innerHTML = markdown(message.content || '');
    else content.textContent = message.content;
    element.querySelector('.message-state').textContent = message.state === 'interrupted' ? 'Interrupted; excluded from the next request.' : message.state === 'pending' ? 'In progress' : message.truncated ? 'Output limit reached; review before continuing.' : '';
    element.querySelector('.copy').disabled = !message.content;
    element.querySelector('.copy').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(message.content); notice('Message copied.'); }
      catch { error('Clipboard unavailable. Select the message text to copy it.'); }
    });
    $('#messages').append(element);
  }
  if (nearBottom) $('#transcript').scrollTop = $('#transcript').scrollHeight;
  controls();
}
function updateSkills() {
  $('#skill').replaceChildren(...catalog.filter(skill => [audience, 'shared'].includes(skill.audience)).map(skill => new Option(skill.title, skill.id)));
  previousSkill = $('#skill').value;
  showSkill();
}
function showSkill() {
  const skill = selected();
  if (!skill) return;
  $('#title').textContent = skill.title;
  $('#empty-title').textContent = skill.title;
  $('#summary').textContent = skill.summary;
  $('#category').textContent = skill.category;
}
function resetSession() {
  messages = []; failedPrompt = ''; conversationModel = ''; $('#prompt').value = ''; $('#context').value = ''; $('#templates').checked = false; error(''); notice(''); render();
}
function mayReset() { return !messages.length && !$('#context').value && !$('#prompt').value || confirm('Start a new session? This clears the conversation, notes and draft. Export anything you need first.'); }

async function refresh() {
  $('#refresh').disabled = true;
  $('#connection').textContent = 'Checking Ollama...';
  try {
    const response = await fetch('/api/models', { signal: AbortSignal.timeout(12000) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    modelsReady = data.models.length > 0;
    const keep = $('#model').value;
    $('#model').replaceChildren(new Option('Choose a local model', ''), ...data.models.map(model => new Option(model.name, model.name)));
    if (data.models.some(model => model.name === keep)) $('#model').value = keep;
    else if (data.models.length === 1 && !messages.length) $('#model').value = data.models[0].name;
    previousModel = $('#model').value;
    $('#model').disabled = false;
    $('#connection').textContent = data.models.length ? `${data.models.length} local model${data.models.length === 1 ? '' : 's'} available` : 'No local GGUF models. Download one in Ollama, then refresh.';
    $('#connection').dataset.ready = String(data.models.length > 0);
  } catch {
    modelsReady = false;
    $('#model').replaceChildren(new Option('Ollama unavailable', ''));
    $('#connection').textContent = 'Ollama unavailable. Start the local service and refresh.';
    $('#connection').dataset.ready = 'false';
  } finally { controls(); $('#refresh').disabled = Boolean(controller); }
}

async function send(text) {
  if (controller || !text.trim()) return;
  const history = messages.filter(message => message.state === 'complete').map(({ role, content }) => ({ role, content }));
  const user = { role: 'user', content: text, state: 'pending' };
  const assistant = { role: 'assistant', content: '', state: 'pending' };
  if (!messages.length) conversationModel = $('#model').value;
  messages.push(user, assistant);
  controller = new AbortController(); failedPrompt = ''; error(''); notice(''); $('#prompt').value = ''; render();
  $('#transcript').scrollTop = $('#transcript').scrollHeight;
  if (matchMedia('(max-width: 700px)').matches) settings.open = false;
  try {
    const response = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Session-Token': token }, signal: controller.signal,
      body: JSON.stringify({ audience, skill: selected().id, model: $('#model').value, context: $('#context').value, includeTemplates: $('#templates').checked, messages: [...history, { role: 'user', content: text }] }),
    });
    if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Request failed.'); }
    let done = false;
    for await (const event of readNDJSON(response.body)) {
      if (event.error) throw new Error(event.error);
      if (event.delta) { assistant.content += event.delta; render(); }
      if (event.done) { done = true; assistant.truncated = Boolean(event.truncated); break; }
    }
    if (!done) throw new Error('The connection ended before the response finished.');
    user.state = assistant.state = 'complete';
    notice('Response complete. Review facts and teaching decisions.');
  } catch (cause) {
    user.state = assistant.state = 'interrupted'; failedPrompt = text;
    error(controller.signal.aborted ? 'Response stopped.' : cause.message);
  } finally { controller = null; render(); $('#prompt').focus(); }
}

$('#composer').addEventListener('submit', event => { event.preventDefault(); send($('#prompt').value); });
$('#stop').addEventListener('click', () => controller?.abort());
$('#refresh').addEventListener('click', refresh);
$('#example').addEventListener('click', () => { $('#prompt').value = selected()?.prompt ?? ''; $('#prompt').focus(); });
$('#clear').addEventListener('click', () => { if (mayReset()) resetSession(); });
$('#retry').addEventListener('click', () => {
  const text = failedPrompt;
  messages = messages.filter(message => message.state === 'complete');
  send(text);
});
for (const button of document.querySelectorAll('[data-audience]')) button.addEventListener('click', () => {
  if (audience === button.dataset.audience || !mayReset()) return;
  resetSession(); audience = button.dataset.audience;
  for (const item of document.querySelectorAll('[data-audience]')) item.setAttribute('aria-pressed', String(item === button));
  updateSkills(); controls();
});
$('#skill').addEventListener('change', () => {
  if (!mayReset()) { $('#skill').value = previousSkill; return; }
  resetSession(); previousSkill = $('#skill').value; showSkill();
});
$('#model').addEventListener('change', () => {
  if (!mayReset()) { $('#model').value = previousModel; return; }
  resetSession(); previousModel = $('#model').value; controls();
});
$('#export').addEventListener('click', () => {
  const body = `# Education AI conversation\n\nModel: ${conversationModel}\nSkill: ${selected()?.title}\n\n` + messages.map(message => `## ${message.role === 'user' ? 'You' : 'Assistant'}${message.state === 'interrupted' ? ' (interrupted)' : ''}\n\n${message.content}\n`).join('\n');
  const url = URL.createObjectURL(new Blob([body], { type: 'text/markdown;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'education-conversation.md'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  notice('Conversation exported. Store it appropriately.');
});
window.addEventListener('beforeunload', event => { if (messages.length || controller || $('#context').value || $('#prompt').value) { event.preventDefault(); event.returnValue = ''; } });
try {
  const response = await fetch('/api/bootstrap');
  if (!response.ok) throw new Error('Cannot initialize this session. Refresh the page.');
  const data = await response.json(); catalog = data.skills; token = data.token;
  updateSkills(); await refresh(); controls();
} catch (cause) { error(cause.message); }
