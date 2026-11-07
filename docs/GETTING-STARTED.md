# Start Here: Choose Your AI Application

Education AI Skills provides free instructions and templates, plus a separate experimental
local chat application. The skills themselves are not a model or an application.
Choose one of the three routes below, then follow its setup guide.
You do not need to install all three. Their access requirements and usage limits are
separate from this project's MIT license; an institution may also restrict which tools you use.

## Choose a route

| Option | Available here | What you need |
| --- | --- | --- |
| Claude Code | Skills and setup guide | Claude Code access and a local course folder |
| Codex | Skills and setup guide | Codex access and a local course folder |
| Local AI assistant | Experimental source preview | Node.js 24+, Ollama and a downloaded local model; no paid API account required |

The Claude Code and Codex sections cover **local folder-based sessions**. Claude Code is not the ordinary Claude
chat interface. Codex is not an ordinary ChatGPT chat. Putting a bundle ZIP into a chat
attachment does not install its skills. Cloud sessions and other products have their own
installation and access rules.

## Prepare a course folder

Create a folder such as `Teaching-AI-Practice` on your computer. Start with synthetic notes
or public course material, not student records or unpublished assessments. Open only that
folder in your chosen application, rather than granting access to your entire home directory.

[Download one audience bundle](https://rrezartprebreza.github.io/education-ai-skills/downloads/)
and extract the ZIP. The professor bundle contains lecture planning, teaching materials,
assessment design, feedback, source checking and responsible AI use. The student bundle
contains tutoring, worked examples, retrieval practice, study planning and the two shared skills.

Read `START-HERE.md` in the extracted bundle for the complete copying, updating and removal
instructions. Choose manual copying **or** marketplace installation, not both for the same skills.

## Claude Code setup

1. Follow the [official desktop quickstart](https://code.claude.com/docs/en/desktop-quickstart)
   to download the Claude desktop application for your operating system. Check its current
   subscription and system requirements first; this repository does not provide paid access.
2. Sign in, open the **Code** tab, and start a **local** session in `Teaching-AI-Practice`.
   Use the official quickstart's illustrated walkthrough if your interface looks different.
3. Inside your course folder, create `.claude/skills/`. Copy the individual folders from
   the extracted bundle's `skills` directory into it. Do not copy the outer bundle folder.
4. Start a new session if the added skills are not visible. For a manually installed professor
   skill, type `/lecture-planning`; for a student skill, type `/socratic-tutor`.
   These are chat commands, not commands to paste into your operating system's terminal.
5. Send a first task from the examples below. Review any proposed file changes or command
   execution before approving them.

For a professor installation, the resulting file should be:

```text
Teaching-AI-Practice/.claude/skills/lecture-planning/SKILL.md
```

The slash-command examples assume **manual installation**. Plugin-installed skills are
namespaced, so use the name shown in the client's skill selector instead. See the
[official skill guide](https://code.claude.com/docs/en/skills) for discovery and naming rules.

## Codex setup

1. Follow the [official desktop setup](https://learn.chatgpt.com/docs/quickstart) and download
   the application from the official page for your operating system. Check current account,
   workspace and usage requirements; this project's free skills do not include model access.
2. Sign in. In the current ChatGPT desktop interface, select **Codex** from the product
   dropdown and open `Teaching-AI-Practice` as the working folder. Use a local session for
   this guide. Labels can differ in older versions; follow the official setup walkthrough.
3. Create `.agents/skills/` inside the course folder, then copy the individual extracted skill
   folders into it. Do not put them in another nested `skills` folder.
4. Start a new session if needed. Type `$lecture-planning` for the professor example or
   `$socratic-tutor` for the student example in the chat composer and select the matching skill.
   These are skill references in chat, not terminal commands.
5. Send your task and review the result and any requested permissions.

For a professor installation, the resulting file should be:

```text
Teaching-AI-Practice/.agents/skills/lecture-planning/SKILL.md
```

See the [official Codex skill guide](https://learn.chatgpt.com/docs/build-skills) for supported
locations and skill selection. Desktop setup is enough for this manual path; you do not need
to install a terminal CLI merely to copy these folders.

## First tasks and expected behavior

Select the skill as described above, then send one of these messages.

**Professor: lecture-planning**

> Plan a 50-minute introduction to recursion for first-year students who know functions and
> loops. Include objectives, a worked example, practice, and an exit question. Keep instructor
> answers separate. Draft the plan in chat without creating files yet.

Check that the time allocations total 50 minutes, that activities address the objectives,
and that answers are separate from student-facing material. A plausible plan still needs
your subject-matter review. If it misses something, ask for a specific revision.

**Student: socratic-tutor**

> Help me understand recursion using a separate practice example, not my assessed assignment.
> Ask one question at a time and wait for my answer before continuing.

The intended behavior is one question followed by a pause for your reply, not a fabricated
conversation or an entire answer sheet. Respond with your actual reasoning; ask for an
explanation if the hint is not enough. These are checks to perform, not promised model outcomes.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| No Code tab or Codex option | Confirm the application, current version, account access and institution's settings using the official setup guide. |
| No skill appears | Confirm the working folder and that each individual skill has its own `SKILL.md` directly inside it. Start a new local session. |
| A command is not recognized | Enter it in the AI application's chat, not a shell. Use `/` for manual Claude Code skills and `$` for Codex. For plugins, select the displayed namespaced skill. |
| A dot-folder is invisible | Enable hidden files in your file manager. Verify `.claude` or `.agents` is inside the course folder. |
| Duplicate skills appear | Check for both ZIP and marketplace installations, or both audience bundles. Review custom changes before removing only the redundant skill copies. |
| Usage limit or sign-in error | Check your account or institution's access. Reinstalling the skills does not add credits or bypass limits. |
| Installation is blocked | Ask your institution's administrator. Do not bypass managed restrictions. |
| The response is inaccurate | Check the selected skill and supplied evidence, ask for corrections, and verify the result yourself. A skill cannot guarantee accuracy. |

## Privacy and permissions

An application working with local files can still send prompt content to an online model.
"Local folder" does not mean "offline inference." Use only institution-approved tools and
data-sharing arrangements. Do not provide identifiable student records, private answer keys
or accommodation data as a setup test. Keep consequential grading and integrity decisions
with the responsible people, and follow the actual course AI policy.

Review file edits before accepting them. Do not approve uploads, publication, email, or access
to unrelated folders just because a skill requests it. Skills are instructions, not a security
boundary or authorization to act on institutional systems.

## Local AI assistant: experimental preview

The third option is a separate browser-based chat interface that runs on your computer and
loads these skills through a local Ollama model. It does not require a Claude Code or Codex
account. It is a source download, not a one-click installer, and includes no model weights.
Hardware and model quality affect results; it is not a validated replacement for either client.

Read the [local setup guide](LOCAL-ASSISTANT.md) for Node.js, native/Docker Ollama, model
downloads, starting the application, and privacy limits. This app has no browsing or file
execution tools; source checking is limited to supplied material.

## Scope and sources

Official setup documentation checked on **7 November 2026**. Product interfaces and access
rules can change; use the linked official pages for current downloads and requirements.
The project tests package contents and documented folder layouts, not every operating system,
account configuration, or model response. No end-to-end Claude Code runtime test is claimed.
