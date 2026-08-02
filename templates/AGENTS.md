# AGENTS.md Template for Zazz Repositories

Copy the section below to the target repository root as `AGENTS.md`, then replace every
`<PLACEHOLDER>` or delete the line. Keep it brief: this is a routing file for an agent
that can already read the repository and reason about code. It is not a substitute for
standards, architecture docs, specifications, or contributor documentation.

```md
# Agent Instructions

## Repository Facts

- Docs root: `<DOCS_ROOT>` (repo-relative; usually `docs` or `.zazz`)
- Documentation model: `<committed Markdown | GitHub Wiki | Confluence | tracker + docs | other>`
- Work tracker: `<system and project key, or none>`
- Branch / worktree policy: `<one short factual rule, or link to the policy>`
- Shared-file coordination: `<declared tool and fallback, or “serialize overlapping edits”>`

## Read Only What Applies

1. Read this file and any closer-scoped instructions before changing files.
2. For code, configuration, review, or validation work, read `<DOCS_ROOT>/standards/index.yaml` and load only
   the standards that match the task's paths and activity.
3. For product behavior, load the relevant feature or architecture document from `<FEATURE_OR_ARCHITECTURE_INDEX>`.
4. For a tracked deliverable, use `<SPEC_OR_TRACKER_LOCATION>` as the execution contract.
5. Do not preload the entire methodology or standards library for a small, isolated task.

## Repository Commands

- Setup: `<command or omit>`
- Targeted tests: `<command or omit>`
- Lint / format: `<command or omit>`
- Documentation checks: `<command or omit>`
- Required environment or secret handling: `<brief rule or link>`

## Local Artifacts and Skills

- Active artifacts (run logs, QA evidence, handoffs, scratch): `<path and tracked/ignored policy>`
- Completed specifications / durable records: `<source of truth and promotion rule>`
- Canonical shared skills: `.agents/skills/`; use only the skill that matches the task and any repo-declared
  integration. Do not assume a runtime-specific skill path or tool API.

## Repo-Specific Overrides

- `<Only rules that differ from the applicable standards or methodology.>`
- `<Examples: protected files, required reviewer, deployment restriction, known CI exception.>`
```

## Authoring Rules

- Keep the final file to the smallest useful set of repo facts, pointers, commands, and exceptions. Roughly 40–100
  lines is a healthy target; go longer only for a real, local operational need.
- Prefer a repository-relative path or a one-line policy over copying a standard or full workflow into this file.
- State durable-document and active-artifact locations only when the repository actually uses them. Do not create
  placeholder directories merely because a template mentions them.
- Declare external systems only when they are authoritative for this repository. Name the fallback when a tool is not
  available.
- Do not prescribe a provider-specific agent API. Shared skills and standards must remain usable from Codex, Claude
  Code, Cursor, and other skill-aware environments.
- Remove a template section that does not apply. Unreplaced placeholders are worse than an omitted section.

## Minimum Checklist

Before committing a repository's `AGENTS.md`, confirm that it identifies:

- how to find task-relevant standards and product/specification context;
- the documentation model and any active-artifact policy that agents must follow;
- the actual tracker, branch/worktree, and shared-file coordination rules when they exist;
- the few commands and restrictions that agents cannot reliably infer from repository files; and
- only current, verifiable repository facts.

For shared-skill authoring rules and portable YAML validation, see
[Agent Skills](../docs/standards/agent-skills.md).
