# The Zazz Framework
Zazz is a feature- and milestone-oriented, spec-driven framework for delivering software with humans and AI agents, where long-lived feature requirements are implemented through deliverables and validated through iterative QA convergence.

## Framework Introduction (At a Glance)

Core concepts and capabilities:
- **Desired-state convergence**: work iterates until implementation aligns with the specification.
- **Feature requirements + deliverable spec contract**: each feature has a long-lived Feature Requirements Document, and each deliverable has its own Deliverable SPEC.
- **User-journey-first feature definition**: features are defined by user journeys and requirements, including human users, agents, and other systems.
- **Structured document flow**: optional Proposal (`-PROP`) → required Deliverable Specification (`-SPEC`) → optional explicit Plan (`-PLAN`) → build/validate loop.
- **Opinionated documentation contract**: required document types plus opinionated naming and directory structure, with flexible root location.
- **Feature lifecycle model**: a product is a collection of long-lived features that evolve through multiple deliverables over time.
- **Milestone-centered delivery**: milestones group related deliverables into date-driven capability objectives.
- **Repository/worktree boundary**: each deliverable is executed in exactly one repository (including a monorepo) and one dedicated worktree.
- **Role and context decomposition**: role-scoped and step-scoped context reduces noise and improves agent focus.
- **Iterative spec stewardship**: spec-builder initializes Deliverable SPEC baselines; QA validates, surfaces gaps, and drives rule-governed refinements.
- **Flexible runtime model**: supports single-agent, multi-agent, and subagent orchestration depending on runtime capability.
- **Automation-first quality model**: maximize agent-driven convergence, then apply human quality gates at UAT and PR merge.
- **Optional service integration**: Zazz Board services are optional accelerators, not prerequisites for adopting the framework.

## Document Scope

This document defines the **philosophy and operating model** of Zazz.
It is not an implementation guide.

Specifically, this document does not define:
- API route contracts
- storage schemas
- tool-specific command syntax
- execution scripts

Those implementation details belong in skills, standards, API docs, and repository-level technical documentation.

---

## Documentation Architecture Philosophy

Zazz is opinionated about **what documents must exist** and **how they relate**.
Zazz is flexible about **where those documents are stored** in a repository.

Required document contract:
- **Standards set** (required): shared conventions that govern implementation and validation.
- **Feature Requirements Document (`-FRD`)** (required per feature): long-lived, mutable user-journey and requirement contract for the feature over time.
- **Deliverable Specification (`-SPEC`)** (required per deliverable): execution contract for one deliverable.
- **Plan (`-PLAN`)** (optional explicit artifact): execution decomposition toward the specification. In some runtimes, planning may be internal to the agent platform instead of persisted as a standalone `-PLAN` document.
- **Proposal (`-PROP`)** (optional, strongly recommended): ideation/debate mechanism before commitment. A proposal may be associated with a feature, a deliverable, or both, depending on scope.

Opinionated naming contract:
- Framework document names are opinionated around four artifact types: `-FRD`, `-PROP`, `-SPEC`, and `-PLAN`.
- `-FRD` is required for features and captures user journeys + requirements (what/why, not how).
- `-SPEC` is reserved for deliverables.
- `-PROP` is optional and used when pre-decision analysis is needed.
- `-PLAN` may be explicit (document) or implicit (agent-internal/runtime-native), depending on platform capability and team policy.

Proposal scope and placement guidance:
- **Feature-scoped proposal**: discusses user journeys/requirements evolution and lives with the feature context (for example `features/task-graph/task-graph-PROP.md`).
- **Deliverable-scoped proposal**: discusses implementation options/tradeoffs for a concrete deliverable and lives with the deliverable context (for example `deliverables/DLV-142/DLV-142-PROP.md`).
- **Joint proposal**: may be linked to both a feature and a deliverable when it covers both requirements and implementation tradeoffs.
- A proposal is exploratory and non-authoritative; authoritative contracts are FRDs for features and SPECs for deliverables.

Recommended supporting artifacts:
- milestone-level acceptance/reference notes for grouped deliverables
- deliverable-level user/release documentation as needed by the milestone
- feature-level capability notes when helpful for long-running feature history

Location flexibility model:
- The framework supports either `.zazz/` or `docs/` (or another repository-defined location) as the documentation root.
- A single configured root should be used per repository for consistency.
- Agents should resolve framework documents from a configured root path, for example `ZAZZ_DOCS_ROOT`.
- Example: one project may store framework docs under `.zazz/` while another stores them under `docs/`; both remain framework-compliant.

