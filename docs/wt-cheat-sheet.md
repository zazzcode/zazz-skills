# `repo-wt` Worktree and Worktrunk Cheat Sheet

Fast reference for working in:

- `~/work/repo-wt/.bare`
- `~/work/repo-wt/dev`
- sibling feature and PR worktrees under `~/work/repo-wt/`

## Layout

```text
repo-wt/
├── .bare/
├── dev/
├── feature-reporting-flow-1/
└── <other-worktrees>/
```

## The Main Idea

- `.bare` is the shared Git repo backend.
- `dev` is the integration worktree.
- each feature branch or PR gets its own sibling worktree directory.
- do not edit the checked-in `.gitignore` for machine-local files.
- use `.bare/info/exclude` for local-only ignore rules.

## Where To Run Worktrunk

From the repo container:

```bash
cd ~/work/repo-wt
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
wt -C .bare switch dev
```

Switch back to the default/integration worktree:

```bash
wt -C .bare switch ^
```

Switch to an existing branch worktree:

```bash
wt -C .bare switch feature-reporting-flow-1
```

Create a new branch and worktree from `dev`:

```bash
wt -C .bare switch --create my-new-branch --base dev
```

Remove a finished worktree:

```bash
wt -C .bare remove my-new-branch
```

Force-remove a worktree with local junk left in it:

```bash
wt -C .bare remove my-new-branch -D
```

## Keep `dev` Current

Update the integration worktree from GitHub:

```bash
git -C ~/work/repo-wt/dev pull origin dev
```

Then create new worktrees from updated `dev`:

```bash
wt -C ~/work/repo-wt/.bare switch --create another-branch --base dev
```

Use this flow before starting a new branch if you want the new worktree based on the latest `origin/dev`.

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
cd ~/work/repo-wt
wt -C .bare switch --create my-feature --base dev
```

Then work inside the new sibling directory:

```bash
cd ~/work/repo-wt/my-feature
```

When ready to push:

```bash
git push -u origin my-feature
```

## Stacked Branches

A stacked branch series is a chain where each branch's PR targets the prior branch instead of `dev`. Each branch lives in its own sibling worktree. Example chain:

```text
dev → feature-reporting-flow-1 → feature-reporting-flow-2 → feature-reporting-flow-3
```

PR `-2` merges into `-1`, PR `-3` merges into `-2`, and so on. The topmost branch contains the cumulative content of the whole stack and is where end-to-end testing happens.

Create the next branch in a stack from the current one (not from `dev`):

```bash
wt -C .bare switch --create feature-reporting-flow-3 --base feature-reporting-flow-2
```

### Verify the tip contains every parent's changes

After any parent in the stack is rebased and force-pushed, the topmost branch needs to be rebased onto the new parent. To prove the tip is current with every parent — even after rebases rewrite SHAs — use `git cherry`:

```bash
git cherry -v HEAD origin/feature-reporting-flow-1
git cherry -v HEAD origin/feature-reporting-flow-2
```

Empty output means every parent commit is present (by ancestry or by patch-equivalence). Any line starting with `+` is a real gap that needs investigation.

`git cherry` compares patch-ids (the hash of the diff), so it survives rebases. `git log <parent>..HEAD` only checks ancestry and gives false positives after a parent rebase.

One-liner to check every parent in a stack:

```bash
for p in 1 2; do
  out=$(git cherry HEAD origin/feature-reporting-flow-$p)
  [ -z "$out" ] && echo "-$p: contained" || printf -- "-%s: MISSING:\n%s\n" "$p" "$out"
done
```

### Rebase onto a rewritten parent

When a parent in the stack gets rebased and force-pushed, fetch with explicit refspecs so the remote-tracking refs actually update (`git fetch origin` alone only updates `FETCH_HEAD`):

```bash
git fetch origin \
  '+refs/heads/feature-reporting-flow-2:refs/remotes/origin/feature-reporting-flow-2' \
  '+refs/heads/feature-reporting-flow-3:refs/remotes/origin/feature-reporting-flow-3'
