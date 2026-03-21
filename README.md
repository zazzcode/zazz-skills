# Zazz Skills

**Skills for the Zazz Framework**: composable capabilities that help humans and AI agents define the right software, build it correctly, and verify it before merge.

This repository is the canonical source of truth for the Zazz framework itself: its intent, its documentation, and its skill definitions. It exists to define the framework, document the opinionated process, and provide the skill contracts that consuming repos should adopt. The reference implementation is [zazz-board](https://github.com/zazzcode/zazz-board), but changes to the framework and skills should land here first.

**Full framework overview:** See [**`zazz-framework.md`**](zazz-framework.md) for the complete framework philosophy, document model, authority model, and operating rules.

---

## Why Zazz

Zazz is opinionated because the goal is not just to automate software work. The goal is to help teams:

- **Define the right software** through durable proposals, FRDs, milestones, and SPECs
- **Build it correctly** through explicit acceptance criteria, TDD, standards, and QA evidence
- **Build efficiently** through launch-and-leave execution once the governing context is approved
- **Keep it maintainable and expandable** by separating long-lived product knowledge from short-lived execution artifacts

The skills are a means to that end. They provide structured workflows for document creation, execution, verification, and PR preparation inside the framework.

---

## End-to-End Workflow

1. **Proposal**: `proposal-builder` helps evaluate why to proceed, what options exist, and which direction is worth taking. Proposal docs live in `<DOCS_ROOT>/proposals/` and are typically shared first through draft PRs.
2. **Feature Definition**: `frd-builder` works with a Product Owner or Project Owner to create or update a long-lived Feature Requirement Document in `<DOCS_ROOT>/features/`. The FRD captures why the feature exists, what is live now, what the system must do at a high level, and how the feature evolves across milestones.
3. **Deliverable Specification**: `spec-builder` helps a Deliverable Owner write the bounded execution contract for one deliverable, including acceptance criteria and testability expectations.
4. **Planning**: `planner` turns an approved SPEC into an execution-ready PLAN with sequencing, traceability, and verification steps.
5. **Execution**: `worker` implements the PLAN using TDD and keeps execution state synchronized with the board when applicable.
6. **Verification**: `qa`, `qa-frontend`, or `qa-backend` validates the result against acceptance criteria, standards, and evidence requirements.
7. **PR Packaging**: `pr-builder` prepares reviewer-ready PR titles and bodies from the diff, governing docs, and verification evidence.
8. **Owner Gates**: Owners approve durable docs, accept deliverable outcomes, review PRs, and merge. Agents may prepare and verify PRs, but they do not merge them.

The framework is intentionally feature-first. Durable product understanding comes before execution slicing.

---

## Skills Inventory

### Interactive, Human-In-The-Loop Skills

| Skill | Purpose |
|-------|---------|
| **proposal-builder** | Facilitates proposal discussions: why, options, tradeoffs, constraints, recommendation. Supports transcript-first and live facilitation patterns. |
| **frd-builder** | Creates and evolves Feature Requirement Documents (`-FRD`) for long-lived capabilities, current-state summaries, and milestone decomposition. |
| **spec-builder** | Interactive deliverable SPEC authoring. Guides the Owner through requirements, acceptance criteria, and testability. |

These skills are expected to work through dialogue, iterative drafting, and owner review. Their outputs are durable documents that shape what gets built and why.

### Autonomous Execution Skills

| Skill | Purpose |
|-------|---------|
| **planner** | Decomposes approved SPECs into execution-ready plans with dependency-safe decomposition and AC traceability. |
| **worker** | Implementation execution with TDD, dependency/board sync, and testing discipline. |
| **qa** | Full verification loop, standards conformance, SPEC gap stewardship, rework generation, PR evidence. |

These are the framework's launch-and-leave skills. Once they have approved inputs, they should drive toward a verified result with minimal human intervention until a real decision, approval, or merge gate is reached.

### QA Specializations

| Skill | Focus |
|-------|-------|
| **qa-frontend** | UI, accessibility, interaction patterns. Built on base `qa`. |
| **qa-backend** | API, data, auth, performance. Built on base `qa`. |

### Delivery Support

| Skill | Purpose |
|-------|---------|
| **pr-builder** | Builds reviewer-ready PR titles and bodies from the diff, SPEC/PLAN context, QA evidence, and manual validation notes. |

### Infrastructure

| Skill | Purpose |
|-------|---------|
| **zazz-board-api** | Required for board/API interaction. CLI-first via `zazzctl`, with OpenAPI as the protocol-validation and fallback surface in the reference implementation. |
| **coordinator** | Coordinates execution of an approved PLAN by materializing tasks, maintaining task graph state, and routing blockers or rework during execution. |

---

## Getting Started

**New to Zazz?**

- Start with [`zazz-framework.md`](zazz-framework.md) — philosophy, entities, document contracts, operating principles.
- Then read [`worktree-setup.md`](worktree-setup.md) — required bare-repo + sibling-worktree operating model for execution.
- Review [`templates/AGENTS.md`](templates/AGENTS.md) — example lean `AGENTS.md` contract for repos adopting the framework.

**Installing skills**

- Copy `.agents/skills/` into your agent runtime’s skill directory (e.g. `$CODEX_HOME/skills/` or `.cursor/skills/`).
- Load skills by name when configuring agents.

**Using the board**

- Agents should use the `zazz-board-api` skill in CLI-first mode through `zazzctl`.
- OpenAPI remains the protocol-validation and fallback surface in the reference implementation.
- Task prompts should be self-contained so workers can execute without re-reading full project docs.
- When multiple tasks touch the same files, use explicit dependency sequencing.

---

## Framework Snapshot

For the full framework overview and intent, see [**`zazz-framework.md`**](zazz-framework.md). Summary:

Zazz organizes delivery around:

- **Minimum hierarchy:** Project → Deliverable → Task
- **Expanded model:** Project → Feature → Milestone → Deliverable → Task

**Core document model:**

- `<DOCS_ROOT>/proposals/` — exploratory and pre-commitment proposal artifacts
- `<DOCS_ROOT>/features/` — long-lived Feature Requirement Documents (`-FRD`) that explain feature value, current behavior, system intent, and milestone evolution
- `<DOCS_ROOT>/standards/` — engineering guidance for how software must be built so it remains maintainable and expandable
- `<DOCS_ROOT>/deliverables/` — per-deliverable SPECs and optional PLANs, usually local to a worktree

**Authority model:**

- Product Owner defines feature value and milestone outcomes
- Project Owner defines repo or implementation-facing direction where needed
- Deliverable Owner approves deliverable scope, acceptance criteria, PR review, and merge
- Agents can execute autonomously inside approved contracts, but merge authority always remains with an authorized human reviewer

**Git-native collaboration:**

- durable docs are reviewed through branches, worktrees, draft PRs, and final PR review
- worktrees are required for active execution
- if a worktree goes down the wrong path, it can be abandoned and the governing docs revisited

---

## Adoption Profiles

Zazz is opinionated about structure and flexible about adoption depth:

| Profile | Scope | Best for |
|---------|-------|----------|
| **Deliverable-down** | Deliverable → Task with SPEC/PLAN | Teams wanting immediate execution rigor |
| **Feature + deliverable** | Feature requirements + feature-linked deliverables | Tracking capability evolution |
| **Full model** | Feature + Milestone + Deliverable + Task | Larger roadmaps, cross-repo coordination |

Start small and expand over time.

---

## Repository Layout

```
.agents/skills/   — role skills, specializations, API/utility skills
templates/        — example files for repos adopting the framework
zazz-framework.md — full framework philosophy, entities, document contracts
worktree-setup.md — operational guide for the required worktree model
```

---

## Propagation

This repo is the source of truth for the framework's intent, framework documentation, and skill definitions. Other repos using Zazz, including `zazz-board`, should copy or sync from here rather than treating downstream copies as authoritative.

**Reference:** [zazz-board](https://github.com/zazzcode/zazz-board)

```bash
rsync -avc /path/to/zazz-skills/zazz-framework.md /path/to/zazz-board/docs/zazz-framework.md
rsync -avc --delete /path/to/zazz-skills/.agents/skills/ /path/to/zazz-board/.agents/skills/
```

---

## License

See [LICENSE](LICENSE).
