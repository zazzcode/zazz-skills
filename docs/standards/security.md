---
last_updated_at: 2026-05-25
---

# Security

This standard governs the security-adjacent conventions that show up in day-to-day work in a product repo: how CI workflows
scope secrets and privileges, how CVE-remediation PRs identify themselves and document their residual audit findings,
and how the frontend keeps known-risky supply-chain surface area off the direct dependency list. It covers GitHub
Actions workflow files under `.github/workflows/`, `frontend/package.json`, and the bodies of PRs that remediate a
published advisory.

This is a stack-specific baseline for GitHub Actions and npm-based frontend dependencies. Teams using a different CI
system or package manager should replace the examples while preserving the same requirements: scoped secrets,
minimum-privilege workflow permissions, direct-dependency risk reduction, and documented residual CVE analysis.

## Workflow secrets are workflow-scoped

Every GitHub Actions workflow that calls an LLM provider consumes a secret named for that workflow. A new LLM-invoking
workflow provisions a new secret; it does not reuse a sibling workflow's key, even "temporarily." This makes
per-workflow LLM spend independently attributable from billing dashboards, lets an operator revoke one workflow's
access without taking down the rest, and bounds the blast radius of a leak to one workflow
(review precedent; see
conformance.yml and
reviewer.yml).

Naming follows a workflow-scoped convention so a reviewer reading the `api_key:` line knows which workflow the key
belongs to. The conformance workflow consumes `LLM_API_KEY_CONFORMANCE_WORKFLOW`; the agent PR-comment
integration consumes `LLM_API_KEY_REVIEWER`.

Operational sequence when adding a new LLM-invoking workflow: open a separate ticket to provision the key, set the
GitHub secret, then merge the workflow that references it. Do not merge a workflow that references a
not-yet-provisioned secret, and do not point the new workflow at an existing secret as a placeholder.

### Desired

```yaml
# .github/workflows/conformance.yml
- uses: llm-provider/example-action@v1
  with:
    llm_api_key: ${{ secrets.LLM_API_KEY_CONFORMANCE_WORKFLOW }}
```

```yaml
# .github/workflows/reviewer.yml
- uses: llm-provider/example-action@v1
  with:
    llm_api_key: ${{ secrets.LLM_API_KEY_REVIEWER }}
```

Sources: conformance.yml,
reviewer.yml.

### Not desired

```yaml
api_key: ${{ secrets.SHARED_LLM_API_KEY }}
# shared key hides per-workflow spend; one leak compromises every LLM workflow
```

## Every workflow declares an explicit minimum-privilege `permissions:` block

