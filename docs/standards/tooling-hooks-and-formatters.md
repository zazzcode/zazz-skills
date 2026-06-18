---
last_updated_at: 2026-05-25
---

# Tooling hooks and formatters

This standard governs pre-commit / prek hook shape, markdown formatting, and TOML formatting.

## prek and pre-commit hooks

### Filename stays `.pre-commit-config.yaml`; runner is `prek`

`prek` is a Rust re-implementation of `pre-commit` with better monorepo support. It reads the same
`.pre-commit-config.yaml` schema. The root, backend, and frontend configs all carry the same header comment explaining
this so editors do not assume stock `pre-commit` is the runner
(`.pre-commit-config.yaml`).

### Hook naming: prefix with `[backend]` or `[frontend]` for service-level hooks

Hooks in service-level configs override the upstream `name` to include a `[backend]` or `[frontend]` prefix so that
prek output makes the source legible when both pipelines run on a multi-service commit. Root hooks do not carry a
prefix.

#### Desired ✅

```yaml
# backend/.pre-commit-config.yaml
- id: ruff-format
  name: "[backend] ruff format"
- id: ruff-check
  name: "[backend] ruff check"
  args: ["--fix"]
- id: mypy
  name: "[backend] typecheck with mypy"
  entry: "uv run mypy ."
  language: system
  pass_filenames: false
```

```yaml
# frontend/.pre-commit-config.yaml
- id: local-biome-check
  name: "[frontend] biome-check"
  entry: "npx @biomejs/biome check --write"
  language: system
  types: [text]
  pass_filenames: false
```

### `pass_filenames: false` for whole-repo tools

Tools whose configuration ignores files outside their scope (biome's `.gitignore`-aware ignore list, mypy reading
`[tool.mypy]` from `pyproject.toml`, sqlfluff reading `.sqlfluffignore`) run with `pass_filenames: false`. The frontend
biome hook config carries an inline explanation: passing filenames lets prek hand biome a path that biome's own ignore
list excludes, which then errors and makes it impossible to commit a change that only touches an ignored file
(`frontend/.pre-commit-config.yaml`).

#### Desired ✅

```yaml
# frontend/.pre-commit-config.yaml
- id: local-biome-check
  name: "[frontend] biome-check"
  entry: "npx @biomejs/biome check --write"
  language: system
  types: [text]
  # Biome is so stupid fast that it's fine to re-run over the whole codebase.
  # Also, if you pass_filenames then it's possible to pass a filename for
  # a file that the biome config is ignoring (like .gitignore), which then
  # errors. Making it impossible to make a commit that only contains a
  # change to a file biome ignores.
  pass_filenames: false
```

### Pin every hook at an explicit `rev:`; do not float

Every upstream hook entry pins an explicit `rev:` tag — `pre-commit/pre-commit-hooks` at `v6.0.0`, `google/yamlfmt` at
`v0.21.0`, `astral-sh/ruff-pre-commit` at `v0.15.2`, `ComPWA/taplo-pre-commit` at `v0.9.3`,
`koalaman/shellcheck-precommit` at `v0.11.0`, `hukkin/mdformat` at `1.0.0`
(`.pre-commit-config.yaml`;
`backend/.pre-commit-config.yaml`). When
bumping a pin, bump it in the config in the same commit that lands any code changes the new version requires.

## Markdown and TOML formatting

### `mdformat` runs at the repo root with `--wrap 119`

Markdown formatting runs from the root pre-commit config via `hukkin/mdformat` with the GFM and frontmatter plugins,
wrapped at 119 columns to match the ruff line length
(`.pre-commit-config.yaml`). Do not add a
service-level mdformat hook; the root entry already covers `backend/docs/`, `frontend/docs/`, and root markdown.

#### Desired ✅

```yaml
# .pre-commit-config.yaml (repo root)
- repo: https://github.com/hukkin/mdformat
  rev: 1.0.0
  hooks:
    - id: mdformat
      additional_dependencies:
        - mdformat-gfm
        - mdformat-frontmatter
      args: ["--wrap", "119"]
```

### `taplo-format` owns `pyproject.toml`

The backend config runs `ComPWA/taplo-pre-commit` to format `pyproject.toml`. Edits to `pyproject.toml` that bypass
taplo (manually reordering keys, mixing quote styles) get rewritten on the next commit; let the formatter own the shape
and use comments for any decisions that taplo cannot express
(`backend/.pre-commit-config.yaml`).

#### Desired ✅

```yaml
# backend/.pre-commit-config.yaml
- repo: https://github.com/ComPWA/taplo-pre-commit
  rev: v0.9.3
  hooks:
    - id: taplo-format
      name: "[backend] format pyproject.toml"
```
