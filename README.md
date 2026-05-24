# Zazz Methodology & Skills

Zazz is a **methodology** that includes a document framework, skills, and tooling. This repository is the canonical source for the methodology document and all shared skills.

Zazz is an opinionated, spec-driven methodology for collaborative software delivery by builders and AI agents.
It exists to help teams build the right software, build it correctly, build it efficiently, and keep it maintainable as the system evolves.

A deliverable specification is the methodology's core execution contract. It replaces the old specification + plan split and contains both intent and implementation guidance for one bounded increment.

Use Zazz when you want more than ad hoc agent prompting.
The methodology gives teams durable product context, bounded execution contracts, explicit verification, and isolated worktree-based execution so they can move faster without losing clarity, quality, or control.

Its opinionated structure is the point.
Zazz draws hard lines between durable product knowledge and transient execution artifacts, expects clear acceptance criteria and verification, and uses worktrees as the default isolation model so builders and AI agents can collaborate safely.

The reference implementation is [zazz-board](https://github.com/zazzcode/zazz-board), but methodology and skill changes should land here first.

## Quick Links

- [Methodology overview](zazz-methodology.md)
- [AGENTS.md example template](templates/AGENTS.md)
- [Worktree setup guide](docs/worktree-setup.md)
- [Worktrunk cheat sheet](docs/wt-cheat-sheet.md)
- [GH-stack guide](docs/using-gh-stack.md)
- [Human-in-the-loop PR review strategy](docs/human-in-loop-pr-review-strategy.md)
- [Reference implementation: zazz-board](https://github.com/zazzcode/zazz-board)

## Why Use Zazz

Zazz is designed for teams that want agent-assisted delivery to be reliable, reviewable, and maintainable rather than clever-but-chaotic.

- Keep long-lived product knowledge in durable docs instead of letting it disappear into chats, tickets, or transient execution notes.
- Break work into bounded deliverables with explicit acceptance criteria so implementation and QA can converge on a clear contract.
- Give agents enough approved context to operate with meaningful autonomy while preserving human approval, review, and merge gates.
- Use worktrees as the default execution boundary so active efforts stay isolated, recoverable, and easier to coordinate.
- Preserve the "why" behind the system while still moving quickly on the "what are we building right now?" question.

## Methodology Position

Zazz is intentionally opinionated about why different artifacts exist and where they belong.

- Durable, continuously maintained documents such as `project.md`, proposals, feature requirements documents, and standards belong in Git or another Git-based service.
- Methodology docs live under the repo's resolved docs root, commonly `docs/` or `.zazz/`, as declared by repo policy in `AGENTS.md` and optionally resolved through an environment variable when that repo chooses.
- Feature requirements documents live under `<DOCS_ROOT>/features/`.
- Architecture documents live under `<DOCS_ROOT>/architecture/` and may be project-level or feature-level.
- Deliverable specifications live under `<DOCS_ROOT>/specifications/` when they are committed to the repo. Because that directory already names the artifact type, filenames do not need a `SPEC` suffix.
- Deliverable specifications may also be stored in Zazz Board or another explicitly declared tracking system when they are not committed in Git.
- Zazz Board is a valid integration pattern, not a methodology requirement.
- Worktrees are a required part of the methodology because they provide the isolation, recoverability, and execution boundaries the methodology depends on.
- The normal operating rule is one active deliverable per worktree.
- The supported exception is a GH-stack lane: one worktree can contain multiple stacked branches, and therefore one or more deliverables, when ordered PRs make the work easier to review.
- Worktrunk is encouraged when a team wants a friendlier workflow on top of `git worktree`, but native Git remains the base capability.
- PRs are draft-first by default. Agents use `pr-builder` to package draft PRs, author-side automated review runs before formal review, and the Deliverable Owner controls the transition from draft to ready for review.

## Document Model

The document framework is intentionally project-first:

```text
<DOCS_ROOT>/
├── project.md
├── proposals/
├── features/
├── architecture/
├── specifications/
└── standards/
```

Each document type exists to solve a different coordination problem:

- `project.md` provides top-level durable orientation for the software project.
- proposals under `<DOCS_ROOT>/proposals/` provide a durable place to work through uncertainty before committing to a direction.
- feature requirements documents under `<DOCS_ROOT>/features/` provide a long-lived home for capability intent and milestone evolution.
- architecture documents under `<DOCS_ROOT>/architecture/` describe project-level or feature-level technical shape.
- deliverable specifications under `<DOCS_ROOT>/specifications/`, Zazz Board, or another declared tracker provide bounded execution contracts for one increment of work.
- standards under `<DOCS_ROOT>/standards/` define how the software should be built.

For the full methodology model, read [zazz-methodology.md](zazz-methodology.md).

## Repository Layout

```text
.agents/skills/        shared Zazz skills, kept AI-tool agnostic
docs/                  supporting methodology docs and guides
templates/             example files for repos adopting the methodology
zazz-methodology.md    primary methodology philosophy and document model
```

## Skill Inventory

### Interactive skills

| Skill | Purpose |
| ----- | ------- |
| `proposal-builder` | Facilitates proposal discussions and drafts decision-ready proposals. |
| `feature-doc-builder` | Creates and evolves feature requirements documents for long-lived capabilities; the skill keeps its historical name for compatibility. |
| `architecture-doc-builder` | Creates and evolves project-level or feature-level architecture documents. |
| `spec-builder` | Guides bounded deliverable specification authoring, including prescriptive execution sequence and implementation guidance. |

### Execution and verification skills

| Skill | Purpose |
| ----- | ------- |
| `qa` | Runs verification against requirements, standards, and evidence. |
| `qa-frontend` | Frontend-focused QA specialization. |
| `qa-backend` | Backend-focused QA specialization. |

### Delivery and infrastructure skills

| Skill | Purpose |
| ----- | ------- |
| `pr-builder` | Produces draft-first PR packaging from diff, docs, stack context, and evidence. |
| `gh-stack` | Manages stacked branches and dependent PRs for incremental review workflows. |
| `worktree` | Sets up or manages the methodology's Zazz-style worktree model through the Worktrunk workflow used by the skill. |
| `zazz-board-api` | Companion utility skill for Zazz Board integration. |
| `jira-api` | Draft companion utility for Jira-backed repos. |

## Getting Started

If you are adopting the methodology in another repo:

1. Read [zazz-methodology.md](zazz-methodology.md).
2. Review [templates/AGENTS.md](templates/AGENTS.md) because `AGENTS.md` declares repo-specific settings such as docs root, tracking system, branch policy, and review workflow.
3. Read [docs/worktree-setup.md](docs/worktree-setup.md) because the methodology requires the worktree operating model.
4. Copy the skills you want from `.agents/skills/` into your agent runtime or repo.

## Installing Skills

The shared skills live under `.agents/skills/` so they stay AI-tool agnostic.

Common installation patterns:

- copy them into a runtime skill directory such as `$CODEX_HOME/skills/`
- vendor them into another repo's `.agents/skills/`
- sync this repo into downstream methodology consumers

Historical naming note:

- `feature-doc-builder` remains the skill name for compatibility, but the methodology's canonical artifact term is **feature requirements document**

## Git and Execution Artifacts

Zazz Board is the reference implementation, but it is optional in the methodology.

Git remains the durable home for:

- `project.md`
- proposals
- feature requirements documents
- standards
- methodology and skill source

Deliverable specifications live under `<DOCS_ROOT>/specifications/` when they are kept on disk, and a repo may choose to:

- commit them intentionally for a Git-native audit trail
- store or track them in an external system such as Zazz Board
- use a combination of committed docs and external records when repo policy defines that explicitly

External systems such as Zazz Board may hold or reference:

- deliverable specifications
- execution diagrams and related working assets
- task and execution state

## Propagation

This repo is meant to be copied or synced outward. Downstream repos should not become the authoritative source for shared methodology intent.

Example:

```bash
rsync -avc /path/to/zazz-skills/zazz-methodology.md /path/to/consumer-repo/zazz-methodology.md
rsync -avc --delete /path/to/zazz-skills/.agents/skills/ /path/to/consumer-repo/.agents/skills/
rsync -avc --delete /path/to/zazz-skills/docs/ /path/to/consumer-repo/docs/
```

## Changelog

### 2026-05-23 — Methodology and skill alignment refresh

Aligned the methodology, README, supporting docs, and shared skills around the current Zazz operating model: feature,
architecture, and specification document locations; draft-first PR packaging; GH-stack review lanes; Zazz Board or
Git-backed specification storage; and simpler skill customization through direct forking/editing instead of extension
overlays.

### 2026-05-17 — Execution model simplification

**Removed `planner` skill (obsolete).**
Modern agents have large context windows and native planning capabilities. A separate plan artifact added ceremony without value. The deliverable specification now includes a prescriptive execution sequence, and the agent decomposes implementation dynamically from live repo context.

- Rationale: agents now read a deliverable specification, inspect the codebase, and internally plan tool-call sequences. A pre-baked text plan was rarely more useful than the specification's scope boundaries plus the agent's own discovery.
- Migration: previous plan files are replaced by the specification's execution sequence section. No loss of planning rigor; the planning is now done by the agent at execution time.

**Removed `worker` skill (execution is now native agent behavior).**
Writing code, running tests, and iterating is what modern agents do by default. The `worker` skill conflated native execution with board state sync, which is now handled by `zazz-board-api` or the agent harness's native subagent features when multi-agent orchestration is needed.

- Rationale: agents don't need a skill wrapper to tell them "write code, then run tests." TDD and iteration are intrinsic. Multi-agent coordination is now handled by harness-native subagent features (GPT-4.5, Opus, etc.), not a methodology skill.
- Migration: single-agent execution needs no skill. Multi-agent execution uses the agent harness's native subagent/teams feature. External system sync uses `zazz-board-api` when needed.

**Removed `coordinator` skill (harness-native subagents replace it).**
Modern agent harnesses (e.g., GPT-4.5, Opus) include built-in manager/subagent orchestration, task decomposition, and dependency management. The `coordinator` skill replicated what the harness now does natively. Teams should use the agent's native multi-agent mode instead of a methodology-level coordination wrapper.

- Rationale: when the harness can spawn subagents, assign file ownership, and enforce serialization automatically, a separate `coordinator` skill adds indirection and drift. The methodology should document how to use harness-native coordination, not reimplement it.
- Migration: use the agent's native subagent or "teams" feature. The deliverable specification's prescriptive execution sequence provides the decomposition input; the harness handles the orchestration.

**Added `architecture-doc-builder` and `gh-stack` skills.**
These reflect evolved practices: paired architecture documents for feature requirements, and stacked PR workflows for incremental review.

**The deliverable specification is now the single execution contract.**
The old specification + plan split is gone. The deliverable specification contains:
- capability statement and acceptance criteria
- prescriptive execution sequence
- test plan and halt conditions

**Renamed "Zazz Framework" → "Zazz Methodology."**
The umbrella term is now "Zazz Methodology" to better reflect that it encompasses more than a document model — it includes skills, tooling, and the overall approach to structuring features, milestones, deliverables, and specifications. "Document framework" is retained as a term for the document model component specifically (hierarchy, naming conventions, file layout). The primary document has been renamed from `zazz-framework.md` to `zazz-methodology.md`.

**Added supporting methodology docs.**
Incorporated guidelines from active project work on feature, architecture, specification-driven development, worktree, and stacked-branch methodology.

## License

See [LICENSE](LICENSE).
