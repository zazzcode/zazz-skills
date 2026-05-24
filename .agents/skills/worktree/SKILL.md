---
name: worktree
description: Set up or manage worktrees for a Zazz-style repo; use when the user wants the opinionated bare-repo plus sibling-worktree pattern, needs help creating or repairing worktrees and flat branch names, or wants guidance on the Worktrunk workflow used with the Zazz methodology.
---

# Worktree Skill

## Prerequisites

This skill requires:

- `git` installed
- `worktrunk` installed

Methodology note:

- Worktrees are required by the Zazz methodology.
- Worktrunk is optional at the methodology level.
- This specific skill requires Worktrunk because it assumes the `wt` workflow for setup, switching, cleanup, and day-to-day management.

## Startup Sequence

Before doing any work:

1. Read `AGENTS.md` if it exists and use it as the source of truth for repo-specific worktree, branch, docs-root, and tracking rules.
2. Read the methodology guidance that applies to worktree setup and usage.
   - In the methodology source repo, that guidance is [zazz-methodology.md](../../../zazz-methodology.md) and [docs/worktree-setup.md](../../../docs/worktree-setup.md).
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
   - whether the repo is already using a bare-repo container with sibling worktrees
   - whether Worktrunk is installed
6. Prefer the repo's existing declared pattern when it already matches the methodology. Do not "upgrade" a repo into the opinionated layout unless the user wants that change.

## Purpose

This skill exists to solve two related problems:

1. How to establish a clean, opinionated bare-repo container with sibling worktrees.
2. How to operate that layout safely over time with a consistent Worktrunk workflow.

Its value is consistency, isolation, and recoverability. It helps teams keep one active deliverable or document effort per branch/worktree, avoid naming patterns that fight the filesystem layout, and preserve a clear rollback path when execution goes wrong.

It is also a convenience skill for humans. Most of the underlying work can be done directly by a human with the right commands; this skill exists to make that workflow easier for people who want the methodology behavior without having to remember or type every command themselves.

That includes simple human requests such as "I need to review PR 193" or "create a deliverable worktree for me" where the skill can translate the request into the right Worktrunk flow and explain the next command or action clearly.

## Methodology Alignment

- Worktrees are required by the methodology.
- The required model is a bare-repo container with sibling worktrees.
- Durable docs belong in Git; execution artifacts follow the repo's declared deliverables policy.
- One active deliverable or document effort must map to one branch and one worktree.
- Flat branch names are preferred because they map cleanly to sibling worktree directory names.
- Worktrunk is optional in the methodology, but required to use this skill.

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
- using the Worktrunk workflow correctly for day-to-day worktree management

### Mode C: Recovery / repair

Use this mode when Git worktree state is inconsistent or partially broken.

Examples:

- stale worktree records
- missing directories
- abandoned branches
- branch/worktree name mismatches

### Mode D: Guidance only

Use this mode when the user wants command examples, operating guidance, or methodology-aware recommendations without filesystem changes.

## What This Skill Produces

Depending on the task, this skill may produce:

- a working bare-repo + sibling-worktree layout
- new worktrees and branches following Zazz naming conventions
- repaired or pruned worktree state
- repo guidance for worktree usage in `AGENTS.md` or related docs when explicitly requested
- command examples for the Worktrunk workflow used by this skill

## Core Rules

1. Inspect before changing anything.
2. Prefer non-destructive commands.
3. Do not remove a worktree or branch unless the user clearly intends that cleanup.
4. Keep branch names flat when using sibling worktrees.
5. Keep the integration worktree clean; do not use it as the default place for feature implementation.
6. Use Worktrunk for routine worktree management through this skill.
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

### Worktrunk guidance

This skill assumes Worktrunk is installed and uses it for:

- creating worktrees
- switching between active efforts
- keeping worktree naming and lifecycle consistent

Representative commands:

```bash
wt -C .bare list
wt -C .bare switch --create feature-rbac
wt -C .bare switch proposal-role-management-options
wt -C .bare switch pr:193
wt -C .bare remove feature-rbac
```

Use plain `git worktree` references only as conceptual background or when debugging a lower-level Git issue outside this skill's normal workflow.

## Example Requests

Example human-to-skill requests:

```text
Use worktree.
Please set up this repo with the required bare-repo plus sibling-worktree layout.
```

```text
Use worktree.
Please create a new deliverable worktree from the integration branch using a flat, worktree-safe branch name.
```

```text
Use worktree.
Please inspect the current worktree state, explain what is broken, and repair it safely.
```

```text
Use worktree.
I don't want to remember the Worktrunk commands. Please tell me exactly what to run to create, switch, and remove worktrees in this repo.
```

```text
Use worktree.
I need to review PR 193.
Please create the review worktree and tell me what to run next.
```

## Safety Checks

Before creating or modifying worktrees, confirm:

- the intended base branch
- the intended branch name
- whether the target directory already exists
- whether the worktree is for a deliverable, proposal, feature, or document effort
- whether the repo has a declared integration branch such as `main` or `dev`

Before cleanup actions, confirm:

- whether unmerged or uncommitted work exists
- whether the branch is still needed
- whether the worktree record is stale or genuinely active

## Recovery Guidance

When a worktree effort goes wrong:

1. Stop forcing the bad path forward.
2. Return to the governing proposal, feature requirements document, or SPEC.
3. Decide whether to repair the same worktree or abandon it.
4. If abandoning, remove or archive the worktree intentionally and create a fresh sibling worktree for the corrected approach.

## Practical Worktrunk Note

In the workflow assumed by this skill, Worktrunk handles the worktree setup in a way that also carries over the ignored local files the program needs in order to run inside the new worktree. Treat that as part of the expected day-to-day developer ergonomics of the Worktrunk-based approach used here.

## When To Escalate

Escalate to the user when:

- the repo's existing layout conflicts with the preferred Zazz pattern
- cleanup would delete or orphan work
- the base branch is unclear
- the branch naming policy is inconsistent with existing team practice
- Worktrunk is not installed but the user is trying to use this skill
