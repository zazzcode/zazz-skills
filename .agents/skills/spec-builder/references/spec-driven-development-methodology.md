# Spec-Driven Development Methodology

**Purpose:** Define the working philosophy for using specifications, worktrees, branches, run logs, and agent
implementation in this repository. This document is intentionally methodological rather than feature-specific. It
should inform the local `spec-builder` skill and broader Zazz Methodology thinking, but it is not itself an operating
skill.

---

## 1. Core Idea

Spec-driven development is a way to make agent work reviewable, recoverable, and bounded without reducing agents to
mechanical instruction followers.

The central mapping is:

```text
one deliverable = one SPEC
```

The flexible mapping is delivery topology:

```text
a worktree / branch / PR may contain one deliverable, multiple deliverables, or a stacked set of branches
```

The SPEC defines the contract for a deliverable: what must be true, what cannot change, what evidence proves the work,
and where the agent must stop for human input. The agent is still expected to use judgment inside that contract. It may
inspect the codebase, follow current patterns, improve internal implementation details, and adapt skeletons when local
evidence shows a better fit.

The goal is not to remove agent autonomy. The goal is to shape it.

---

## 2. Vocabulary

### Feature

A feature is the product or system capability being built over time. A feature can span multiple milestones, services,
worktrees, branches, and pull requests.

Example: Reporting.

### Milestone

A milestone is a coherent, independently testable and reviewable stage of a feature. It has a capability statement, a
completion target, and a clear "what is true at the end" summary.

A milestone may contain one deliverable or multiple deliverables. A milestone may be delivered in one PR, multiple
sibling PRs, or a stacked branch sequence. The deciding factor is the desired human review shape, not an abstract rule
that every milestone must map to exactly one branch.

Example: M2 Backend Reporting API.

### Deliverable

A deliverable is a bounded implementation unit with its own SPEC, scope, acceptance criteria, and definition of done.
A deliverable should be small enough that an agent can implement it with bounded context and a verifier can evaluate it
against concrete evidence.

One deliverable maps to one SPEC. A milestone may contain multiple deliverables, and therefore multiple SPECs.

A deliverable is not automatically the same thing as a branch, worktree, or PR. Those are delivery topology choices.

Example: Reports service-layer foundation; CLI refactor; HTTP route.

### SPEC

A SPEC is the executable contract for one deliverable. It contains enough detail for a fresh agent to implement the
deliverable without needing a separate implementation plan.

A SPEC includes:

- capability statement
- required reading
- invariants
- scope and out-of-scope boundaries
- decisions and rejected alternatives
- TDD entry point
- prescriptive execution sequence
- test plan
- acceptance criteria
- halt conditions
- definition of done
- run-log protocol
- paste-ready implementation prompt

The SPEC is not a live status tracker. If implementation progress, manual evidence, or recovery notes need to be
recorded, they belong in the run log.

### Run Log

A run log is the append-only execution memory for a deliverable or deliverable group. It records open-question
resolutions, phase completions, deviations, manual evidence locations, load-bearing issues, and verifier results.

The run log is local-only and not part of the review diff unless explicitly requested. Its job is recovery: a fresh
agent should be able to read the SPEC, run log, and current branch state and continue without reconstructing history
from conversation.

A single-deliverable branch may use one run log section. A milestone branch should use one shared run log with sections
per SPEC. A stacked lane should use a shared run log when decisions or deviations in lower branches affect upper
branches.

### Worktree

A worktree is an isolated filesystem workspace for a coherent effort. It is not inherently the same thing as a feature,
milestone, branch, or deliverable.

A worktree may contain:

- one branch implementing one deliverable / SPEC
- one branch implementing multiple ordered deliverables / SPECs
- a stacked branch lane implementing multiple independently reviewed slices

Worktrees are operational containers. They provide isolation and continuity; they do not define review boundaries by
themselves.

### Branch

A branch is the version-control unit that accumulates implementation changes. In normal work, a branch is also the PR
source.

The branch is often the human review artifact. When multiple deliverables are implemented on one branch, the reviewer
reviews the combined branch diff and PR body, while the SPECs explain the internal delivery slices.

