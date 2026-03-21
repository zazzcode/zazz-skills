# AGENTS.md Example Template for Zazz Repositories

This file is an example starter for a repo-level `AGENTS.md` in a project that uses the Zazz framework.

Copy it into the target repository root as `AGENTS.md`, then replace the placeholder values and project-specific sections. The goal is not to preserve this file verbatim. The goal is to create a concise, repo-specific agent entry point that combines:

- framework-required instructions
- repo-specific standards and workflow rules
- only the highest-signal operational guidance an agent needs to work well

For a real in-use example, see the reference implementation:

- [zazz-board](https://github.com/zazzcode/zazz-board)

## How to Use This Template

1. Copy this file to the target repo root as `AGENTS.md`.
2. Declare the repo-relative framework docs root used by that project.
3. Replace every placeholder section with real repo instructions or remove the section if it does not apply.
4. Keep the framework-required parts intact:
   - docs-root declaration
   - standards index location
   - selective standards loading rules
   - features index location when used
   - deliverables policy
   - worktree / branch policy
5. Add only repo-specific information that an agent actually needs during execution, planning, QA, or review.

## What Must Be In a Real `AGENTS.md`

The following are required for repos using the Zazz framework:

- the repo's framework docs root
- the path to `<DOCS_ROOT>/standards/index.yaml`
- instructions to read the standards index first and load only relevant standards
- the path to `<DOCS_ROOT>/features/index.yaml` when the repo uses feature documents
- the repo's policy for `<DOCS_ROOT>/deliverables/`
- worktree / branch workflow expectations

Without those pieces, agents will tend to either miss important project rules or overload their context with unnecessary docs.

## Best Practices for a Good `AGENTS.md`

- Keep it lean. `AGENTS.md` should be a routing and orientation file, not a large knowledge dump.
- Keep it short. This file should orient the agent, not replace the full docs set.
- Prefer pointers over duplication. Point to standards and feature indexes instead of restating their contents.
- Separate framework rules from repo rules. Use the framework for shared concepts and this file for repo-specific behavior.
- Be explicit about workflows. If the repo requires worktrees, branch naming, env copying, or GitHub-only merges, say so directly.
- State defaults and exceptions. Example: deliverables are local/untracked by default unless the repo explicitly commits them.
- Avoid stale reference text. If a section is not maintained, delete it rather than leaving misleading instructions.
- Include only actionable commands. If you list test or dev commands, make sure they are the ones maintainers actually expect agents to run.

Why this matters:

- large `AGENTS.md` files waste context window
- duplicated standards go stale quickly
- the standards index exists specifically so agents can load only what is relevant
- a lean `AGENTS.md` improves both discoverability and execution quality

## Purpose

This repository uses the Zazz framework for long-lived product docs, execution contracts, and selective standards loading.

Agents should use this file as the starting point for:

- docs-root discovery
- standards loading
- feature-context loading
- worktree and deliverable conventions

## Docs Root

`Framework docs root: <SET_REPO_RELATIVE_DOCS_ROOT>`

Recommended values:

- `.zazz` at the monorepo root
- `docs` at the monorepo root

Rules:

- The docs root is a repo-relative path, not an absolute path.
- Framework docs live under `<DOCS_ROOT>/`.
- Do not hardcode `.zazz` if this repo uses another docs root.
- If the repo is a monorepo, set this to the monorepo-level docs location that governs the project as a whole.

## Standards Loading Rules

Authoritative standards index:

- `<DOCS_ROOT>/standards/index.yaml`

Required behavior:

1. Read `<DOCS_ROOT>/standards/index.yaml` before creating, modifying, reviewing, or validating code.
2. Match standards by `applies_to.paths` and `applies_to.activities`.
3. Load only the standards relevant to the task.
4. Do not inject every standards document into context by default.
5. If a standard lists a companion document, load that too when relevant.

This section is framework-specific and should almost always remain in the final repo `AGENTS.md`.

When conflicting implementation patterns exist in the repo:

1. Follow the applicable standard if one exists.
2. If no standard exists, prefer the most recent intentional project pattern.
3. If still ambiguous, ask the user instead of guessing.

## Feature Context Rules

Feature index:

- `<DOCS_ROOT>/features/index.yaml`

Use feature docs when the task touches product behavior, user-facing capability, roadmap context, milestone history, or stakeholder intent.

Rules:

1. Read `<DOCS_ROOT>/features/index.yaml` when product context may matter.
2. Load only the relevant feature document(s), not the entire features directory.
3. Treat feature documents as long-lived capability docs, not execution specs.
4. When a deliverable changes shipped behavior, update the relevant feature document so it reflects the current system.

If the repo does not yet use feature docs, either remove this section or replace it with a note that the repo is currently deliverable-only.

## Deliverables Policy

Deliverable docs live under:

- `<DOCS_ROOT>/deliverables/`

Default policy:

- deliverable SPECs and PLANs are worktree-local execution artifacts
- `standards/` and `features/` are long-lived tracked docs
- deliverable files are untracked by default unless this repo explicitly chooses to commit them

If this repo uses a different policy, document it here.

This section should be explicit because agents need to know whether deliverable docs are expected to be committed, ignored locally, or promoted selectively.

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

## Project-Specific Constraints

Add anything repo-specific that agents must know, for example:

- primary languages and frameworks
- required test commands
- deployment constraints
- service boundaries
- forbidden edit zones
- secrets and environment handling

This is the right place for repo-specific instructions that should not live in the framework doc itself.

## Quick Links

- Standards index: `<DOCS_ROOT>/standards/index.yaml`
- Features index: `<DOCS_ROOT>/features/index.yaml`
- Deliverables dir: `<DOCS_ROOT>/deliverables/`

## Maintainer Checklist

Before you commit a real repo `AGENTS.md`, verify that:

- placeholders have been replaced or removed
- all referenced paths exist in that repo
- the worktree / branch rules are accurate
- standards and features sections reflect the repo's actual document model
- command examples still work
- the file is still lean and does not duplicate whole standards documents
- the file helps an agent discover docs instead of duplicating them
