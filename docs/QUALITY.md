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

## Research basis

The [IES practice guide](https://ies.ed.gov/ncee/wwc/PracticeGuide/1) discusses strategies such as
worked examples, retrieval practice and spacing. Their appropriateness varies with content,
learner knowledge and implementation. The [UNESCO guidance](https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research)
provides context for human oversight, inclusion and privacy in generative-AI use.

Do not turn these general sources into a product efficacy claim. Any future pilot should define
the population, consent/approval process, comparison, outcomes, delayed measurements and limitations
before reporting results. Keep participant data outside the public repository.
