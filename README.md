# Zazz Skills
Agent skills and companion documentation for the Zazz Framework.
This repository packages reusable agent behaviors (`spec-builder`, `planner`, `worker`, `qa`, `coordinator`, API rules) and framework-oriented docs used across projects.

## Source of truth
Framework and skill concepts are authored/matured in the `zazz-board` repository first.
This repository is kept aligned by syncing from the board repo when concepts or workflows change.

## What this repository contains
- `.agents/skills/` — role skills and rule/API skills used by agents
- `docs/` — framework and workflow reference documents

## Skills inventory
- `spec-builder-agent` — interactive specification authoring for deliverables
- `planner-agent` — plan decomposition from SPEC to executable work breakdown
- `worker-agent` — implementation execution with testing expectations
- `qa-agent` — acceptance verification, test evidence, and rework definition
- `coordinator-agent` — orchestration and flow control across tasks
- `zazz-board-api` — required API interaction rules/utilities for board integration
- `database-baseline-refresh` — specialized workflow for baseline refresh operations

## Documentation index
Start here:
- [`docs/ZAZZ-framework.md`](docs/ZAZZ-framework.md) — framework philosophy, document contracts, feature/deliverable model, and operating principles

Supporting docs:
- [`docs/zazz-skills.md`](docs/zazz-skills.md) — agent-skills workflow overview and API-oriented orchestration concepts
- [`docs/deliverables_feature_SPEC.md`](docs/deliverables_feature_SPEC.md) — feature/deliverable specification reference
- [`docs/deliverables-mvp-PLAN.md`](docs/deliverables-mvp-PLAN.md) — MVP planning structure
- [`docs/features/project-governance/project-governance-PROP.md`](docs/features/project-governance/project-governance-PROP.md) — governance proposal for feature/proposal management
- [`docs/CLIENT-API-REFACTORING.md`](docs/CLIENT-API-REFACTORING.md)
- [`docs/database-baseline-refresh.md`](docs/database-baseline-refresh.md)
- [`docs/dynamic-task-graph-Implementation-Plan.md`](docs/dynamic-task-graph-Implementation-Plan.md)
- [`docs/swagger-for-agent-enhancement.md`](docs/swagger-for-agent-enhancement.md)
- [`docs/zazzctl-command-spec.md`](docs/zazzctl-command-spec.md)
- [`docs/ZAZZ-6-manual-test-plan.md`](docs/ZAZZ-6-manual-test-plan.md)
- [`docs/sample-worker-multi-agent-prompt-CODEX.md`](docs/sample-worker-multi-agent-prompt-CODEX.md)

## Quick start
1. Clone this repository.
2. Load needed skills from `.agents/skills/` in your agent runtime.
3. Read [`docs/ZAZZ-framework.md`](docs/ZAZZ-framework.md) before running multi-agent workflows.
4. Use `spec-builder-agent` to create/iterate deliverable specs, then `planner-agent`/`worker-agent`/`qa-agent` according to your process.

## Syncing from zazz-board
When board-side concepts change, sync the canonical folders:

```bash
rsync -avc --delete /path/to/zazz-board/docs/ /path/to/zazz-skills/docs/
rsync -avc --delete /path/to/zazz-board/.agents/skills/ /path/to/zazz-skills/.agents/skills/
```

## License
See [`LICENSE`](LICENSE).
