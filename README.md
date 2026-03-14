# Zazz Skills
Reusable agent skills and companion docs for the Zazz Framework.

This repository packages practical, composable skills for proposal, specification, planning, implementation, and QA workflows.

This repo is a standalone skill and documentation package. Contributions can be proposed directly in this repository.

## Framework snapshot (current model)
Zazz organizes delivery around:
- **Project → Feature → Milestone → Deliverable → Task**

Core document model:
- **Feature Requirements Document (`-FRD`)** — long-lived feature requirements and user journeys
- **Proposal (`-PROP`)** — exploratory option/tradeoff artifact (feature, deliverable, or joint scope)
- **Deliverable Specification (`-SPEC`)** — execution contract for a specific deliverable
- **Plan (`-PLAN`)** — optional explicit decomposition for execution

The framework supports process-only usage and tool-assisted usage (e.g., Zazz Board API/UI).

## Adoption profiles (flexible by design)
Zazz is intentionally **opinionated** about structure and workflow, but **flexible** about how much of the model you adopt at once.

Common adoption profiles:
1. **Deliverable-down adoption** (minimum practical slice)
   - Focus on `Deliverable → Task` execution with SPEC/PLAN and agent workflows.
   - Useful for teams that want immediate execution rigor without rolling out full feature/milestone governance yet.
2. **Feature + deliverable adoption**
   - Add long-lived feature requirements (`-FRD`) and feature-linked deliverables.
   - Useful for tracking capability evolution across multiple deliverables.
3. **Full model adoption**
   - Adopt Feature + Milestone + Deliverable + Task across planning and execution.
   - Useful for organizations coordinating larger cross-feature or cross-repo delivery.

You can start small and expand to deeper framework layers over time.

## What this repository contains
- `.agents/skills/` — role skills, specialization skills, and API/utility skills
- `docs/` — framework philosophy and supporting reference docs

## Skills inventory
### Core flow skills
- `proposal-builder-agent` — facilitator + scribe for proposal discussions (why, options, tradeoffs, constraints, recommendation), including transcript-first workflows and Zoom-live facilitation pattern when integrations exist
- `spec-builder-agent` — interactive deliverable SPEC authoring
- `planner-agent` — decomposition from approved SPEC to execution-ready PLAN
- `worker-agent` — implementation execution with dependency/board synchronization and testing discipline
- `qa-agent` — base QA contract: full verification loop, standards conformance checks, SPEC gap stewardship, rework generation, PR evidence/manual test plan requirements

### QA specializations
- `qa-frontend-agent` — frontend/UI accessibility/interaction-focused QA specialization built on base `qa-agent`
- `qa-backend-agent` — API/data/auth/performance-focused QA specialization built on base `qa-agent`

### Infrastructure and utilities
- `zazz-board-api` — required board/API interaction skill and CLI adapter guidance
- `database-baseline-refresh` — specialized baseline refresh workflow
- `coordinator-agent` — available orchestration skill artifact (current projects may run with human-as-coordinator operationally)

## Documentation index
Start here:
- [`docs/ZAZZ-framework.md`](docs/ZAZZ-framework.md) — framework philosophy, entities, document contracts, and operating principles

Supporting references:
- [`docs/zazz-skills.md`](docs/zazz-skills.md)
- [`docs/deliverables_feature_SPEC.md`](docs/deliverables_feature_SPEC.md)
- [`docs/deliverables-mvp-PLAN.md`](docs/deliverables-mvp-PLAN.md)
- [`docs/features/project-governance/project-governance-PROP.md`](docs/features/project-governance/project-governance-PROP.md)
- [`docs/CLIENT-API-REFACTORING.md`](docs/CLIENT-API-REFACTORING.md)
- [`docs/database-baseline-refresh.md`](docs/database-baseline-refresh.md)
- [`docs/dynamic-task-graph-Implementation-Plan.md`](docs/dynamic-task-graph-Implementation-Plan.md)
- [`docs/swagger-for-agent-enhancement.md`](docs/swagger-for-agent-enhancement.md)
- [`docs/zazzctl-command-spec.md`](docs/zazzctl-command-spec.md)
- [`docs/ZAZZ-6-manual-test-plan.md`](docs/ZAZZ-6-manual-test-plan.md)
- [`docs/sample-worker-multi-agent-prompt-CODEX.md`](docs/sample-worker-multi-agent-prompt-CODEX.md)

## Typical workflow
1. Use `proposal-builder-agent` when discovery/option analysis is needed.
2. On proposal sign-off, transition to `spec-builder-agent`.
3. Use `planner-agent` to produce/update execution plan.
4. Execute with `worker-agent`.
5. Validate with `qa-agent` or a QA specialization (`qa-frontend-agent` / `qa-backend-agent`).

## Development note (optional sync path)
These skills are actively dog-fooded and improved while building `zazz-board` and other software projects.
Some teams apply a board-first workflow (`zazz-board` → sync to this repo), while others contribute directly here. Both workflows are valid.

Reference repository:
- `zazz-board` GitHub: https://github.com/zazzcode/zazz-board

Example sync commands:

```bash
rsync -avc --delete /path/to/zazz-board/docs/ /path/to/zazz-skills/docs/
rsync -avc --delete /path/to/zazz-board/.agents/skills/ /path/to/zazz-skills/.agents/skills/
```

## License
See [`LICENSE`](LICENSE).
