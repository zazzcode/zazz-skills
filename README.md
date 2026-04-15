# Zazz Skills

Zazz is an opinionated framework for delivering software with humans and AI agents.
It exists to help teams build the right software, build it correctly, build it efficiently, and keep it maintainable as the system evolves.

Use Zazz when you want more than ad hoc agent prompting.
The framework gives teams durable product context, bounded execution contracts, explicit verification, and isolated worktree-based execution so they can move faster without losing clarity, quality, or control.

Its opinionated structure is the point.
Zazz draws hard lines between durable product knowledge and transient execution artifacts, expects clear acceptance criteria and verification, and uses worktrees as the default isolation model so both humans and agents can collaborate safely.

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

## Why Use Zazz

Zazz is designed for teams that want agent-assisted delivery to be reliable, reviewable, and maintainable rather than clever-but-chaotic.

- Keep long-lived product knowledge in durable docs instead of letting it disappear into chats, tickets, or transient execution notes.
- Break work into bounded deliverables with explicit acceptance criteria so implementation and QA can converge on a clear contract.
- Give agents enough approved context to operate with meaningful autonomy while preserving human approval, review, and merge gates.
- Use worktrees as the default execution boundary so active efforts stay isolated, recoverable, and easier to coordinate.
- Preserve the "why" behind the system while still moving quickly on the "what are we building right now?" question.

## Framework Position

Zazz is intentionally opinionated about why different artifacts exist and where they belong.

- Durable, continuously maintained documents such as `project.md`, proposals, feature requirements documents, and standards belong in Git or another Git-based service.
- Framework docs live under the repo's resolved docs root, commonly `docs/` or `.zazz/`, as declared by repo policy in `AGENTS.md` and optionally resolved through an environment variable when that repo chooses.
- Execution artifacts such as deliverable SPECs, PLANs, diagrams, and related working assets belong under `<DOCS_ROOT>/deliverables/` when they live on disk.
- Those deliverable files may be ignored locally, committed intentionally, or mirrored/tracked in an external system such as Zazz Board.
- Zazz Board is a valid integration pattern, not a framework requirement.
- Worktrees are a required part of the framework because they provide the isolation, recoverability, and execution boundaries the framework depends on.
- The opinionated operating rule is one active deliverable per worktree.
- If the team wants multiple versions of the work, those should be modeled as separate deliverables, and each deliverable gets its own worktree.
- Worktrunk is encouraged when a team wants a friendlier workflow on top of `git worktree`, but native Git remains the base capability.

## Document Model

The framework is intentionally project-first:

```text
<DOCS_ROOT>/
├── project.md
├── proposals/
└── features/
    └── milestones
        └── deliverables
            └── tasks
```

Each document type exists to solve a different coordination problem:

- `project.md` provides top-level durable orientation for the software project.
- proposals under `<DOCS_ROOT>/proposals/` provide a durable place to work through uncertainty before committing to a direction.
- feature requirements documents under `<DOCS_ROOT>/features/` provide a long-lived home for capability intent and milestone evolution.
- standards under `<DOCS_ROOT>/standards/` define how the software should be built.
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
| `worktree` | Sets up or manages the framework's required Zazz-style worktree model through the Worktrunk workflow used by the skill. |
| `zazz-board-api` | Companion utility skill for Zazz Board integration. |
| `jira-api` | Draft companion utility for Jira-backed repos. |

## Getting Started

If you are adopting the framework in another repo:

1. Read [zazz-framework.md](zazz-framework.md).
2. Read [docs/worktree-setup.md](docs/worktree-setup.md) because the framework requires the worktree operating model.
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

## Git and Execution Artifacts

Zazz Board is the reference implementation, but it is optional in the framework.

Git remains the durable home for:

- `project.md`
- proposals
- feature requirements documents
- standards
- framework and skill source

Execution artifacts generally live under `<DOCS_ROOT>/deliverables/` when they are kept on disk, and a repo may choose to:

- keep them ignored locally as execution working files
- commit them intentionally for a Git-native audit trail
- mirror or track them in an external system such as Zazz Board

External systems such as Zazz Board may also hold or reference:

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
