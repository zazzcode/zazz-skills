# Spec Builder Skill — User Guide

How to use the **spec-builder** skill in the qb-mono-wt repo to write deliverable
specifications (SPECs).

## What it does

Helps you draft a SPEC for a bounded deliverable: a feature slice, bug fix, refactor,
report migration slice, milestone slice, or other implementation unit.

The stable rule is:

```text
one deliverable = one SPEC
```

The flexible rule is delivery topology:

```text
a worktree / branch / PR may contain one deliverable, multiple deliverables, or a
single-lane stack of branches
```

The skill conducts an interactive dialogue, captures decisions and acceptance criteria,
and produces a self-contained SPEC. The SPEC includes the execution sequence,
definition of done, halt conditions, run-log protocol, and a paste-ready implementation
prompt. There is no separate PLAN document.

**The paste-ready implementation prompt is the key output.** When implementation begins,
a fresh agent reads the SPEC (or the prompt section directly) and executes from it
without any additional human briefing. The SPEC must be complete enough that the agent
can start immediately and the run log is the only state it needs to maintain.

The skill writes SPECs. It does **not** implement product code.

## Team integration rule

This is a team repository. Agents may commit to their feature branch and push their
feature branch when the SPEC says to, but they must never merge directly to `dev`.

All integration to `dev` happens through human PR review. SPECs should use wording like
"submit a PR to `dev`", "after the PR lands", or "after the lower PR lands" rather than
instructing an agent to merge.

## When to use it

- You have a bounded deliverable and want to capture scope, decisions, and ACs before
  implementation.
- You are defining a milestone branch with multiple ordered deliverables/SPECs that
  will be reviewed as one PR.
- You are defining sibling deliverables that will be reviewed as separate PRs.
- You are defining a stacked review lane where branches are stacked inside one lane
  worktree using `gh-stack`.
- You are updating an existing SPEC after Owner-approved scope or contract changes.

## Delivery topologies

The skill should help choose the simplest topology that matches the intended review
artifact.

- **Single-deliverable branch** — one deliverable, one SPEC, one branch/PR.
- **Milestone branch** — multiple deliverables/SPECs in one worktree and branch, one
  shared run log, one PR. Use when the milestone is reviewed as a whole.
- **Sibling branches** — multiple independently reviewable branches/PRs for one
  milestone. Use when deliverables do not depend on each other strongly enough to need
  a stack.
- **Stacked review lane** — stacked branches inside one lane worktree using
  `gh-stack`. Use only when separate review/merge boundaries or lower-layer/upper-layer
  dependency justify stack overhead.

Do not create stacked worktrees. Stacks are branches inside one worktree.

## How to invoke

In Claude Code: `/spec-builder` or `@.claude/skills/spec-builder/SKILL.md`. Then
describe the deliverable or milestone.

## What to tell the skill at invocation

State these up front when you know them:

- **Delivery topology** — single-deliverable branch, milestone branch, sibling
  branches, or stacked review lane.
- **Deliverable slug** — kebab-case identifier used in SPEC filenames.
- **Milestone / effort slug** — when multiple SPECs share one run log or PR.
- **Review artifact** — one PR for the whole milestone, separate sibling PRs, or
  stacked PRs.

The skill will ask follow-ups on scope boundaries, decisions, acceptance criteria,
run-log shape, and review boundaries.

You do not need to arrive with every answer. If topology, deliverable boundaries,
reference data, acceptance criteria, or test evidence are unclear, the skill should
interview you in small batches and propose defaults for confirmation. It should not
produce a final SPEC that leaves an implementation agent guessing about what proves the
deliverable is done.

## Output paths

- **Regular / non-stacked SPEC**:
  `<worktree>/docs/implementation/<slug>-SPEC.md`
- **Milestone branch SPECs**:
  `<worktree>/docs/implementation/<milestone>-spec-<n>-<slug>.md` or another
  Owner-approved consistent naming pattern.
- **Run log**:
  `<worktree>/docs/implementation/<effort-slug>-RUN-LOG.md`
- **Stacked SPEC**:
  `<container-root>/<slug>-stacked-SPEC.md`
  (container root, shared across stacked branches in the lane).

## What you should have ready

- A rough sketch of the deliverable or milestone and why it is needed.
- The intended review shape: one PR, sibling PRs, or stacked PRs.
- Any constraints that already exist: legacy compatibility, performance targets,
  coordination with other work in flight.
- Known source documents: feature docs, architecture docs, standards, prior SPECs.

## After approval

Implementation starts from the SPEC itself and the run log. A fresh implementing agent
reads the SPEC, resolves open questions, maintains the run log, executes the phases,
and dispatches a verifier when the definition of done is complete.

Material contract changes during implementation require Owner sign-off and SPEC
revision; progress and evidence go in the run log.
