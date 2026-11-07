# Start Here: Education AI Skills

These downloads are instructions, examples and templates for **Claude Code or Codex**.
They are not a standalone application, a trained AI model, or a model subscription.
Use an installed, institution-approved client with the account/model access it requires.
Ordinary web-chat attachments do not install these bundles as skills.

New to these applications? Read [Choose Your AI Application](GETTING-STARTED.md) first.
It covers application setup, first tasks, troubleshooting and the experimental local-assistant option.

## 1. Download and extract

Choose the professor or student ZIP, then extract it with your file manager. Open the
`education-professor-skills` or `education-student-skills` folder. Each includes a `skills`
folder containing six individual skill folders, this guide, a license and `BUNDLE.json`
with the version and skill list. Plugin metadata is included for compatible clients;
the manual installation below needs only the individual skill folders.

Read the instructions and any scripts before installing. No installer runs automatically.
The optional timing/rubric helpers require Python 3; the Markdown instructions do not.

## 2. Add skills to a teaching or study project

Choose a working folder for your course. Create the directory for your chosen application:

| Application | Directory inside your course folder | Example installed file |
| --- | --- | --- |
| Claude Code | `.claude/skills/` | `.claude/skills/lecture-planning/SKILL.md` |
| Codex | `.agents/skills/` | `.agents/skills/lecture-planning/SKILL.md` |

Copy the **individual folders inside the extracted `skills` folder** into that directory.
Do not copy the whole ZIP, the outer bundle folder, or another nested `skills` directory.
For the student bundle, a corresponding example is `socratic-tutor/SKILL.md`.
Folders starting with a dot may be hidden in your file manager; enable hidden files when needed.

Open that course folder in the application. If the skills are not visible, start a new session
and check the exact folder layout above. In Codex, select the skill using `$skill-name`;
in Claude Code, use `/skill-name`. Managed settings may restrict custom skills, so contact
your institution's administrator if installation is blocked.

Choose either manual installation or marketplace installation, not both for the same skills.
The professor and student bundles share two skills. If a destination folder already exists,
review it first; do not overwrite customized files or install duplicate copies blindly.

Official setup references: [Codex skills](https://learn.chatgpt.com/docs/build-skills) and
[Claude Code skills](https://code.claude.com/docs/en/skills).

## 3. Try a first task

Select the named skill first, then enter a prompt. These examples use no student records.

**Professor: lecture-planning**

> Plan a 50-minute introduction to recursion for first-year students. Include learning
> objectives, a worked example, practice and an exit question. Keep instructor answers separate.

**Professor: assessment-design**

> Draft a formative assessment on SQL joins with a 20-point rubric and a separate instructor
> answer key. Flag assumptions and items that need my review before use.

**Professor: feedback-assistant**

> Help me draft feedback on a synthetic student response. Ask me for the task, rubric and
> response first. Tie comments to evidence and leave the final grade to me.

**Student: socratic-tutor**

> Help me understand recursion. Ask one question at a time, wait for my answer, and help
> me reason through it rather than completing an assessed assignment for me.

**Student: retrieval-practice**

> Quiz me on database normalization one question at a time. Wait for my answer before
> revealing the explanation, and revisit concepts I miss.

## Updating and removing

ZIP installs do not update automatically. Check `BUNDLE.json` for your installed version.
Before replacing files, back up custom changes outside the active skills directories and
compare them with the new download. Keep only one installed copy of each skill.
To remove a manual installation, delete only the individual skill folders you copied,
not the entire `.agents` or `.claude` directory. Start a new session if needed.

## Privacy and limits

Use synthetic or de-identified material. Do not provide student names, grades, unpublished
exams, private answer keys or accommodation records without the necessary institutional
approval and appropriate access controls. Installing skills is not consent to share data.

Skills guide model behavior; they do not guarantee correctness, learning outcomes, course
policy compliance, or separation of instructor and student data. Review teaching materials
before use. Final grading and misconduct decisions remain with responsible people.

The same ZIP can be used with either supported client by following the folder instructions.
It is not an upload-ready package for every AI application, and it does not provide offline
inference. Other clients require their own compatibility checks.