Baseline structure under the configured root:
- `standards/` for framework standards (single canonical standards location)
- `features/` for long-lived feature requirements and user-journey artifacts
- `deliverables/` for deliverable execution artifacts (`-SPEC`, optional `-PROP`, optional `-PLAN`)
- optional `milestones/` for milestone-level artifacts

Required directory contract:
- Each repository adopting the framework should expose `standards/`, `features/`, and `deliverables/` under its configured docs root.
- The docs root itself is flexible (`.zazz/`, `docs/`, or repository-defined), but these subdirectories are part of the opinionated framework shape.

Single-standards-location rule:
- For framework clarity, standards are assumed to live in one canonical standards location under the configured docs root.
- The framework does not require per-subdirectory or per-section standards partitioning.

Feature directory and naming contract:
- Each new feature must have its own directory under `features/`.
- That directory is the canonical location for managing the feature over time (initial delivery, QA-driven rework, enhancements, and bug fixes).
- Feature identity should include:
  - human-readable **feature name** (for example `Task Graph`)
  - stable **feature key** (slashless `kebab-case`, for example `task-graph`) used for paths and references
- The feature directory name should be the feature key.
- Feature requirements should be long-lived and maintained in-place (for example `task-graph-FRD.md`).

Deliverable directory and naming contract:
- Each deliverable must have its own directory under `deliverables/` (for example `deliverables/DLV-142/`).
- Deliverable execution artifacts live in that directory: required `DLV-142-SPEC.md`, optional `DLV-142-PROP.md`, optional `DLV-142-PLAN.md`.
- Deliverable IDs should be stable and unique within the project scope.
- Deliverables are linked to features by references/metadata, not by physical nesting under `features/`.

---

## Core Philosophy

- Zazz is designed to converge deliverables toward a declared desired state.
- Feature requirements define long-duration user journeys and capability intent; Deliverable SPEC defines execution scope for one increment.
- Tests define the executable verification contract.
- Proposal, planning, execution, QA, and rework are convergence mechanisms.
- Products are treated as collections of evolving features; deliverables are bounded increments that implement, improve, or repair those features.
- Convergence is agent-driven and rule-driven.
- The final deliverable must fully reflect its finalized Deliverable SPEC.
- Context engineering is a core design goal: provide agents only the context needed for the current decision/work step.
- Role decomposition and step decomposition exist partly to bound context scope and reduce unnecessary prompt/context load.

---

## Core Entities

Zazz organizes work using:
- execution hierarchy: `Project -> Deliverable -> Task`
- cross-cutting coordination objects: `Feature` and `Milestone`

### Project
The long-lived product/application context.
A project may span one or more repositories.
### Feature
A long-lived capability object within the product/application.
Features span time and can receive many deliverables (initial version, enhancements, bug fixes, and rework).
Each feature has one long-lived Feature Requirements Document (`-FRD`) that evolves over time.
Feature scope is driven by user journeys and requirements (human users, agents, or external systems).
Features may have dependency relationships with other features.

### Milestone
A first-class, date-driven grouping of deliverables, conceptually similar to a Scrum initiative (or grouped epics).

A milestone exists to represent a larger capability or release objective that usually spans multiple deliverables.
A milestone may group deliverables from multiple features and from different repositories within the same project.

A milestone has:
- an explicit completion/release date
- milestone-level acceptance criteria
- potential cross-deliverable outputs (for example user documentation or release notes)

### Deliverable
A bounded unit of value completed by an agent group, with its own Deliverable SPEC, optional explicit PLAN, and acceptance criteria.
A deliverable is typically one incremental change to a feature (for example initial implementation, enhancement, bug fix, refactor, or QA-driven rework).
A deliverable may satisfy requirements from one or more features and may contribute to one or more milestone objectives.
A deliverable is strictly scoped to one repository (including a monorepo) and one dedicated git worktree.
Its implementation and framework documents are versioned in that same repository.
Once closed, a Deliverable SPEC is treated as frozen/immutable (except explicit amendment records).
Deliverable-to-feature linkage guidance:
- Requirement-changing deliverables (for example MVPs, enhancements, bug fixes) should link to one or more features.
- Shared supporting deliverables may link to multiple features when they satisfy multiple feature requirements.
- Chore/platform-maintenance deliverables may have no feature linkage.
- Refactor deliverables link to features when they affect user-journey requirements; pure internal refactors may remain feature-agnostic.

### Task
The smallest execution unit inside a deliverable.

---

## Feature, Milestone, and Deliverable Relationship Philosophy

