# Zazz Skills

Skills and framework documents for the Zazz framework.

This repository is the canonical source of truth for:

- the Zazz framework document
- the shared skill definitions under `.agents/skills/`
- supporting framework docs under `docs/`

The reference implementation is [zazz-board](https://github.com/zazzcode/zazz-board), but framework and skill changes should land here first.

## Quick Links

- [Framework overview](zazz-framework.md)
- [Worktree setup guide](docs/worktree-setup.md)
- [Worktrunk cheat sheet](docs/wt-cheat-sheet.md)
- [AGENTS.md example template](templates/AGENTS.md)
- [Reference implementation: zazz-board](https://github.com/zazzcode/zazz-board)

## Current Framework Position

Zazz is opinionated about why different artifacts exist and where they belong.

- Durable, continuously maintained documents such as `project.md`, proposals, feature requirements documents, and standards belong in Git or another Git-based service.
- Transient execution artifacts such as deliverable SPECs, PLANs, diagrams, and related working assets generally belong in Zazz Board.
- Local deliverable files are useful as working copies, but they are not the default durable record.
- Worktrees are strongly encouraged because they improve isolation and recovery, but they are not a hard requirement of the framework.
- Worktrunk is encouraged when a team wants a friendlier workflow on top of `git worktree`, but native Git remains the base capability.

## Document Model

The framework is intentionally project-first:

```text
project.md
├── proposals/
└── features/
    └── milestones
        └── deliverables
            └── tasks
```

Each document type exists to solve a different coordination problem:

- `project.md` provides top-level durable orientation for the software project.
- proposals provide a durable place to work through uncertainty before committing to a direction.
- feature requirements documents provide a long-lived home for capability intent and milestone evolution.
- standards define how the software should be built.
- deliverables provide bounded execution contracts for one increment of work.

For the full framework model, read [zazz-framework.md](zazz-framework.md).

## Repository Layout

```text
.agents/skills/        shared Zazz skills, kept AI-tool agnostic
docs/                  supporting framework docs and guides
templates/             example files for repos adopting the framework
zazz-framework.md      primary framework philosophy and document model
```

## Skill Inventory

### Interactive skills

| Skill | Purpose |
| ----- | ------- |
| `proposal-builder` | Facilitates proposal discussions and drafts decision-ready proposals. |
| `feature-doc-builder` | Creates and evolves feature requirements documents for long-lived capabilities; the skill keeps its historical name for compatibility. |
| `spec-builder` | Guides bounded deliverable SPEC authoring. |

### Execution skills

| Skill | Purpose |
| ----- | ------- |
| `planner` | Converts an approved SPEC into an execution-ready PLAN. |
| `worker` | Implements approved work with TDD and execution-discipline. |
| `qa` | Runs verification against requirements, standards, and evidence. |
| `qa-frontend` | Frontend-focused QA specialization. |
| `qa-backend` | Backend-focused QA specialization. |
| `coordinator` | Coordinates execution of an approved PLAN across tasks and blockers. |

### Delivery and infrastructure skills

| Skill | Purpose |
| ----- | ------- |
| `pr-builder` | Produces reviewer-ready PR packaging from diff, docs, and evidence. |
| `worktree` | Sets up or manages Zazz-style worktrees using `git worktree` and Worktrunk; intended for environments where both are installed. |
| `zazz-board-api` | Companion utility skill for Zazz Board integration. |
| `jira-api` | Draft companion utility for Jira-backed repos. |

## Getting Started

If you are adopting the framework in another repo:

1. Read [zazz-framework.md](zazz-framework.md).
2. Read [docs/worktree-setup.md](docs/worktree-setup.md) if your repo will use the recommended worktree model.
3. Review [templates/AGENTS.md](templates/AGENTS.md).
4. Copy the skills you want from `.agents/skills/` into your agent runtime or repo.

## Installing Skills

The shared skills live under `.agents/skills/` so they stay AI-tool agnostic.

Common installation patterns:

- copy them into a runtime skill directory such as `$CODEX_HOME/skills/`
- vendor them into another repo's `.agents/skills/`
- sync this repo into downstream framework consumers

Historical naming note:

- `feature-doc-builder` remains the skill name for compatibility, but the framework's canonical artifact term is **feature requirements document**

## Zazz Board and Git

Zazz Board is the reference implementation and the preferred durable home for transient execution artifacts.

Git remains the durable home for:

- `project.md`
- proposals
- feature requirements documents
- standards
- framework and skill source

Zazz Board is generally the durable home for:

- deliverable SPECs
- deliverable PLANs
- execution diagrams and related working assets
- task and execution state

## Propagation

This repo is meant to be copied or synced outward. Downstream repos should not become the authoritative source for shared framework intent.

Example:

```bash
rsync -avc /path/to/zazz-skills/zazz-framework.md /path/to/consumer-repo/zazz-framework.md
rsync -avc --delete /path/to/zazz-skills/.agents/skills/ /path/to/consumer-repo/.agents/skills/
rsync -avc --delete /path/to/zazz-skills/docs/ /path/to/consumer-repo/docs/
```

## License

See [LICENSE](LICENSE).
