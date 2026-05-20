---
name: zazz-init
description: >-
  Walk a team through first-time Zazz methodology adoption in a new or existing repo;
  produces a working AGENTS.md, project.md, and index skeletons with no unfilled placeholders.
  Use when a repo has no Zazz foundation or when the existing AGENTS.md still has template placeholders.
---

# Zazz Init Skill

## Required Repo Extension Check

Before doing anything else, check for `.claude/skill-extensions/zazz-init/EXTENSION.md`. If it exists,
read it immediately after this `SKILL.md` and apply it as repo-specific guidance.

## Startup Sequence

1. Check for the repo extension file above and read it if present.
2. Scan the repo for existing Zazz artifacts: `AGENTS.md`, any docs root directory, `project.md`.
3. Assess the current state:
   - **New repo** — no Zazz docs at all; start from scratch.
   - **Partial adoption** — some docs exist but `AGENTS.md` has placeholders or missing sections.
   - **Existing codebase** — working code but no methodology docs; infer context from the codebase.
4. Tell the user what you found and what the session will produce.
5. Begin the intake dialogue.

## Mission

Produce a working Zazz foundation for the repo — no placeholders, no unfilled sections — so the team can immediately use the other Zazz skills without additional setup.

This skill is the on-ramp. It stops when the foundation is established and hands off to the individual skills.

## Intake Dialogue

Gather the following, in order of priority. Ask only what is needed; infer what you can from the codebase.

### Required for AGENTS.md

1. **Docs root** — where should methodology docs live? Common choices: `.zazz/`, `docs/`, `zazz/`. Check if a directory already exists.
2. **Integration branch** — what is the repo's integration branch? Check `git branch -a` or ask.
3. **Tracking system** — Zazz Board, Jira, Avaza, or none? If Jira, what is the project key?
4. **Shared-file coordination** — will multiple agents run in parallel on this repo? If yes, what coordination model?
5. **Worktree policy** — any repo-specific branch naming rules, env copy requirements, or merge restrictions?
6. **Primary language and framework** — infer from the codebase if possible; confirm with the user.
7. **Required test / build commands** — what commands should agents run to verify their work?

### Required for project.md

1. **What does this software do?** — one paragraph, plain language.
2. **Who uses it?** — the primary users or consumers.
3. **What are the major capabilities?** — top-level feature areas, not implementation details.
4. **What is the current state?** — what is live, what is in progress, what is not started?

### Optional but recommended

- Known forbidden actions (destructive DB operations, specific env restrictions)
- Whether deliverable SPECs are committed, ignored locally, or tracked in an external system
- Whether the repo is a monorepo (affects docs root scoping)

## AGENTS.md Generation Rules

Produce a complete, repo-specific `AGENTS.md` with no placeholder text.

Required sections (always present):
- Docs root declaration — exact resolved path, not a placeholder
- Standards loading rules — pointing to the actual `standards/index.yaml` path
- Feature context rules — pointing to the actual `features/index.yaml` path, or explicitly stating the repo does not use feature documents yet
- Deliverables policy — explicit: local/ignored, committed, or tracked externally
- Tracking system policy — explicit: which system, what identifier, what deliverable naming convention
- Shared-file coordination policy — explicit: what tool or fallback
- Worktree policy — integration branch name, any env copy steps, any branch naming constraints
- Agent execution discipline — keep the methodology-level rules; add repo-specific command wrappers
- Project-specific constraints — primary language, test commands, forbidden actions

Optional sections to include when relevant:
- Quick links — paths to standards index, features index, deliverables dir

Do not include sections that do not apply to this repo. An `AGENTS.md` with no tracking system section is better than one with "Tracking system: none declared."

Keep the file lean. Point to standards and indexes instead of duplicating their contents.

## project.md Generation Rules

Produce a working first draft of `<DOCS_ROOT>/project.md`:
- purpose and value proposition (why does this software exist?)
- primary users or consumers
- major capabilities (what can the system do?)
- current state (what is live vs. in progress vs. planned?)

Do not invent capabilities. Infer from the codebase and confirm with the user.
Mark sections as "draft" when the user has not confirmed them.

## Index Skeleton Generation Rules

### standards/index.yaml

Create an empty but valid index:

```yaml
# Standards index for <repo-name>
# Add entries here as standards are created via the standards-builder skill.
# Each entry must declare applies_to.paths and applies_to.activities for selective loading.
standards: []
```

### features/index.yaml (when applicable)

Create an empty but valid index:

```yaml
# Feature requirements document index for <repo-name>
# Add entries here as feature documents are created via feature-doc-builder.
features: []
```

## Worktree Setup Guidance

Always provide worktree setup guidance appropriate for the repo's tooling:

- If Worktrunk is installed or the team wants to use it: provide the `wt` setup steps from the worktree skill.
- If the team prefers native git: provide the native `git worktree` setup steps from the worktree skill's "Without Worktrunk" section.
- In either case, confirm the integration branch name and any env copy requirements before providing the setup steps.

Do not skip this. Worktrees are a methodology requirement even if the team defers full adoption.

## Handoff

When the session is complete, provide:

1. A summary of what was created and where each file lives.
2. The next recommended steps:
   - `standards-builder` to define the first standards
   - `feature-doc-builder` to document existing capabilities
   - Complete the worktree setup if deferred
3. A note that `AGENTS.md` should be committed before running any other Zazz skill, since every skill reads it first.

## Quality Bar

The foundation is complete when:
- `AGENTS.md` has no unfilled placeholders and every required section is present
- `project.md` has a confirmed purpose, user, capabilities, and current state (draft sections are acceptable on day one)
- `standards/index.yaml` exists and is valid YAML
- `features/index.yaml` exists if the repo will use feature documents
- worktree setup instructions have been provided

## Development Mode

If the user says "development mode", the focus is on improving this skill itself. In development mode,
you may edit `.agents/skills/zazz-init/SKILL.md`. Outside development mode, this file is read-only.
