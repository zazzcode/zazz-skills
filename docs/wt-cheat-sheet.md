# Worktree and Worktrunk Cheat Sheet

Fast reference for working in a Zazz bare-repo plus sibling-worktree layout.

Replace `<repo-container>` with your actual container directory path and `<integration-branch>` with your repo's integration branch (commonly `dev` or `main`).

## Layout

```text
<repo-container>/
├── .bare/
├── <integration-branch>/
├── my-feature/
└── <other-worktrees>/
```

## The Main Idea

- `.bare` is the shared Git repo backend.
- `<integration-branch>` is the integration worktree.
- each feature branch or PR gets its own sibling worktree directory.
- do not edit the checked-in `.gitignore` for machine-local files.
- use `.bare/info/exclude` for local-only ignore rules.

## Where To Run Worktrunk

From the repo container:

```bash
cd <repo-container>
wt -C .bare <command>
```

From inside a worktree:

```bash
wt -C ../.bare <command>
```

## Everyday Commands

List worktrees:

```bash
wt -C .bare list
```

Switch to the integration worktree:

```bash
wt -C .bare switch <integration-branch>
```

Switch back to the default/integration worktree:

```bash
wt -C .bare switch ^
```

Switch to an existing branch worktree:

```bash
wt -C .bare switch my-feature
```

Create a new branch and worktree from `<integration-branch>`:

```bash
wt -C .bare switch --create my-new-branch --base <integration-branch>
```

Remove a finished worktree:

```bash
wt -C .bare remove my-new-branch
```

Force-remove a worktree with local junk left in it:

```bash
wt -C .bare remove my-new-branch -D
```

## Keep the Integration Branch Current

Update the integration worktree from remote:

```bash
git -C <repo-container>/<integration-branch> pull origin <integration-branch>
```

Then create new worktrees from the updated integration branch:

```bash
wt -C <repo-container>/.bare switch --create another-branch --base <integration-branch>
```

Use this flow before starting a new branch if you want the new worktree based on the latest remote state.

## Review A PR

Create or switch to a PR review worktree:

```bash
wt -C .bare switch pr:123
```

That tells Worktrunk to fetch the PR branch and open it as its own worktree.

If the PR worktree is created through `wt`, the local copy hook can populate ignored local files there too.

When review is done:

```bash
wt -C .bare remove <pr-branch-name>
```

If you are not sure what branch name Worktrunk used, run:

```bash
wt -C .bare list
```

## Create A New Feature Worktree

From the repo container:

```bash
cd <repo-container>
wt -C .bare switch --create my-feature --base <integration-branch>
```

Then work inside the new sibling directory:

```bash
cd <repo-container>/my-feature
```

When ready to push:

```bash
git push -u origin my-feature
```

## Stacked Branches

