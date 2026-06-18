---
last_updated_at: 2026-05-25
---

# Tooling, lint, and format

This stack-specific baseline governs a Python/TypeScript monorepo toolchain: ruff (Python lint and format), mypy
(Python type-checking), `google/yamlfmt` (YAML formatting), and `prek` (the Rust-based pre-commit runner used in place
of stock `pre-commit`). It covers how the configs are scoped across the repo, what conventions apply when editing
those configs, and the small set of source-level rules that the configured linters enforce but that an author still has
to follow by hand. Teams using different languages or hook runners should replace the tool names while preserving the
same placement, pinning, and evidence rules.

## Overview

The toolchain is split between the monorepo root and each service. Tools that touch files across the repo live at the
root; tools whose remit is a single service live inside that service's directory. Reading the configs is the fastest
way to see the boundary:

```text
.pre-commit-config.yaml      # root: cross-cutting hooks (yamlfmt, mdformat, trailing-whitespace, check-yaml, ...)
.yamlfmt.yaml                # root: yamlfmt formatter behavior
backend/
  pyproject.toml             # backend: ruff, mypy, pytest, sqlfluff
  .pre-commit-config.yaml    # backend: ruff, mypy, taplo (pyproject.toml), shellcheck, sqlfluff
frontend/
  .pre-commit-config.yaml    # frontend: biome (check + format), tsc
```

The runner is `prek`, not `pre-commit`, even though the config files keep the `.pre-commit-config.yaml` filename. The
root config carries an inline note explaining this so editors do not get tripped up
(`.pre-commit-config.yaml`). All three configs
share the same naming for the same reason — prek discovers them by the canonical filename.

The general rule for placement: cross-service tooling (yamlfmt, repo-wide secret scanning, markdown formatting) belongs
at the root; a service-level config is a smell unless the tool is genuinely service-scoped (e.g., ruff for Python is
backend-only, biome for TypeScript is frontend-only) .

## mypy configuration

### Prefer `types-*` stub packages over `[[tool.mypy.overrides]]` blocks

Before adding a `[[tool.mypy.overrides]]` block for a third-party library, check whether a `types-<lib>` stub package
exists on PyPI. If a stub exists, install it as a dev dependency and skip the override. An uncommented
`ignore_missing_imports = true` block silently suppresses type errors and frequently masks a different problem — for
example, the library was not installed in the environment mypy ran in, so mypy reported "cannot find type information"
for a reason that has nothing to do with stubs
.

The current `pyproject.toml` reflects this: `types-Flask-Cors`, `types-passlib`, and `types-reportlab` are listed in
the `dev` dependency group, and there are no `[[tool.mypy.overrides]]` blocks
(`backend/pyproject.toml`).

If an override is genuinely necessary — for example, a library that provides partial stubs only for parts unused by
this codebase, or a library with no stubs at all on PyPI — the override block carries an inline comment naming the
specific reason. The comment is what makes the override auditable; without it, a later reader cannot tell whether the
override is load-bearing or a leftover.

#### Desired ✅

```toml
# backend/pyproject.toml — dev dependencies
[dependency-groups]
dev = [
  # ...
  "types-Flask-Cors>=6.0.0.20250809,<7",
  "types-passlib>=1.7.7.20260211,<2",
  "types-reportlab>=4.4.10.20260408,<5",
]

[tool.mypy]
python_version = "3.12"
strict = true
exclude = [
  "vendor/serverless-wsgi/",
  "dist",
  "scripts/db-query-mcp/mcp-server.py",
]
# Note: no [[tool.mypy.overrides]] blocks. Stubs are preferred.
```

```toml
# When an override IS necessary, document why inline:
[[tool.mypy.overrides]]
module = "some.lib"
ignore_missing_imports = true
# types-somelib only covers the HTTP client; this service uses only the async
# transport, which has no stubs yet.
```

#### Not desired ❌

```toml
[[tool.mypy.overrides]]
module = "reportlab"
ignore_missing_imports = true
# An uncommented override for a library that has a published types-reportlab stub.
# The actual fix was to add `types-reportlab` to dev deps and delete the override.
```

### Run mypy via the local hook, not the isolated prek hook

The backend pre-commit config runs mypy through a `repo: local` hook that shells out to `uv run mypy .`, not through
the upstream mypy pre-commit hook. The reason is in an inline comment in the config: keeping the `types-*` packages in
sync inside an isolated prek venv at the same versions pinned in `pyproject.toml` is fragile, so the hook uses the
project's `uv`-managed environment directly
(`backend/.pre-commit-config.yaml`).

