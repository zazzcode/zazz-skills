---
last_updated_at: 2026-05-25
---

# PR process

This standard governs how PRs are titled, scoped, structured, and merged in the repository. It covers the
bracketed scope-label format used in every PR title, the one-logical-change-per-PR rule, expectations for
legacy-replacement PRs, the prohibition on transitional cruft that lands dead on merge, and the CVE-prefix convention
for security remediations. A sparse-fold subsection at the bottom carries monorepo / repo-hygiene rules that are too
small to warrant their own document — root-only direnv / .env / yamlfmt configuration.

## PR titles — bracketed scope labels

Every PR title begins with one or more bracketed category labels from the canonical set, before any descriptive text.
The label set is owned by
`.github/pull_request_template.md`; the
template's HTML comment is the source of truth and is shown to every PR author at PR creation time.

The canonical labels are:

- `BE` — Backend
- `FE` — Frontend
- `DB` — Database (anything in `/backend/database`)
- `CI` — CI/CD and infrastructure (workflows, deploy, AWS)
- `agent` — agent runtime settings, skills, hooks, and config
- `DOC` — Documentation (standards docs, feature docs, README, etc.)

Cross-cutting PRs combine labels with `+` and **no spaces** inside the brackets. The canonical form is `[BE+DB]`, never
`[BE + DB]` or `[BE] + [DB]`
(PR template).

Auto-generated release PRs (titled `Staging Release <YYYYMMDD>-<n>` by `app/github-actions`) are unlabeled by design
and are the only exception.

### Desired ✅

```text
[BE] Fix password hashing on second use
[FE] Add loading spinner to dashboard
[DB] Add index on users.email column
[CI] Speed up backend test pipeline
[AGENT] Add prek PostToolUse correction hook
[DOC] Add new test standards doc + update index
[BE+FE] Add password reset flow end-to-end
[BE+DB] Add soft-delete to user accounts
[FE+CI] Add frontend preview deploys
[BE+FE+DB] Implement new audit log feature
```

### Not desired ❌

```text
Fix password hashing on second use
# missing scope label entirely

[BE] + [DB] Add soft-delete to user accounts
# split brackets; canonical form is [BE+DB]

[BE + DB] Add soft-delete to user accounts
# spaces around +; canonical form is [BE+DB]
```

Source: pre-canonical drift observed in the PR-template comment block at
`.github/pull_request_template.md:1-25`
describing the no-space combined form.

## PR scope — one logical change per PR

A single PR scopes one logical change: one feature, one fix, one refactor, or one migration. Incidental bug fixes
discovered while working on a feature go in their own one-liner PR (or at minimum, an isolated commit on a separate
PR). Drive-by edits ("while I'm here") and unrelated migrations go in their own PR
(review precedent).

Multi-layer PRs (`[BE+DB+FE]`) are reserved for changes that are genuinely cross-cutting — an endpoint plus its
frontend caller plus its sproc — not for bundling unrelated work behind a multi-scope label. The label declares
cross-cutting *coupling*, not "I happened to touch all three layers this week."

The rule extends to commits inside a PR: when a feature commit unavoidably includes an unrelated fix, the fix lands in
its own commit with a clear message so `git revert` and `git blame` work cleanly. See
`AGENTS.md` cross-service commit rules for the related "one
service per commit" preference.

### Desired ✅

```text
[FE] Fix Redux userSlice login reducer
# review precedent — one-liner extracted from a feature PR

[BE+FE] Add RBAC role-permission matrix UI
# review precedent — feature only, no bundled migrations or drive-by fixes
```

### Not desired ❌

```text
[BE+FE] Add RBAC matrix UI + fix userSlice login reducer + reformat lints
# three logically distinct changes bundled into one PR
```

```text
[BE+FE+DB] Add RBAC matrix UI + V00030__update_seed_role_display_names migration
# the seed-data migration is unrelated to the UI feature and belongs in its own [DB] PR
```

## Legacy-replacement PRs — legacy screenshot + demo GIF

