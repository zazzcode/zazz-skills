# Agent Execution Discipline

This document is the default Zazz operating guide for agents executing, verifying,
reviewing, or packaging work inside a repository. It is intentionally generic. Repo
`AGENTS.md` files should link here, then declare only repo-specific overrides such as
integration branch, command wrappers, tracking system, and execution-record location.

## First-Read Rule

At the start of a work session, agents should read:

1. repo `AGENTS.md`
2. the approved deliverable specification or assigned work item
3. the current run log or declared execution record when one is used
4. relevant standards and feature/architecture documents selected through indexes

Do not load every indexed document by default. Load additional docs only when their
scope applies to the current task.

## Worktree Discipline

Active execution happens in an isolated worktree.

Rules:

- treat the integration branch worktree as read-only except for sync
- do not use the integration worktree for feature work or scratch files
- create or switch to the active deliverable worktree before editing files
- confirm current path and branch before edits, tests, commits, or pushes
- use one active deliverable per worktree by default
- use one worktree lane for a GH-stack review lane when stacked branches are intentional
- do not create extra worktrees unless the user, repo policy, or worktree guide asks for it

## Scope Discipline

The active worktree contains the whole repo, but the task is scoped to the intended
branch diff and approved contract.

Before editing files, running broad linters, or applying auto-fixes, inspect the branch
scope:

```bash
git diff <integration-branch> --stat
```

Rules:

- if a file is outside the approved scope, do not modify it
- if a failing test touches an unmodified file, investigate whether the branch changed a shared dependency
- do not call failures "pre-existing" without evidence
- for stacked branches, scope fixes to the current stack slice
- do not auto-fix, format, or lint parent-slice files unless explicitly asked to change that lower branch

## Integration Branch Health

The methodology assumes the integration branch is the healthy baseline for new work
unless repo `AGENTS.md` documents a known exception.

Rules:

- treat test failures as caused by the active branch until proven otherwise
- if the repo has a known integration-branch failure or disabled check, `AGENTS.md` must document it
- do not dismiss a failure as unrelated because the failing file was not directly edited

## Concurrent Human Work

Developers may edit files while an agent is working. This is normal.

Rules:

- do not treat unexpected file changes as corruption or agent failure
- if a file changes unexpectedly, ask whether the developer changed it
- work with concurrent changes instead of overwriting them
- never revert changes you did not make unless explicitly asked

## Command Shape Discipline

Use stable command shapes so sessions are reproducible and approval friction stays low.

Rules:

- prefer the repo-declared command wrappers in `AGENTS.md`
- keep wrapper and argument order stable when rerunning related commands
- batch related read-only discovery commands when practical
- do not vary wrappers casually just because a command is technically equivalent
- use `rg` for search when available
- use `git status --short --branch` for quick repo-state checks

`AGENTS.md` should declare preferred command shapes for test, lint, format, database,
and environment-wrapped commands.

## Execution Records

Use the repo-declared execution-record surface.

Default local paths:

```text
<DOCS_ROOT>/execution/<slug>-run-log.md
<DOCS_ROOT>/execution/<milestone-or-lane-slug>-run-log.md
```

Allowed surfaces include:

- ignored local file under `<DOCS_ROOT>/execution/`
- committed support artifact when the repo intentionally tracks execution history
- Zazz Board note or attachment
- external tracker entry
- another repo-declared execution record

Run logs are append-only. Do not rewrite prior entries unless the user explicitly asks.

Record:

- open-question resolutions
- standards verification
- phase completions and verifying command results
- deviations from the specification and Owner decisions
- manual evidence locations
- QA findings and rework
- verifier sub-agent summaries
- handoff notes when another agent or session must continue

## Verification Discipline

Agents should favor verification over assumption.

Rules:

- verify repo state, file state, and command results directly when practical
- write or run tests mapped to acceptance criteria
- keep test coverage proportional to the risk and blast radius
- cite exact commands and outcomes in final evidence
- if a test cannot be run, explain why and identify residual risk
- dispatch independent verification when the specification or repo workflow requires it

## Halt Conditions

Stop and surface to the Owner when:

- an open question blocks implementation
- scope needs to change materially
- the same test fails repeatedly without a clear path forward
- a command failure suggests destructive recovery
- a needed file or service boundary is outside approved scope
- a standard applies but was not considered in the specification
- required reference data or external access is unavailable
- a merge, rebase, or conflict resolution is not clearly safe

## Database and Environment Safety

Treat shared state as sensitive.

Rules:

- never drop, recreate, truncate, or bulk-delete shared state as a troubleshooting shortcut
- never run destructive reset or rebuild commands because an error message is confusing
- prefer logs, configuration checks, connection checks, and read-only queries first
- if destructive action may be needed, stop and ask the user

## Documentation Discipline

When editing methodology, feature, architecture, proposal, standards, or execution docs:

- write for technical decision-making
- keep prose concise, direct, and specific
- prefer facts, decisions, status, risk, and verification over background narration
- avoid duplicating the same point in multiple sections
- edit documents in place; do not delete and recreate as a shortcut
- mark resolved items as `Implemented`, `Done`, `Rejected`, or `Deferred`
- remove obsolete recommendations or rewrite them as completed actions
- include links, file paths, commands, commit SHAs, and test results when they clarify the record

## PR and Merge Boundaries

Agents may prepare PRs, draft PR bodies, update verification evidence, and respond to
review feedback inside approved scope.

Agents must not:

- approve their own work
- merge PRs
- bypass required human review
- push directly to the integration branch unless repo policy explicitly allows it

Final approval and merge authority stays with an authorized human.

## Durable Knowledge Promotion

Execution records are not the final home for product knowledge. When a deliverable
changes the product or its engineering rules, promote the durable outcome into the
appropriate tracked surface:

- `project.md`
- feature requirements document
- architecture document
- standards document
- proposal or proposal pointer when the decision record changes