When adding a new tool that has its own type stubs or plugins (sqlfluff is the other example), follow the same pattern
— register it as a `repo: local` hook with `language: system` and let `uv` manage the dependency.

#### Desired ✅

```yaml
# backend/.pre-commit-config.yaml
- repo: local
  hooks:
    - id: mypy
      name: "[backend] typecheck with mypy"
      entry: "uv run mypy ."
      language: system
      pass_filenames: false
```

## yamlfmt and YAML hooks

### `.yamlfmt.yaml` lives at the repo root; no service-level copies

`.yamlfmt.yaml` sits at the repo root and configures the formatter for every YAML file in the monorepo. The root
`.pre-commit-config.yaml` registers the `google/yamlfmt` hook at a pinned tag. There is no `backend/.yamlfmt.yaml`, no
`frontend/.yamlfmt.yaml`, and no service-level pre-commit entry for yamlfmt
(review precedent; `.yamlfmt.yaml`).

The rationale is drift prevention: splitting a repo-wide tool across multiple service-level configs guarantees that one
service gets the latest version, another lags, and YAML files at the root or in the `frontend/` tree escape coverage
entirely (`docker-compose.yml`, workflow files under `.github/workflows/`, `.mcp.json`, frontend `serverless.yml`,
etc.).

#### Desired ✅

```yaml
# .pre-commit-config.yaml (repo root)
- repo: https://github.com/google/yamlfmt
  rev: v0.21.0
  hooks:
    - id: yamlfmt
```

```yaml
# .yamlfmt.yaml (repo root) — the only yamlfmt config in the repo
line_ending: lf
formatter:
  type: basic
  retain_line_breaks_single: true
  trim_trailing_whitespace: true
  eof_newline: true
```

#### Not desired ❌

```yaml
# backend/.pre-commit-config.yaml — registering yamlfmt at service level
# Pre-merge, yamlfmt lived only inside backend/, leaving root and frontend YAML uncovered.
- repo: https://github.com/google/yamlfmt
  rev: v0.21.0
  hooks:
    - id: yamlfmt
```

### Exclude YAML from `end-of-file-fixer`

The shared `pre-commit/pre-commit-hooks` set in the root config includes `end-of-file-fixer`, which normalizes trailing
newlines on every file. yamlfmt also manages trailing newlines on YAML files via `eof_newline: true` in
`.yamlfmt.yaml`. When both hooks run on the same YAML file, they fight: one writes a newline, the other rewrites it
differently, prek loops, and the commit never settles. The root config resolves this by excluding `*.yaml` and `*.yml`
from `end-of-file-fixer` and letting yamlfmt own the trailing newline
(`.pre-commit-config.yaml`).

#### Desired ✅

```yaml
# .pre-commit-config.yaml (repo root)
- repo: https://github.com/pre-commit/pre-commit-hooks
  rev: v6.0.0
  hooks:
    - id: trailing-whitespace
    - id: end-of-file-fixer
      exclude: '\.(yaml|yml)$' # yamlfmt manages this for us
    - id: check-yaml
      exclude: "frontend/serverless\\.yml"
      # ^ frontend serverless.yml uses CloudFormation syntax that breaks simple yaml parsing
```

The same `check-yaml` hook excludes `frontend/serverless.yml` because that file uses CloudFormation YAML extensions
that the basic parser cannot read; the inline comment in the config carries the reason. Apply the same convention when
introducing other YAML files that intentionally violate the strict spec: exclude with a comment naming why.

## ruff

### Lint rule selection and per-file ignores

The ruff config in `backend/pyproject.toml` enables a curated set of rule families and pins the exact ruff version that
the pre-commit hook also runs (`ruff==0.15.2`), with a comment saying the two must match
(`backend/pyproject.toml`). When bumping ruff,
update both places in the same commit; otherwise local `uv run ruff` and `prek run ruff-check` produce different
findings.

