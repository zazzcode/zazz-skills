---
name: worktree
description: Set up or manage Git worktrees for a Zazz-style repo; use when the user wants the opinionated bare-repo plus sibling-worktree pattern, needs help creating or repairing worktrees and flat branch names, or wants guidance on using git worktree and Worktrunk within the Zazz framework.
---

# Worktree Skill

## Prerequisites

This skill requires:

- `git` installed

Worktrunk is optional but recommended. This skill should fully support the framework's required worktree model with native `git worktree` commands, while using Worktrunk as a convenience layer when it is available.

## Startup Sequence

Before doing any work:

1. Read `AGENTS.md` if it exists and use it as the source of truth for repo-specific worktree, branch, docs-root, and tracking rules.
2. Read the framework guidance that applies to worktree setup and usage.
   - In the framework source repo, that guidance is [zazz-framework.md](../../../zazz-framework.md) and [docs/worktree-setup.md](../../../docs/worktree-setup.md).
   - In consuming repos, use the repo's declared docs root and any equivalent worktree guidance there.
3. Read the supporting Worktrunk docs selectively when they matter.
   - Read [docs/wt-cheat-sheet.md](../../../docs/wt-cheat-sheet.md) when the user needs day-to-day Worktrunk commands or quick command selection.
4. Determine whether the user wants:
   - a new opinionated worktree setup
   - management of an existing worktree layout
   - repair or cleanup of a broken worktree state
   - command guidance only
5. Inspect current Git reality before making recommendations or changes:
   - current branch
   - current worktree list
   - whether the repo is already using a bare container + sibling worktrees
   - whether Worktrunk is installed and intended for use
6. Prefer the repo's existing declared pattern when it already matches the framework. Do not "upgrade" a repo into the opinionated layout unless the user wants that change.

## Purpose

This skill exists to solve two related problems:

1. How to establish a clean, opinionated Zazz-style worktree layout.
2. How to operate that layout safely over time with `git worktree` and optional Worktrunk commands.

Its value is consistency, isolation, and recoverability. It helps teams keep one active deliverable or document effort per branch/worktree, avoid naming patterns that fight the filesystem layout, and preserve a clear rollback path when execution goes wrong.

## Framework Alignment

- Worktrees are required by the framework.
- The required model is a bare-repo container with sibling worktrees.
- Durable docs belong in Git; transient deliverable execution artifacts generally belong in Zazz Board.
- One active deliverable or document effort must map to one branch and one worktree.
- Flat branch names are preferred because they map cleanly to sibling worktree directory names.
- Worktrunk is encouraged when available, but plain `git worktree` remains the base capability.

## Interaction Modes

### Mode A: New setup

Use this mode when the repo is adopting the opinionated layout for the first time.

Expected outcomes:

- a bare Git directory such as `.bare/`
- one integration worktree such as `main/` or `dev/`
- sibling worktrees for deliverables, proposals, or document efforts
- a documented branch/worktree naming convention

### Mode B: Ongoing management

Use this mode when the layout already exists and the user needs help with:

- adding a worktree
- listing worktrees
- pruning stale entries
- removing abandoned worktrees
- checking current branch/worktree state
- choosing between `git worktree` and Worktrunk commands

### Mode C: Recovery / repair

Use this mode when Git worktree state is inconsistent or partially broken.

Examples:

- stale worktree records
- missing directories
- abandoned branches
- branch/worktree name mismatches

### Mode D: Guidance only

Use this mode when the user wants command examples, operating guidance, or framework-aware recommendations without filesystem changes.

## What This Skill Produces

Depending on the task, this skill may produce:

- a working bare-repo + sibling-worktree layout
- new worktrees and branches following Zazz naming conventions
- repaired or pruned worktree state
- repo guidance for worktree usage in `AGENTS.md` or related docs when explicitly requested
- command examples for `git worktree` and optional Worktrunk usage

## Core Rules

1. Inspect before changing anything.
2. Prefer non-destructive commands.
3. Do not remove a worktree or branch unless the user clearly intends that cleanup.
4. Keep branch names flat when using sibling worktrees.
5. Keep the integration worktree clean; do not use it as the default place for feature implementation.
6. When Worktrunk is available, prefer it for routine worktree management if it preserves the repo's conventions.
7. If the repo is already using a different but stable layout, explain the tradeoff before trying to reshape it.

## Required Layout

```text
repo-container/
├── .bare/
├── dev/
├── proposal-role-management-options/
├── feature-rbac/
└── deliverable-zazz-142-role-management-ui/
```

Conventions:

- `.bare/` is the shared Git directory
- the container directory is not itself the active checkout
- every active worktree is a sibling directory
- one active effort maps to one branch and one worktree

For deliverables, do not create multiple worktrees for one active deliverable. If several agents are working different tasks from the same deliverable, they coordinate inside that single deliverable worktree.

If the user wants multiple versions or competing implementations, treat them as separate deliverables. Each deliverable gets its own worktree.

## Branch Naming Guidance

Preferred examples:

- `feature-rbac`
- `proposal-role-management-options`
- `docs-reorg-mw1`
- `deliverable-zazz-142-role-management-ui`

Avoid when using sibling worktrees:

- `feature/rbac`
- `docs/reorg-mw1`
- `deliverable/ZAZZ-142-role-management-ui`

## Command Guidance

### Base Git commands

Typical creation flow:

```bash
git worktree add ../feature-rbac -b feature-rbac
git worktree add ../proposal-role-management-options -b proposal-role-management-options
git worktree list
git worktree prune
```

Bare-repo style example:

```bash
git --git-dir=.bare worktree add ../feature-rbac -b feature-rbac origin/<integration-branch>
git --git-dir=.bare worktree add ../docs-reorg-mw1 -b docs-reorg-mw1 origin/<integration-branch>
git --git-dir=.bare worktree list
```

### Worktrunk guidance

If Worktrunk is installed and the repo uses it, prefer its wrappers for:

- creating worktrees
- switching between active efforts
- keeping worktree naming and lifecycle consistent

Use plain `git worktree` when:

- Worktrunk is unavailable
- the repo explicitly prefers native Git commands
- debugging a lower-level Git worktree issue

## Safety Checks

Before creating or modifying worktrees, confirm:

- the intended base branch
- the intended branch name
- whether the target directory already exists
- whether the worktree is for a deliverable, proposal, feature, or docs effort
- whether the repo has a declared integration branch such as `main` or `dev`

Before cleanup actions, confirm:

- whether unmerged or uncommitted work exists
- whether the branch is still needed
- whether the worktree record is stale or genuinely active

## Recovery Guidance

When a worktree effort goes wrong:

1. Stop forcing the bad path forward.
2. Return to the governing proposal, feature requirements document, SPEC, or PLAN.
3. Decide whether to repair the same worktree or abandon it.
4. If abandoning, remove or archive the worktree intentionally and create a fresh sibling worktree for the corrected approach.

## When To Escalate

Escalate to the user when:

- the repo's existing layout conflicts with the preferred Zazz pattern
- cleanup would delete or orphan work
- the base branch is unclear
- the branch naming policy is inconsistent with existing team practice
- the user may need to choose between native Git and Worktrunk as the repo standard
