---
last_updated_at: 2026-05-25
---

# CI workflows

This standard governs every file under `.github/workflows/`. It covers how check pipelines are triggered and scoped per
service, how privileges and secrets are declared, how caches are kept warm across PR branches, how the prek pre-commit
action is invoked, and how LLM-invoking workflows are structured. The rules apply to authors writing or modifying
workflow YAML and to reviewers gating those changes.

## Overview

CI is path-filtered per service. Backend changes trigger backend checks; frontend changes trigger frontend checks; root
or cross-cutting changes trigger common checks. The two services do not share a single mega-workflow.

```text
.github/workflows/
├── backend-checks.yml             # PR-gated backend lint/format/test
├── backend-serverless-deploy.yml  # push-gated deploy to dev/stage
├── cache-warmers.yml              # dev-push cache seeder for PR-gated workflows
├── claude.yml                     # @claude PR-comment integration (LLM)
├── common-checks.yml              # PR-gated root/cross-service lint
├── conformance.yml                # workflow_dispatch incremental conformance (LLM)
├── frontend-checks.yml            # PR-gated frontend lint/format/typecheck/build
├── frontend-serverless-deploy.yml # push-gated frontend deploy
└── prepare-release.yml            # release prep
```

The check workflows fire on `pull_request` against `dev` and never on raw `push:`. The deploy workflows fire on `push:`
against `dev` and `stage`. Caches are populated from `dev` by `cache-warmers.yml` so PR branches can restore on first
run (cache-warmers.yml;
review precedent).

## Triggers — `pull_request` against `dev` for checks

Backend and frontend check workflows trigger on `pull_request: branches: [dev]` with a `paths:` filter scoping them to
their service. Every commit pushed to an open PR re-runs the full layer-specific suite for that PR, so the PR's status
list always reflects the current tip — including after follow-up commits that touch only an unrelated layer. Raw
`push:` triggers on feature branches are not used for check workflows; they produce a per-commit pattern that leaves
the PR view inconsistent (review precedent; backend-checks.yml:2-11).

The `paths:` filter includes both the service tree and the workflow file itself, so edits to the workflow re-trigger
it.

### Desired ✅

```yaml
# .github/workflows/backend-checks.yml
name: "[backend] Format, lint, test"
on:
  pull_request:
    # This will only run on PR branches targeting merge to dev. Release branches
    # via dev -> stage will not trigger this workflow.
    # This workflow also relies on cache-warmers.yml to keep caches warm for
    # feature branch PRs
    branches: [dev]
    paths:
      - "backend/**"
      - ".github/workflows/backend-*.yml"
```

### Not desired ❌

```yaml
on:
  push:
    branches:
      - "feature/*"
# wrong: per-commit on push; later docs-only commits clear the layer-specific
# check from the PR view, leaving reviewers unsure whether earlier commits pass.
```

Check workflows do not run on the release path (`dev → stage`) and do not run on feature branches that lack an open PR
— both are intentional .

