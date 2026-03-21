# Zazz Skills

**Skills for the Zazz Framework** — composable, role-scoped capabilities that let AI agents participate in spec-driven delivery from proposal through implementation and QA.

This repository is the canonical skill package for teams building with Zazz. Install these skills into your agent runtime (Cursor, Codex, or compatible harnesses) so agents can propose, specify, plan, execute, and validate deliverables within the framework.

**Full framework overview:** See [**`zazz-framework.md`**](zazz-framework.md) at the repo root for the complete framework philosophy, entities, document contracts, and operating principles.

---

## What You Get

Zazz Skills turn agents into first-class participants in your delivery workflow. Instead of ad-hoc prompts and handoffs, agents operate with:

- **Clear role boundaries** — proposal facilitator, FRD author, spec author, planner, worker, QA
- **Launch-and-leave execution** — once the approved context exists, planning, implementation, verification, and PR packaging can proceed with minimal human oversight
- **Framework-aware context** — specs, plans, tasks, and board state as first-class inputs
- **Composable specialization** — base QA plus frontend/backend specializations; optional board API integration
- **Standards alignment** — skills reference the repo's declared docs root for `standards/` and enforce TDD, accessibility, and conformance checks

---

## End-to-End Workflow

1. **Proposal** — `proposal-builder` facilitates discovery, options, tradeoffs, and recommendations; draft PRs are the preferred sharing surface while proposals are still in progress.
2. **Feature Definition** — `frd-builder` creates or evolves long-lived Feature Requirement Documents (`-FRD`) and milestone breakdowns, typically reviewed through the same PR workflow as durable code and docs.
3. **Spec** — `spec-builder` guides the Deliverable Owner through interactive SPEC authoring.
4. **Plan** — `planner` decomposes approved SPECs into execution-ready plans (or use runtime-native planning).
5. **Execute** — `worker` implements with TDD, dependency sequencing, and board sync.
6. **Validate** — `qa` (or `qa-frontend` / `qa-backend`) runs the full verification loop.
7. **Package Review** — `pr-builder` can turn the diff, SPEC, and QA evidence into reviewer-ready PR text.
8. **Gate** — Human UAT and PR review before merge.

---

## Skills Inventory

### Interactive, Human-In-The-Loop Skills

| Skill | Purpose |
|-------|---------|
| **proposal-builder** | Facilitates proposal discussions: why, options, tradeoffs, constraints, recommendation. Supports transcript-first and live facilitation patterns. |
| **frd-builder** | Creates and evolves Feature Requirement Documents (`-FRD`) for long-lived capabilities, current-state summaries, and milestone decomposition. |
| **spec-builder** | Interactive deliverable SPEC authoring. Guides the Owner through requirements, acceptance criteria, and testability. |

These skills are expected to work through conversation and iterative drafting with humans.

### Autonomous Execution Skills

| Skill | Purpose |
|-------|---------|
| **planner** | Decomposes approved SPECs into execution-ready plans with dependency-safe decomposition and AC traceability. |
| **worker** | Implementation execution with TDD, dependency/board sync, and testing discipline. |
| **qa** | Full verification loop, standards conformance, SPEC gap stewardship, rework generation, PR evidence. |

These are the framework's "launch-and-leave" skills: once they have approved inputs, they should drive toward a verified output with minimal human intervention until a real decision or approval gate is reached.

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
| **coordinator** | Placeholder for orchestration (not implemented in current iteration). |

---

## Getting Started

**New to Zazz?**

- Start with [`zazz-framework.md`](zazz-framework.md) — philosophy, entities, document contracts, operating principles.
- Then read [`worktree-setup.md`](worktree-setup.md) — required bare-repo + sibling-worktree operating model for execution.

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
- `<DOCS_ROOT>/features/` — long-lived Feature Requirement Documents (`-FRD`), user/system flows, and milestone history
- **Deliverable Specification (`-SPEC`)** — execution contract for a deliverable
- **Plan (`-PLAN`)** — optional explicit decomposition

The framework supports process-only usage, skills-assisted usage, and tool-assisted usage (e.g. Zazz Board). It leverages runtime-native agent capabilities (planning, decomposition, orchestration) instead of re-implementing them.

---

## Adoption Profiles

Zazz is **opinionated** about structure and **flexible** about how much you adopt:

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
zazz-framework.md — full framework philosophy, entities, document contracts
worktree-setup.md — operational guide for the required worktree model
```

---

## Propagation

This repo is the source of truth for the framework doc and skill definitions. Other repos using Zazz, including `zazz-board`, should copy or sync from here rather than treating downstream copies as authoritative.

**Reference:** [zazz-board](https://github.com/zazzcode/zazz-board)

```bash
rsync -avc /path/to/zazz-skills/zazz-framework.md /path/to/zazz-board/docs/zazz-framework.md
rsync -avc --delete /path/to/zazz-skills/.agents/skills/ /path/to/zazz-board/.agents/skills/
```

---

## License

See [LICENSE](LICENSE).