Every workflow file under `.github/workflows/` declares a `permissions:` block — top-level when all jobs share the same
scopes, per-job when they differ — granting only the scopes that workflow actually uses. Workflows MUST NOT rely on the
implicit default `GITHUB_TOKEN` scope: that default is broader than the minimum, makes least-privilege auditing
impossible, and silently breaks workflows when GitHub tightens the default
(review precedent; see
frontend-checks.yml#L13-L15).

Concrete scope choices observed on `dev`, grouped by what the workflow needs to do:

- Path-filtered PR checks using `dorny/paths-filter` need to read the repo and the PR metadata. Grant `contents: read`
  and `pull-requests: read` (see
  frontend-checks.yml#L13-L15).
- Serverless deploy workflows assume an AWS role via OIDC and check out the repo. Grant `id-token: write` and
  `contents: read` at the top level (see
  backend-serverless-deploy.yml#L9-L11).
- Workflows that open PRs (conformance, the `@claude` integration) need to write to contents and pull-requests and use
  OIDC; declare these at the job level so the surface stays narrow (see
  conformance.yml#L22-L25).

Annotate the block with a one-line comment naming the action that forced the scope ("dorny/paths-filter requires read
permissions", "OIDC for AWS role assumption"). The next reader can then audit privilege at a glance instead of
re-deriving it from the workflow's job graph.

### Desired

```yaml
# .github/workflows/frontend-checks.yml
on:
  pull_request:
    branches: [dev]
    paths:
      - "frontend/**"
      - ".github/workflows/frontend-*.yml"
# dorny/paths-filter requires read permissions
permissions:
  contents: read
  pull-requests: read
```

Source:
frontend-checks.yml#L13-L15.

```yaml
# .github/workflows/backend-serverless-deploy.yml
permissions:
  id-token: write # required for the JWT AWS uses to authorize the cloud-credentials request
  contents: read  # required for actions/checkout
```

Source:
backend-serverless-deploy.yml#L9-L11.

```yaml
# .github/workflows/conformance.yml — job-level grant for a PR-opening job
jobs:
  conform:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      id-token: write
```

Source: conformance.yml#L22-L25.

### Not desired

```yaml
# no permissions: block — falls back to the default GITHUB_TOKEN scope,
# which is broader than the minimum and not auditable from the workflow file
name: "[backend] Format, lint, test"
on:
  pull_request:
    branches: [dev]
jobs:
  format-lint-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
```

## CVE-remediation PRs put the CVE in the title

PR titles that remediate a published CVE put the CVE identifier in the descriptive portion of the title, after the
scope label, in the form `[<scope>] <CVE-ID>: <human description>`. The scope label is the usual `[FE]`, `[BE]`,
`[CI]`, or `[DB]` prefix; the CVE identifier follows it (review precedent).

This is the rare case where the title actively serves an audit purpose, not just a descriptive one. PR lists
(`gh pr list`, the GitHub UI) show titles only. Security incident response often involves grepping merged PRs for a
CVE; title-level inclusion is what makes that grep work. Auditors scanning the changelog can identify remediation PRs
without opening each body.

### Desired

```text
[FE] CVE-2025-59471: bump Next.js to 16.2.0 and remove direct lodash
[BE] CVE-2025-12345: upgrade requests to 2.32.4
[CI] CVE-2025-67890: pin actions/checkout to v6.1.1
```

Source: review precedent.

### Not desired

```text
[FE] Bump Next.js and remove lodash
# CVE identifier buried in the body; grep-based audit fails
```

## Vet new dependencies before adding them

Before adding or recommending any new library — frontend or backend, runtime or dev — verify all three of the
following. A library failing any one of them needs explicit sign-off in the PR, not silent inclusion.

- **Actively maintained.** Recent releases and commit activity. A package whose last publish is roughly a year old or
  more is presumed dead: it will never receive security patches, and it freezes whatever transitive tree it pins.
- **Current.** The latest major version, with peer dependencies that accept current majors of their transitives. A peer
  range that pins a CVE-vulnerable major (e.g. a viewer library peer-pinned to `pdfjs-dist ^2||^3`) imports unfixable
  `npm audit` findings on day one.
- **Liberal license for commercial use.** MIT/BSD/Apache-2.0-class licenses are acceptable. GPL/AGPL/SSPL,
  source-available, or commercially restricted licenses require explicit approval before the dependency enters the
  tree.

Check before proposing:

```bash
# npm: last publish, version, license, peer pins
npm view <pkg> time.modified version license peerDependencies
# advisory posture
npm audit --package-lock-only   # after a trial add, or check the GitHub advisory DB directly
```

For Python, check the PyPI project page for last release date and license, and `uv tree` for what the candidate drags
in.

Worked negative example: `@react-pdf-viewer` (last published March 2023, peer-pinned to a CVE-vulnerable `pdfjs-dist`
major) was added to the frontend and had to be rejected — a dead library that locked the project to vulnerable
transitive versions with "No fix available" in `npm audit`. Prefer zero-dependency or native-platform solutions when
they cover the feature set.

## Frontend supply chain: no direct `lodash` dependency

`frontend/package.json` does not list `lodash` as a direct `dependencies` entry. `lodash` has a long history of CVEs
across versions and usages, and this project does not depend on its surface area in any non-trivial way, so the direct
dep is pure exposure. The helpers actually used (`last`, `pick`, `omit`, and similar) have sub-five-line native JS
replacements (review precedent; verify against current
frontend/package.json).

The previous use site (`frontend/src/layouts/Menu.tsx`, `lodash/last`) was replaced with `array[array.length - 1]`.
Future PRs that touch a frontend file with a `lodash/<fn>` import inline the native equivalent instead of leaving the
import in place.

Out of scope for this rule: `lodash` arriving transitively through a third-party library. Those are bounded by the
supply-chain hygiene of the importing library and are not directly addressable here. The rule is specifically about the
project's own direct dependency.

Anti-pattern to call out explicitly: importing `lodash/<fn>` "because it's already in the lockfile transitively." Even
when the install is free, the direct dependency in `package.json` re-asserts the supply-chain risk and is what
`npm audit` flags as the project's problem.

Verify the change before merge:

```bash
cd frontend
npm ls lodash --omit=dev
# Expected: no production `lodash` package listed
```

### Desired

```ts
// frontend/src/layouts/Menu.tsx
const last = array[array.length - 1];
```

```jsonc
// frontend/package.json — no "lodash" entry under "dependencies"
{
  "dependencies": {
    "next": "16.2.0",
    "react": "^19.0.0"
    // ... no lodash
  }
}
```

Source: frontend/package.json.

### Not desired

```ts
import last from "lodash/last";
// re-asserts the direct lodash dependency for a one-line native replacement
const value = last(array);
```

## Document residual `npm audit` warnings in the PR body

Security-remediation PRs include a `## Security follow-up context from audit` section in the body. For each remaining
`npm audit --omit=dev` warning at moderate-or-higher severity after the remediation, the section records five things in
order (review precedent):

1. The advisory identifier (e.g., `GHSA-2g4f-4pwh-qvx6`).
1. The reachability chain through `npm ls`, naming every link from a direct dependency down to the vulnerable package.
1. The exploitability condition — the specific runtime configuration or call pattern that triggers the vulnerability.
1. The actual runtime instantiation in this project, with enough detail to confirm or deny the exploit condition.
1. The deferral decision: exploitable in the runtime (block this PR on the upstream fix), or non-exploitable /
   acceptably-bounded (defer, with the analysis above as the durable record).

Pair the security-context section with a `## Verification` block that lists the commands actually run to confirm the
remediation. At a minimum: `npm run test:ci`, `npm run build`, and the targeted `npm ls <package> --omit=dev` check for
whatever direct dependency this PR removed or upgraded (see
frontend/package.json scripts).

The principle: silent deferrals — "I ran audit, some warnings remain, I'm merging anyway" — make future incident
response much harder. Future-you needs to know whether a given advisory was knowingly tolerated when the PR shipped, or
simply overlooked. Forcing the analysis into the PR body at merge time creates a durable per-CVE record colocated with
the change.

### Desired

```markdown
## Security follow-up context from audit

### `ajv` GHSA-2g4f-4pwh-qvx6 (moderate)

- Reachability: `@mui/x-data-grid-pro -> @mui/x-license -> @mui/x-telemetry -> conf -> ajv`
- Exploit condition: Ajv must be instantiated with `$data` enabled.
- Runtime analysis: Ajv is created with options equivalent to
  `{ allErrors: true, useDefaults: true }` and does not enable `$data`.
- Decision: Defer; non-exploitable for this usage.

### `yaml` GHSA-48c2-rrv3-qjmp (moderate)

- Reachability: `@emotion/react -> ... -> cosmiconfig -> yaml`
- Exploit condition: parsing untrusted YAML at runtime.
- Runtime analysis: `yaml` is only invoked at build time by `cosmiconfig`
  loading repo-owned config files; no user input reaches the parser.
- Decision: Defer; non-exploitable for this usage.

## Verification

- `npm run test:ci` — pass
- `npm run build` — pass
- `npm ls lodash --omit=dev` — no production lodash
```

Source: review precedent.

### Not desired

```markdown
## Notes

A couple of audit warnings remain but they're transitive — merging anyway.
<!-- silent deferral; future incident response can't tell what was
tolerated vs. accidentally missed -->
```

Source: review precedent.

## Related standards

- CI workflows — workflow file structure,
  path filters, caching, and the broader set of conventions for `.github/workflows/`.
- PR process — general PR title, body, and
  verification conventions.
