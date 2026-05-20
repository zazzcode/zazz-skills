# Zazz Init Skill — User Guide

How to use the Zazz Init skill to adopt the Zazz methodology in a new or existing repo.

## What It Does

The Zazz Init skill walks a team through first-time Zazz adoption step by step.

It produces a working, repo-specific foundation:
- `AGENTS.md` with all required sections filled in for this specific repo
- `<DOCS_ROOT>/project.md` capturing the project's purpose and capabilities
- `<DOCS_ROOT>/standards/index.yaml` skeleton ready for standards to be added
- `<DOCS_ROOT>/features/index.yaml` skeleton when the repo will use feature documents
- worktree setup guidance appropriate for this repo's tooling

This skill removes the blank-page problem. By the end of a session the repo has a functional Zazz foundation, not a set of templates with placeholders.

## When to Use It

Use this skill when:
- adopting Zazz in a new repo that has no methodology docs yet
- adopting Zazz in an existing repo with working code but no structured docs
- the existing `AGENTS.md` was created from the template and still has unfilled placeholders

Do not use this skill to update an already-established Zazz repo. Use the individual skills (`feature-doc-builder`, `standards-builder`, etc.) for ongoing maintenance.

## What You Should Have Ready

The more context you can provide, the faster the session goes:
- what the repo does and why it exists
- the primary language, framework, and package manager
- the repo's integration branch name (`main`, `dev`, or other)
- the docs root convention you want to use (`.zazz/`, `docs/`, or other)
- whether the repo uses Zazz Board, Jira, Avaza, or another tracking system
- whether multiple people or agents will work in this repo in parallel (informs worktree setup)

None of these are required upfront — the skill will ask.

## Example Prompts

```text
Use zazz-init.
This is a new FastAPI + React monorepo. Please walk me through adopting Zazz and produce a working AGENTS.md and project.md.
```

```text
Use zazz-init.
We have an existing Rails app with no methodology docs. Please help us adopt Zazz without disrupting the existing codebase.
```

```text
Use zazz-init.
Our AGENTS.md was created from the template and still has placeholders everywhere. Please help us fill it in properly.
```

## What the Skill Produces

### Required outputs (every repo)

| File | Purpose |
| ---- | ------- |
| `AGENTS.md` | Agent entry point; docs-root declaration, standards loading rules, worktree policy, tracking system |
| `<DOCS_ROOT>/project.md` | Durable top-level orientation for the software project |
| `<DOCS_ROOT>/standards/index.yaml` | Index skeleton; ready for standards to be added via `standards-builder` |

### Conditional outputs

| File | When |
| ---- | ---- |
| `<DOCS_ROOT>/features/index.yaml` | When the repo will use feature requirements documents |
| Worktree setup instructions | Always — bare-repo setup steps tailored to this repo's tooling |

## Scope

This skill sets up the foundation. It does not:
- write feature documents (use `feature-doc-builder`)
- write standards (use `standards-builder`)
- write architecture documents (use `architecture-doc-builder`)
- write SPECs (use `spec-builder`)

The session ends when the foundation files are created and the team can use the other skills without hitting blank-page problems.

## Notes

- `AGENTS.md` is the most important output. Invest time getting it right. Every agent that runs in this repo reads it first.
- Keep `AGENTS.md` lean. It should orient agents, not duplicate docs.
- The `project.md` does not need to be complete on day one. A working draft is better than a perfect template.
- Worktree setup can be deferred if the team is not ready to adopt it yet, but the skill will flag that worktrees are a methodology requirement.
