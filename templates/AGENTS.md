# AGENTS.md Example Template for Zazz Repositories

This file is an example starter for a repo-level `AGENTS.md` in a project that uses the Zazz methodology.

For skills in this methodology, `AGENTS.md` is the source of truth for repo-specific settings such as docs-root resolution, tracking system, project-code conventions, and workflow rules.

Copy it into the target repository root as `AGENTS.md`, then replace the placeholder values and project-specific sections. The goal is not to preserve this file verbatim. The goal is to create a concise, repo-specific agent entry point that combines:

- methodology-required instructions
- repo-specific standards and workflow rules
- only the highest-signal operational guidance an agent needs to work well

For a real in-use example, see the reference implementation:

- [zazz-board](https://github.com/zazzcode/zazz-board)

## How to Use This Template

1. Copy this file to the target repo root as `AGENTS.md`.
2. Declare how the repo-relative methodology docs root is resolved for that project.
3. Replace every placeholder section with real repo instructions or remove the section if it does not apply.
4. Keep the methodology-required parts intact:
   - docs-root declaration
   - documentation operating model declaration
   - standards index location
   - selective standards loading rules
   - durable-doc and active-artifact storage policy
   - features index location when used and when feature docs are repo-local
   - tracking system / issue-management declaration
   - shared-file coordination policy
   - worktree / branch policy
   - agent execution discipline reference and repo-specific overrides
5. Add only repo-specific information that an agent actually needs during specification, execution, QA, or review.

## What Must Be In a Real `AGENTS.md`

The following are required for repos using the Zazz methodology:

- the repo's methodology docs-root rule
- the repo's documentation operating model
- the path to `<DOCS_ROOT>/standards/index.yaml`
- instructions to read the standards index first and load only relevant standards
- the path to `<DOCS_ROOT>/features/index.yaml` when the repo uses repo-local feature requirements documents
- the repo's durable-doc storage policy for project overview, architecture, features, project plans, roadmap, milestones, proposals, standards, and completed implemented specifications
- the repo's active-artifact policy for RUN_LOG files, QA notes, handoffs, evidence, and scratch work
- the repo's work-tracking system for deliverables / tickets / PR context
- the repo's shared-file coordination policy for execution
- worktree / branch workflow expectations
- the default agent execution discipline document and any repo-specific overrides

Without those pieces, agents will tend to either miss important project rules or overload their context with unnecessary docs.

## Best Practices for a Good `AGENTS.md`

- Keep it lean. `AGENTS.md` should be a routing and orientation file, not a large knowledge dump.
- Keep it short. This file should orient the agent, not replace the full docs set.
- Prefer pointers over duplication. Point to standards and feature indexes instead of restating their contents.
- Separate methodology rules from repo rules. Use the methodology for shared concepts and this file for repo-specific behavior.
- Be explicit about workflows. If the repo requires worktrees, branch naming, env copying, or GitHub-only merges, say so directly.
- Be explicit about the documentation operating model. Say whether durable docs live in committed Markdown, GitHub Wiki, Confluence, Zazz Board/Jira, or a hybrid.
- Be explicit about tracking. Say whether the repo uses Zazz Board, Jira, Avaza, or another system for PR-facing work items and whether that affects specification metadata, final spec promotion, or PR links.
- Be explicit about shared-file coordination. If the repo uses Zazz Board locks, Switchman, harness-native coordination, or strict serialization, say so in one short section.
- State defaults and exceptions. Example: deliverables are local/untracked by default unless the repo explicitly commits them.
- Avoid stale reference text. If a section is not maintained, delete it rather than leaving misleading instructions.
- For documentation cleanup, never remove sections, citations, workflows, diagrams, requirements, or named tools without first presenting a keep/remove/condense plan and receiving approval. Default to condensing over deleting.
- Include only actionable commands. If you list test or dev commands, make sure they are the ones maintainers actually expect agents to run.

Why this matters:

- large `AGENTS.md` files waste context window
- duplicated standards go stale quickly
- the standards index exists specifically so agents can load only what is relevant
- a lean `AGENTS.md` improves both discoverability and execution quality

## Purpose

This repository uses the Zazz methodology for long-lived product docs, execution contracts, and selective standards loading.

Agents should use this file as the starting point for:

- docs-root discovery
- documentation operating model discovery
- standards loading
- feature-context loading
- worktree and deliverable conventions

## Docs Root

`Methodology docs root: <SET_REPO_RELATIVE_DOCS_ROOT>`

or

`Methodology docs root: resolve from <ENV_VAR> (must be a repo-relative path)`

Recommended values:

- `.zazz` at the monorepo root
- `docs` at the monorepo root

Rules:

- The docs root is a repo-relative path, not an absolute path.
- Methodology docs live under `<DOCS_ROOT>/`.
- Repo-local durable docs and local ephemeral artifacts live under that same root when the operating model stores them in the repo.
- Do not hardcode `.zazz` if this repo uses another docs root.
- If this repo resolves the docs root from an environment variable, document that rule explicitly here.
- If the repo is a monorepo, set this to the monorepo-level docs location that governs the project as a whole.

## Documentation Operating Model

Declare how this repo stores durable docs and active implementation artifacts. Agents
must follow this declaration and must not infer storage behavior from directory names
that happen to exist.

Choose and fill in one model, or write the repo's hybrid policy explicitly:

- `Documentation operating model: GitHub-only committed Markdown`
- `Documentation operating model: GitHub repo plus GitHub Wiki`
- `Documentation operating model: Zazz Board for execution records plus repo or wiki durable docs`
- `Documentation operating model: Jira plus Confluence`
- `Documentation operating model: Hybrid; see per-artifact source-of-truth table below`

Per-artifact source of truth:

| Artifact | Source of truth | Agent update rule |
| --- | --- | --- |
| Project overview | {{ <DOCS_ROOT>/project.md | GitHub Wiki page | Confluence page | other }} | {{ update rule }} |
| Architecture | {{ <DOCS_ROOT>/architecture/ | GitHub Wiki index | Confluence space | other }} | {{ update rule }} |
| Feature requirements | {{ <DOCS_ROOT>/features/ | GitHub Wiki pages | Confluence pages | other }} | {{ update rule }} |
| Project plans / roadmap / milestones | {{ repo docs | GitHub Wiki | Confluence | tracker | other }} | {{ update rule }} |
| Proposals | {{ <DOCS_ROOT>/proposals/ | wiki/KB pages | pointer files | other }} | {{ update rule }} |
| Specifications | `<DOCS_ROOT>/specifications/` | {{ tracked | ignored | mirrored to Zazz Board/Jira | promoted to wiki/Confluence after merge }} |
| RUN_LOG / QA / handoff / evidence | {{ file under <DOCS_ROOT>/ephemeral/ | Zazz Board | Jira | other }} | {{ update rule }} |
| Final implemented specifications | {{ <DOCS_ROOT>/specifications/ | GitHub Wiki | Confluence | Zazz Board | Jira | none }} | {{ promotion/update rule }} |
| Standards | {{ <DOCS_ROOT>/standards/ | other }} | {{ update rule }} |

Rules:

- `<DOCS_ROOT>/specifications/` is the local spec-builder working directory. Declare whether it is tracked, ignored, mirrored, or promoted elsewhere.
- `<DOCS_ROOT>/ephemeral/` is the optional local scratch surface for RUN_LOG files, QA notes, handoffs, evidence, recovery notes, and scratch work. Do not create or assume subdirectories inside it unless this file declares them.
- If final specs live in GitHub Wiki, Confluence, Zazz Board, Jira, or another durable surface, keep `<DOCS_ROOT>/specifications/` excluded from Git unless the repo also wants local specs committed.
- When a feature, architecture, roadmap, milestone, or completed spec changes, update the declared source of truth through the appropriate skill or repo process.

## Standards Loading Rules

Authoritative standards index:

- `<DOCS_ROOT>/standards/index.yaml`

Required behavior:

1. Read `<DOCS_ROOT>/standards/index.yaml` before creating, modifying, reviewing, or validating code.
2. Match standards by `applies_to.paths` and `applies_to.activities`.
3. Load only the standards relevant to the task.
4. Do not inject every standards document into context by default.
5. If a standard lists a companion document, load that too when relevant.

This section is methodology-specific and should almost always remain in the final repo `AGENTS.md`.

When conflicting implementation patterns exist in the repo:

1. Follow the applicable standard if one exists.
2. If no standard exists, prefer the most recent intentional project pattern.
3. If still ambiguous, ask the user instead of guessing.

## Feature Context Rules

Feature index:

- `<DOCS_ROOT>/features/index.yaml`

Use feature requirements documents when the task touches product behavior, user-facing capability, roadmap context, milestone history, or stakeholder intent.

Rules:

1. Read `<DOCS_ROOT>/features/index.yaml` when product context may matter.
2. Load only the relevant feature requirements document(s), not the entire features directory.
3. Treat feature requirements documents as long-lived capability docs, not execution specs.
4. When a deliverable changes shipped behavior, update the relevant feature requirements document so it reflects the current system.

If the repo does not yet use feature requirements documents, either remove this section or replace it with a note that the repo is currently deliverable-only.

## Tracking System Policy

Declare the primary project tracking system that agents should use when referencing work in PRs, specifications, QA notes, and related review artifacts.

Recommended contents:

- whether the project uses Zazz Board, Jira, Avaza, another tracker, or no external tracker
- which system is authoritative for PR-facing work-item links
- the project-level identifier agents should use for that system
- whether active or completed specification storage depends on tracker IDs
- whether external ticket URLs should be included in PRs even when they do not affect deliverable file paths
- what agents should do when the exact ticket URL or ID is not available at draft time

When relevant, also state how to resolve the tracker's project identifier:

- **Zazz Board / service-assisted repos**: declare the board project code and whether agents should read it from `ZAZZ_PROJECT_CODE`
- **Monorepos using Zazz Board**: clarify which monorepo-level project code applies and whether subprojects share one board project code or use separate ones
- **Jira**: declare the Jira project key or state that it must match the issue-key prefix used for deliverables and PR links
- **Other trackers**: declare the equivalent project/workspace identifier when agents need it for links, validation, or API usage

Example:

- `Tracking system: Zazz Board for service-assisted execution, board project code comes from ZAZZ_PROJECT_CODE, execution records live in Zazz Board unless the owner asks for local files; specification files still live under <DOCS_ROOT>/specifications/.`
- `Tracking system: Jira for issue management, Jira project key is PROJ, Jira issue link required at the top of PRs, completed specs are promoted to Confluence after merge.`
- `Tracking system: Avaza for PR-facing task links; specification files live under <DOCS_ROOT>/specifications/ and include Avaza task URL in PR context when provided.`

Keep this section short and factual.
Its purpose is to remove ambiguity about how PRs and deliverable references should be anchored in this repo.

## Shared-File Coordination Policy

Declare the repo's single source of truth for how execution agents should coordinate edits when parallel work could touch the same files.

Keep this section short. It should answer only:

- what coordination model the repo uses
- when it applies
- what the fallback is

Required behavior:

- If this section names a coordination tool, agents may use that tool as declared.
- If this section is silent or omitted, agents should assume no repo-declared external locking tool is available.
- When no repo-declared tool is available, agents should use the coordination features native to the active agent harness and serialize overlapping-file work when safe isolation is not guaranteed.
- Agents should not infer or search for an undeclared locking tool from incidental repo clues.

Examples:

- `Shared-file coordination: Use Zazz Board file locks for parallel deliverable execution. If locks are unavailable, serialize overlapping-file work.`
- `Shared-file coordination: Use Switchman for shared-file execution.`
- `Shared-file coordination: No external locking tool is declared. Use harness-native isolation when available; otherwise serialize overlapping-file work.`

## Worktree Policy

Recommended default:

- one active deliverable per worktree
- one branch per worktree
- worktree name matches the branch or deliverable slug when practical

Project-specific worktree rules for this repo:

- <ADD_BRANCH_BASE_RULE>
- <ADD_ENV_COPY_RULES_IF_ANY>
- <ADD_LOCAL_MERGE_OR_GITHUB_FLOW_RULES>

If the repo has no special worktree policy, replace this section with the actual branch workflow rather than leaving placeholders behind.

## Agent Execution Discipline

This repo follows the default Zazz execution discipline:

- `docs/agent-execution-discipline.md` from the vendored Zazz methodology docs, or the repo's declared equivalent path

Repo-specific overrides:

- Integration branch: `<ADD_INTEGRATION_BRANCH>`
- Execution records: `<ADD_EXECUTION_RECORD_POLICY>`
- Stack policy: `<ADD_STACK_POLICY_OR_N/A>`
- Known integration-branch health exceptions: `<ADD_EXCEPTIONS_OR_NONE>`

Preferred command wrappers:

```bash
# Example:
<ENV_WRAPPER> <TEST_COMMAND> ...
<ENV_WRAPPER> <LINT_COMMAND> ...
```

Replace the examples with the commands maintainers actually expect agents to use.

## Project-Specific Constraints

Add anything repo-specific that agents must know, for example:

- primary languages and frameworks
- required test commands
- deployment constraints
- service boundaries
- forbidden edit zones
- secrets and environment handling

This is the right place for repo-specific instructions that should not live in the methodology doc itself.

## Quick Links

- Agent execution discipline: `docs/agent-execution-discipline.md`
- Standards index: `<DOCS_ROOT>/standards/index.yaml`
- Feature index or durable feature surface: `<DOCS_ROOT>/features/index.yaml` or the declared wiki/KB index
- Active scratch surface when local files are used: `<DOCS_ROOT>/ephemeral/`
- Completed-spec surface: `<DOCS_ROOT>/specifications/`, GitHub Wiki, Confluence, tracker, or none per the operating model

## Maintainer Checklist

Before you commit a real repo `AGENTS.md`, verify that:

- placeholders have been replaced or removed
- all referenced paths exist in that repo
- documentation operating model is explicit and does not imply directories the repo does not use
- the worktree / branch rules are accurate
- standards and features sections reflect the repo's actual document model
- tracking and shared-file coordination policies are explicit and accurate
- agent execution discipline link and repo-specific overrides are accurate
- command examples still work
- the file is still lean and does not duplicate whole standards documents
- the file helps an agent discover docs instead of duplicating them
