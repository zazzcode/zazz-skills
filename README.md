# Zazz Methodology & Skills

Zazz is an opinionated, spec-driven methodology for collaborative software delivery by builders and AI agents.
It combines a document framework, reusable skills, and delivery conventions so teams can preserve product intent while agents execute bounded work safely.

This repository is the canonical source for the Zazz methodology document and shared skills.
The reference implementation is [zazz-board](https://github.com/zazzcode/zazz-board), but methodology and skill changes should land here first before propagating outward.

## Quick Links

- [Methodology overview](zazz-methodology.md)
- [AGENTS.md example template](templates/AGENTS.md)
- [Worktree setup guide](docs/worktree-setup.md)
- [Agent execution discipline](docs/agent-execution-discipline.md)
- [Worktrunk cheat sheet](docs/wt-cheat-sheet.md)
- [GH-stack guide](docs/using-gh-stack.md)
- [Human-in-the-loop PR review strategy](docs/human-in-loop-pr-review-strategy.md)
- [Reference implementation: zazz-board](https://github.com/zazzcode/zazz-board)

## Why Zazz

- Keep long-lived product knowledge in durable docs instead of letting it disappear into chats, tickets, or transient execution notes.
- Break work into bounded deliverables with explicit acceptance criteria and verification evidence.
- Give agents enough approved context to operate with meaningful autonomy while preserving human approval, review, and merge gates.
- Use worktrees as the default execution boundary so active efforts stay isolated, recoverable, and easier to coordinate.
- Preserve the "why" behind the system while still moving quickly on the "what are we building right now?" question.

## Core Positions

Zazz is intentionally opinionated about artifact boundaries and execution workflow:

- Durable product knowledge belongs in Git or another Git-based review system.
- Deliverable specifications are the core execution contracts. They replace the old specification + plan split and contain intent, acceptance criteria, implementation guidance, test plan, halt conditions, and the agent implementation prompt.
- Mutable execution records, such as run logs and handoff notes, live under `<DOCS_ROOT>/execution/` or in a declared external system.
- Zazz Board is a valid integration pattern, not a methodology requirement.
- Worktrees are required because they provide the isolation, recoverability, and execution boundaries the methodology depends on.
- The normal operating rule is one active deliverable per worktree. The supported exception is a GH-stack lane, where one worktree can contain multiple stacked branches when ordered PRs make review easier.
- Worktrunk is encouraged when a team wants a friendlier workflow on top of `git worktree`, but native Git remains the base capability.
- PRs are draft-first by default. Agents use `pr-builder` to package draft PRs, author-side automated review runs before formal review, and the Deliverable Owner controls the transition from draft to ready for review.

## Document Model

The document framework is project-first. Each repo declares its docs root in `AGENTS.md`,
commonly `docs/` or `.zazz/`. Repos that resolve the docs root from an environment
variable should use `ZAZZ_DOCS_ROOT`, and its value must be a repo-relative path such as
`docs`, `.zazz`, or `packages/platform-docs`.

```text
<DOCS_ROOT>/
├── project.md
├── standards/
├── proposals/
├── features/
├── architecture/
├── specifications/
└── execution/
```

Each document type exists to solve a different coordination problem:

- `project.md` provides top-level durable orientation for the software project.
- `standards/` defines how the software should be built.
- `proposals/` provides a durable place to work through uncertainty before committing to a direction.
- `features/` contains long-lived feature requirements documents for capability intent and milestone evolution.
- `architecture/` contains project-level or feature-level technical design.
- `specifications/` contains local deliverable specifications when the repo keeps them on disk.
- `execution/` contains local mutable execution records such as run logs, handoff notes, QA findings, and recovery notes.

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
| `pr-review` | Reviews PRs or local diffs for correctness, evidence quality, low-value tests, agentic slop, redundancy, and scope drift. |

### Delivery and infrastructure skills

| Skill | Purpose |
| ----- | ------- |
| `pr-builder` | Produces draft-first PR packaging from diff, docs, stack context, and evidence. |
| `gh-stack` | Manages stacked branches and dependent PRs for incremental review workflows. |
| `worktree` | Sets up or manages the methodology's Zazz-style worktree model through the Worktrunk workflow used by the skill. |
| `zazz-board-api` | Companion utility skill for Zazz Board integration. |
| `jira-api` | Draft companion utility for Jira-backed repos. |

## Setup and Prerequisites

Before adopting Zazz in a repo, make sure the team has the supporting tools and repo
entry points the methodology expects:

- **Git**: required. Zazz uses branches, worktrees, commits, diffs, and PRs as core collaboration primitives. Install it through the normal path for your platform, such as Apple Command Line Tools on macOS, a Linux package manager, Git for Windows, or the downloads linked from [git-scm.com](https://git-scm.com/downloads).
- **Git hosting and PR tooling**: required for normal team use. GitHub is common, but the methodology also works with GitLab, Bitbucket, Forgejo, or another Git-based review system.
- **GitHub CLI (`gh`)**: recommended when the repo uses GitHub, draft PR automation, or `gh-stack`. Install from [cli.github.com](https://cli.github.com/) and run `gh auth login` before expecting agents to create or inspect PRs.
- **Worktrunk**: recommended for routine worktree management and required by the bundled `worktree` skill. Native `git worktree` remains the base capability. Install from [worktrunk.dev](https://worktrunk.dev/).
- **`gh-stack`**: optional, but recommended when the team wants stacked PR lanes. Install the GitHub CLI extension from [github/gh-stack](https://github.com/github/gh-stack); command reference lives at [github.github.com/gh-stack](https://github.github.com/gh-stack/reference/cli/).
- **Agent runtime**: required. Use Codex, Claude, Cursor, Warp, or another agent environment that can read repo instructions and load skills.
- **Project runtime/toolchain**: required for real execution. Install the repo's normal language runtimes, package managers, test tools, database services, and local environment helpers before asking agents to implement or verify work.
- **Node.js**: required when using the bundled `zazz-board-api` CLI helper, because `zazzctl` is a Node-based script.
- **External tracker or service**: optional. Zazz Board can centralize specifications, run logs, handoff notes, QA findings, file locks, and task state, but repos may also operate entirely from Git plus `<DOCS_ROOT>/execution/`.

Common setup commands:

```bash
gh auth login
gh extension install github/gh-stack
```

Recommended repo-local setup:

```text
repo/
├── AGENTS.md
├── .agents/
│   └── skills/
└── <DOCS_ROOT>/
    ├── project.md
    ├── standards/
    ├── features/
    ├── architecture/
    ├── specifications/
    └── execution/
```

Use `.agents/skills/` as the canonical repo-local skill location when vendoring Zazz
skills into a project. Runtime-specific files such as `CLAUDE.md`, `.claude/`, or
`.codex/` can either point agents at `.agents/skills/` or copy/sync selected skills
into the runtime's native skill directory.

## Getting Started

If you are adopting the methodology in another repo:

1. Read [zazz-methodology.md](zazz-methodology.md).
2. Review [templates/AGENTS.md](templates/AGENTS.md) because `AGENTS.md` declares repo-specific settings such as docs root, tracking system, branch policy, and review workflow.
3. Install the supporting tools your workflow needs: Git, Worktrunk, `gh`, `gh-stack`, and any project-specific build/test tools.
4. Read [docs/worktree-setup.md](docs/worktree-setup.md) because the methodology requires the worktree operating model.
5. Copy or sync the skills you want from `.agents/skills/` into the repo or your agent runtime.

## Installing Skills

The shared skills live under `.agents/skills/` so they stay AI-tool agnostic.

Common installation patterns:

- copy them into a runtime skill directory such as `$CODEX_HOME/skills/`
- vendor them into another repo's `.agents/skills/`
- point runtime-specific instructions such as `CLAUDE.md`, `.claude/`, or `.codex/` at the repo's `.agents/skills/` directory when the runtime supports that pattern
- sync this repo into downstream methodology consumers

Historical naming note:

- `feature-doc-builder` remains the skill name for compatibility, but the methodology's canonical artifact term is **feature requirements document**

## Artifact Storage

Git remains the durable home for `project.md`, proposal markdown files or proposal
pointers, feature requirements documents, architecture documents, standards,
methodology docs, and skill source.

Repos choose and document their execution-artifact policy in `AGENTS.md`:

- Proposals live under `<DOCS_ROOT>/proposals/` by default, but may live in Google Docs, SharePoint, or another shared document system when rich images, screenshots, diagrams, comments, or non-engineering stakeholder review make that the better collaboration surface. In that case, keep a stable Git-tracked pointer under `<DOCS_ROOT>/proposals/`.
- Deliverable specifications live under `<DOCS_ROOT>/specifications/` when kept on disk. They may be committed, ignored locally, mirrored externally, or stored only in a declared tracker.
- Mutable execution records live under `<DOCS_ROOT>/execution/` when kept on disk. This directory usually stays out of Git and holds run logs, handoff notes, QA findings, recovery notes, and related active-work records.
- Teams that do not use Zazz Board can rely exclusively on `<DOCS_ROOT>/execution/` for local execution records.
- Teams that use Zazz Board may use it as the centralized execution-record service so multiple agents can share specifications, run logs, handoff documents, QA findings, task state, and related information across worktrees and sessions.

## Propagation

This repo is meant to be copied or synced outward. Downstream repos should not become the authoritative source for shared methodology intent.

Example:

```bash
rsync -avc /path/to/zazz-skills/zazz-methodology.md /path/to/consumer-repo/zazz-methodology.md
rsync -avc --delete /path/to/zazz-skills/.agents/skills/ /path/to/consumer-repo/.agents/skills/
rsync -avc --delete /path/to/zazz-skills/docs/ /path/to/consumer-repo/docs/
```

## Changelog

### 2026-05-24 — Execution artifact location refresh

Renamed the default local mutable execution artifact directory from `<DOCS_ROOT>/implementation/` to
`<DOCS_ROOT>/execution/`, and clarified that Zazz Board can serve as the centralized execution-record surface for
run logs, handoff documents, QA findings, and related information shared across worktrees, agents, and sessions.

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
