---
name: gh-issue
description: "CLI-first companion skill for interacting with GitHub Issues via the `gh` CLI under the zazzcode account. Use it to CREATE/log/file a GitHub issue — a bug, follow-up, enhancement, or observation, including when the user hits something while coding and wants to track it for later instead of fixing it now. Use it equally to READ/view/list/search an issue as input to fixing or assessment — including when the user references an issue number or says things like 'read issue #19', 'assess issue N', 'propose a fix for issue N', 'what does issue N say', or 'work on issue N'. Covers the full issue lifecycle (create, view, search, comment, close, reopen), screenshot/attachment handling, methodology-aligned routing of issue-vs-spec-vs-proposal, and the read→assess→propose-fix→feed-back workflow. Operates against GitHub Issues using the active `gh` profile (zazzcode under the zazzcode tree)."
metadata:
  type: rule
---

# GitHub Issues Skill

## Purpose

This skill gives agents a consistent, CLI-first way to interact with GitHub Issues for **two equally important directions**:

1. **Create** — when a developer hits something mid-task that should not interrupt the current work (a bug, a rough edge, an enhancement idea, a follow-up), capture it durably in the repo's GitHub Issues in seconds, attributed to the right account, with enough context to act on later.
2. **Read** — when a developer says "look at issue #19, assess it, and propose a fix," pull the issue, extract its acceptance criteria, validate them against the code, form an honest assessment, and feed a proposed fix back (as a comment, a spec, or a PR) without overstepping human approval authority.

The two directions are split into separate sections below so an agent doing one does not need to load the other's guidance. Shared concerns (account verification, repo resolution, AGENTS.md conventions, authority gates, error handling) live in the shared sections.

GitHub Issues are lightweight, single-repo, collaborator-triageable records. They are not a substitute for a Zazz deliverable specification when bounded implementation work is needed. This skill makes that distinction explicit so the right artifact gets created.

## How to load this skill

This skill is a file on disk, not necessarily registered in your runtime's available-skills list. If a `read_skill` call returns "Skill not found" for this path, load it directly with `read_files` against the `SKILL.md` path. Do not treat a `read_skill` miss as a reason to skip the skill — its guidance still applies.

## Startup sequence

Before any mutating action (create/comment/close/reopen) or a read-for-fixing assessment, do this every time:

1. Confirm the active GitHub account matches the workspace. Run `gh auth status` and read the `Logged in to github.com account <name>` line. Under the `/Users/michael/Dev/zazzcode` tree the `gh()` shell wrapper routes to the `zazzcode` profile automatically, but verify rather than assume — issues are attributed to whichever account creates them. If the account is wrong, stop and tell the user instead of filing or editing under the wrong identity. If for any reason the wrapper is not active in your shell, run gh commands in the explicit form `GH_CONFIG_DIR="$HOME/.config/gh-zazzcode" gh ...`. Do not pass tokens inline; the credential helper handles auth.
2. Identify the target repo. `gh issue` commands target the repo in the current directory by default. If the user is in a worktree or a different repo than they mean to act on, or they named a repo, pass `--repo zazzcode/<repo>` (shorthand `-R`). Resolve the repo from `git remote -v` when in doubt, or ask.
3. Read `AGENTS.md` for repo-specific issue conventions: labels, templates, project codes, milestone conventions, and the repo's tracking-system policy. `AGENTS.md` is the source of truth for repo-specific settings; honor its conventions over any generic default here. If `AGENTS.md` declares Zazz Board (or Jira) as the authoritative tracking system but that system is currently down or unavailable, GitHub Issues are an acceptable active tracker for development follow-ups — surface that fallback to the user rather than silently routing around the declared policy.
4. Make only the issue updates the user asked for. Do not close, reopen, or edit issues the user did not mention.

## Authentication and multi-account context

This skill assumes the multi-account setup in `github-multi-account-setup.md` is in effect: a separate `gh` profile at `~/.config/gh-zazzcode` is used under the zazzcode tree, and a `gh()` shell wrapper routes commands there. The `repo` scope on the zazzcode token covers all issue operations (create, comment, close, reopen, edit, list, view) for repos zazzcode owns or has write access to.

If `gh auth status` fails or reports a non-zazzcode account under the zazzcode tree, surface that to the user rather than working around it.

---

## Create an issue

Use this section when the user wants to log, file, create, or track something as a GitHub issue. Skip the "Read an issue" section.

### Log (create) an issue

