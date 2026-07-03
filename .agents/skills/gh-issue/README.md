# GitHub Issues (`gh-issue`) Skill — User Guide

This README is human- and agent-consumable. It describes the intent and capabilities of the `gh-issue` skill. The agent-facing contract is in `SKILL.md`; this document gives the broader context, the screenshot/attachment reference, and the methodology alignment.

## What it does

`gh-issue` is a CLI-first companion skill that lets an agent interact with GitHub Issues using the `gh` CLI, attributed to the `zazzcode` account under the zazzcode tree. It covers **two directions**:

- **Create** — log a bug, follow-up, enhancement, or observation you hit while coding, and track it for later without context-switching.
- **Read** — read/view/list/search an issue, and use it as input to fixing: assess it, validate its acceptance criteria against the code, propose a fix, and feed the assessment back as a comment, a spec, or a PR.

It also knows the difference between a quick "track this for later" issue and a Zazz deliverable specification so the right artifact gets created.

## When it triggers

Use it (or just ask naturally) when you want to:

- log a bug, follow-up, enhancement, or observation you hit while coding
- read, search, or list issues
- assess an issue, propose a fix for an issue, or work on an issue ("read issue #19 and tell me how to fix it")
- comment on, close, or reopen an issue
- link an issue to a spec, PR, or Zazz Board deliverable
- attach a screenshot or image to an issue

## Why it exists

The create direction targets the workflow: you are mid-implementation, you notice something that should not block the current task, and you want it captured durably in the repo's GitHub Issues in seconds — attributed to zazzcode, with enough context to act on later — without context-switching yourself.

