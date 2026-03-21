# Zazz Worktree Setup

This document defines the default worktree structure for repos using the Zazz framework.

The framework is opinionated here on purpose. A consistent worktree model reduces ambiguity, makes agent execution safer, and gives teams a clean recovery path when a deliverable or document branch goes in the wrong direction.

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
- one active deliverable or document effort maps to one worktree
- one branch maps to one worktree
- merges happen through PRs, not by locally merging feature branches into the integration worktree

## Integration Worktree

Keep one integration worktree such as `dev/` or `main/`.

Its role is:

- represent the integration target branch
- stay clean and reviewable
- receive changes through PR merge

Do not use the integration worktree as the normal place for day-to-day feature implementation.

## Feature and Deliverable Worktrees

Create a separate sibling worktree for each active feature, deliverable, proposal, or major documentation effort.

Examples:

- `implement-rbac-mvp/`
- `docs-reorg-mw1/`
- `feature-role-management-ui/`

Benefits:

- isolation for launch-and-leave agent execution
- lower risk of cross-deliverable contamination
- simpler branch-to-worktree mental model
- easy abandonment when a line of work proves incorrect

## Recovery Model

One of the reasons the framework requires worktrees is recovery.

If a session of work:

- goes down the wrong path
- fails owner review
- reveals that the proposal, FRD, SPEC, or PLAN is wrong

then the worktree can be abandoned and the team can return to the governing documents, revise the contract, and start a new worktree for the corrected approach.

This is preferable to forcing a flawed branch forward or contaminating the integration line with partially correct work.

## Deliverables Directory Policy

Within each worktree:

- `deliverables/` exists locally under the repo docs root
- deliverable SPEC/PLAN files are usually local execution artifacts
- local ignore configuration should keep transient deliverable files out of shared history unless the repo intentionally commits them

Typical mechanisms:

- `.git/info/exclude`
- another worktree-local exclude approach in the shared bare/worktree setup

## Operational Rules

- do implementation work only inside feature/deliverable worktrees
- keep the integration worktree clean
- open PRs from feature/deliverable worktrees into the integration branch
- do not let agents merge PRs
- require Deliverable Owner or another authorized human reviewer to approve and merge

## Relationship to the Framework

This document is the operational companion to [zazz-framework.md](/Users/michael/Dev/Zazz/zazz-skills/zazz-framework.md).

The framework defines:

- why worktrees are required
- where human gates remain
- how worktrees support isolation and recovery

This document defines:

- the default bare-repo + sibling-worktree layout
- the expected integration-worktree pattern
- the operational conventions for using that layout
