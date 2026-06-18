# The Zazz Methodology

Zazz is an operating model for AI-assisted software delivery. It helps teams use agents to move faster while keeping product direction, engineering quality, review discipline, and merge authority in human hands.

This document is the methodology entry point and executive overview. The detailed guidance lives in focused section docs under [`docs/methodology/`](docs/methodology/).

## Executive Overview

AI agents can produce code quickly. The hard part is making sure the team is building the right thing, the implementation is reviewable, the evidence is credible, and the knowledge survives after merge.

Zazz gives teams a repeatable path from product intent to a human-reviewed, merged software change:

- Durable docs explain the product, architecture, decisions, features, and standards.
- Deliverable specifications turn intent into bounded implementation contracts with acceptance criteria, test plans, standards, and halt conditions.
- Deterministic quality gates turn enforceable code, documentation, accessibility, type-safety, and formatting rules into repeatable checks before probabilistic agent or human review.
- Standards conformance work keeps legacy and existing code moving toward adopted standards through small, reviewable,
  evidence-backed maintenance PRs.
- Agents execute inside approved contracts, isolated worktrees, and repo standards.
- Validation, pull request packaging, and automated self-review happen before human review and merge.
- Durable docs are updated when shipped work changes the product, architecture, or standards.

The result is faster agent-assisted delivery with clearer scope, stronger review signal, less rework, and durable knowledge that stays useful after the PR is merged.

## Progression

Zazz moves from durable context to executable work, then back into durable knowledge after the work ships.

```text
project.md
  -> architecture.md
  -> proposals/
  -> features/ and milestones
  -> specifications/
  -> deterministic quality gates
  -> standards conformance maintenance
  -> code generation
  -> testing and validation
  -> PR packaging and automated review
  -> human review and merge
  -> durable docs updated
```

Not every step is needed for every change. Small fixes may start at a specification. Uncertain product or technical direction should start with a proposal. Long-lived capabilities should have feature and architecture context before deliverables are sliced.

## Section Guide

Each focused section includes a `Relevant Skills` table that explains which skills apply to that stage and how they improve process efficiency.

| Section | Purpose |
| ------- | ------- |
| [Project Document](docs/methodology/project.md) | Defines `project.md`, the top-level product orientation document. |
| [Architecture](docs/methodology/architecture.md) | Defines project-level and feature-level architecture docs. |
| [Proposals](docs/methodology/proposals.md) | Defines durable decision artifacts for uncertain product or technical direction. |
| [Features and Milestones](docs/methodology/features-and-milestones.md) | Defines feature requirements documents, milestones, and time-boxed deliverables. |
| [Specifications](docs/methodology/specifications.md) | Defines deliverable specifications as bounded execution contracts. |
| [Deterministic Quality Gates](docs/methodology/deterministic-quality.md) | Defines linters, formatters, type checks, accessibility checks, doc checks, CI gates, and ongoing standards conformance as deterministic controls. |
| [Code Generation](docs/methodology/code-generation.md) | Defines agent implementation workflow, worktree discipline, and halt conditions. |
| [Testing and Validation](docs/methodology/testing-and-validation.md) | Defines acceptance verification, test quality, QA loops, and evidence. |
| [PR Creation](docs/methodology/pr-creation.md) | Defines draft-first PR packaging and stacked PR usage. |
| [Self-Review](docs/methodology/self-review.md) | Defines author-side automated review before human review. |
| [Human Review and Merge](docs/human-in-loop-pr-review-strategy.md) | Defines review tiers, human approval, merge expectations, and post-merge learning. |

## Core Model

Zazz uses a project-first document model:

- `project.md` explains the product's purpose, users, major capabilities, and durable operating assumptions.
- `architecture/` explains intended technical shape and important system decisions.
- `proposals/` records decisions when the path is uncertain.
- `features/` describes long-lived capabilities and milestone progression.
- `specifications/` contains bounded deliverable contracts.
- `execution/` contains mutable run logs, QA findings, handoff notes, and recovery notes when the repo stores execution records on disk.
- `standards/` defines how the software should be built.

Repos declare the docs root in `AGENTS.md`, commonly `docs/` or `.zazz/`. The value must be repo-relative.

```text
<DOCS_ROOT>/
├── project.md
├── architecture/
├── proposals/
├── features/
├── specifications/
├── execution/
└── standards/
```

## Operating Principles

1. Durable product and architecture knowledge lives in durable docs, not chats or transient task notes.
2. Deliverable specifications are the execution contracts for bounded work.
3. Deterministic tools enforce every quality rule they can express reliably.
4. Existing code is kept aligned through focused, agent-prepared conformance PRs against named standards and bounded
   repo areas.
5. Acceptance criteria and test evidence are required for convergence.
6. Agents may operate autonomously inside approved contracts, but humans retain scope, approval, signoff, and merge authority.
7. Active implementation happens in isolated worktrees.
8. Draft PRs are the normal packaging surface for agent-generated work.
9. Automated self-review runs before a PR is marked ready for human review.
10. Durable docs are updated when implementation changes the product, architecture, or standards.

## Skills

The shared skills under [`.agents/skills/`](.agents/skills/) implement the methodology's common workflows:

| Workflow | Skill |
| -------- | ----- |
| Proposal exploration | `proposal-builder` |
| Feature requirements | `feature-doc-builder` |
| Architecture docs | `architecture-doc-builder` |
| Deliverable specifications | `spec-builder` |
| Implementation verification | `qa-testing` |
| PR packaging | `pr-builder` |
| Automated self-review | `pr-review` |
| Stacked PR workflow | `gh-stack` |
| Worktree setup | `worktree` |
| Standard creation | `standard-builder` |
| Standards conformance | `conformance` |
| Documentation checks | `doc-check` |

Companion utility skills such as `zazz-board-api`, `jira-api`, `psql`, and `sqlcmd` provide repo-specific or tool-specific support when a project uses those systems.

## Authority Gates

Agents can draft docs, implement code, run tests, prepare pull requests, and perform self-review when the governing contract is approved.

Humans control:

- approving proposals, feature direction, architecture direction, and deliverable specifications
- resolving product or technical ambiguity
- accepting subjective UX or product behavior
- requesting human review when repo policy requires it
- approving and merging PRs

## Storage Modes

Zazz is Git-native by default. Durable docs should normally be reviewed and versioned through the same branch and PR workflow as code.

Repos may use external systems for proposals, specifications, or execution records when `AGENTS.md` declares the storage policy and gives agents a stable lookup path. When an external document is the source of truth, keep a repo-tracked pointer with title, owner, status, and link.

## Reference Implementation

This repository is the canonical source for the methodology and shared skills. Downstream repos may vendor or sync these docs and skills, but methodology changes should land here first.

[zazz-board](https://github.com/zazzcode/zazz-board) is the reference implementation and uses the methodology.
