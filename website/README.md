# Education AI Skills website

Static Astro catalog generated from `../catalog.json` and canonical skill Markdown. No accounts,
uploads, model API calls, cookies, analytics, or student-data storage. The maintainer photo is
the creator's existing public GitHub profile photo, reused with the repository owner's request.

Requires Node >=22.23.4. CI uses Node 24.

```sh
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
