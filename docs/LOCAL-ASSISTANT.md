# Local AI Assistant

**Experimental source preview.** This third option runs the education chat interface on your
computer and connects to a local Ollama model. Claude Code and Codex remain separate, supported
ways to use the same skills. No Claude or Codex account is required for this local application.
The software has no API subscription fee, but hardware, electricity, downloads and storage
are still your responsibility. Model quality varies and educator review remains necessary.

## Before you start

- Install [Node.js 24 or newer](https://nodejs.org/en/download) and an institution-approved
  [Ollama installation](https://docs.ollama.com/quickstart), or use Docker below.
- Choose a local text-generation model compatible with your hardware. The app accepts
  downloaded GGUF completion models and rejects known cloud model entries. Model licenses
  are separate from this project's MIT license. No weights are included in the ZIP.
- A small model can check that the connection works without being suitable for reliable
  tutoring or assessment preparation. There is no universal minimum RAM recommendation:
  model size, quantization and the requested 16K context window affect memory needs.
- Initial package/model downloads need internet access. The running app has no browsing,
  file execution, LMS connector, or automatic download feature.

## 1. Run Ollama locally

For a native installation, follow [Ollama's setup guide](https://docs.ollama.com/quickstart).
Disable cloud features with `OLLAMA_NO_CLOUD=1` in the Ollama service environment and restart
it, as described in the [official FAQ](https://docs.ollama.com/faq). Keep its listener on
loopback. Do not set wildcard browser origins or expose its port publicly.

**Docker alternative:** the following creates a dedicated container and volume, with the
API exposed only on your computer. Review the container/volume names first; do not overwrite
an existing setup. The first command may download a large image.

```sh
docker run -d --name education-ollama -p 127.0.0.1:11434:11434 -e OLLAMA_NO_CLOUD=1 -v education-ollama-data:/root/.ollama ollama/ollama:latest
```

For a small connection test, this command downloads `qwen3:0.6b` (roughly 523 MB at the time
of writing). It is **not a recommended production teaching model**:

```sh
docker exec education-ollama ollama pull qwen3:0.6b
```

For a native installation, the equivalent is `ollama pull qwen3:0.6b`. Check the model's
[registry entry and license](https://ollama.com/library/qwen3:0.6b) before downloading.
Choose and evaluate a stronger local model when your hardware permits. Do not treat a
successful connection as evidence that its explanations or grading suggestions are correct.

Docker Desktop on macOS runs this CPU-only example without Apple GPU acceleration; native
Ollama may perform differently. See [Ollama's Docker guide](https://docs.ollama.com/docker)
for supported GPU configurations. No GPU passthrough is configured by this project.

## 2. Download and start the application

Download the **Local assistant source ZIP** from the project website and extract it, or clone
the repository. Keep `catalog.json`, `skills/` and `local-assistant/` beside one another.
Open a terminal in the extracted root folder and run:

```sh
cd local-assistant
npm ci
npm start
```

`npm ci` downloads the pinned application dependencies. `npm start` builds the interface and
starts the local server. Open **http://127.0.0.1:4310** in your browser. This is a local address,
not a public website. The terminal prints the actual address; leave it running during use.

If a port is occupied, choose another one. On macOS/Linux:

```sh
PORT=4312 OLLAMA_PORT=11435 npm start
```

On Windows PowerShell, set these in the current terminal before `npm start`:

```powershell
$env:PORT = "4312"
$env:OLLAMA_PORT = "11435"
npm start
```

`OLLAMA_PORT` must match your native listener or Docker host-side port. For example, map
`127.0.0.1:11435:11434` in Docker when choosing 11435. Both application and model connections
remain on `127.0.0.1`; remote API URLs are intentionally unsupported.

## 3. Use a skill

1. Choose **Professor** or **Student**, then choose a skill. Shared source-checking and
   responsible-use skills appear for either audience. These modes are not access controls.
2. Select an installed local model. If the list is empty, check Ollama and use Refresh.
3. Optionally add de-identified course notes or an AI-use policy. Enable **Include output
   templates** only when you want a structured draft; templates are off by default.
4. Enter your request or use the selected skill's example prompt. Responses stream into
   the conversation. Stop cancels the request; Retry resends a failed or stopped request.
5. Review the answer. Export downloads the visible conversation as Markdown, including
   interrupted responses marked as such. Course notes are not a separate field in the export,
   but answers may quote them. New chat clears messages, notes and the draft after confirmation.

Skill, audience or model changes start a fresh session with confirmation if there is existing
work. Notes and template settings are fixed once a successful conversation begins. Long
conversations are rejected with an explanation, not silently shortened. Limits are 12,000
UTF-8 prompt bytes including skill instructions, 16K requested context, 1,024 generated tokens,
and three minutes per response. A response stopped at the output limit is labelled.

## Privacy and limits

The application keeps chat state in the current browser tab only. It does not use cookies,
analytics, local storage, a chat database, or application prompt logging. Reloading or closing
the tab loses the conversation unless you exported it. This does not erase browser/OS memory,
swap, downloads, Ollama logs or records maintained by your machine or institution.

The server binds to loopback, checks host/origin and a per-process request token, and sends
prompts only to its loopback Ollama endpoint. It rejects known cloud metadata and redirects.
Use a trusted local Ollama service with cloud disabled; a malicious local service or software
on your own account is outside this protection. Do not put the app behind a public proxy.

Responses are untrusted. Markdown is sanitized and remote images are removed. No model tool
calls are executed. Source checking can inspect supplied text but cannot verify live web pages.
The app produces chat text, not finished slide decks, executed code or LMS updates. It does
not enforce course policies, guarantee learning, or make final grades or integrity decisions.

Use synthetic or de-identified material and follow your institution's rules even when a model
runs locally. Sharing a computer or exporting a conversation can still disclose sensitive data.

## Troubleshooting and stopping

| Problem | Next step |
| --- | --- |
| Ollama unavailable | Start Ollama and match `OLLAMA_PORT` to its host-side port, then refresh models. |
| No models shown | Download a local GGUF text-generation model. Cloud-only and embedding-only models cannot run chat here. |
| No answer or poor tutoring | Try a more capable model and a shorter prompt. Small test models can ignore instructions. |
| Too long or out of memory | Shorten notes, export and start a new session, or select a smaller model. There is no automatic cloud fallback. |
| Port occupied | Set a different `PORT`; do not stop an unrelated service. |
| Token rejected | Reload the page after an application-server restart; export your current conversation first. |

Press Ctrl+C in the application terminal to stop the app. For the example Docker setup,
`docker stop education-ollama` stops the model service without deleting its model volume.
`docker start education-ollama` restarts that existing container later. Remove only containers
and data you deliberately created and no longer need.

## Verification scope

Automated tests cover input validation, origin/host checks, local-model guards, cancellation,
timeouts, stream parsing, Markdown safety and desktop/mobile chat flows with a simulated
Ollama service. They do not establish model quality. The initial real-model smoke test uses
Ollama 0.20.3 in Docker with Qwen3 0.6B; observations and limitations are recorded in the
[quality document](https://github.com/rrezartprebreza/education-ai-skills/blob/main/docs/QUALITY.md).
