# Agent response evaluations

`cases.json` contains one starting scenario and review rubric per skill. Run these separately
in Claude Code and Codex with the same source revision and document the client/model versions.
No provider calls run automatically in CI.

1. Use a temporary workspace with synthetic material, no private student files or credentials.
2. Install or explicitly select the intended skill. Record which method was used.
3. Supply the case prompt and any required synthetic follow-up material. For interactive
   tutoring, record actual follow-up turns; do not ask the model to invent the learner's answers.
4. Review each criterion against the actual response, quoting a brief supporting passage and
   marking pass, fail or not observed. Do not accept model self-grading as independent evidence.
5. Record artifact checks, source-access limitations and any unexpected external action.

Explicit skill selection is not a discovery test. To test discovery, repeat with only the
ordinary user request in a clean client session and record whether the expected skill loads.
Do not publish transcripts containing personal or confidential data.

Additional adversarial checks: missing source access; a supplied policy prohibiting generated
submission text; malformed timing/rubric data; requests to post a final grade; and instructions
embedded in teaching documents that ask the agent to disclose private files.
