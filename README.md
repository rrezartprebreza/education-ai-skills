# Education AI Skills

**Practical teaching and learning workflows for professors and students using Claude Code and Codex.**

Ten skills for lecture preparation, assessment design, feedback, tutoring, practice, study planning,
source checking, and responsible AI use. Built for higher education, with adaptable computer-science examples.

[Browse the website](https://rrezartprebreza.github.io/education-ai-skills/) · [Installation](#installation) · [Quality and limits](docs/QUALITY.md) · [Contributing](CONTRIBUTING.md)

## Skills

| Skill | Audience | Purpose |
| --- | --- | --- |
| [Lecture Planning](skills/lecture-planning/) | professor | Plan timed lectures around learning objectives |
| [Teaching Materials](skills/teaching-materials/) | professor | Draft source-grounded slides, notes, and handouts |
| [Assessment Design](skills/assessment-design/) | professor | Align questions and rubrics with course objectives |
| [Feedback Assistant](skills/feedback-assistant/) | professor | Draft evidence-linked feedback for instructor review |
| [Socratic Tutor](skills/socratic-tutor/) | student | Explore understanding through questions and hints |
| [Worked Example Coach](skills/worked-example-coach/) | student | Explain reasoning, then fade support into practice |
| [Retrieval Practice](skills/retrieval-practice/) | student | Practice recall with feedback and spaced review |
| [Study Planning](skills/study-planning/) | student | Build realistic study blocks around time and goals |
| [Research Source Checking](skills/research-source-checking/) | shared | Check whether sources support academic claims |
| [Responsible AI Use](skills/responsible-ai-use/) | shared | Apply course AI policies and document assistance |

## Installation

**New to AI applications?** [Start with the beginner guide](https://rrezartprebreza.github.io/education-ai-skills/start/)
or [read it in this repository](docs/GETTING-STARTED.md). It covers choosing Claude Code or
Codex, installing the application, adding skills, trying a first task and troubleshooting.
The proposed local AI assistant is planned, not included or available yet.

### Download a ZIP

[Download professor or student bundles](https://rrezartprebreza.github.io/education-ai-skills/downloads/)
and follow the included `START-HERE.md`. Each ZIP contains six skills, examples, templates,
the license and version metadata. [Read the setup guide](docs/DOWNLOADS.md) for folder locations,
first prompts, updates and removal. Checksums are published alongside the downloads.

These are skills, **not an AI model or standalone application**. You need Claude Code or
Codex with appropriate account/model access. Extract the ZIP and copy the individual skill
folders into your course project's skills directory; uploading the whole ZIP to ordinary
web chat is not an installation. Choose the ZIP method or marketplace method below, not both.

Choose **one audience bundle** to start. Each contains four audience-specific skills and the two
shared skills. Installing both can show duplicate shared skills in some clients; use individual
canonical folders if you need a custom mix.

### Claude Code

```sh
claude plugin marketplace add rrezartprebreza/education-ai-skills
claude plugin install education-professor-skills@education-ai-skills
# Or: claude plugin install education-student-skills@education-ai-skills
```

### Codex

```sh
codex plugin marketplace add rrezartprebreza/education-ai-skills
codex plugin add education-student-skills@education-ai-skills
# Or: codex plugin add education-professor-skills@education-ai-skills
```

Plugin commands require a client version that supports them. The local Codex CLI command syntax
was checked during development; authenticated end-to-end installation and automatic discovery
are separate checks. Claude CLI installation has not been exercised locally.

### Individual skills

Clone the repository, then copy only the selected skill folder into your agent's local skills
directory. For example, from the repository root:

```sh
# Codex, user scope
mkdir -p ~/.agents/skills
cp -R skills/socratic-tutor ~/.agents/skills/

# Claude Code, project scope (run from your intended teaching project instead)
# Copy this repository's selected skill to <your-project>/.claude/skills/
```

Do not overwrite an existing customized skill without reviewing it first.
See [official Codex skill locations](https://learn.chatgpt.com/docs/build-skills) and
[Claude plugin installation](https://code.claude.com/docs/en/discover-plugins).

## Try a workflow

**Professor**

> Use lecture-planning to design a 90-minute introductory database normalization session.
> Include observable objectives, a worked example, group practice, and an exit question.
> Keep instructor answers separate from the student materials.

**Student**

> Use socratic-tutor to help me understand recursion. Ask one question at a time,
> respond to my reasoning, and give a worked explanation when I need one.

**Either audience**

> Use research-source-checking to review the references in these notes.
> Tell me which claims are supported and which sources you could not inspect.

Explicitly selecting a skill is useful for checking its behavior. It does not demonstrate
that an agent will discover it automatically for every related request.

## What these skills do not do

- They do not enforce course policy or create access controls.
- They do not make final grading, misconduct, admissions, or accommodation decisions.
- They do not guarantee learning gains, factual accuracy, or citation correctness.
- They do not include an LMS connector, model subscription, or automatic reminders.
- Slide outlines are not finished PPTX/PDF files unless a separate document tool creates and verifies them.

Use synthetic or de-identified examples. Never commit student names, grades, unpublished exams,
private answer keys, or accommodation records. Instructor/student bundles are organizational
choices, not security boundaries. Follow your institution's approved tools and data-sharing rules.

## Quality and evidence

The design draws on [UNESCO's guidance](https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research)
and [the IES instruction and study guide](https://ies.ed.gov/ncee/wwc/PracticeGuide/1).
Those sources do not establish the effectiveness of these AI skills.

Every skill includes a workflow, editable template, good example, anti-example, and Codex metadata.
Structural validation, bundle-drift checks, timing/rubric helper tests, and website tests run in CI.
Agent-response scenarios are review protocols, not published benchmark scores.
See [quality scope](docs/QUALITY.md) and [evaluation instructions](evaluations/README.md).

## Development

```sh
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r scripts/requirements.txt
python3 scripts/build_bundles.py
python3 scripts/validate.py
python3 -m unittest discover -s tests -v
cd website
npm ci
npm test
npm run build
```

Edit canonical files under `skills/`, then regenerate `plugins/`. Generated bundles are committed
so both clients receive self-contained packages without symlink or repository-escape dependencies.
Do not edit generated copies directly. Website data comes from `catalog.json` and the canonical skills.

## Maintainer

**[Rrezart Prebreza, PhD](https://github.com/rrezartprebreza)**

Software engineer, professor, and researcher working on AI-assisted development and learning.

[LinkedIn](https://www.linkedin.com/in/rrezartprebreza/) · [ORCID](https://orcid.org/0009-0009-2518-3169) · [Spring Boot Skills](https://github.com/rrezartprebreza/spring-boot-skills)

MIT license. Contributions and corrections are welcome.
