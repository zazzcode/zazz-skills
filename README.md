# Zazz Skills

Agent skills that implement the Zazz framework—an opinionated, spec-driven approach to delivering software from spec to ship with AI agents. These skills provide the terminology, workflow, and document management for coordinating deliverables from specification through implementation and review, using the Zazz Board API.

**Zazz** is both a framework for multi-agent software development and a task/deliverable management application (Zazz Board). The framework enables AI agents to work autonomously and collaboratively on software deliverables. **Test-driven development (TDD)** is embedded throughout—every deliverable and task has well-defined test requirements and acceptance criteria before work begins.

## Overview

### Required Infrastructure Skill

Every agent MUST use this rule:

- **zazz-board-api** (type: `rule`) — Required API for all agents to communicate and manage deliverables/tasks

### Role Skills

Each agent loads one of these role-specific skills:


| Skill                  | Description                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **spec-builder-agent** | Guides the Deliverable Owner through an interactive process to create a comprehensive Deliverable Specification. Establishes testable AC and test requirements at the SPEC level. Assists the Owner in revising the SPEC.                                                                                                                                      |
| **planner-agent**      | One-shot decomposition of the Deliverable Specification into an Implementation Plan. Phases work, assigns files to tasks, maps test requirements to each task, identifies parallel sequences that avoid file conflicts. Does not participate in execution. When available, leverages vendor-native planning features (e.g., Warp Plan, Claude Code plan mode). |
| **coordinator-agent**  | Orchestrates execution once the plan is approved. Creates tasks from the PLAN via API, hands out tasks to workers, manages the task graph, responds to blockers, creates rework tasks from QA content. Adjusts the PLAN when the change mechanism is invoked.                                                                                                  |
| **worker-agent**       | Executes tasks with TDD—creates and runs tests per task, commits changes. Context is cleared between tasks.                                                                                                                                                                                                                                                    |
| **qa-agent**           | Verifies acceptance criteria via tests and evidence. Finds issues; when AC or tests are not met, messages the Coordinator to create rework tasks. Creates PR with full evidence once all criteria are satisfied. Fresh context per evaluation.                                                                                                                 |


Each agent has **independent context** and communicates through terminal interaction (MVP), with synchronization to Zazz Board notes/comments and Redis pub/sub via the API.

## Documentation

All documentation lives in the **docs/** directory:


| Document                                                     | Purpose                                                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| **[docs/FRAMEWORK.md](docs/FRAMEWORK.md)**                   | The Zazz framework—terminology, workflow, philosophy, and opinionated standards. **Start here.** |
| **[docs/WORKFLOW-OVERVIEW.md](docs/WORKFLOW-OVERVIEW.md)**   | Detailed stage-by-stage workflow and skill integration                                           |
| **[docs/AGENT-ARCHITECTURE.md](docs/AGENT-ARCHITECTURE.md)** | Technical architecture, agent roles, communication, concurrency                                  |
| **[docs/FRAMEWORK-SETUP.md](docs/FRAMEWORK-SETUP.md)**       | Integration with Warp, Claude, LangGraph, CrewAI, etc.                                           |


**Skills:** `.agents/skills/` — Individual skill definitions (planner, coordinator, worker, qa, spec-builder, zazz-board-api)

**Project structure:** `.zazz/` — Installed in repos using the framework. Contains `project.md`, `standards/` (atomic files + index.yaml), `deliverables/` (SPEC and PLAN files + index.yaml), plus runtime state (agent-locks.json, audit.log).

## Core Concepts

### Document Ownership and Storage

Documents live in the `.zazz/` folder (installed in project repos using the framework):


| Document                             | Location                                         | Owner                                                 |
| ------------------------------------ | ------------------------------------------------ | ----------------------------------------------------- |
| **project.md**                       | `.zazz/project.md`                               | Project Owner                                         |
| **Project standards**                | `.zazz/standards/` (atomic files + `index.yaml`) | Project Owner                                         |
| **Deliverable Specification (SPEC)** | `.zazz/deliverables/{name}-SPEC.md`              | Deliverable Owner (with spec-builder-agent)           |
| **Implementation Plan (PLAN)**       | `.zazz/deliverables/{name}-PLAN.md`              | Planner creates; Coordinator updates during execution |


Runtime files (agent-locks.json, audit.log, api-spec.json) also live in `.zazz/`.

### Project as Succession

A project or software product is a succession of deliverables. Greenfield projects typically start with a handful of deliverables in order to generate an MVP; as the product grows, deliverables shift to new features, enhancements, bug fixes, and refactors.

### Workflow Stages

1. **SPEC Creation** — Deliverable Owner + spec-builder-agent
2. **Planning** — Planner decomposes SPEC into PLAN (one-shot); Owner approves; Coordinator takes over
3. **Implementation** — Workers execute tasks from PLAN
4. **QA & Rework** — QA verifies against AC; creates rework content when needed; Coordinator creates rework tasks
5. **PR & Review** — QA creates PR; Deliverable Owner reviews and merges

### Two Boards

- **Deliverable Board** — For humans (Planning → Ready → In Progress → In Review → Stage → Done)
- **Task Board** — For agents (READY → IN_PROGRESS → QA → COMPLETED)

## Quick Start

1. Clone this skill collection
2. Set environment variables (see [docs/AGENT-ARCHITECTURE.md](docs/AGENT-ARCHITECTURE.md))
3. Create a Deliverable Specification with spec-builder-agent
4. Run Planner to create Implementation Plan (one-shot)
5. Owner approves PLAN; Coordinator takes over and creates tasks

```bash
# Planner (one-shot)
oz agent run --skill "planner-agent" --prompt "Decompose SPEC for deliverable DEL-001"

# Coordinator (after plan approval)
oz agent run --skill "coordinator-agent" --prompt "Start deliverable DEL-001 (plan approved)"
```

## MVP Status

This repository is an MVP documentation/skills package. The Zazz Board API integration skill is intentionally draft while the API is being finalized. For the MVP, **Deliverable Owner ↔ agent interaction happens primarily in terminal sessions**. Key decisions and outcomes should be posted to task notes/comments on Zazz Board for traceability.

## License

See [LICENSE](LICENSE).