```bash path=null start=null
gh issue create \
  --repo zazzcode/<repo> \
  --title "<concise imperative title>" \
  --body-file <path-to-body.md> \
  --label <label> \
  --assignee <user> \
  --project "<project name>" \
  --milestone "<milestone>"
```

- Prefer `--body-file` over `--body` for anything more than a one-liner. It keeps long, structured bodies readable and avoids shell-quoting problems.
- **Temp body vs. persistent body:** if the body is just a scratch file you created to feed `--body-file`, write it to a temp path and remove it after the issue is created. If the user (or a task) asked you to persist the body at a specific path, use `--body-file` pointing at that persistent path and do **not** delete it afterward — the developer wants it kept. The skill cannot know which case you are in; decide based on whether a persistent path was requested.
- Do not invent labels. Check what exists with `gh label list` and only apply labels that already exist or that `AGENTS.md` defines. If the right label does not exist, create the issue without a label and tell the user the label is missing rather than silently creating new taxonomy.
- Only set `--assignee`, `--project`, and `--milestone` when the user asked for them or `AGENTS.md` prescribes them. Default to unassigned.
- Add `--web` only if the user explicitly wants to finish the issue in the browser.

After creating, re-fetch with `gh issue view <number> --json number,title,url,state,author,labels` to confirm the issue landed correctly, then report the issue number and URL to the user.

### Issue body structure

Use this template. It is intentionally lightweight so the agent can fill it quickly during a coding session, but it captures enough to act on later. Drop sections that do not apply.

```markdown path=null start=null
## Summary
<one or two sentences: what this is about>

## Context
- Repo: zazzcode/<repo>
- Branch / worktree: <branch or path>
- File(s): <path:line>
- Steps to reproduce / how to get here: <if a bug>

## Expected
<what should happen, for bugs>

## Actual
<what happens instead, for bugs>

## Definition of done / acceptance
<what would make this closeable — for enhancements and follow-ups>

## Links
- Related: #<issue>, <spec path>, ZAZZ-<deliverable>
- Drafted PR: #<pr> (Closes #<this issue>)
```

For the "hit something while coding, log it for later" workflow, the most common shape is: a short Summary, a Context section with the file:line and what the agent was doing, and a Definition of done. Do not over-engineer small follow-ups; do not under-document real bugs.

### When the reported symptom contradicts the code

Sometimes a quick read of the code shows the reported bug cannot happen as described — a guard already exists, the route already returns 404, the field is already validated. Do not silently "fix" the report by parroting only the symptom, and do not silently suppress the contradiction. File the issue **faithfully** (capture the observed symptom and Expected/Actual as reported) **and** add a short section such as `## Notes from a quick code read` that records what the code actually shows and points at likely downstream culprits (a service returning a wrong value, a stale build, a shadowing route, env-dependent behavior). This keeps the issue honest and actionable for the person who picks it up later, and it distinguishes "reproduced" from "not yet reproduced / possibly upstream."

### Screenshots and attachments

GitHub has **no first-party CLI or API for image uploads** as of mid-2026 (`gh issue create`/`comment` have no `--attach`; the internal `uploads.github.com` endpoint requires a browser session cookie, not a PAT). The agent's default is the **web-UI placeholder pattern**: create the issue with a `<!-- attach screenshot here from browser -->` placeholder and tell the user to drag-drop the screenshot in via the browser — that produces the best `user-attachments` URLs (render inline, work in email, respect private-repo visibility). For programmatic upload when the user asks for it, see the README's "Attaching images/screenshots" reference for the `gh-image` extension and the Contents-API-on-a-branch fallback, including their limitations. Do not attempt `gh api` against the upload endpoint; it will fail.

---

## Read an issue (as input to fixing or assessment)

Use this section when the user references an issue number or asks you to read, assess, summarize, triage, or propose a fix for an issue. Skip the "Create an issue" section.

### View, list, and search

- View one issue with comments: `gh issue view <number> --comments`
- View one issue as raw JSON for parsing: `gh issue view <number> --json number,title,state,body,labels,assignees,author,url,createdAt`
- List open issues: `gh issue list` (add `--state all` to include closed, `--state closed` for closed only)
- Filter: `--label <label>`, `--assignee <user>`, `--author <user>`, `--milestone <title>`, `--limit <N>` (default 30)
- Search with GitHub search syntax: `gh issue list --search "is:open <query>"` — supports `label:`, `assignee:`, `author:`, `state:`, `no:label`, `created:`, `sort:` and more.
- Quick repo overview: `gh issue status` shows issues assigned to / mentioning / created by you in the current repo.

