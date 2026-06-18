---
last_updated_at: 2026-05-25
---

# CI LLM and conformance workflows

This standard governs LLM-invoking GitHub Actions workflows and the incremental conformance workflow.

## LLM-invoking workflows — workflow-scoped API keys

Each LLM-invoking workflow consumes its own dedicated LLM API key secret. A shared "all-purpose" key destroys
per-workflow cost attribution, prevents anomaly detection on individual workflows, and broadens leak blast radius. When
adding a new LLM-invoking workflow, provision a fresh key and set its secret **before** merging — do not reuse another
workflow's key "temporarily" .

Secret names follow a workflow-scoped convention so a reader scanning `api_key: ${{ secrets.<NAME> }}` can identify the
usage bucket from the secret name alone.

### Desired ✅

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

### Not desired ❌

```yaml
- uses: llm-provider/example-action@v1
  with:
    llm_api_key: ${{ secrets.SHARED_LLM_API_KEY }}
# wrong: a shared secret hides per-workflow spend and broadens leak blast radius
```

Concrete pairing on the integration branch: `conformance.yml` reads `LLM_API_KEY_CONFORMANCE_WORKFLOW`; `reviewer.yml` reads
`LLM_API_KEY_REVIEWER`
(conformance.yml:40;
reviewer.yml:51).

## LLM-invoking workflows — "settings first, then prompt" layout

LLM-invoking workflows have a larger blast radius than typical CI jobs: write access, secret consumption, auto-PR
creation. The YAML is laid out so a reader can answer three questions — what triggers it, what privileges it has, what
inputs it accepts — without scrolling past the prompt block. Configuration (workflow inputs, job permissions, action
parameters) is placed **above** the LLM prompt content. The prompt block is last
.

Inputs constrained to a fixed set use the `choice` type, not free-form `string`. LLM-style actions enable
`display_report: true` (or the equivalent) so the workflow run's summary surfaces what the LLM did, without requiring
an operator to dig through raw logs.

### Desired ✅

```yaml
# .github/workflows/conformance.yml (excerpted)
name: Conformance
on:
  workflow_dispatch:
    inputs:
      guide-path:
        description: "Guide to conform against"
        required: true
        type: choice
        options:
          - backend/docs/http-layer-guide.md
          - backend/docs/service-layer-guide.md
          - backend/docs/data-layer-guide.md
          - backend/docs/database-guide.md
      file:
        description: "Optional: specific file to conform (leave empty to auto-discover)"
        required: false
        type: string

jobs:
  conform:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/checkout@v6
      - uses: astral-sh/setup-uv@v7
        with:
          enable-cache: true
          cache-dependency-glob: "backend/uv.lock"
      - run: cd backend && uv sync --all-groups
      - uses: llm-provider/example-action@v1
        with:
          llm_api_key: ${{ secrets.LLM_API_KEY_CONFORMANCE_WORKFLOW }}
          settings: |
            { "env": { "ENVIRONMENT": "local", ... } }
          display_report: true
          claude_args: |
            --model sonnet
            --allowedTools Read,Edit,Write,Glob,Grep,Bash(git:*),Bash(gh pr create:*)
          prompt: |-
            <prompt content here, LAST>
```

### Not desired ❌

```yaml
# wrong: prompt appears before permissions/inputs; reader cannot audit privilege at a glance
steps:
  - uses: llm-provider/example-action@v1
    with:
      prompt: |
        ...
  - name: configure
    ...
```

The on-dev `conformance.yml` is the reference layout: `name:` → `on: workflow_dispatch:` with typed `inputs:` →
`jobs.conform:` with `runs-on:` and explicit `permissions:` → setup steps (`checkout`, `setup-uv`) → action invocation
with `display_report: true` and `prompt:` last
(conformance.yml).

## Incremental conformance — `/conformance` skill + workflow

Prescriptive standards documents only deliver value if the codebase is brought into conformance with them over time. A
bulk rewrite is unreviewable; a CLI/CI loop that produces one small, isolated change per invocation makes incremental
conformance tractable. The project's mechanism for this is the `/conformance` agent Code skill at
`.agents/skills/conformance/`, paired with `.github/workflows/conformance.yml` for CI invocation
.

The skill accepts a guide path and finds ONE small, topically isolated change to bring a file closer to the guide. It
does NOT commit — it produces a commit-message blurb in a temp file for the human or downstream automation to commit.
The `--auto` flag skips interactive selection so the skill can be invoked by agents or CI.

Invocation forms:

```text
/conformance <path/to/guide/file>           # interactive
/conformance <path/to/guide/file> --auto    # non-interactive (agent / CI)
/conformance <guide> --file <target-file>   # narrow scope to one file
```

The CI workflow exposes the skill via `workflow_dispatch` with a `choice`-typed `guide-path` input listing the
canonical guides and an optional `file` input for targeted runs. Job permissions are `contents: write`,
`pull-requests: write`, `id-token: write` so the run can open a PR with the change. The workflow's prompt instructs the
agent to first list any open PRs labeled `conformance` and skip candidates already covered, then run
`/conformance ... --auto`, then create a `conformance/<short-kebab-description>` branch and open a labeled PR with the
`[BE] Conformance: ...` title shape
(conformance.yml;
review precedent).

### Desired ✅

```yaml
# .github/workflows/conformance.yml — invocation pattern (excerpted)
on:
  workflow_dispatch:
    inputs:
      guide-path:
        type: choice
        options:
          - backend/docs/http-layer-guide.md
          - backend/docs/service-layer-guide.md
          - backend/docs/data-layer-guide.md
          - backend/docs/database-guide.md
      file:
        required: false
        type: string

jobs:
  conform:
    permissions:
      contents: write
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/checkout@v6
      - uses: llm-provider/example-action@v1
        with:
          llm_api_key: ${{ secrets.LLM_API_KEY_CONFORMANCE_WORKFLOW }}
          display_report: true
          prompt: |-
            Before making any changes, check for existing open conformance PRs:
            Run: gh pr list --label conformance --state open --json title,body,url

            Then run /conformance ${{ inputs.guide-path }} --auto \
              ${{ inputs.file && format('--file {0}', inputs.file) || '' }}

            After making the change successfully, create a PR targeting dev from a new branch.
            Name the branch conformance/<short-kebab-description>.
            Label the PR with the "conformance" label.
```

When introducing a new prescriptive guide under `docs/standards/` or `backend/docs/`, add it to the `guide-path` enum
in `conformance.yml` so the workflow can target it.

### Coordinating concurrent conformance runs

Because the workflow can be dispatched repeatedly against the same guide, the prompt's first step is to enumerate open
PRs labeled `conformance` and skip any candidate file already addressed by an open PR. If every viable candidate is
already covered, the run stops and reports that no new conformance change is needed. This keeps multiple concurrent or
scheduled invocations from racing on the same file
(conformance.yml prompt block).

The resulting PRs follow a fixed shape so reviewers can scan them quickly: title
`[BE] Conformance: <brief title specifying file path updated + guide used>`; body with `## WHY`, `## WHAT`,
`**File updated**:`, and a `## Note` linking back to the GitHub Actions run that produced the change
(conformance.yml prompt block).