```

Then rebase the current branch onto the new parent:

```bash
git rebase origin/feature-reporting-flow-2
```

Patch-equivalent commits (changes already absorbed into the new parent) are skipped automatically. The branch's own unique commits are replayed on top.

### Force-push with a pinned lease

After a rebase, push with `--force-with-lease` pinned to the verified remote SHA. Plain `--force-with-lease` can fail with "stale info" if remote-tracking refs are not fresh, and falling back to plain `--force` discards that safety check.

```bash
git ls-remote origin refs/heads/feature-reporting-flow-3
# copy the SHA, then:
git push --force-with-lease=feature-reporting-flow-3:<expected-remote-sha> \
  origin feature-reporting-flow-3
```

### Inspect divergence

When `git cherry` reports a `+` line and you want to see exactly how a commit differs across two branches, use `git range-diff`:

```bash
git range-diff origin/feature-reporting-flow-2...HEAD
```

It aligns commits by patch-id and shows the deltas.

### Stacking with `gh-stack` inside a single worktree

For deliverables that split into 2–3 dependent layers (e.g., a `-struct` branch and a `-svc` branch), keep the entire stack in one worktree and use `gh-stack` to manage branches and PRs. This avoids the manual rebase workflow above and lets `gh-stack` handle rebase, PR linking, and squash-merge recovery automatically.

Create the worktree from `dev` using the bottom branch name, then initialize the stack:

```bash
cd ~/work/repo-wt
wt -C .bare switch --create feature-reporting-struct --base dev
cd ~/work/repo-wt/feature-reporting-struct
gh stack init --base dev feature-reporting-struct feature-reporting-svc
```

All branches share the same working directory. Switch between them with `gh stack` navigation:

```bash
gh stack bottom          # bottom branch (closest to dev)
gh stack top             # top branch (furthest from dev)
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

For full command reference and agent rules (non-interactive use, JSON output, conflict handling), see the `gh-stack` skill and `gh-stack reference guide`.

## `wt` vs `git worktree`

Use Worktrunk for this repo layout when you want the local setup to come across automatically:

```bash
wt -C .bare switch --create my-feature --base dev
```

Avoid using plain `git worktree add` for normal day-to-day branch creation in this setup, because the local Worktrunk hook does not run there.

## Venv hygiene when creating worktrees

Worktrunk's `copy-ignored` hook copies machine-local files (`.env`, `.agents/settings.local.json`, etc.) into new worktrees. If `.venv/` is also copied, its shebangs will point at the source worktree and break imports.

### Automated venv hygiene via Worktrunk

This repo's local Worktrunk project config
(`~/work/repo-wt/dev/.config/wt.toml`) is already set up so every new
worktree gets a fresh backend virtualenv automatically. Agents and developers
normally should not need to change this configuration.

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

### Manual fallback (if hook is not yet configured)

```bash
cd <affected-worktree>/backend
head -1 .venv/bin/pytest
# If it points at a different worktree path, rebuild:
rm -rf .venv
uv sync --all-groups
```

See `venv-stale-shebang-alert.md` and `stacked-worktrees-agent-guide.md` §"Running tests" for the full diagnosis.

---

## Local-Only Ignore Rules

Repo-wide local excludes:

```bash
~/work/repo-wt/.bare/info/exclude
```

Per-worktree local excludes:

```bash
~/work/repo-wt/.bare/worktrees/<worktree-name>/info/exclude
```

Check why something is ignored:

```bash
git check-ignore -v <path>
```

## Local Worktrunk Hook

This setup uses a local-only Worktrunk project config at:

```bash
~/work/repo-wt/dev/.config/wt.toml
```

It is kept untracked via `.bare/info/exclude`.

Current hooks:

```toml
pre-start = "/opt/homebrew/bin/wt step copy-ignored"
post-start = [
  "rm -rf {{ worktree_path }}/backend/.venv",
  "cd {{ worktree_path }}/backend && uv sync --all-groups",
]

[step.copy-ignored]
exclude = ["backend/.venv/"]
```

What it does:

- when a new worktree is created with Worktrunk, ignored local files are copied into it
- this includes files like `.env`, `backend/.env`, `frontend/.env.local`, `.agents/settings.local.json`, and ignored local skill files or folders
- this applies to `wt`-created worktrees, not plain `git worktree add`

If Worktrunk asks for approval for the hook, approve it for this repo and let it remember the commands.

## Good Habits

- keep `dev` clean
- do feature work in sibling worktrees, not in `dev`
- use flat branch names like `my-feature`, not `feature/my-feature`
- use `.bare/info/exclude` for local-only notes, env files, and machine-specific config
- use `wt -C .bare list` often so you can see what worktrees already exist
