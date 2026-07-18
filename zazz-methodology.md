# The Zazz Methodology

Zazz is an operating model for the agentic software delivery lifecycle. It helps teams use agents to move faster while keeping product direction, engineering quality, review discipline, and merge authority in human hands.

This document is the methodology entry point and executive overview. The detailed guidance lives in focused section docs under [`docs/methodology/`](docs/methodology/).

## Executive Overview

AI agents can produce code quickly. The hard part is making sure the team is building the right thing, the implementation is reviewable, the evidence is credible, and the knowledge survives after merge.

Zazz gives teams a repeatable path from product intent to a human-reviewed, merged software change:

- Durable docs explain the product, architecture, decisions, features, and standards.
- Deliverable specifications turn intent into bounded implementation contracts with acceptance criteria, test strategies, standards, and halt conditions.
- Spec-driven development keeps approved specifications, implementation evidence, Deliverable Owner steering, QA feedback, and PR review aligned through a controlled lifecycle.
- Deterministic quality gates turn enforceable code, documentation, accessibility, type-safety, and formatting rules into repeatable checks before probabilistic agent or human review.
- Standards conformance work keeps legacy and existing code moving toward adopted standards through small, reviewable,
  evidence-backed maintenance PRs.
- Agents execute inside approved contracts, isolated worktrees, and repo standards.
- Validation, pull request packaging, and automated self-review happen before human review and merge.
- Durable docs are updated when shipped work changes the product, architecture, or standards.

The result is faster agent-assisted delivery with clearer scope, stronger review signal, less rework, and durable knowledge that stays useful after the PR is merged.

## Roles

Zazz reserves ownership for human accountability and names AI participation explicitly:

- A **Project Owner** is the human accountable for project direction and durable product context.
- A **Deliverable Owner** is the human accountable for a deliverable's intent, scope decisions, acceptance, and review or merge readiness. A Project Owner may also be a Deliverable Owner.
- A **Contributor** is a human engineer contributing to a deliverable. A Contributor may also be its Deliverable Owner.
- A **Contributor Agent** is an AI agent assigned explicitly to bounded implementation, testing, documentation, or investigation work.
- A **Lead Agent** is a designated Contributor Agent that coordinates execution. It may delegate work to other Contributor Agents and Verifier Agents, but remains responsible for integrating agent-produced work and evidence.
- A **Verifier Agent** or **QA Agent** is an AI agent performing independent verification. It does not modify implementation unless explicitly assigned that work.

The Deliverable Owner retains authority for contract changes, acceptance, and review or merge readiness. A Lead Agent coordinates execution; it does not gain Deliverable Owner authority.

## Progression

Zazz moves from durable context to executable work, then back into durable knowledge after the work ships.

```text
project.md
  -> architecture.md
  -> proposals/
  -> features/ for capability context
  -> project milestones / roadmap for timeline planning
  -> specifications/
  -> spec-driven development
  -> deterministic quality gates
  -> standards conformance maintenance
  -> code generation
  -> testing and validation
  -> PR packaging and automated review
  -> human review and merge
  -> durable docs updated
```

Not every step is needed for every change. Small fixes may start at a specification. Uncertain product or technical direction should start with a proposal. Long-lived capabilities should have feature and architecture context before deliverables are sliced.

## Specification-Driven Delivery Cycle

Specification-driven delivery is the core execution segment of the SDLC, not the
entire SDLC. It begins when a Deliverable Owner greenlights a bounded deliverable
specification and ends when that deliverable is human-reviewed, merged, and its durable
knowledge is updated. It connects pre-delivery product planning to post-delivery
operational oversight.

```text
Project Owner establishes project direction and project milestones
  -> proposals resolve uncertainty when needed
  -> features and architecture establish durable capability context
  -> deliverables are assigned to project milestone time boxes
  -> Deliverable Owner greenlights a deliverable specification
  -> Lead Agent coordinates Contributor Agents and Verifier Agents
  -> implementation, evidence, QA, and draft-PR feedback refine the current contract
  -> human review, approval, and merge
  -> deployment, operational review, maintenance, and durable-doc updates
```

