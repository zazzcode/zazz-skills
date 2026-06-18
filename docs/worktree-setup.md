# Zazz Worktree Setup

This document defines the required worktree structure for repos using the Zazz methodology.

The methodology is opinionated here on purpose. A consistent worktree model reduces ambiguity, keeps agent work isolated, and gives teams a clean recovery path when a deliverable or document branch goes in the wrong direction.

Worktrees are required by the methodology. This document describes the methodology's opinionated worktree operating model.

Background references:

- [Git worktree documentation](https://git-scm.com/docs/git-worktree)
- [Worktrunk CLI](https://worktrunk.dev/worktrunk/)

`git worktree` is the underlying Git feature. Worktrunk is an encouraged convenience CLI that makes worktree workflows easier, especially when builders and AI agents are working in parallel.

Supporting docs in this repo:

- [wt-cheat-sheet.md](wt-cheat-sheet.md)

## Required Model

Use a bare-repo container with sibling worktrees.

Expected high-level shape:

```text
repo-container/
├── .bare/
├── dev/
├── feature-or-deliverable-branch-a/
├── feature-or-deliverable-branch-b/
└── docs-or-proposal-branch/
```

Required conventions:

- the container directory is not itself the active development checkout
- `.bare/` is the shared Git directory
- each active worktree is a sibling directory under the container
- one active deliverable or document effort maps to one worktree in the normal case
- one branch maps to one worktree in the normal case; stacked branch lanes are the deliberate exception
- do not use `/` in branch names
- use flat branch names so the branch name can map directly to a sibling worktree directory
- merges happen through PRs, not by locally merging feature branches into the integration worktree

For deliverable execution, the default rule is one active deliverable equals one worktree. If multiple agents work tasks from the same deliverable, they still coordinate inside that single deliverable worktree rather than creating separate worktrees for the same deliverable.

A single worktree may host a deliberate stacked branch lane when related review branches need to share one filesystem, dependency install, scratch space, and build cache. In that case, the worktree has one checked-out branch at a time, and the stack tool moves the same working directory through the ordered branch stack.

If the team wants multiple versions or competing implementations, model them as separate deliverables. Each alternative gets its own worktree unless the team is explicitly stacking dependent deliverables for review sequencing.

## Why This Pattern

This pattern gives the methodology three important properties:

- isolation: each active effort has its own checkout and branch
- recoverability: a failed line of work can be abandoned cleanly
- consistency: builders and AI agents can use the same branch/worktree mental model

It also pairs well with the methodology's document model:

- durable docs stay in Git
- execution artifacts can stay local, be committed intentionally, or be mirrored/tracked in an external system such as Zazz Board
- worktrees keep those transient artifacts scoped to one effort at a time

## Integration Worktree

Keep one integration worktree for the repo's declared integration branch, such as `main/` or `dev/`.

Its role is:

- represent the integration target branch
- stay clean and reviewable
- receive changes through PR merge

Do not use the integration worktree as the normal place for day-to-day feature implementation.

## New Setup Paths

### Option A: Convert an existing clone

If you already have a normal clone and want to convert it into the bare + sibling-worktree layout:

1. Make sure your current checkout is clean or intentionally stashed/committed.
2. Rename `.git` to `.bare`.
3. Mark `.bare` as a bare repository.
4. Create the integration worktree from the repo's declared integration branch.

Example:

```bash
cd <repo-container>
git status

mv .git .bare
git --git-dir=.bare config --bool core.bare true

git --git-dir=.bare worktree add <integration-branch> -b <integration-branch> origin/<integration-branch>
# or, if that branch does not exist yet:
git --git-dir=.bare worktree add <integration-branch> -b <integration-branch> origin/main
```

### Option B: Fresh setup

If you are starting from scratch:

```bash
mkdir -p <repo-container>
cd <repo-container>
git clone --bare <repo-url> .bare
git --git-dir=.bare worktree add <integration-branch> -b <integration-branch> origin/<integration-branch>
# or, if that branch does not exist yet:
git --git-dir=.bare worktree add <integration-branch> -b <integration-branch> origin/main
```

## Verification Checklist

After setup, verify:

- `.bare/` exists and is the shared Git directory
- the integration worktree exists
- `git --git-dir=.bare rev-parse --is-bare-repository` returns `true`
- `git --git-dir=.bare worktree list` shows the expected worktrees
- the integration worktree is on the expected base branch

Useful commands:

```bash
git --git-dir=.bare rev-parse --is-bare-repository
git --git-dir=.bare worktree list
cd <integration-branch> && git branch -vv
```

## Branch Naming Rules

Because the methodology expects sibling worktree directories, branch names should also be worktree-safe directory names.

Recommended guidance:

- do not use `/` in branch names
- use flat branch names with hyphens
- prefer names that describe the feature, deliverable, or document effort
- keep the branch name and worktree directory the same whenever practical

If the repo adopts the recommended sibling-worktree model:

- `feature/rbac` is wrong for Zazz worktrees
- `docs/reorg-mw1` is wrong for Zazz worktrees
- `feature-rbac` and `docs-reorg-mw1` are correct

Preferred examples:

- `feature-rbac`
- `deliverable-zazz-142-role-management-ui`
- `proposal-role-management-options`
- `docs-reorg-mw1`

Avoid:

- `feature/rbac`
- `docs/reorg-mw1`
- `deliverable/ZAZZ-142-role-management-ui`

Git allows `/` in branch names, but that creates awkward nested directory paths if the same string is used for a sibling worktree directory. Zazz avoids that mismatch by standardizing on flat branch names when using sibling worktrees.

## Creating Feature, Deliverable, or Proposal Worktrees

From the repo container:

```bash
git --git-dir=.bare fetch origin
git --git-dir=.bare worktree add feature-rbac -b feature-rbac origin/<integration-branch>
git --git-dir=.bare worktree add proposal-role-management-options -b proposal-role-management-options origin/<integration-branch>
```

From inside the integration worktree:

```bash
git pull origin <integration-branch>
git worktree add ../feature-rbac -b feature-rbac
git worktree add ../proposal-role-management-options -b proposal-role-management-options
```

## Deliverables Directory Policy

Within each worktree:

- the repo's `AGENTS.md` should declare the docs root, commonly `docs/` or `.zazz/`
- when the repo keeps deliverable specification files on disk, they belong under `<DOCS_ROOT>/specifications/`
- local ignored specification files are a valid first-class methodology mode, not a workaround
- some repos intentionally commit specification files for a Git-native audit trail
- some repos also mirror, track, or store execution artifacts in an external system such as Zazz Board
- worktree-local excludes are preferred over committed `.gitignore` rules when the team wants deliverable execution artifacts to stay local

Typical mechanisms:

- `.git/info/exclude`
- `.bare/worktrees/<worktree-name>/info/exclude`
- another worktree-local exclude approach in the shared bare/worktree setup

Canonical example exclusion:

| Path | Reason |
| ---- | ------ |
| `<DOCS_ROOT>/specifications/` | Local deliverable specification files should not pollute shared Git history when the repo uses ignored local specifications |

Why `info/exclude` instead of `.gitignore`:

- `.gitignore` is committed and affects every clone
- `info/exclude` is local to the checkout/worktree
- this preserves the option to keep execution artifacts local by default while still allowing explicit exceptions

## Daily Operations

### List worktrees

```bash
git --git-dir=.bare worktree list
git --git-dir=.bare worktree list --verbose
```

### Keep a branch current

```bash
cd <repo-container>/feature-rbac
git fetch origin
git rebase origin/<integration-branch>
```

### Commit and push

```bash
cd <repo-container>/feature-rbac
git add .
git commit -m "type: description"
git push origin feature-rbac
```

### Remove a worktree

```bash
cd <repo-container>
git --git-dir=.bare worktree remove feature-rbac
git --git-dir=.bare worktree remove --force feature-rbac
git --git-dir=.bare worktree prune
```

## Worktrunk Usage

Worktrunk is recommended when the environment has it installed.

Common patterns from the repo container:

```bash
wt -C .bare list
wt -C .bare switch --create feature-rbac
wt -C .bare switch proposal-role-management-options
wt -C .bare switch pr:123
wt -C .bare remove feature-rbac
wt -C .bare step commit
wt -C .bare step push origin/feature-rbac
wt -C .bare step rebase dev
```

Common pattern from inside a worktree:

```bash
wt -C ../.bare list
wt -C ../.bare switch pr:123
wt -C ../.bare remove feature-rbac
```

If the team uses Worktrunk, prefer its wrappers for:

- creating worktrees
- switching between active efforts
- checking out PRs
- routine commit/push/rebase flows

Use plain `git worktree` when:

- Worktrunk is unavailable
- the repo explicitly prefers native Git commands
- debugging a lower-level worktree issue

## Review and PR Flow

When pushing a branch for review:

- target the repo's declared integration branch
- avoid merging feature branches locally into the integration worktree
- prefer PR review as the integration path

If the repo has a fixed integration branch such as `dev`, keep that policy explicit in `AGENTS.md` or repo docs.

## Recovery Model

One of the reasons the methodology requires worktrees is recovery.

If a session of work:

- goes down the wrong path
- fails owner review
- reveals that the proposal, feature requirements document, or deliverable specification is wrong

then the worktree can be abandoned and the team can return to the governing documents, revise the contract, and start a new worktree for the corrected approach.

Useful commands:

```bash
git --git-dir=.bare worktree remove my-failed-branch
git --git-dir=.bare worktree remove --force my-failed-branch
git --git-dir=.bare worktree prune
```

## Operational Rules

1. Do implementation work only inside feature, deliverable, proposal, or docs worktrees.
2. Keep the integration worktree clean.
3. Open PRs from non-integration worktrees into the integration branch.
4. Do not let agents merge PRs.
5. Require a human reviewer to approve and merge.

## Relationship to the Methodology

This document is the operational companion to [../zazz-methodology.md](../zazz-methodology.md).

The methodology defines:

- why worktrees are required
- where human gates remain
- how worktrees support isolation and recovery

This document defines:

- the required bare-repo + sibling-worktree layout
- setup and conversion paths
- worktree-local exclusion guidance
- daily operations with `git worktree`
- the encouraged Worktrunk command model
