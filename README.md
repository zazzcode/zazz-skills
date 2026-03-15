# Zazz Skills

**Agent skills for the Zazz Framework** — composable, role-scoped capabilities that let AI agents participate in spec-driven delivery from proposal through implementation and QA.

This repository is the canonical skill package for teams building with Zazz. Install these skills into your agent runtime (Cursor, Codex, or compatible harnesses) so agents can propose, specify, plan, execute, and validate deliverables within the framework.

**Full framework overview:** See [**`zazz-framework.md`**](zazz-framework.md) at the repo root for the complete framework philosophy, entities, document contracts, and operating principles.

---

## What You Get

Zazz Skills turn agents into first-class participants in your delivery workflow. Instead of ad-hoc prompts and handoffs, agents operate with:

- **Clear role boundaries** — proposal facilitator, spec author, planner, worker, QA
- **Framework-aware context** — specs, plans, tasks, and board state as first-class inputs
- **Composable specialization** — base QA plus frontend/backend specializations; optional board API integration
- **Standards alignment** — skills reference `.zazz/standards/` and enforce TDD, accessibility, and conformance checks

---

## End-to-End Workflow

1. **Proposal** — `proposal-builder-agent` facilitates discovery, options, tradeoffs, and recommendations.
2. **Spec** — `spec-builder-agent` guides the Deliverable Owner through interactive SPEC authoring.
3. **Plan** — `planner-agent` decomposes approved SPECs into execution-ready plans (or use runtime-native planning).
4. **Execute** — `worker-agent` implements with TDD, dependency sequencing, and board sync.
5. **Validate** — `qa-agent` (or `qa-frontend-agent` / `qa-backend-agent`) runs the full verification loop.
6. **Gate** — Human UAT and PR review before merge.

---

## Skills Inventory

### Core Flow Skills

| Skill | Purpose |
|-------|---------|
| **proposal-builder-agent** | Facilitates proposal discussions: why, options, tradeoffs, constraints, recommendation. Supports transcript-first and live facilitation patterns. |
| **spec-builder-agent** | Interactive deliverable SPEC authoring. Guides the Owner through requirements, acceptance criteria, and testability. |
| **planner-agent** | Decomposes approved SPECs into execution-ready plans with dependency-safe decomposition and AC traceability. |
| **worker-agent** | Implementation execution with TDD, dependency/board sync, and testing discipline. |
| **qa-agent** | Full verification loop, standards conformance, SPEC gap stewardship, rework generation, PR evidence. |

### QA Specializations

| Skill | Focus |
|-------|-------|
| **qa-frontend-agent** | UI, accessibility, interaction patterns. Built on base `qa-agent`. |
| **qa-backend-agent** | API, data, auth, performance. Built on base `qa-agent`. |

### Infrastructure

| Skill | Purpose |
|-------|---------|
| **zazz-board-api** | Required for board/API interaction. OpenAPI-driven; fetch `{API_BASE_URL}/docs/json` as source of truth. |
| **coordinator-agent** | Placeholder for orchestration (not implemented in current iteration). |

---

## Getting Started

**New to Zazz?**

- Start with [`zazz-framework.md`](zazz-framework.md) — philosophy, entities, document contracts, operating principles.

**Installing skills**

- Copy `.agents/skills/` into your agent runtime’s skill directory (e.g. `$CODEX_HOME/skills/` or `.cursor/skills/`).
- Load skills by name when configuring agents.

**Using the board**

- Skills stay API-spec-driven: infer operations from the live OpenAPI document.
- Task prompts should be self-contained so workers can execute without re-reading full project docs.
- When multiple tasks touch the same files, use explicit dependency sequencing.

---

## Framework Snapshot

For the full framework overview and intent, see [**`zazz-framework.md`**](zazz-framework.md). Summary:

Zazz organizes delivery around:

- **Minimum hierarchy:** Project → Deliverable → Task
- **Expanded model:** Project → Feature → Milestone → Deliverable → Task

**Core document model:**

- `proposals/` — exploratory and pre-commitment proposal artifacts
- `features/` — long-lived feature requirements and user journeys
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
```

---

## Optional Sync Path

Skills are dog-fooded while building `zazz-board` and other projects. Some teams sync from `zazz-board`; others contribute directly here. Both are valid.

**Reference:** [zazz-board](https://github.com/zazzcode/zazz-board)

```bash
rsync -avc /path/to/zazz-board/docs/zazz-framework.md /path/to/zazz-skills/zazz-framework.md
rsync -avc --delete /path/to/zazz-board/.agents/skills/ /path/to/zazz-skills/.agents/skills/
```

---

## License

See [LICENSE](LICENSE).