Within this cycle, a Lead Agent may implement directly or delegate bounded work to
Contributor Agents. The Lead Agent integrates agent-produced work and evidence; the
Deliverable Owner remains the human authority for scope changes, acceptance, and review
or merge readiness. QA and Verifier Agents provide independent evidence but do not
change implementation unless explicitly reassigned.

The cycle does not replace the work before a specification exists—project direction,
proposals, features, architecture, and milestone planning—nor the work after merge:
deployment, monitoring, support, maintenance, and subsequent planning. Those stages
inform the next deliverables and may reopen proposals, feature documents, architecture,
or standards when the product or operating environment changes.

## Project Milestones And Deliverables

Project milestones are project-owned time boxes for communicating planned delivery.
They belong to the project plan, not to an individual feature. A milestone can contain
deliverables from multiple features, as well as bug fixes, chores, or technical
investments. A deliverable may contribute to a feature for capability context while also
being assigned to a project milestone for timeline and stakeholder planning.

Every deliverable should record its Project Owner, Deliverable Owner, feature context
when applicable, and assigned project milestone or an explicit `N/A`. The milestone is
the time box; the deliverable is the bounded, reviewable execution unit inside it.

The section docs are designed for incremental discovery. Read the entry point to choose
the current stage, then load the focused section for that stage rather than pulling the
entire methodology into every task.

## Section Guide

Each focused section includes a `Relevant Skills` table that explains which skills apply to that stage and how they improve process efficiency.

| Section | Purpose |
| ------- | ------- |
| [Project Document](docs/methodology/project.md) | Defines `project.md`, the top-level product orientation document. |
| [Document Storage](docs/methodology/document-storage.md) | Defines where durable docs, active implementation scratch, completed specs, project plans, roadmaps, and milestones live. |
| [Architecture](docs/methodology/architecture.md) | Defines project-level and feature-level architecture docs. |
| [Proposals](docs/methodology/proposals.md) | Defines durable decision artifacts for uncertain product or technical direction. |
| [Features and Project Milestones](docs/methodology/features-and-milestones.md) | Defines feature requirements documents, feature roadmap increments, project milestones, and time-boxed deliverables. |
| [Specifications](docs/methodology/specifications.md) | Defines deliverable specifications as bounded execution contracts. |
| [Spec-Driven Development](docs/methodology/spec-driven-development.md) | Defines the post-greenlight lifecycle for implementation, steering, contract updates, QA, PR feedback, and signoff. |
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
- `features/` describes long-lived capabilities and feature roadmap increments.
- `specifications/` contains deliverable specifications authored by spec-builder and executed by Contributor Agents inside the worktree. The repo decides whether this directory is tracked, ignored, mirrored, or promoted elsewhere.
- `ephemeral/` contains active implementation scratch: run logs, QA findings, handoff notes, recovery notes, evidence, and other records that normally stay out of Git. Ephemeral means uncommitted and non-durable, not necessarily memory-only; these files may persist locally until the worktree is removed.
- `standards/` defines how the software should be built.

Repos declare the docs root in `AGENTS.md`, commonly `docs/` or `.zazz/`. The value must be repo-relative.
Repos also declare their documentation operating model. That model decides whether
`specifications/` is tracked, ignored, mirrored, or promoted, and whether final specs,
project plans, roadmap, project milestones, or other durable docs are promoted to
GitHub Wiki, Confluence, or another system.

```text
<DOCS_ROOT>/
├── project.md
├── architecture/
├── proposals/
├── features/
├── specifications/
├── ephemeral/
└── standards/
```

## Operating Principles

1. Durable product and architecture knowledge lives in durable docs, not chats or transient task notes.
2. Deliverable specifications are the execution contracts for bounded work.
3. Approved specifications stay current through spec-driven development: implementation feedback updates the spec body in place and records an audit trail.
4. Deterministic tools enforce every quality rule they can express reliably.
5. Existing code is kept aligned through focused, agent-prepared conformance PRs against named standards and bounded
   repo areas.
