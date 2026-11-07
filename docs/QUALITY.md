# Quality and evidence scope

## Checked automatically

- Catalog IDs, skill frontmatter, local links, examples, templates and Codex metadata.
- Exact generated bundle contents for both audiences and marketplace paths.
- ZIP downloads match the canonical plugin content, extract into both clients' documented
  skill layouts, and have reproducible bytes and matching checksums. This is a filesystem
  installation check, not proof of runtime selection or model behavior in either client.
- Lecture timing/objective references and rubric arithmetic on synthetic fixtures, including
  negative cases. These validators do not judge fairness, pedagogy, subject accuracy or learning.
- Website content rendering, links, audience filters, copy controls and responsive layouts.
- Local assistant request validation, loopback/origin protections, local-model guards,
  cancellation, bounded streams, sanitized Markdown and desktop/mobile workflows using a
  simulated Ollama service. These tests check application behavior, not model quality.

## Requires human or client evaluation

- Actual skill selection and installation in each client/version.
- Tutoring turn-taking, appropriate hints, source verification, and policy-sensitive responses.
- Technical correctness of generated teaching materials and assessments.
- Instructor review before any consequential grading or institutional action.

No educational-effectiveness study or cross-model benchmark is claimed. The response scenarios
in the evaluation directory are test protocols, not completed observations. A passing build
does not establish improved learning, accessibility conformance or institutional compliance.

## Initial authoring review

A separate agent read the tutoring, feedback and responsible-use instructions and responded
to two synthetic boundary scenarios: a policy-prohibited assignment solution disguised as
a hint, and a request for a misconduct zero based on a detector score and one sentence.
The observed responses offered permitted conceptual help and withheld the unsupported grade.
The review prompted clearer instructions for missing rubrics, partial excerpts and optional
disclosure templates. Both scenarios are retained in `evaluations/cases.json` for future runs.
This was a narrow authoring smoke test, not a repeatability study, client-installation test,
automated benchmark or evidence of improved learning.

## Local model smoke test

On 7 November 2026, the local assistant was exercised with synthetic recursion-tutoring
requests against Ollama 0.20.3 in an isolated Docker container on macOS, limited to four CPUs
and 4 GiB of memory. Cloud features were disabled and the host port was bound to loopback.
The application requested a 16K context window and disabled thinking for these Qwen3 models.

- `qwen3:0.6b` (Q4_K_M) returned a complete streamed response through the application.
  A fresh extraction of the source ZIP also installed, built, loaded all ten skills and
  completed a real streamed response, independently of the repository's dependencies.
  Initially, automatically included templates caused it to fill in a session record instead
  of asking a diagnostic question. Templates are now an explicit, off-by-default option.
- With templates off, the same model asked about the base case but then supplied its own
  explanation instead of waiting for the learner. This failed the requested turn-taking
  behavior despite the connection working. It is a connection-test model, not an endorsed
  tutoring model.
- `qwen3:1.7b` downloaded successfully but could not load with this configuration. Ollama
  reported 3.1 GiB required versus 3.0 GiB available. The app surfaced a generation error
  without treating it as an answer. No response-quality claim is made for that model.

These are narrow manual observations, not a repeatability study, benchmark, evaluation of
all ten skills, or evidence of educational effectiveness. Other models and hardware require
their own checks. No student records or assessed work were used. The local app remains an
experimental source preview; educators must review outputs and course-policy compliance.

## Research basis

The [IES practice guide](https://ies.ed.gov/ncee/wwc/PracticeGuide/1) discusses strategies such as
worked examples, retrieval practice and spacing. Their appropriateness varies with content,
learner knowledge and implementation. The [UNESCO guidance](https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research)
provides context for human oversight, inclusion and privacy in generative-AI use.

Do not turn these general sources into a product efficacy claim. Any future pilot should define
the population, consent/approval process, comparison, outcomes, delayed measurements and limitations
before reporting results. Keep participant data outside the public repository.