A branch does not have to map one-to-one with a SPEC. It may, but only when that is the desired review shape.

### Pull Request

A pull request is the primary review artifact. It should link the relevant feature, architecture, SPECs, and acceptance
criteria evidence. Reviewers should be able to evaluate the branch as a coherent change, even when it contains multiple
deliverables.

### Stack

A stack is a sequence of branches where an upper branch depends on a lower branch. Stacked branches are useful when
humans should review or merge slices independently, or when a lower-layer contract must stabilize before the upper
layer is reviewed.

Stacks are not the default way to get agent parallelism or sequencing. They add rebase and ownership overhead, so they
should be chosen only when the review boundary justifies the cost.

---

## 3. Delivery Topologies

Delivery topology is chosen after the conceptual breakdown is clear.

The conceptual hierarchy is:

```text
Feature
  Milestone
    Deliverable
      SPEC
```

The delivery topology answers a different question: how should these deliverables be isolated, implemented, and
reviewed?

### Single-Deliverable Branch

Use this when the change is bounded and can be reviewed as one unit.

Shape:

- one worktree
- one branch
- one SPEC
- one deliverable
- one run-log section or one small run log
- one PR

This is the default for small and medium changes.

### Milestone Branch

Use this when a milestone contains multiple ordered deliverables, but the human review artifact should be the whole
milestone.

Shape:

- one worktree
- one branch
- multiple SPECs
- multiple deliverables
- one shared run log
- one PR

Each SPEC has its own scope, acceptance criteria, and definition of done. The branch PR is the final reviewable
artifact. The PR body should summarize how each SPEC's acceptance criteria were verified.

This is the preferred shape for the M2 Reporting API work: service-layer foundation, CLI refactor, and HTTP route are
separate deliverables but should be reviewed as one backend reporting API milestone.

### Stacked Review Lane

Use this when separate review or merge boundaries are valuable enough to justify stack overhead.

Shape:

- one lane worktree
- two stacked branches by default
- multiple deliverables / SPECs when needed
- one or more SPECs defining the seam and branch ownership
- branch-specific acceptance criteria
- sequential PR review

Examples where stacking may be appropriate:

- data layer first, render layer second
- foundation contract reviewed separately from consumer code
- a large diff needs reviewable slices with independent merge points

Avoid stacking when the only reason is that there are multiple SPECs. Multiple SPECs can live on one branch if the PR
is meant to be reviewed as one artifact.

### Multiple Sibling Branches

Use this when a milestone contains multiple deliverables that can be reviewed independently without a stack dependency.

Shape:

- multiple worktrees or branches
- one deliverable / SPEC per branch, or a small group per branch
- separate PRs targeting the same integration branch
- milestone completion tracked at the feature/milestone level

This is useful when deliverables share a milestone but do not depend on each other strongly enough to justify a stack.

---

## 4. Review Boundary Principle

Choose the delivery topology based on the intended human review artifact.

If the reviewer should judge the milestone end-to-end, use a milestone branch. If the reviewer should approve one
slice before another and the later slice depends on the earlier one, use stacked branches. If the milestone has
independent parts that can be reviewed separately, use sibling branches. If the work is one bounded unit, use a
single-deliverable branch.

Do not force one worktree per milestone or one branch per SPEC as universal rules. Those mappings are sometimes right,
but they are not the methodology. The methodology is to make the review boundary explicit and then choose the simplest
topology that supports it.

The stable rule is one deliverable per SPEC. The flexible rule is where deliverables live during implementation and
review.

---

## 5. Agent Autonomy Model

The SPEC should constrain outcomes, boundaries, and contracts. It should not over-constrain every implementation move.

### Hard Constraints

Hard constraints are non-negotiable. Violating one requires stopping and surfacing to the owner.

Examples:

- strict file scope
- public API contracts
- compatibility invariants
- standards selected from `docs/standards/index.yaml`
- acceptance criteria
- halt conditions
- security, data safety, and migration safety rules
- user-visible behavior that must remain unchanged

### Adaptive Guidance

Adaptive guidance is the preferred path, but the agent may adjust it when verified local evidence shows that the
codebase needs a different shape.

Examples:

