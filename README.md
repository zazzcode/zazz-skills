# Zazz Skills
Reusable agent skills and companion docs for the Zazz Framework.

This repository packages practical, composable skills for proposal, specification, planning, implementation, and QA workflows.

This repo is a standalone skill and documentation package. Contributions can be proposed directly in this repository.

## Framework snapshot (current model)
Zazz organizes delivery around:
- minimum execution hierarchy: **Project → Deliverable → Task**
- expanded framework model: **Project → Feature → Milestone → Deliverable → Task**

Milestones remain part of the framework's coordination model, but they are feature-associated rather than standalone repository artifacts. They are not represented by a required repository document or `milestones/` directory, and in service-assisted usage milestone state typically lives in Zazz Board.

Core document model:
- **Feature Requirements Document (`-FRD`)** — long-lived feature requirements and user journeys
- **Proposal (`-PROP`)** — exploratory option/tradeoff artifact (feature, deliverable, or joint scope)
- **Deliverable Specification (`-SPEC`)** — execution contract for a specific deliverable
- **Plan (`-PLAN`)** — optional explicit decomposition for execution

The framework supports process-only usage and tool-assisted usage (e.g., Zazz Board API/UI).
It also intentionally leverages runtime-native agent capabilities (for example planning, task decomposition, orchestration, and context handling) instead of re-implementing those capabilities in the framework when the underlying model/harness already does them better.
It is also compatible with multiple repository branch strategies, including staged integration flows and direct-to-main merge models.

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
   - Useful for organizations coordinating larger feature roadmaps or cross-repo delivery.

You can start small and expand to deeper framework layers over time.

## What this repository contains
- `.agents/skills/` — role skills, specialization skills, and API/utility skills
- `docs/` — framework philosophy and supporting reference docs

## Skills inventory
### Core flow skills
- `proposal-builder-agent` — facilitator + scribe for proposal discussions (why, options, tradeoffs, constraints, recommendation), including transcript-first workflows and Zoom-live facilitation pattern when integrations exist
- `spec-builder-agent` — interactive deliverable SPEC authoring
- `planner-agent` — decomposition from approved SPEC to execution-ready PLAN (optional when your runtime provides reliable built-in planning and task decomposition)
- `worker-agent` — implementation execution with dependency/board synchronization and testing discipline
- `qa-agent` — base QA contract: full verification loop, standards conformance checks, SPEC gap stewardship, rework generation, PR evidence/manual test plan requirements

### QA specializations
- `qa-frontend-agent` — frontend/UI accessibility/interaction-focused QA specialization built on base `qa-agent`
- `qa-backend-agent` — API/data/auth/performance-focused QA specialization built on base `qa-agent`

### Infrastructure and utilities
- `zazz-board-api` — required board/API interaction skill and CLI adapter guidance
- `coordinator-agent` — placeholder orchestration artifact (not implemented in current iteration)

## Board API operating notes
- Skills should stay API-spec-driven: fetch the running board OpenAPI document at `{API_BASE_URL}/docs/json` and infer operations from descriptions rather than hardcoding route assumptions.
- Task prompts should be self-contained so workers can execute without re-reading full project documents (goal, instructions, relevant technical context, acceptance criteria, required tests).
- When multiple tasks touch the same files, favor explicit dependency sequencing to reduce merge/edit conflicts between concurrent workers.

## Documentation index
Start here:
- [`docs/zazz-framework.md`](docs/zazz-framework.md) — framework philosophy, entities, document contracts, and operating principles

Supporting references:
- [`docs/sample-worker-multi-agent-prompt-CODEX.md`](docs/sample-worker-multi-agent-prompt-CODEX.md)

## Typical workflow
1. Use `proposal-builder-agent` when discovery/option analysis is needed.
2. On proposal sign-off, transition to `spec-builder-agent`.
3. Produce/update execution plan using either `planner-agent` or runtime-native planning (if your agent platform already provides robust built-in planning and task decomposition).
4. Human owner/facilitator acts as coordinator for handoffs and rework orchestration.
5. Execute with `worker-agent`.
6. Validate with `qa-agent` or a QA specialization (`qa-frontend-agent` / `qa-backend-agent`).
7. Run human UAT and PR review before merge; either approve for merge/closure, request bounded rework in the same deliverable, or create/select a successor or variant path.

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
