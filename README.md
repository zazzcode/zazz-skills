# Zazz Methodology & Skills

Zazz is an operating model for AI-assisted software delivery. It helps teams use agents to move faster while keeping product direction, engineering quality, review discipline, and merge authority in human hands.

This repository is the canonical source for the Zazz methodology and shared skills. Downstream repos can vendor or sync these docs and skills, but methodology changes should land here first.

## Executive Overview

AI agents can produce code quickly. The hard part is making sure the team is building the right thing, the implementation is reviewable, the evidence is credible, and the knowledge survives after merge. Zazz provides the structure for that.

Zazz gives executives and engineering teams:

- **Faster delivery with control:** agents can implement and verify bounded work, while humans keep scope, product signoff, review, approval, and merge authority.
- **Clearer product intent:** `project.md`, proposals, architecture docs, feature requirements, and milestones preserve why the work matters before code is written.
- **Executable delivery contracts:** deliverable specifications turn intent into scoped implementation work with acceptance criteria, test plans, standards, and halt conditions.
- **Ongoing standards conformance:** localized, evidence-backed maintenance PRs keep legacy and existing code aligned with adopted standards instead of letting drift accumulate.
- **Cleaner parallel execution:** isolated worktrees keep active agent work separate, recoverable, and easier to coordinate across teams or branches.
- **Stronger review signal:** `qa-testing` verifies behavior and evidence, `pr-builder` packages the pull request, and `pr-review` runs automated self-review before human review and merge.
- **Durable organizational knowledge:** shipped work updates product, architecture, and standards docs so decisions do not disappear into chats, tickets, or PR comments.

The methodology is intentionally Git-native. Durable docs, code, review evidence, automated review, human approval, and merge all move through normal branch and PR workflows. The shared skills in `.agents/skills/` operationalize the workflow so teams can apply it consistently across projects and agent runtimes.

## Quick Links