- code skeleton bodies
- helper names
- exact decorator syntax
- test organization details
- phase ordering when a different order is clearly safer
- internal implementation mechanics that do not affect the public contract

When adaptive guidance changes in a meaningful way, the agent records the deviation in the run log.

### Discovery Budget

The agent is expected to inspect nearby code, follow current patterns, and notice risks the SPEC author may have
missed. The SPEC should explicitly allow this kind of discovery within scope.

Agents may:

- inspect implementation files cited by the SPEC
- inspect nearby analogues when needed
- use repo standards and recent code patterns to refine implementation
- propose a better internal shape when it preserves the hard constraints

Agents must stop when discovery implies a change to scope, acceptance criteria, public contract, review topology, or a
hard invariant.

---

## 6. SPEC and Run Log Relationship

The SPEC is durable contract. The run log is mutable execution history.

Use the SPEC for:

- intended behavior
- decisions and rationale
- scope boundaries
- acceptance criteria
- execution sequence
- halt conditions
- definition of done

Use the run log for:

- user answers to open questions
- phase completions
- commit SHAs
- deviations from guidance
- manual evidence paths
- failed attempts that matter for recovery
- verifier reports

If implementation reveals that the contract itself is wrong, revise the SPEC with owner sign-off. Do not bury contract
changes only in the run log.

---

## 7. Milestones and Completion

A milestone should be independently testable and reviewable. It should have:

- a capability statement
- a target completion date or explicit TBD
- a list of deliverables
- outcome criteria
- a completion summary

Individual deliverables inside the milestone may also be independently testable and reviewable. Each deliverable's SPEC
defines its own definition of done. The milestone is complete only when every deliverable needed for the milestone's
capability has met its definition of done and the chosen delivery topology satisfies the milestone outcome criteria.

This allows both levels to exist:

- deliverable-level verification for agent execution
- milestone-level verification for product/review completion

A milestone may finish through one PR, several sibling PRs, or a stack. The milestone definition should make that
delivery shape explicit once known.

---

## 8. Applying This to M2 Reporting API

M2 Reporting API is best treated as a milestone branch:

- one worktree: `mw-report-api-svc-layer`
- one final PR review artifact
- three deliverable SPECs
- one shared run log
- no stacked branches unless the owner decides each deliverable requires separate human review

Deliverables:

1. Reports service-layer foundation.
2. CLI refactor through the registry.
3. HTTP route, blueprint, and OpenAPI.

The branch is reviewable as the backend reporting API milestone. The individual SPECs give agents bounded execution
contracts and give reviewers traceability into why the branch is structured the way it is.

---

## 9. Methodology Rules To Carry Into Spec Builder

The `spec-builder` skill should encode these rules:

- One deliverable per SPEC.
- A SPEC replaces the old SPEC + PLAN split for agent implementation.
- A run log is required for multi-phase or multi-SPEC work.
- The branch or stack PR is the reviewable artifact.
- Worktrees are operational containers, not automatic review boundaries.
- A worktree may contain one deliverable, multiple deliverables, or a stacked lane.
- A branch may implement one SPEC or multiple ordered SPECs.
- Multiple SPECs may be implemented in one worktree and one branch when the milestone is reviewed as a whole.
- Multiple sibling branches may be used when milestone deliverables are independently reviewable.
- Stacked branches are reserved for separate human review boundaries.
- SPECs must distinguish hard constraints from adaptive guidance.
- Agents are allowed to use local judgment inside scope.
- Meaningful deviations go in the run log.
- Contract-changing deviations require owner sign-off and SPEC revision.

---

## 10. Open Methodology Questions

These remain intentionally fluid:

- When should a milestone branch split into multiple sibling PRs instead of one PR?
- How large can a milestone branch become before review quality suffers?
- Should a milestone branch have one PR body template that summarizes all SPECs?
- Should verifier agents verify each SPEC independently, then run a milestone-level verification pass?
- Should run logs be one per milestone branch by default, with sections per SPEC, or one per deliverable unless the
  owner declares a multi-SPEC milestone branch?

The current working answer for M2 is: one shared run log, per-SPEC verification, and one final branch/PR review.
