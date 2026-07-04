---
name: handoff
description: Create platform-neutral HANDOFF documents for agents and developers when work needs to be paused, transferred, resumed in another session, or summarized for a fresh agent. Use when the user asks for a handoff document, continuation note, stale-session summary, issue catalog, next-session brief, or cross-agent summary, including when they provide a focus or arguments for what the next session should continue.
---

# Handoff

Use this skill to write a concise Markdown HANDOFF document that helps a fresh agent or
developer continue safely without replaying the whole conversation.

## Core Rules

- Write platform-neutral notes. Do not make the handoff Codex-specific,
  Claude-specific, Cursor-specific, or tied to any single agent runtime.
- Save temporary handoff documents in the user's OS temporary directory, not in the
  current workspace or repository.
- Name every handoff document with local date and time down to seconds, and include
  `HANDOFF` in all caps so the file stands out:

```text
<topic>-HANDOFF-YYYY-MM-DD-HHMMSS.md
```

- Treat any user-provided arguments as the intended focus of the next session and tailor
  the handoff to that focus.
- Do not duplicate content already captured in other artifacts such as PRDs, plans,
  ADRs, issues, commits, diffs, specifications, or PR bodies. Reference them by path,
  commit, issue URL, PR URL, or document title instead.
- Redact sensitive information, including API keys, passwords, tokens, secrets, private
  keys, session identifiers, and unnecessary personally identifiable information.
- Do not commit generated handoff documents.

## Workflow

1. Read the current task context, relevant diffs, recent commits, verification output,
   and any artifacts the user referenced.
2. Identify the OS temp directory:
   - macOS/Linux: prefer `$TMPDIR` when set; otherwise use `/tmp`.
   - Windows: prefer `%TEMP%`, then `%TMP%`.
3. Choose a short topic slug from the work or the user's stated next-session focus.
4. Generate the timestamp from local time unless the user requests another timezone.
5. Write a concise Markdown file named `<topic>-HANDOFF-YYYY-MM-DD-HHMMSS.md` in the OS
   temp directory.
6. Verify the file is outside the workspace and contains no obvious secrets before
   reporting the path.

## Recommended Content

Include only sections that fit the situation:

- **Context:** Current repo, branch, user intent, and why the handoff exists.
- **Current State:** Completed commits, pushed branches, open local diffs, or active
  worktree state.
- **Suggested Skills:** Skills the next agent should invoke and why.
- **Artifacts To Read:** Paths, commits, issues, PRs, specifications, plans, or docs to
  inspect instead of restating their contents.
- **Decisions And Constraints:** Accepted direction, constraints, owner preferences, and
  halt conditions that are not already obvious from referenced artifacts.
- **Open Questions:** Items that need human confirmation or investigation.
- **Verification:** Tests, checks, manual review, and known gaps.
- **Next Steps:** Ordered, actionable work for the next agent or developer.

Prefer concrete paths, commands, observed errors, and reproduction steps over broad
narration. Keep the document short enough to be useful at session start.
