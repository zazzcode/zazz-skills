# Zazz Skills
Reusable agent skills and companion docs for the Zazz Framework.

This repository packages practical, composable skills for proposal, specification, planning, implementation, and QA workflows.

## Source of truth and relationship to zazz-board
Framework and skill concepts are authored/matured first in the Zazz Board repository, then synced here:
- `zazz-board` GitHub: https://github.com/zazzcode/zazz-board

This repo is the portable skill/documentation package for teams using the framework across projects and runtimes.

## Framework snapshot (current model)
Zazz organizes delivery around:
- **Project → Feature → Milestone → Deliverable → Task**

Core document model:
- **Feature Requirements Document (`-FRD`)** — long-lived feature requirements and user journeys
- **Proposal (`-PROP`)** — exploratory option/tradeoff artifact (feature, deliverable, or joint scope)
- **Deliverable Specification (`-SPEC`)** — execution contract for a specific deliverable
- **Plan (`-PLAN`)** — optional explicit decomposition for execution

The framework supports process-only usage and tool-assisted usage (e.g., Zazz Board API/UI).

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

## Syncing from zazz-board
When board-side concepts change, sync canonical folders:

```bash
rsync -avc --delete /path/to/zazz-board/docs/ /path/to/zazz-skills/docs/
rsync -avc --delete /path/to/zazz-board/.agents/skills/ /path/to/zazz-skills/.agents/skills/
```

## License
See [`LICENSE`](LICENSE).