For any PR that replicates or replaces a legacy app screen with a new modal or page, the PR body includes the legacy
app screenshot in the **WHY** section and a GIF (or screen recording) of the new implementation in the **Demo**
section. The PR is self-contained — a reviewer or future `git log` reader does not need to open the tracker ticket to
understand what was being replicated .

The template at
`.github/pull_request_template.md`
already provides the **WHY** and **Demo** sections; the legacy-replacement convention is to fill both with images
rather than leaving the **Demo** section empty or describing the legacy in prose.

### Desired ✅

```markdown
### WHY

This PR replaces the legacy Customer Segment "Create" screen
so users can create customer segments without leaving the new UI.

Legacy screen:
![legacy create screen](./.images/legacy-customer-segment-create.png)

### Demo

![new create modal](./.images/new-customer-segment-create.gif)
```

### Not desired ❌

```markdown
### WHY

Adds the Create Customer Segment modal.
# reviewer has to open the tracker ticket to see what was being replicated;
# the PR body carries no visual context for "what existed before".
```

## No transitional cruft on merge

Transitional types, parameters, and interfaces added "for the migration" are removed in the same PR if they offer no
value after merge. If the only reason the code exists is "support for the prior version" or "support for old Storybook
stories that haven't been updated yet," update the consumers in the same PR and delete the bridge
.

Concrete patterns flagged in review and removed before merge in review precedent:

- `RolePermissionMatrixProps` — legacy props interface kept only to bridge to the old component shape. Removed.
- `TRole` — type export used only by old Storybook stories. Removed.
- `_props` — unused parameter retained "for compatibility." Removed.

When a refactor changes a component's props or types, the same PR updates every `*.stories.tsx` file that consumes the
component to the new shape. Storybook compatibility is not a reason to leak deprecated types into runtime component
code .

### Desired ✅

```tsx
// component.tsx — single canonical props shape, no legacy bridge
type Props = {
  roles: Role[];
  onChange: (next: Role[]) => void;
};

export function RolePermissionMatrix({ roles, onChange }: Props) {
  // ...
}

// component.stories.tsx — updated in the SAME PR to use the new shape
export const Default: Story = {
  args: { roles: sampleRoles, onChange: () => {} },
};
```

### Not desired ❌

```tsx
// Legacy interface retained only so old stories compile.
// Becomes cruft the moment this PR merges.
export interface RolePermissionMatrixProps {
  legacyRoles: TRole[];
}

export function RolePermissionMatrix(_props: RolePermissionMatrixProps) {
  // new implementation ignores _props entirely
}
```

```tsx
// Legacy type export kept only to satisfy old Storybook stories.
export type TRole = {
  // shape matches the pre-refactor model, not the new one
};
```

## CVE remediation PR titles

PR titles that remediate a published CVE include the CVE identifier in the descriptive portion of the title, after the
scope label, in the form `[<scope>] <CVE-ID>: <human description>`. The CVE identifier in the title is what makes
PR-list grep, dashboards, and post-incident audits work — burying the CVE in the body breaks all three
.

The full rule, including the supply-chain hygiene rationale (e.g., why direct `lodash` was removed from the frontend),
lives in `docs/standards/security.md`. This
document carries only the title-format convention so PR-list scanners and changelog tooling have a single authoritative
reference for "what shape does a CVE PR title take."

### Desired ✅

```text
[FE] CVE-2025-59471: bump Next.js to 16.2.0 and remove direct lodash
[BE] CVE-2025-12345: upgrade cryptography to 43.0.1
[CI] CVE-2025-99999: pin actions/checkout to v4.2.2
```

### Not desired ❌

```text
[FE] Bump Next.js and remove lodash
# no CVE identifier in the title; remediation context is invisible
# in PR lists, `gh pr list`, and the changelog.
```

## Monorepo / repo hygiene

This subsection folds in the small `monorepo-repo-hygiene` bucket. It covers the rule that environment configuration
and YAML formatting are owned by the repo root, not any single service directory. Anything broader (CI workflow
ordering, deploy pipelines) belongs in
`ci-workflows.md`; anything about
lint/format tools generally belongs in
`tooling-lint-format.md`.