- Features are long-lived capability contexts.
- Features are cross-cutting objects that span multiple deliverables and can span multiple milestones over time.
- Deliverables are bounded execution units within a feature lifecycle.
- A feature is implemented and evolved through multiple deliverables over time.
- Milestones are grouping and coordination constructs, not just labels.
- Milestones may contain deliverables from one or many features.
- Milestones represent capability progression/maturation targets for features by a date; deliverables are the implementation increments used to reach those targets.
- A milestone is not required to represent a fully completed feature; it may represent an intermediate grouping of deliverables toward broader feature completion.
- Deliverables may be sequenced in series (dependency-gated) or run in parallel (independent).
- Most milestone structures are mixed dependency graphs.
- Milestones may include deliverables from multiple repositories.
- No single deliverable is split across repositories or across multiple worktrees.
- Deliverables and features are many-to-many at requirements level: one deliverable can satisfy multiple feature requirements, and one feature requirement can require multiple deliverables over time.
- Deliverables are not required to be feature-linked in all cases (for example chores); however, requirement-changing deliverables should link to relevant features.
- Rework, bug-fix, and enhancement deliverables can belong to the same milestone when they are required for milestone acceptance.

Milestone completion is judged at the milestone level:
- the grouped deliverables satisfy milestone acceptance criteria
- milestone completion aligns to its target date objective

---

## Document Flow Philosophy

Zazz uses the following conceptual flow:

`PROP -> SPEC -> PLAN -> build/validate loop`

This flow runs per deliverable while preserving continuity with the long-lived Feature Requirements Document (`-FRD`).

### Proposal (`-PROP`, optional)
Used to clarify options, rationale, tradeoffs, and constraints before committing to a Deliverable SPEC.
Strongly recommended for new capabilities and major refactors.
Proposal discussions may include both user-journey requirements and technical implementation options.
Proposal output is input to decisions, not the final contract.

### Specification (`-SPEC`)
Defines the desired state and acceptance contract.
This is the central convergence target.

Requirements and specification maintenance convention:
- **Feature Requirements Document (`-FRD`)** (long-lived, mutable): canonical user-journey and requirement contract for the feature over time.
- **Deliverable SPEC** (short-lived execution contract): scoped contract for one deliverable.
- Deliverable SPEC is refined during active execution/QA and then frozen when the deliverable closes.
- Enhancements, bug fixes, refactors, and rework that are treated as distinct deliverables should use new Deliverable SPECs.
- A bug fix is both an implementation correction and a specification clarification when the bug reveals a behavior gap.
- Feature requirements should be updated to reflect accepted behavior evolution across deliverables.
- Requirement/spec history should remain explicit and traceable (for example via changelogs and cross-references between feature requirements and deliverable specs).

### Plan (`-PLAN`)
Defines how work is organized to move toward the SPEC-defined state.
`-PLAN` may be persisted as a document or executed as runtime-native/agent-internal planning, depending on platform capability and team policy.

---

## Context Engineering Philosophy

Zazz is intentionally designed to manage context as a first-class concern.

Core context principles:
- Load the **least necessary context** for the current task, role, and decision.
- Avoid broad, undifferentiated context dumps that increase noise and ambiguity.
- Decompose work into explicit roles and steps so each agent operates with focused context windows.
- Use runtime-native capabilities (for example subagents/teams/planning primitives) to isolate context by workstream whenever possible.
- Prefer iterative context refresh over monolithic one-shot prompts for complex deliverables.

Outcome:
- Better reasoning quality, lower context drift, and more predictable convergence to the SPEC-defined target state.

---

## Convergence Loop Philosophy (Spec Stewardship)

Zazz is intentionally iterative:
1. A baseline Deliverable SPEC is established (typically via spec-builder), aligned to current Feature Requirements context.
2. Work progresses toward the Deliverable SPEC.
3. QA validates the implementation against the Deliverable SPEC and verification evidence.
4. QA identifies gaps, inconsistencies, edge cases, missing tests, and ambiguity.
5. QA drives rule-governed Deliverable SPEC refinement and explicit rework definition when needed.
6. Rework is generated and resolved.
7. A fresh QA context revalidates against the updated Deliverable SPEC.
8. Repeat until implementation converges and the final deliverable fully reflects the finalized Deliverable SPEC.
9. On deliverable closure, freeze the Deliverable SPEC and reconcile accepted behavior into the Feature Requirements Document (`-FRD`).

Specification stewardship is shared across the lifecycle:
- spec-builder creates the initial Deliverable SPEC baseline
- QA refines and hardens the Deliverable SPEC through controlled updates under framework rules
- feature owners/stewards reconcile accepted outcomes into linked Feature Requirements Documents (`-FRD`) when the deliverable changes feature requirements
- SPEC change history should remain explicit and traceable

