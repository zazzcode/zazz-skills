# Spec Builder Skill — User Guide

How to use the **spec-builder** skill to write deliverable specifications.

## What it does

Helps you draft a deliverable specification for a bounded deliverable: a feature slice,
bug fix, refactor, milestone slice, or other implementation unit.

The stable rule is:

```text
one deliverable = one deliverable specification
```

The flexible rule is delivery topology:

```text
a worktree / branch / PR may contain one deliverable, multiple deliverables, or a
single-lane stack of branches
```

The skill conducts an interactive dialogue, captures decisions and acceptance criteria,
and produces a self-contained specification. The specification includes the execution sequence,
definition of done, halt conditions, run-log protocol, and paste-ready implementation
prompt. There is no separate plan document.

The skill writes deliverable specifications. It does **not** implement product code.

## Team integration rule

This is a team repository. Agents may commit to their feature branch and push their
feature branch when the specification says to, but they must never merge directly to `dev`.

All integration to `dev` happens through human PR review. Specifications should use wording like
"submit a PR to `dev`", "after the PR lands", or "after the lower PR lands" rather than
instructing an agent to merge.

## When to use it

- You have a bounded deliverable and want to capture scope, decisions, and ACs before
  implementation.
- You are defining a milestone branch with multiple ordered deliverables/specifications that
  will be reviewed as one PR.
- You are defining sibling deliverables that will be reviewed as separate PRs.
- You are defining a stacked review lane where branches are stacked inside one lane
  worktree using `gh-stack`.
- You are updating an existing specification after Owner-approved scope or contract changes.

## Delivery topologies

The skill should help choose the simplest topology that matches the intended review
artifact.

- **Single-deliverable branch** — one deliverable, one specification, one branch/PR.
- **Milestone branch** — multiple deliverables/specifications in one worktree and branch, one
  shared run log, one PR. Use when the milestone is reviewed as a whole.
- **Sibling branches** — multiple independently reviewable branches/PRs for one
  milestone. Use when deliverables do not depend on each other strongly enough to need
  a stack.
- **Stacked review lane** — stacked branches inside one lane worktree using
  `gh-stack`. Use only when separate review/merge boundaries or lower-layer/upper-layer
  dependency justify stack overhead.

Do not create stacked worktrees. Stacks are branches inside one worktree.

## How to invoke

Invoke the skill by name, for example `/spec-builder` or `@.agents/skills/spec-builder/SKILL.md`. Then
describe the deliverable or milestone.

## What to tell the skill at invocation

State these up front when you know them:

- **Delivery topology** — single-deliverable branch, milestone branch, sibling
  branches, or stacked review lane.
- **Deliverable slug** — kebab-case identifier used in specification filenames.
- **Milestone / effort slug** — when multiple specifications share one run log or PR.
- **Review artifact** — one PR for the whole milestone, separate sibling PRs, or
  stacked PRs.

The skill will ask follow-ups on scope boundaries, decisions, acceptance criteria,
run-log shape, and review boundaries.

You do not need to arrive with every answer. If topology, deliverable boundaries,
reference data, acceptance criteria, or test evidence are unclear, the skill should
interview you in small batches and propose defaults for confirmation. It should not
produce a final specification that leaves an implementation agent guessing about what proves the
deliverable is done.

## Output paths

- **Committed specification**:
  `<DOCS_ROOT>/specifications/<slug>.md`
- **Milestone branch specifications**:
  `<DOCS_ROOT>/specifications/<milestone>-spec-<n>-<slug>.md` or another
  Owner-approved consistent naming pattern under `specifications/`.
- **Run log**:
  repo-declared storage: ignored local file, committed support artifact, Zazz Board note,
  external tracker entry, or a combination.
- **Externally stored specification**:
  Zazz Board or the repo-declared tracking system, with a stable identifier linked from
  the PR and implementation prompt.

## What you should have ready

- A rough sketch of the deliverable or milestone and why it is needed.
- The intended review shape: one PR, sibling PRs, or stacked PRs.
- Any constraints that already exist: legacy compatibility, performance targets,
  coordination with other work in flight.
- Known source documents: feature docs, architecture docs, standards, prior specifications.

## After approval

Implementation starts from the specification itself and the run log. A fresh implementing agent
reads the specification, resolves open questions, maintains the run log, executes the phases,
and dispatches a verifier when the definition of done is complete.

Material contract changes during implementation require Owner sign-off and specification
revision; progress and evidence go in the run log.