> **Prefer `gh-stack` for stacks of 2–3 dependent layers** (e.g., a `-struct` branch and a `-svc` branch).
> It handles rebase, PR linking, and squash-merge recovery automatically, replacing the manual workflow below.
> See [Stacking with `gh-stack`](#stacking-with-gh-stack-inside-a-single-worktree) and the `gh-stack` skill.
> Use the manual workflow only when `gh-stack` is not installed or the stack has special constraints.

A stacked branch series is a chain where each branch's PR targets the prior branch instead of `<integration-branch>`. Example chain:

```text
<integration-branch> → feature-rpt-1 → feature-rpt-2 → feature-rpt-3
```

PR `-2` merges into `-1`, PR `-3` merges into `-2`, and so on. The topmost branch contains the cumulative content of the whole stack and is where end-to-end testing happens.

Create the next branch in a stack from the current one (not from `<integration-branch>`):

```bash
wt -C .bare switch --create feature-rpt-3 --base feature-rpt-2
```

### Verify the tip contains every parent's changes

After any parent in the stack is rebased and force-pushed, the topmost branch needs to be rebased onto the new parent. To prove the tip is current with every parent — even after rebases rewrite SHAs — use `git cherry`:

```bash
git cherry -v HEAD origin/feature-rpt-1
git cherry -v HEAD origin/feature-rpt-2
```

Empty output means every parent commit is present (by ancestry or by patch-equivalence). Any line starting with `+` is a real gap that needs investigation.

`git cherry` compares patch-ids (the hash of the diff), so it survives rebases. `git log <parent>..HEAD` only checks ancestry and gives false positives after a parent rebase.

One-liner to check every parent in a two-deep stack:

```bash
for branch in feature-rpt-1 feature-rpt-2; do
  out=$(git cherry HEAD origin/$branch)
  [ -z "$out" ] && echo "$branch: contained" || printf "%s: MISSING:\n%s\n" "$branch" "$out"
done
```

### Rebase onto a rewritten parent

When a parent in the stack gets rebased and force-pushed, fetch with explicit refspecs so the remote-tracking refs actually update (`git fetch origin` alone only updates `FETCH_HEAD`):

```bash
git fetch origin \
  '+refs/heads/feature-rpt-2:refs/remotes/origin/feature-rpt-2' \
  '+refs/heads/feature-rpt-3:refs/remotes/origin/feature-rpt-3'
```

Then rebase the current branch onto the new parent:

```bash
git rebase origin/feature-rpt-2
```

Patch-equivalent commits (changes already absorbed into the new parent) are skipped automatically. The branch's own unique commits are replayed on top.

### Force-push with a pinned lease

After a rebase, push with `--force-with-lease` pinned to the verified remote SHA. Plain `--force-with-lease` can fail with "stale info" if remote-tracking refs are not fresh, and falling back to plain `--force` discards that safety check.

```bash
git ls-remote origin refs/heads/feature-rpt-3
# copy the SHA, then:
git push --force-with-lease=feature-rpt-3:<expected-remote-sha> \
  origin feature-rpt-3
```

### Inspect divergence

When `git cherry` reports a `+` line and you want to see exactly how a commit differs across two branches, use `git range-diff`:

```bash
git range-diff origin/feature-rpt-2...HEAD
```

It aligns commits by patch-id and shows the deltas.

### Stacking with `gh-stack` inside a single worktree

For deliverables that split into 2–3 dependent layers, keep the entire stack in one worktree and use `gh-stack` to manage branches and PRs. This avoids the manual rebase workflow above and lets `gh-stack` handle rebase, PR linking, and squash-merge recovery automatically.

Create the worktree from `<integration-branch>` using the bottom branch name, then initialize the stack:

```bash
cd <repo-container>
wt -C .bare switch --create my-feature-struct --base <integration-branch>
cd <repo-container>/my-feature-struct
gh stack init --base <integration-branch> my-feature-struct my-feature-svc
```

All branches share the same working directory. Switch between them with `gh stack` navigation:

```bash
gh stack bottom          # bottom branch (closest to integration)
gh stack top             # top branch (furthest from integration)
gh stack up / down       # move one layer
```

Commit with standard `git add` and `git commit`. Stage deliberately so each branch contains only its layer's changes. Because branches share a working tree, commit or stash before switching to avoid conflicts.

Push and create linked draft PRs:

```bash
gh stack submit --auto --draft
```

Routine sync (fetch, rebase, push, sync PR state):

```bash
gh stack sync
```

After editing a lower layer, rebase everything above it:

```bash
gh stack bottom
# edit and commit
git add ...
git commit -m "..."
gh stack rebase --upstack
gh stack push
```

For full command reference and agent rules (non-interactive use, JSON output, conflict handling), see the `gh-stack` skill.

## `wt` vs `git worktree`

Use Worktrunk for this repo layout when you want the local setup to come across automatically:

```bash
wt -C .bare switch --create my-feature --base <integration-branch>
```

Avoid using plain `git worktree add` for normal day-to-day branch creation in this setup, because the local Worktrunk hook does not run there.

## Venv hygiene when creating worktrees

Worktrunk's `copy-ignored` hook copies machine-local files (`.env`, `.claude/settings.local.json`, etc.) into new worktrees. If `.venv/` is also copied, its shebangs will point at the source worktree and break imports.

### Automated venv hygiene via Worktrunk

Add a local Worktrunk project config at `<integration-worktree>/.config/wt.toml` (kept untracked via `.bare/info/exclude`) so every new worktree gets a fresh virtualenv automatically:

```toml
pre-start = "/opt/homebrew/bin/wt step copy-ignored"
post-start = [
  "rm -rf {{ worktree_path }}/backend/.venv",
  "cd {{ worktree_path }}/backend && uv sync --all-groups",
]

[step.copy-ignored]
exclude = ["backend/.venv/"]
```

Why this works:

- `pre-start` copies the local ignored files this repo expects in each worktree
- `post-start` deletes any copied `backend/.venv` and rebuilds it inside the new worktree
- excluding `backend/.venv/` from `copy-ignored` adds defense in depth
- the rebuilt `.venv/bin/pytest` shebang points at the new worktree instead of the source worktree

Operational note:

- if Worktrunk prompts for project hook approval, approve and remember it for this repo
- once approved, PR review worktrees created with `wt -C .bare switch pr:<number>` should not require any extra venv repair work
- if approval is missing, Worktrunk may create the worktree but stop before the venv rebuild finishes

Adapt the `post-start` commands to your repo's actual package manager and virtual environment tooling.

### Manual fallback (if hook is not yet configured)

```bash
cd <affected-worktree>/backend
head -1 .venv/bin/pytest
# If it points at a different worktree path, rebuild:
rm -rf .venv
uv sync --all-groups
```

## Local-Only Ignore Rules

Repo-wide local excludes:

```bash
<repo-container>/.bare/info/exclude
```

Per-worktree local excludes:

```bash
<repo-container>/.bare/worktrees/<worktree-name>/info/exclude
```

Check why something is ignored:

```bash
git check-ignore -v <path>
```

## Local Worktrunk Hook

Keep a local-only Worktrunk project config at:

```bash
<integration-worktree>/.config/wt.toml
```

Keep it untracked via `.bare/info/exclude`.

What it does:

- when a new worktree is created with Worktrunk, ignored local files are copied into it
- this includes files like `.env`, `backend/.env`, `frontend/.env.local`, `.claude/settings.local.json`, and ignored local skill files or folders
- this applies to `wt`-created worktrees, not plain `git worktree add`

If Worktrunk asks for approval for the hook, approve it for this repo and let it remember the commands.

## Good Habits

- keep the integration branch clean
- do feature work in sibling worktrees, not in the integration worktree
- use flat branch names like `my-feature`, not `feature/my-feature`
- use `.bare/info/exclude` for local-only notes, env files, and machine-specific config
- use `wt -C .bare list` often so you can see what worktrees already exist