---

## Agent Role Philosophy

Zazz commonly uses these roles:
- `spec-builder-agent`
- `planner-agent`
- `worker-agent`
- `qa-agent`
- optional coordination role (`coordinator-agent`)

The active agent runtime (for example Claude, Codex, Warp, Gemini CLI) may provide built-in planning, orchestration, or subagent/team capabilities.
The framework is role-oriented and convergence-oriented, not tied to a single runtime.

Companion skills repository:
- `zazz-skills` is the skills repository for the Zazz Framework.
- It contains reusable agent skills and API skills that implement framework workflows across environments.
- In service-assisted adoption, teams may consume skills from `zazz-skills` to standardize spec-builder/planner/worker/qa behavior and board API interactions.
- This framework document may be copied or moved into `zazz-skills`; when that happens, the philosophy and contracts remain the same, while repository-specific integration notes may differ.

---

## Collaboration Philosophy

Default collaboration model:
- one dedicated worktree per active deliverable branch
- concurrent work coordinated by explicit ownership and dependency awareness
- deliverable execution is single-repo/single-worktree; project and milestone coordination may span repositories

Branch and worktree naming contract:
- Worktree directory name must match the branch name used for that deliverable.
- Branch names must be slashless (no `/`) so branch and worktree names map cleanly to a single directory path.
- Branch/worktree naming should align with feature identifiers in `features/` and deliverable identifiers in `deliverables/` when practical (for example `feature-id-deliverable-id`).

Locking philosophy:
- prefer runtime-native concurrency/ownership guarantees when they are stronger
- use service-level locking (for example Board API locking) when needed for shared-state safety and observability

---

## Service Adoption Philosophy

Zazz supports two valid adoption paths:
The framework can be adopted either alongside the Zazz Board application/tools or independently as a process-only operating model.

1. **Process-only adoption**: apply the framework philosophy and document flow without any board service.
2. **Service-assisted adoption**: add Zazz Board API/UI for orchestration, visibility, and locking support.

Board API integration is optional framework infrastructure, not a prerequisite for framework adoption.

---

## Post-Convergence Human Acceptance

Human involvement is intentionally positioned after convergence, not inside it.
Balance model:
- Maximal automation during convergence: agents and framework rules drive refinement, validation, and rework.
- Deliberate human quality checkpoints after convergence: user acceptance testing (UAT) and PR merge approval.

Post-convergence checkpoints:
1. **UAT checkpoint**: human validation that delivered behavior meets user/business expectations.
2. **PR merge checkpoint**: human review/approval gate for code integration and release readiness.

These checkpoints are quality controls, not convergence controls.

---

## Key Principles

1. Desired-state convergence is the core operating model.
2. The framework uses a two-document model: long-lived Feature Requirements (`-FRD`) + per-deliverable Deliverable SPEC (`-SPEC`).
3. Milestones are first-class, date-driven groupings of deliverables.
4. Deliverable dependencies (serial/parallel) shape milestone progression.
5. Projects and milestones may span repositories; each deliverable remains single-repo and single-worktree.
6. QA is an independent convergence pressure function: it finds gaps/inconsistencies, flags missing tests, and drives rule-governed refinement and rework.
7. SPEC stewardship is iterative across spec-builder and QA.
8. The final deliverable must fully reflect its finalized Deliverable SPEC.
9. Every feature has one long-lived Feature Requirements Document (`-FRD`); every deliverable has one required Deliverable SPEC (`-SPEC`).
10. Convergence is agent-driven; human acceptance is deliberately scoped to post-convergence UAT and PR merge checkpoints.
11. Context engineering is required: least-necessary context, role-scoped context, and step-scoped context.
12. The framework is opinionated about required document types and subdirectory shape, but flexible about document root location.
13. `features/`, `deliverables/`, and `standards/` are required framework directories under the configured docs root.
14. Features define user journeys and requirements (what/why); deliverables define and implement scoped specification contracts (what/how) for execution.
15. Proposals are optional ideation artifacts and may attach to features, deliverables, or both; they are not authoritative contracts.
16. User journeys are the core boundary signal for features and may represent human users, agents, or other systems.
17. Branch/worktree naming is opinionated: worktree equals branch name, and branch names are slashless.
18. Standards are expected in one canonical location under the configured docs root.
19. Framework philosophy is implementation-agnostic.
20. Board services are optional accelerators, not mandatory prerequisites.
21. `zazz-skills` is the skills repository for the Zazz Framework.

---

## Framework Maturity

Pre-1.0 working draft: `0.8.1`
