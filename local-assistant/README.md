# Education Local Assistant

Experimental third route alongside Claude Code and Codex. Requires Node.js 24+, a trusted
local Ollama service, and a downloaded GGUF completion model. No model weights or API access
are included. No paid API account is needed for the local route.

From this directory:

```sh
npm ci
npm start
```

Open the printed loopback URL (default http://127.0.0.1:4310). Optional environment variables:
`PORT` for the app and `OLLAMA_PORT` for the model service; both are port numbers, never remote
URLs. Stop with Ctrl+C. Keep the parent `skills/` directory and `catalog.json` beside this folder.

Read `START-HERE.md` in the source ZIP or the
[local setup guide](https://rrezartprebreza.github.io/education-ai-skills/local/) for Docker,
model selection, privacy, controls and limitations. Disable Ollama cloud features and do not
expose either service publicly. The app does not execute tools or save conversations automatically.

## Development

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Tests use a simulated model. `tests/serve.mjs` is test-only and is never used by `npm start`.
Real-model observations must be reported separately, not treated as benchmark results.
