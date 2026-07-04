---
name: handoff
description: Create or update platform-neutral handoff documents for agents and developers when work needs to be paused, transferred, resumed in another session, or cataloged as follow-up context; use for ephemeral HANDOFF notes, issue catalogs, continuation plans, next-session briefs, and cross-agent summaries.
---

# Handoff

Use this skill when a user asks for a handoff document, continuation note, stale-session summary, issue catalog for another agent, next-session brief, or any artifact meant to help another agent or developer resume work.

## Core Rules

- Handoff documents are platform-neutral working notes. Do not make them Codex-specific, Claude-specific, Cursor-specific, or tied to any single agent runtime.
- Store temporary handoff documents under `<DOCS_ROOT>/ephemeral/` unless the user explicitly specifies another location. In repos that declare `<DOCS_ROOT>` as `.zazz`, the default location is `.zazz/ephemeral/`.
- Name every handoff document with local date and time down to seconds, and include `HANDOFF` in all caps so the file stands out:

```text
<topic>-HANDOFF-YYYY-MM-DD-HHMMSS.md
```

- Treat any user-provided arguments as the intended focus of the next session and tailor the handoff to that focus.
- Do not duplicate content already captured in other artifacts such as PRDs, plans, ADRs, issues, commits, diffs, specifications, or PR bodies. Reference them by path, commit, issue URL, PR URL, or document title instead.
- Redact sensitive information, including API keys, passwords, tokens, secrets, private keys, session identifiers, and unnecessary personally identifiable information.
- Do not commit handoff documents. The generated handoff file must be ignored by git.
- Do not change `.zazz/standards/*` while creating a handoff unless the user explicitly confirms the standards change.

## Workflow

1. Read the current task context, relevant diffs, recent commits, and test or verification results.
2. Identify `<DOCS_ROOT>`. Use `.zazz` when the repo has one; otherwise use the repository's documented project-doc root.
3. Create `<DOCS_ROOT>/ephemeral/` if it does not exist.
4. Generate the timestamp from local time unless the user requests another timezone.
5. Write a concise Markdown handoff with enough context for another agent or developer to continue safely.
6. Verify the handoff file is ignored by git before finishing.

## Recommended Content

Include the sections that fit the situation:

- **Context:** Current branch, project area, user intent, and why the handoff exists.
- **Completed:** Commits, pushed branches, schema or seed changes, UI/API behavior already handled.
- **Suggested Skills:** Skills the next agent should invoke and why.
- **Open Issues:** Bugs, incomplete behavior, questions, or risks that still need investigation.
- **Files To Inspect:** Key files and why they matter.
- **Artifacts To Read:** Paths, commits, issues, PRs, specifications, plans, or docs to inspect instead of restating their contents.
- **Verification:** Tests run, manual checks performed, and known gaps.
- **Next Steps:** Ordered, actionable work for the next agent or developer.

Keep the document practical. Prefer concrete file paths, commands, observed errors, and reproduction steps over broad narration.