6. Acceptance criteria and test evidence are required for convergence.
7. Agents may operate autonomously inside approved contracts, but humans retain scope, approval, signoff, and merge authority.
8. Active implementation happens in isolated worktrees or approved stacked lanes, with one Lead Agent coordinating file-conflict serialization. A gh-stack lane is one dedicated worktree containing every stacked branch; each branch and PR represents one dependent deliverable.
9. Draft PRs are the normal packaging surface for agent-generated work.
10. Automated self-review runs before a PR is marked ready for human review.
11. Active implementation artifacts live in `<DOCS_ROOT>/ephemeral/` or a declared tracker/service, and only durable knowledge is promoted into the repo, wiki, Confluence, or another declared knowledge base.
12. Durable docs are updated when implementation changes the product, architecture, feature capability, roadmap, project milestone state, or standards.

## Skills

The shared skills under [`.agents/skills/`](.agents/skills/) implement the methodology's common workflows:

| Workflow | Skill |
| -------- | ----- |
| Proposal exploration | `proposal-builder` |
| GitHub Wiki durable docs | `gh-wiki` |
| Confluence-backed durable docs | `confluence` |
| Feature requirements | `feature-doc-builder` |
| Architecture docs | `architecture-doc-builder` |
| Deliverable specifications | `spec-builder` |
| Spec-driven implementation lifecycle | `spec-driven` |
| Implementation verification | `qa-testing` |
| PR packaging | `pr-builder` |
| Automated self-review | `pr-review` |
| Stacked PR workflow | `gh-stack` |
| Worktree setup | `worktree` |
| Temporary handoff notes | `handoff` |
| Standard creation | `standard-builder` |
| Standards conformance | `conformance` |
| Documentation checks | `doc-check` |

Companion utility skills such as `gh-issue`, `handoff`, `zazz-board`, `jira`, `psql`, and `sqlcmd` provide repo-specific or tool-specific support when a project uses those systems.

Shared skills follow the Agent Skills format. Use [Agent Skills](docs/standards/agent-skills.md) for authoring rules,
portable front matter, metadata placement, and validation.

## Authority Gates

Agents can draft docs, implement code, run tests, prepare pull requests, and perform self-review when the governing contract is approved.

Humans control:

- approving proposals, feature direction, architecture direction, and deliverable specifications
- resolving product or technical ambiguity
- accepting subjective UX or product behavior
- requesting human review when repo policy requires it
- approving and merging PRs

## Storage Modes

Zazz is Git-native by default, but not every durable document has to live as a committed Markdown file in the application repository. Repos declare a documentation storage mode in `AGENTS.md` so agents know where to read and update project knowledge.

Supported durable storage modes include:

- repo-committed Markdown reviewed through normal branches and PRs
- GitHub Wiki, GitLab Wiki, Bitbucket Wiki, or another Git-backed repository wiki
- Confluence or a similar knowledge-base system
- tracker-backed records for issue-specific context

`project.md`, architecture, feature requirements, project plans, roadmaps, project milestones, and final implemented specifications may live in the declared durable storage surface. Local specification working files live under `<DOCS_ROOT>/specifications/`; RUN_LOG files and other active execution records live in `<DOCS_ROOT>/ephemeral/` or the declared tracker/service while work is underway. After implementation lands, the final current specification may be promoted to a wiki, Confluence, Jira, Zazz Board, or another durable location if the repo policy calls for it.

When an external document is the source of truth, keep a stable pointer in `AGENTS.md`, an index page, or a repo-tracked pointer file with title, responsible human, status, and link. See [Document Storage](docs/methodology/document-storage.md).

## Reference Implementation

This repository is the canonical source for the methodology and shared skills. Downstream repos may vendor or sync these docs and skills, but methodology changes should land here first.

[zazz-board](https://github.com/zazzcode/zazz-board) is the reference implementation and uses the methodology.