Prefer JSON output (`--json`) when you need to reason over fields programmatically; prefer the default human-readable output when surfacing an issue to the user.

### Reading an issue as input to a fix

When the user says "read issue #N and propose a fix" (or "assess #N", "work on #N", "what's the status of #N"), follow this workflow:

1. **Fetch the full issue.** `gh issue view <number> --comments` — read the body and the comment thread, not just the title. The acceptance criteria and constraints often live in comments.
2. **Extract the contract.** Pull out: the reported symptom/Expected/Actual, any Definition of done or acceptance criteria, file:line references, repro steps, and linked specs/PRs/Zazz Board deliverables. State these back to the user so they can confirm you understood the issue correctly before you go deeper.
3. **Validate against the code.** Open the referenced files and check whether the reported behavior matches the current code. This is where you catch contradictions (a guard already exists, the bug is upstream, the symptom is stale). Report what the code actually does, with file:line evidence — do not assert a cause you have not checked.
4. **Form an honest assessment.** Categorize the issue: reproducible as described / not reproducible as described / partially reproducible / needs more info / already fixed / out of scope. If you cannot reproduce, say so and propose how to get a reliable repro (a test, a specific command, a data condition). Do not pretend to have reproduced something you have not.
5. **Propose a fix or next step** scoped to what you actually verified. A proposal is not an implementation unless the user asked for one. Distinguish clearly between: a concrete code change you have traced end-to-end, a hypothesis that needs a test to confirm, and a question for the reporter. Reference the exact files and lines a fix would touch.
6. **Feed the assessment back.** See the next subsection for where to put it.

### Feeding an assessment or proposed fix back

Pick the right surface for the feedback, in this order of preference:

- **Comment on the issue** (`gh issue comment <number> --body-file <path>`) — the default for an assessment, a repro result, a question for the reporter, or a proposed fix that the user should approve before anyone implements it. Keep the comment structured: assessment, evidence (file:line), proposed fix or next step, and an explicit ask ("approve this direction and I'll implement" / "need repro from reporter").
- **A PR** (handled by `pr-builder`) with `Closes #N` in the PR body — when the user has approved the fix direction and you have implemented and verified it. Do not open a PR for a mere proposal.
- **A deliverable specification** (`spec-builder` / Zazz Board) — when the issue turns out to describe bounded implementation work that should pass through the spec-driven development lifecycle rather than a quick fix. Steer there and keep the issue as a pointer.
- **A proposal** (`proposal-builder`) — when the issue reveals genuine uncertainty about product or technical direction that needs a decision before a fix.

Do not edit the issue author's body to "fix" their report. If the report is inaccurate, add a comment with the correction and evidence; let the author update their own body.

Authority gates for the read direction are the same as for create: an agent assesses, proposes, and comments; the human approves the fix direction, decides spec-vs-quick-fix, and approves/merges any PR. See `## Authority gates`.

---

## Close, reopen, and comment

```bash path=null start=null
gh issue comment <number> --body-file <path-to-comment.md>
gh issue close <number>    # optionally --reason "completed" | "not planned"
gh issue reopen <number>
```

Use comments to add context, reproduction steps, test results, assessment, or links to a related PR/spec. Closing is a human-authority action: as an agent, prefer to recommend closing with evidence and let the user close, unless the user explicitly told you to close it. When you do close on instruction, include the reason: `completed` or `not planned`.

Note: GitHub does **not** allow deleting issues via the CLI, the REST/GraphQL API, or the web UI — issues can only be closed. Plan cleanup as "close as not planned" with a comment, never as deletion.

## Link issues to specs, PRs, and Zazz Board deliverables

Cross-references make issues useful later. In issue bodies, comments, and PR descriptions, use GitHub's auto-reference syntax:

- `Refs #N` — references an issue without closing it.
- `Closes #N` / `Fixes #N` / `Resolves #N` — closes the issue when the PR merges. Only use these in a PR description or commit that actually resolves the issue.
- Link Zazz Board deliverable codes (e.g., `ZAZZ-4`) and repo doc paths (e.g., `specifications/<slug>.md`) explicitly so a later reader can find the governing context.

When a fix is being delivered, prefer opening the PR with `Closes #N` in the PR body (handled by `pr-builder`) rather than manually closing the issue.

## When to log an issue vs. other Zazz artifacts

