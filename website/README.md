# Education AI Skills website

Static Astro catalog generated from `../catalog.json` and canonical skill Markdown. No accounts,
uploads, model API calls, cookies, analytics, or student-data storage. The maintainer photo is
the creator's existing public GitHub profile photo, reused with the repository owner's request.

Requires Node >=22.23.4 and Python 3.10+ with `../scripts/requirements.txt` installed in the
active Python environment. CI uses Node 24 and Python 3.13. The `predev` and `prebuild` scripts
generate versioned ZIP files and SHA-256 checksums into ignored `public/downloads/`.

```sh
python3 -m pip install -r ../scripts/requirements.txt
npm ci
npm run dev
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The dev command prints the local URL. Production output is `dist/`, with the GitHub Pages base
path `/education-ai-skills/`. The workflow publishes only main after checks pass. Enable Pages
with GitHub Actions as the source in repository settings before deployment.

The source renderer sanitizes Markdown HTML and maps local file links to the public repository.
Keep confidential teaching material outside this public repository, even if a UI hides it.

Downloads are built from the same canonical content as the plugin packages, not checked-in ZIP
copies. Each audience archive includes `docs/DOWNLOADS.md` as `START-HERE.md`. CI retains the downloads
as a workflow artifact for PR review; only a merge to main publishes them to GitHub Pages.

The `/start/` beginner page renders `docs/GETTING-STARTED.md`, which is also included in both
ZIPs. Update that source document to keep website and offline onboarding consistent.

The `/local/` page renders `docs/LOCAL-ASSISTANT.md` and offers a separate, versioned local
assistant source ZIP with all ten skills, its dependency lockfile and setup guide. It includes
neither model weights nor installed dependencies. The public website does not run the model
or accept conversations; the downloaded application runs separately on the user's computer.
