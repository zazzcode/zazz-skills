---
name: doc-check
description: Run or choose repository-local formatting, linting, and consistency checks for markdown, text, and documentation files before committing. Use when documentation files changed, standards docs were edited, or the user asks to verify docs formatting.
---

# Document Check

Run documentation checks using the repository's own tooling. Do not install or invent formatters when the repo already declares hooks, package scripts, make targets, or CI jobs.

## Workflow

1. Identify changed documentation files with `git status --short` and, when needed, `git diff --name-only`.
2. Read repo instructions (`AGENTS.md`, README, contributing docs) and hook configuration files such as `.pre-commit-config.yaml`, `package.json`, `pyproject.toml`, `justfile`, `Makefile`, or markdownlint config.
3. Prefer the narrowest repo-declared command that checks the changed docs. Common examples include `pre-commit run --files ...`, `prek run --files ...`, `npm run lint:docs`, `markdownlint`, `mdformat`, or a repo-specific `just` target.
4. Include all text-like files affected by the change, not only `.md`, when hooks apply to trailing whitespace, final newline, merge conflict markers, YAML, TOML, or generated docs.
5. If a formatter modifies files, rerun the same check once to verify stability.
6. Report commands, results, and any files changed by formatting.

## Boundaries

- Do not run all-docs or all-files checks by default when a file-scoped command exists.
- Do not touch unrelated formatting churn.
- If the repo uses a virtual-branch or stacked-diff tool, identify which changed files belong to the current unit of work before running broad fixers.
- If no doc tooling exists, perform a manual pass for broken links, stale paths, private local paths, merge markers, trailing whitespace, and missing final newline.