The trade-off is explicit: a second commit on a PR that touches only docs still triggers the full backend/frontend
check suite for the whole PR. The lost per-commit efficiency is the cost; the gain is that the PR's check list always
shows the full status for every layer the PR touches, even after follow-up commits — reviewers can confirm "all checks
passed on the merge commit" at a glance instead of walking commit history
. `cache-warmers.yml` is the complementary workflow that keeps the
per-PR re-runs fast (see [Caching](#caching--cache-warmersyml-mirrors-every-pr-gated-cache)).

### Deploy workflows trigger on `push:` to env branches

Deploy workflows use a different shape: `push:` against the env branches (`dev` and `stage`) plus `workflow_dispatch:`
for manual runs. They also set a `concurrency:` group keyed by `${{ github.workflow }}-${{ github.ref }}` so two pushes
to the same env branch do not race on the same deployment target
(backend-serverless-deploy.yml:3-14).

```yaml
# .github/workflows/backend-serverless-deploy.yml
on:
  push:
    branches:
      - dev
      - stage
  workflow_dispatch:
permissions:
  id-token: write # required for requesting the JWT that AWS uses to authorize the cloud-credentials request
  contents: read # required for actions/checkout
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: false
```

## Workflow permissions — explicit minimum-privilege block

Every workflow declares an explicit `permissions:` block at top level or per-job, granting only the scopes the workflow
actually uses. Omitting the block falls back to the default `GITHUB_TOKEN` scope, which is silently overpermissive and
breaks workflows when GitHub tightens defaults — both outcomes the team has observed in production
.

Workflows that read PR metadata or use `dorny/paths-filter` need `contents: read` and `pull-requests: read`. Deploy
workflows that assume an AWS role via OIDC add `id-token: write`. LLM-invoking workflows that open PRs need
`contents: write`, `pull-requests: write`, and `id-token: write` at the job level. Annotate any non-obvious scope with
a one-line comment so the next reader can audit privilege without leaving the file.

### Desired ✅

```yaml
# .github/workflows/frontend-checks.yml
# dorny/paths-filter requires read permissions
permissions:
  contents: read
  pull-requests: read
```

```yaml
# .github/workflows/backend-serverless-deploy.yml
permissions:
  id-token: write # required for requesting the JWT that AWS uses to authorize the cloud-credentials request
  contents: read # required for actions/checkout
```

```yaml
# .github/workflows/conformance.yml — job-level grants for an LLM that opens PRs
jobs:
  conform:
    permissions:
      contents: write
      pull-requests: write
      id-token: write
```

### Not desired ❌

```yaml
# wrong: no permissions block — falls back to default GITHUB_TOKEN scope, silently overpermissive
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
```

Concrete grants on the integration branch: `frontend-checks.yml` and `backend-checks.yml` use the read-only pair; the two
`*-serverless-deploy.yml` workflows add `id-token: write` for OIDC; `conformance.yml` and `claude.yml` carry the
write-trio at job level (review precedent; backend-serverless-deploy.yml:9-11).

## Caching — `cache-warmers.yml` mirrors every PR-gated cache

GitHub Actions only lets a PR branch restore caches from its own branch or the base branch. The check workflows do not
run on the integration branch itself, so without a dedicated seeder no cache ever exists on the integration branch and every new PR starts cold.
`.github/workflows/cache-warmers.yml` solves this: it runs on every push to `dev` and pre-populates each cache that a
PR-gated workflow depends on. When the cache key already exists, each warmer job is a fast no-op (~15s lookup + skip)
(review precedent; cache-warmers.yml header comment).

When introducing a new `actions/cache` step or a `cache:` directive on a `setup-*` action in a PR-gated workflow, add a
mirroring job in `cache-warmers.yml` that derives the **same** cache key from the same inputs (lockfile hash, OS, tool
version). A drifted key means the warmer runs but PR branches still miss.

### Desired ✅

```yaml
# .github/workflows/cache-warmers.yml
name: Warm CI caches

on:
  push:
    branches: [dev]

jobs:
  warm-backend-prek:
    name: Warm backend prek hook environments
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - name: Install UV
        uses: astral-sh/setup-uv@v7
        with:
          enable-cache: true
          cache-dependency-glob: "backend/uv.lock"
      - name: Install project dependencies
        run: cd backend && uv sync --all-groups
      # install-only: sets up hook environments and saves the prek cache
      # without actually running hooks. This is sufficient to warm the cache.
      - name: Install prek hook environments
        uses: j178/prek-action@v2
        with:
          install-only: true
          extra-args: "--directory backend"
```

The matching consumer in `backend-checks.yml` uses the identical `astral-sh/setup-uv@v7` step with
`cache-dependency-glob: "backend/uv.lock"` so the key resolves to the same hash
(backend-checks.yml:17-21).

The mirror jobs cover every ecosystem in use: `warm-backend-prek` and the corresponding `astral-sh/setup-uv@v7` cache
for backend Python deps; `warm-common-prek` for hooks that have no service-specific deps; and the equivalent frontend
warmers tied to `actions/setup-node@v6` with `cache: "npm"` and `cache-dependency-path: "frontend/package-lock.json"`
(cache-warmers.yml).

### Not desired ❌

```yaml
# wrong: new cache added in backend-checks.yml but no mirror in cache-warmers.yml
# PR runs miss the cache and re-install from scratch
```

## prek action — v2, explicit `--all-files` / `--directory` discipline

Workflow invocations of the prek pre-commit action use the v2 action (`j178/prek-action@v2`). The v2 action's implicit
`--all-files` behavior **only** applies when no `extra-args:` are passed at all. When `extra-args:` is present,
`--all-files` must be passed explicitly — otherwise the action silently skips files and the lint job goes green without
running the rules. When `extra-args:` includes `--directory <path>`, omit `--all-files`: the two flags are mutually
exclusive in prek and passing both raises an error .

Downgrades from v2 require justification in the workflow file.

### Desired ✅

```yaml
# .github/workflows/common-checks.yml — whole-repo scope
- name: Install and run prek pre-commit hooks
  uses: j178/prek-action@v2
  with:
    extra-args: "--all-files --config .pre-commit-config.yaml"
```

```yaml
# .github/workflows/backend-checks.yml — directory scope, --all-files omitted
- name: Install and run prek pre-commit hooks
  uses: j178/prek-action@v2
  with:
    extra-args: "--directory backend"
```

### Not desired ❌

```yaml
# wrong: extra-args present without --all-files — common-checks silently skips files
- uses: j178/prek-action@v2
  with:
    extra-args: --some-other-flag
```

On the integration branch: `common-checks.yml` passes `--all-files`; the backend and frontend variants pass `--directory <service>` and
omit `--all-files`
(common-checks.yml:14-18;
backend-checks.yml:26-29).

The same install/save pattern is mirrored in `cache-warmers.yml` with `install-only: true` so hook environments are
seeded on the integration branch
(cache-warmers.yml:40-46).

## Related standards

- security.md — workflow-permissions and
  secret-handling rules referenced above also appear in the security bucket.
- tooling-lint-format.md — the prek
  action invoked from these workflows is the same one used pre-commit locally.