- [Methodology overview](zazz-methodology.md)
- [Methodology sections](docs/methodology/README.md)
- [Standards baseline](docs/standards/README.md)
- [Standards index](docs/standards/index.yaml)
- [AGENTS.md example template](templates/AGENTS.md)
- [Worktree setup guide](docs/worktree-setup.md)
- [Agent execution discipline](docs/agent-execution-discipline.md)
- [Worktrunk cheat sheet](docs/wt-cheat-sheet.md)
- [GH-stack guide](docs/using-gh-stack.md)
- [Human-in-the-loop PR review strategy](docs/human-in-loop-pr-review-strategy.md)
- [Code review graph guidance](docs/code-review-graph.md)
- [Reference implementation: zazz-board](https://github.com/zazzcode/zazz-board)

## Workflow

```text
project.md
  -> architecture.md
  -> proposals/
  -> features/ and milestones
  -> specifications/
  -> deterministic quality gates
  -> standards conformance maintenance
  -> code generation
  -> testing and validation
  -> PR packaging and automated review
  -> human review and merge
```

Read [zazz-methodology.md](zazz-methodology.md) for the entry point, then use the focused [methodology sections](docs/methodology/README.md) for the part of the workflow you are working on.

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

For the methodology progression and section table of contents, read [zazz-methodology.md](zazz-methodology.md).

## Repository Layout

```text
.agents/skills/        shared Zazz skills, kept AI-tool agnostic
docs/                  supporting methodology docs and guides
docs/standards/        reusable software engineering standards
templates/             example files for repos adopting the methodology
zazz-methodology.md    methodology overview and section table of contents
docs/methodology/      focused methodology section docs
```

## Methodology Library

The methodology is split so teams can read only the part of the progression they are working on:

| Stage | Document |
| ----- | -------- |
| Executive overview and table of contents | [zazz-methodology.md](zazz-methodology.md) |
| Project orientation | [docs/methodology/project.md](docs/methodology/project.md) |
| Architecture direction | [docs/methodology/architecture.md](docs/methodology/architecture.md) |
| Proposals and decisions | [docs/methodology/proposals.md](docs/methodology/proposals.md) |
| Features and milestones | [docs/methodology/features-and-milestones.md](docs/methodology/features-and-milestones.md) |
| Deliverable specifications | [docs/methodology/specifications.md](docs/methodology/specifications.md) |
| Deterministic quality gates and standards conformance | [docs/methodology/deterministic-quality.md](docs/methodology/deterministic-quality.md) |
| Code generation | [docs/methodology/code-generation.md](docs/methodology/code-generation.md) |
| Testing and validation | [docs/methodology/testing-and-validation.md](docs/methodology/testing-and-validation.md) |
| PR creation | [docs/methodology/pr-creation.md](docs/methodology/pr-creation.md) |
| Automated self-review | [docs/methodology/self-review.md](docs/methodology/self-review.md) |
| Human review and merge | [docs/human-in-loop-pr-review-strategy.md](docs/human-in-loop-pr-review-strategy.md) |

Each section includes a `Relevant Skills` table that explains which skills apply and how they improve process efficiency.

## Standards Library

Start with [docs/standards/README.md](docs/standards/README.md). The standards library is also indexed by [docs/standards/index.yaml](docs/standards/index.yaml) so agents can load the smallest relevant standard set for a task.

The standards are baseline templates for efficient AI-assisted software product development, not a universal corporate policy. Teams adopting Zazz should keep the generic methodology standards, replace stack-specific examples that do not fit, and add their own requirements for security, privacy, compliance, accessibility, release management, code ownership, and review evidence. The important habit is to make engineering expectations explicit enough that humans and agents can implement, test, and review against the same source of truth.

Recommended adoption flow:

1. Copy or sync `docs/standards/` into the adopting repository's docs root.
2. Read `docs/standards/README.md` and decide which standards are generic methodology rules for your team.
3. Treat Python, React, SQL Server, AWS Lambda, GitHub Actions, and similar documents as stack-specific baseline examples. Keep them only when they match your architecture, or replace them with equivalent standards for your stack.
4. Update `docs/standards/index.yaml` so `applies_to.paths`, `applies_to.activities`, and `purpose` match the adopting repository.
5. Run a sensitive-reference scan before publishing the adapted standards. At minimum, search for personal names, local checkout paths, restricted project names, restricted repository URLs, and examples that only make sense in the source repository.
6. Add any organization-specific approval, compliance, security, privacy, accessibility, support, and evidence requirements that are required before merge.

| Area | Standards |
| ---- | --------- |
| Core structure and docs | Generic baseline: [code-structure.md](docs/standards/code-structure.md), [contextual-split.md](docs/standards/contextual-split.md), [docs-hygiene.md](docs/standards/docs-hygiene.md), [docs-hygiene-reference-structure.md](docs/standards/docs-hygiene-reference-structure.md), [spec-hygiene.md](docs/standards/spec-hygiene.md), [pr-process.md](docs/standards/pr-process.md) |
| HTTP/API layer | Stack-specific baseline example: [http-layer.md](docs/standards/http-layer.md), [http-layer-guide.md](docs/standards/http-layer-guide.md), [http-layer-schemas-and-responses.md](docs/standards/http-layer-schemas-and-responses.md), [http-layer-errors-and-auth.md](docs/standards/http-layer-errors-and-auth.md), [http-layer-docs-and-tests.md](docs/standards/http-layer-docs-and-tests.md) |
| Service layer | Stack-specific baseline example: [service-layer.md](docs/standards/service-layer.md), [service-layer-guide.md](docs/standards/service-layer-guide.md), [service-layer-data-and-exceptions.md](docs/standards/service-layer-data-and-exceptions.md), [service-layer-modules-and-cli.md](docs/standards/service-layer-modules-and-cli.md) |
| Data layer | Stack-specific baseline example: [data-layer.md](docs/standards/data-layer.md), [data-layer-guide.md](docs/standards/data-layer-guide.md), [data-layer-exec-sproc.md](docs/standards/data-layer-exec-sproc.md), [data-layer-results.md](docs/standards/data-layer-results.md), [data-layer-errors.md](docs/standards/data-layer-errors.md), [data-layer-templates.md](docs/standards/data-layer-templates.md), [data-layer-utilities.md](docs/standards/data-layer-utilities.md), [data-layer-sproc-examples.md](docs/standards/data-layer-sproc-examples.md) |
| Database | Stack-specific baseline example: [database.md](docs/standards/database.md), [database-guide.md](docs/standards/database-guide.md), [database-sproc-shape.md](docs/standards/database-sproc-shape.md), [database-sproc-errors.md](docs/standards/database-sproc-errors.md), [database-migrations-and-modernization.md](docs/standards/database-migrations-and-modernization.md), [database-modernization-approach.md](docs/standards/database-modernization-approach.md), [database-testing.md](docs/standards/database-testing.md), [database-testing-guide.md](docs/standards/database-testing-guide.md) |
| Frontend | Stack-specific baseline example: [frontend.md](docs/standards/frontend.md), [frontend-admin-crud-guide.md](docs/standards/frontend-admin-crud-guide.md), [frontend-forms-ui.md](docs/standards/frontend-forms-ui.md), [frontend-hook-design.md](docs/standards/frontend-hook-design.md) |
| Testing and reports | Stack-specific baseline example: [python-testing.md](docs/standards/python-testing.md), [python-testing-guide.md](docs/standards/python-testing-guide.md), [python-testing-http-behavior.md](docs/standards/python-testing-http-behavior.md), [report-test-strategy.md](docs/standards/report-test-strategy.md), [reports.md](docs/standards/reports.md) |
| Operations, tooling, and security | Mixed generic and stack-specific baseline: [ci-workflows.md](docs/standards/ci-workflows.md), [ci-llm-conformance-workflows.md](docs/standards/ci-llm-conformance-workflows.md), [deployment.md](docs/standards/deployment.md), [backend-entrypoint-initialization-guide.md](docs/standards/backend-entrypoint-initialization-guide.md), [backend-lambda-deployment-guide.md](docs/standards/backend-lambda-deployment-guide.md), [logging-observability.md](docs/standards/logging-observability.md), [logging-runtime-behavior.md](docs/standards/logging-runtime-behavior.md), [settings.md](docs/standards/settings.md), [security.md](docs/standards/security.md), [tooling-hooks-and-formatters.md](docs/standards/tooling-hooks-and-formatters.md), [tooling-lint-format.md](docs/standards/tooling-lint-format.md) |

## Skill Inventory

### Interactive skills

| Skill | Purpose |
| ----- | ------- |
| `proposal-builder` | Facilitates proposal discussions and drafts decision-ready proposals. |
| `feature-doc-builder` | Creates and evolves feature requirements documents for long-lived capabilities; the skill keeps its historical name for compatibility. |
| `architecture-doc-builder` | Creates and evolves project-level or feature-level architecture documents. |
| `spec-builder` | Guides bounded deliverable specification authoring, including prescriptive execution sequence and implementation guidance. |
| `standard-builder` | Inspects an existing codebase and drafts repo-specific standards for team review. |

### Execution and verification skills

| Skill | Purpose |
| ----- | ------- |
| `qa-testing` | Runs verification against requirements, standards, tests, frontend/backend behavior, API checks, and evidence quality. |
| `pr-review` | Reviews PRs or local diffs for correctness, evidence quality, low-value tests, generated-code clutter, redundancy, and scope drift. |

### Delivery and infrastructure skills

| Skill | Purpose |
| ----- | ------- |
| `pr-builder` | Produces draft-first PR packaging from diff, docs, stack context, and evidence. |
| `gh-stack` | Manages stacked branches and dependent PRs for incremental review workflows. |
| `worktree` | Sets up or manages the methodology's Zazz-style worktree model through the Worktrunk workflow used by the skill. |
| `zazz-board-api` | Companion utility skill for Zazz Board integration. |
| `jira-api` | Draft companion utility for Jira-backed repos. |
| `conformance` | Applies one focused standards-alignment change against a named standard and bounded repo area, then prepares verified, self-reviewed PR evidence. |
| `doc-check` | Runs repo-local formatting and linting checks for documentation changes. |
| `psql` | Provides safe PostgreSQL diagnostic and profiling command guidance for repos that use `psql`. |
| `sqlcmd` | Provides safe SQL Server diagnostic command guidance for repos that use `sqlcmd`. |

## Setup and Prerequisites

Before adopting Zazz in a repo, make sure the team has the supporting tools and repo
entry points the methodology expects:

- **Git**: required. Zazz uses branches, worktrees, commits, diffs, and PRs as core collaboration primitives. Install it through the normal path for your platform, such as Apple Command Line Tools on macOS, a Linux package manager, Git for Windows, or the downloads linked from [git-scm.com](https://git-scm.com/downloads).
- **Git hosting and PR tooling**: required for normal team use. GitHub is common, but the methodology also works with GitLab, Bitbucket, Forgejo, or another Git-based review system.
- **GitHub CLI (`gh`)**: recommended when the repo uses GitHub, PR automation, or `gh-stack`. Install from [cli.github.com](https://cli.github.com/) and run `gh auth login` before expecting agents to create or inspect PRs.
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
skills into a project. Runtime-specific instruction files can either point agents at
`.agents/skills/` or copy/sync selected skills into the runtime's native skill directory.

## Getting Started

If you are adopting the methodology in another repo:

1. Read [zazz-methodology.md](zazz-methodology.md), then follow the section links that match your current workflow.
2. Review [templates/AGENTS.md](templates/AGENTS.md) because `AGENTS.md` declares repo-specific settings such as docs root, tracking system, branch policy, and review workflow.
3. Install the supporting tools your workflow needs: Git, Worktrunk, `gh`, `gh-stack`, and any project-specific build/test tools.
4. Read [docs/worktree-setup.md](docs/worktree-setup.md) because the methodology requires the worktree operating model.
5. Copy or sync the skills you want from `.agents/skills/` into the repo or your agent runtime.

## Installing Skills

The shared skills live under `.agents/skills/` so they stay AI-tool agnostic.

Common installation patterns:

- copy them into a runtime skill directory such as `$CODEX_HOME/skills/`
- vendor them into another repo's `.agents/skills/`
- point runtime-specific instruction files at the repo's `.agents/skills/` directory when the runtime supports that pattern
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

### 2026-06-18 — Public methodology and standards refresh

Split the methodology into a concise executive overview plus focused workflow sections, refreshed the README with the current skill and standards inventory, consolidated QA guidance under `qa-testing`, and added PostgreSQL/SQL Server diagnostic utility skills.

### 2026-05-24 — Execution artifact location refresh

Renamed the default local mutable execution artifact directory to `<DOCS_ROOT>/execution/`, and clarified that Zazz Board can serve as the centralized execution-record surface for run logs, handoff documents, QA findings, and related information shared across worktrees, agents, and sessions.

### 2026-05-23 — Methodology and skill alignment refresh

Aligned the methodology, README, supporting docs, and shared skills around feature, architecture, and specification document locations; draft-first PR packaging; stacked PR lanes; Zazz Board or Git-backed specification storage; and direct skill customization.

## License

See [LICENSE](LICENSE).