The read direction targets the workflow: an issue exists (yours or a teammate's) and you want the agent to turn it into an assessment and a proposed fix without the agent overstepping into unapproved implementation.

## Multi-account safety

It verifies `gh auth status` is the `zazzcode` account before filing or editing, so issues are not accidentally attributed to your default identity. It does not pass tokens inline; the existing credential helper handles auth. The setup it relies on is documented in `github-multi-account-setup.md`. If the `gh()` shell wrapper is not active in the agent's shell, it falls back to the explicit form `GH_CONFIG_DIR="$HOME/.config/gh-zazzcode" gh ...`.

## Methodology alignment

GitHub Issues are lightweight and single-repo. They are not a substitute for:

- a **proposal** when direction is uncertain (`proposal-builder`)
- a **deliverable specification** / Zazz Board task when there is bounded implementation work (`spec-builder` / `zazz-board`)
- a **feature requirements document** for long-lived capability intent (`feature-doc-builder`)

The skill asks which artifact you want when the request is ambiguous, rather than silently creating the wrong one.

### GitHub Issues as the active tracker when Zazz Board is down

`zazz-board` is itself an issue-tracking application, but it is not always running. During development, when a repo's `AGENTS.md` declares Zazz Board as the authoritative tracking system but Zazz Board is down or unavailable, GitHub Issues are an acceptable active tracker for development follow-ups. The skill surfaces this fallback to the user rather than silently routing around the declared policy. When Zazz Board comes back up, bounded work should still move into Zazz Board deliverables.

## Authority

The agent creates, comments on, reads, assesses, and proposes freely. It recommends closing with evidence but does not close or reopen without your instruction. It does not assign, milestone, or project-set issues unless you ask or `AGENTS.md` prescribes it. For the read direction, it proposes a fix but does not implement one without your approval of the fix direction.

## Attaching images / screenshots

GitHub has **no first-party CLI or API for image uploads** as of mid-2026. `gh issue create` / `gh issue comment` have no `--attach` flag, and the internal `uploads.github.com/upload/policies/assets` endpoint the web UI uses requires a browser session cookie, not a PAT — `gh api` cannot reach it. This is tracked as `blocked` on `cli/cli` issues #1895 and #13256. The options below are workarounds; pick based on whether you want manual or programmatic attachment.

### 1. Web UI drag-and-drop (simplest, most reliable)

Open the issue (or the comment box) in the GitHub web UI and:

- **drag-and-drop** the image file into the text box, or
- **paste** from clipboard (Cmd+V with a screenshot on the clipboard), or
- **click** the image icon in the formatting toolbar to pick a file.

GitHub uploads it through its native flow and auto-inserts `![filename](https://github.com/user-attachments/assets/<uuid>)` into the text. These `user-attachments` URLs:

- render **inline** for everyone
- work in **email notifications**
- **respect private-repo visibility** (private-repo images require auth to view)
- are the gold-standard attachment URL that none of the CLI workarounds can produce via the public API

This is the agent's default recommendation for attachments. The typical pattern: the agent creates the issue via `gh` with a `<!-- attach screenshot here from browser -->` placeholder and tells you to drag-drop the screenshot in via the browser. No CLI, no extension, no PAT needed.

### 2. `gh-image` extension (programmatic, browser-cookie auth)

A third-party `gh` CLI extension (not made by GitHub) that uploads images from the command line and prints a markdown image reference you can embed in an issue body or comment.

Install and use:

```bash path=null start=null
gh extension install drogers0/gh-image
gh image screenshot.png --repo zazzcode/<repo>
# => ![screenshot.png](https://github.com/user-attachments/assets/<uuid>)
```

Then embed the output in the issue body or a comment:

```bash path=null start=null
gh issue create --repo zazzcode/<repo> \
  --title "Bug" \
  --body "Repro:

$(gh image screenshot.png --repo zazzcode/<repo>)

Happens consistently."
```

How it works: reads your browser's `user_session` cookie from the local encrypted cookie store, replicates the web UI's internal upload flow, and prints a `https://github.com/user-attachments/assets/...` URL — the same format drag-and-drop produces, so images inherit repo visibility (private-repo images stay private).

**Limitations to know before testing/adopting it:**

- Relies on an **undocumented** GitHub internal endpoint that could change or break without notice.
- The upload token is only issued to users with **write access** to the target repo.
- `user_session` cookies grant **full account access** if leaked — treat the cookie store with the same care as a password. The tool reads it locally and does not transmit it elsewhere, but any process that can read the cookie store has that power.
- On macOS, a **Keychain prompt** may appear on first use to authorize decryption of the browser's cookie encryption key.
- Filenames with spaces (e.g. `Screenshot 2026-07-02 at 11.25.07 AM.png`) must be **quoted**.
- Source: [drogers0/gh-image](https://github.com/drogers0/gh-image) (MIT, Go).

### 3. Contents API on a branch (pure public API, no browser/cookie)

Push the image to a branch in the repo via the GitHub Contents API, then embed a `raw` URL. Works with a PAT, no browser session.

```bash path=null start=null
BASE64=$(base64 -i /path/to/image.png)
gh api repos/zazzcode/<repo>/contents/docs/images/<image>.png \
  -X PUT \
  -f message="Add issue screenshot" \
  -f content="$BASE64" \
  -f branch="<branch>" \
  --jq '.content.path'
```

Then embed:

```markdown path=null start=null
![Description](https://github.com/zazzcode/<repo>/raw/<branch>/docs/images/<image>.png)
```

**Important:** use `https://github.com/{owner}/{repo}/raw/{branch}/{path}`, **not** `raw.githubusercontent.com` — the latter returns 404 on private repos because GitHub's CDN does not pass auth headers through.

**Limitations:** creates commits in the repo (history bloat); viewers must be authenticated to see the image; images will not render in email notifications; base64 payloads have practical size limits.

### Bottom line

For manual attachment, use the **web UI drag-and-drop**. For programmatic attachment, prefer **`gh-image`** if you are comfortable with the browser-cookie auth model, or the **Contents-API branch** fallback if you want a pure-PAT path. There is no first-party `gh`/API way to produce `user-attachments` URLs as of mid-2026.

## First-iteration status

This is a first iteration: real and functional against `gh`, validated by a small eval (3 issues created on `zazzcode/zazz-board`, all attributed to `zazzcode`, correct labels, structured bodies, no invented labels). The eval surfaced a few gaps that have been folded back into the skill (temp-vs-persistent body cleanup, "reported symptom contradicts the code" guidance, loading via `read_files`, GitHub-Issues-as-active-tracker-when-Zazz-Board-down wording). The read-for-fixing direction is documented but not yet eval-tested. Tell the agent what went well or wrong after using it and the skill can be improved further.
