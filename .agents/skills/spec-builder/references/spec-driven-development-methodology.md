# Deliverable Specification Methodology Reference

This reference is the portable spec-builder summary of the Zazz methodology. Repo-local methodology documents and
`AGENTS.md` remain the source of truth when they declare stricter project rules.

## Core Mapping

The stable rule is:

```text
one deliverable = one deliverable specification
```

The flexible rule is where deliverables live during implementation and review:

```text
a worktree / branch / PR may contain one deliverable, multiple deliverables, or a
single-lane stack of branches
```

A worktree usually has one active deliverable. The supported exception is a stacked branch lane: one worktree can hold
multiple dependent deliverables or review branches when those branches are intentionally stacked with `gh-stack`.

For features and deliverables, decomposition is part of specification approval. The
specification defines whether the work is one PR, one milestone PR, sibling PRs, a
bounded stacked review lane, or a large exception before implementation starts. PR-time
review verifies conformance to that approved shape; it does not invent a new split or
stack after coding is already underway.

## Document Locations

When specifications are committed to Git, store them under:

```text
<DOCS_ROOT>/specifications/
```

Because the directory already names the artifact type, specification filenames do not need to end in `SPEC`.

Specifications may also live in Zazz Board or another declared external tracker when the repo policy says they are not
committed. In that case, the implementation prompt and PR body should identify the stable external record.

Related long-lived methodology documents use these directories:

- `<DOCS_ROOT>/features/` for feature requirements documents.
- `<DOCS_ROOT>/architecture/` for architecture documents.
- `<DOCS_ROOT>/standards/` for standards.

Architecture documents can be project-level, such as `<DOCS_ROOT>/architecture/project-architecture.md`, or
feature-level, such as `<DOCS_ROOT>/architecture/{feature-key}-architecture.md`.

## What A Specification Does

A deliverable specification is the executable contract for one deliverable. It captures:

- capability and scope
- approved review shape and decomposition rationale
- required reading
- invariants
- decisions and rationale
- acceptance criteria
- test strategy
- execution sequence
- halt conditions
- definition of done
- implementation prompt
- implementation and review change log
- execution tracking system and lead/subagent coordination model

The specification should distinguish hard constraints from adaptive guidance. It should constrain outcomes, contracts,
and boundaries without over-prescribing every internal implementation move.

After greenlight, accepted steering or review feedback updates the affected
specification sections in place. The final Implementation And Review Change Log records
timestamp, source, changed sections, rationale, summary, and verification impact. The
change log is an audit trail, not a second source of current requirements.

## Run Logs

Use a run log when the effort needs append-only execution history: open-question answers, phase progress, deviations,
manual evidence, recovery notes, or verifier output.

The run log is not inherently a committed Git document. Store it according to the repo's declared policy: ignored local
file, committed support artifact, Zazz Board note, external tracker entry, or a combination.
Repos that do not use Zazz Board may use `<DOCS_ROOT>/ephemeral/` as the exclusive execution-record surface.
When Zazz Board is the declared surface, it acts as the centralized execution record for run logs, handoff notes, QA
findings, and related information that multiple agents need across worktrees and sessions.
When Jira or another tracker is declared, the specification should name the stable issue,
task, or tracker reference and tell the implementation prompt which companion skill or
repo guidance to use.

## Review Topologies

Use the simplest topology that matches the intended review artifact:

- Single-deliverable branch: one deliverable, one specification, one branch/PR.
- Milestone branch: multiple ordered deliverables and specifications in one worktree and branch, reviewed as one PR.
- Sibling branches: multiple independently reviewable branches/PRs.
- Stacked review lane: multiple dependent branches inside one worktree managed by `gh-stack`.

Do not force one worktree per deliverable as a universal rule. Do keep one deliverable per specification.
Do choose and record the review shape in the specification before implementation starts.
If implementation reveals the shape is wrong, stop for Owner sign-off, update the
affected specification sections in place, and record the change in the Implementation
And Review Change Log before continuing.

## Stacked Branches

`gh-stack` is the methodology's stack tool. Use stacked branches when dependent PRs make the work easier to review or
sequence than one combined branch. Each PR in the stack still requires human sign-off.

Stacked branches are useful when:

- a lower-layer contract should be reviewed before upper-layer behavior
- one logical change has meaningful internal review boundaries
- related deliverables are easier to comprehend as dependent PRs

Avoid stacking when sibling PRs or one milestone PR would be clearer.

Stacking is a specification-time choice. Do not retrofit an oversized implementation
into a stack during cleanup unless the specification is revised and approved first.

Do not enforce universal file-count, line-count, or branch-count caps. Instead, optimize for human reviewability:
focused purpose, clear dependency, concrete acceptance criteria, and a PR body that explains what to review.

## Human Review

Agents may commit and push feature branches when instructed, but they must not merge directly into the integration
branch. Integration happens through human PR review.

A strong flow is:

1. Open a draft PR.
2. Run author-side automated agent review and address feedback.
3. Mark the PR ready for formal review.
4. Run or receive formal automated agent review as part of the ready PR process.
5. Require human sign-off before merge.

For stacked branches, this applies to every PR in the stack.

## Change Rule

If implementation, QA, UAT, or PR review changes the contract or the approved review
shape, update the affected specification sections with Owner sign-off and record the
change in the Implementation And Review Change Log. Do not hide contract changes only in
commits, PR comments, or run-log entries.