Picking the wrong artifact creates noise. Use this routing:

- **GitHub issue** — a single, trackable item for a bug, small enhancement, follow-up, or observation tied to one repo. Lightweight; triageable by any collaborator; good for "capture this now, decide later." This is the default when the user says "log this," "file this," "track this for later," or "create an issue."
- **Proposal** (`proposal-builder`, lives under `<DOCS_ROOT>/proposals/`) — use when product or technical direction is genuinely uncertain and the team needs to work through options and record a decision before building. An issue can point to a proposal, but the proposal is the durable decision artifact.
- **Deliverable specification** (`spec-builder` / Zazz Board) — use when there is bounded implementation work with acceptance criteria, a test strategy, standards, and halt conditions. An issue is not a spec; if the user is describing a unit of work that would pass through the spec-driven development lifecycle, steer toward a spec/Zazz Board deliverable and optionally keep an issue as a lightweight pointer.
- **Feature requirements document** (`feature-doc-builder`) — use for long-lived capability intent and feature roadmap increments, not for a single follow-up.

When the user's request is ambiguous, ask one clarifying question: "Do you want a quick GitHub issue to track this for later, or a deliverable spec because this is bounded implementation work?" Do not silently upgrade a quick issue into a spec or vice versa.

## Authority gates

This follows the methodology's operating principle that humans retain scope, triage, and approval authority while agents execute inside approved contracts.

Agents may:
- read, list, and search issues freely
- create issues to capture bugs, follow-ups, and observations
- comment on issues with context, evidence, assessment, or links
- assess an issue and propose a fix or next step
- recommend closing an issue with evidence

Agents should not:
- close or reopen issues without explicit user instruction (recommend instead)
- edit another author's issue body without instruction
- prioritize, assign, milestone-set, or project-set issues without instruction or an `AGENTS.md` rule
- create issues that impersonate a decision (e.g., "Approved: do X") — issues track, they do not approve
- implement a fix for an issue without the user approving the fix direction, unless the user explicitly asked for implementation

## Execution discipline

- Operate from the user's current working directory or an explicit `--repo`. Do not `cd` into a repo just to file an issue; use `--repo` instead.
- Use the `gh()` wrapper as-is under the zazzcode tree. Do not set `GH_CONFIG_DIR` or `GH_TOKEN` manually unless the wrapper is not active in your shell.
- For long bodies, write to a file and use `--body-file`; clean up only temp files, not persistent ones the user asked to keep.
- After any mutating action (create/comment/close/reopen), re-fetch with `gh issue view <number>` and confirm the result before reporting success.
- Report issue numbers and URLs back to the user so they can open or share them.
- If an issue create fails (e.g., 403, labels restricted, issues disabled), report the exact error and the command run; do not retry with guessed alternate flags.
- For the read direction, always cite file:line evidence for any claim about the code, and clearly separate "verified" from "hypothesis" from "question for the reporter."

## Error handling

Common failure modes and what to do:

- `issues are disabled for this repository` — the repo has issues turned off. Tell the user; do not try to enable issues for them without instruction (that is an owner setting via `gh repo edit --enable-issues`).
- `403` / `Resource not accessible` — the active account lacks write access to the repo. Check `gh auth status`; if it is the wrong account, tell the user rather than filing under the wrong identity.
- `label not found` — a requested label does not exist. List real labels with `gh label list` and either use an existing one or file without a label and flag the gap.
- Rate limit (`403` with rate-limit message) — wait and retry once; if it persists, report it.
- Wrong repo detected — if `gh issue create` targets the wrong repo, re-run with an explicit `--repo zazzcode/<repo>`.

## Non-goals

- No issue-template authoring automation (creating/updating `.github/ISSUE_TEMPLATE/*`) — that is a repo change through PR review, not an issue operation.
- No org-level management, webhook, or security settings.
- No replacing the tracking-system policy in `AGENTS.md`; this skill honors repo conventions, it does not override them.
- No bulk operations across many repos or many issues in one shot.
- No deleting issues — GitHub does not support it; use close-as-not-planned.

## Related skills

- `pr-builder` — packages a PR; use `Closes #N` in the PR body to auto-close the issue on merge.
- `proposal-builder`, `spec-builder`, `feature-doc-builder` — the durable-decision and contract artifacts when an issue is not the right shape.
- `zazz-board` — for repos that use Zazz Board as the authoritative execution-record and task system; fall back to GitHub Issues only when Zazz Board is down or unavailable, and surface that to the user.