### Root-only direnv (`.envrc`) and env (`.env`)

Direnv configuration lives at the repo root in `.envrc`, which calls `dotenv_if_exists .env`. No `.envrc` or `.env`
exists at the service level (`backend/.envrc`, `frontend/.envrc`, `backend/.env`, `frontend/.env`). If a PR
re-introduces a service-level `.envrc` or `.env` — typically from merging an old branch that predates the root
consolidation — the file is removed rather than merged
(review precedent; see
`.envrc`).

#### Desired ✅

```text
example-app/
├── .envrc          # dotenv_if_exists .env
├── .env            # single repo-wide env file
├── backend/        # no .envrc, no .env
└── frontend/       # no .envrc, no .env
```

```bash
# .envrc at repo root
# shellcheck disable=SC2148
dotenv_if_exists .env
```

#### Not desired ❌

```text
example-app/
├── .envrc
├── .env
├── backend/
│   └── .envrc      # service-level config re-introduced by an old-branch merge
└── frontend/
```

### Root-only YAML formatting (`yamlfmt`)

YAML formatting is wired at the repo root, not in any service directory. Three pieces work together
(review precedent; see
`.pre-commit-config.yaml` and
`.yamlfmt.yaml`):

1. `.yamlfmt.yaml` at the repo root configures the formatter (line endings, indentation, trailing-whitespace, EOF
   newline behavior).
1. `.pre-commit-config.yaml` at the repo root registers `google/yamlfmt` at a pinned tag (`rev: v0.21.0` on the integration branch).
1. The same root pre-commit config excludes `*.yaml` / `*.yml` from `end-of-file-fixer` so the two hooks do not fight
   over trailing newlines (which otherwise produces an endless prek loop).

The general principle: cross-service tooling — `yamlfmt`, repo-wide secret scanning, root-doc lint — belongs at the
monorepo root. A service-level config for a generic tool is a smell unless the tool is genuinely service-scoped (e.g.,
`ruff` for backend Python). Registering a repo-wide formatter inside `backend/.pre-commit-config.yaml` guarantees
drift: one service gets the latest version, another lags, root YAML files (workflow files, `.mcp.json`,
`docker-compose.yml`) escape coverage entirely.

#### Desired ✅

```yaml
# .pre-commit-config.yaml at repo root
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v6.0.0
    hooks:
      - id: end-of-file-fixer
        exclude: '\.(yaml|yml)$' # yamlfmt manages this for us

  - repo: https://github.com/google/yamlfmt
    rev: v0.21.0
    hooks:
      - id: yamlfmt
```

```yaml
# .yamlfmt.yaml at repo root
line_ending: lf
formatter:
  type: basic
  retain_line_breaks_single: true
  trim_trailing_whitespace: true
  eof_newline: true
```

#### Not desired ❌

```yaml
# backend/.pre-commit-config.yaml
# yamlfmt registered service-locally; root and frontend YAMLs escape coverage.
repos:
  - repo: https://github.com/google/yamlfmt
    rev: v0.21.0
    hooks:
      - id: yamlfmt
```

```yaml
# .pre-commit-config.yaml at root — end-of-file-fixer fights yamlfmt
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    hooks:
      - id: end-of-file-fixer
        # no exclude for *.yaml — produces an endless prek loop
  - repo: https://github.com/google/yamlfmt
    rev: v0.21.0
    hooks:
      - id: yamlfmt
```

## Related standards

- `docs/standards/security.md` — full
  CVE-remediation rules including dependency-hygiene checks (`npm ls lodash --omit=dev`, etc.).
- `docs/standards/tooling-lint-format.md`
  — broader lint/format tooling conventions (prek, mdformat, ruff).
- `docs/standards/ci-workflows.md` — CI
  path-filtering and workflow ordering that consume the `[BE]` / `[FE]` / `[DB]` scope labels.
- `docs/standards/docs-hygiene.md` —
  `[DOC]`-scoped PR conventions for standards documents and READMEs.