Each entry in `[tool.ruff.lint.select]` carries a trailing comment with the rule family name and a link to the ruff
docs. Apply the same format when adding a new family. The `[tool.ruff.lint.ignore]` list does the same in reverse —
every ignore line names the specific rule it suppresses and either the permanent reason ("ternaries are more difficult
to read than if-else blocks") or a `TODO: enable` marker for ignores that exist only to break the work into smaller
PRs.

#### Desired ✅

```toml
# backend/pyproject.toml
[tool.ruff.lint]
select = [
  "B",   # flake8-bugbear: https://docs.astral.sh/ruff/rules/#flake8-bugbear-b
  "I",   # isort: https://docs.astral.sh/ruff/rules/#isort-i
  # ...
]
ignore = [
  "SIM108", # ternaries are more difficult to read than if-else blocks # https://docs.astral.sh/ruff/rules/if-else-block-instead-of-if-exp/
  "S101",   # assert is useful with mypy strict mode; tests do not run with -O # https://docs.astral.sh/ruff/rules/assert/#assert-s101
  "S603",   # TODO: enable # https://docs.astral.sh/ruff/rules/subprocess-without-shell-equals-true/
]
```

Per-file ignores follow the same convention: name the rule with a comment that explains why the file (or glob) is
exempt. Tests get `PLR2004` (magic-value comparison) because test code reads better with literals; scripts get
`INP001`, `T201`, and `T203` because `scripts/` is a flat directory of standalone entry points.

```toml
[tool.ruff.lint.per-file-ignores]
"tests/**/test_*.py" = [
  "PLR2004",
] # PLR2004 is 'no magic strings/numbers'; but it's just too freaking common/useful in test code to have that
"scripts/*.py" = [
  "INP001", # scripts/ is intended as a dir of standalone scripts that aren't imported from
  "T201",   # allow print statements in scripts
  "T203",   # allow pprint too
]
```

### Banned imports

`[tool.ruff.lint.flake8-tidy-imports.banned-api]` is the place to block specific call sites that have a project-blessed
replacement. The current entry is `logging.getLogger` → use `logging_config.get_logger` instead
(`backend/pyproject.toml`). When adding a new
banned import, set the `.msg` so the lint failure tells the author what to use instead.

#### Desired ✅

```toml
[tool.ruff.lint.flake8-tidy-imports.banned-api]
"logging.getLogger".msg = "Use logging_config.get_logger instead"
```

### Aliased and unaliased imports stay in separate `from` blocks

Ruff isort runs with the default `combine-as-imports = false`. Aliased and unaliased imports from the same module
remain in separate `from … import (…)` blocks. Merging them into one block triggers `I001`, and `ruff --fix` actively
re-splits them on the next run, so manually combining is a fight the author always loses
(review precedent; `backend/scripts/manage-account.py`).

Flipping `combine-as-imports = true` is not the answer for a single PR — it reflows imports across the entire backend
and is out of scope for any feature change.

#### Desired ✅

```python
# Unaliased imports from a module — own block
from svc.reports.vendor_summary import service

# Aliased imports from the same module — separate block
from svc.reports.vendor_summary import (
    pdf as asm_pdf,
)
```

#### Not desired ❌

```python
from svc.reports.vendor_summary import (
    service,
    pdf as asm_pdf,
)
# Reviewer-suggested combined form. Triggers I001; `ruff --fix` re-splits it.
```

### `ruff-format` and `ruff-check` both run in pre-commit

The backend pre-commit config runs `ruff-format` and then `ruff-check --fix` from the same pinned `ruff-pre-commit`
release (`v0.15.2`). Both hooks must use the same version as the `ruff` entry in `[dependency-groups].dev` of
`pyproject.toml`; the version pin in `pyproject.toml` carries a trailing comment saying "must match pre-commit hook
version"
(`backend/.pre-commit-config.yaml`). The
same rule applies to `sqlfluff`.

#### Desired ✅

```yaml
# backend/.pre-commit-config.yaml
- repo: https://github.com/astral-sh/ruff-pre-commit
  rev: v0.15.2
  hooks:
    - id: ruff-format
      name: "[backend] ruff format"
    - id: ruff-check
      name: "[backend] ruff check"
      args: ["--fix"]
```

```toml
# backend/pyproject.toml — pin must match the rev above
[dependency-groups]
dev = [
  # ...
  "ruff==0.15.2",     # must match pre-commit hook version
  "sqlfluff==4.0.4",  # must match pre-commit hook version
]
```

## Related standards

- [`docs/standards/pr-process.md`](./pr-process.md) — how the configured hooks interact with the review process.
- [`docs/standards/ci-workflows.md`](./ci-workflows.md) — the CI pipelines that re-run the same hooks on PRs.
- [`docs/standards/docs-hygiene.md`](./docs-hygiene.md) — markdown conventions enforced by `mdformat`.
