# Code-Review-Graph Optional Utility

Use `code-review-graph` as an optional review accelerator for large or high-risk PRs. It can reduce token usage by
giving the agent compact structural context before it reads files, and can provide blast radius, impacted
callers/dependents, affected flows, likely test gaps, and context-savings data.

Load it to help the agent perform a stronger review on behalf of the human user before the human has to manually
untangle a large or AI-generated PR.

Graph output is advisory. Do not let it replace the pinned git diff, standards matching, spec review, or human review
judgment. Verify suspected issues against source, tests, standards, and spec before reporting findings.

## Zazz Boundary

This file is adapted Zazz workflow guidance, not a vendored upstream skill.

Do not copy or install upstream companion skills by default. Upstream skills such as `review-pr`, `review-delta`, and
`build-graph` are references only; `pr-review` remains the orchestrator and still runs the Standards and Spec axes.

Default Zazz setup is minimal CLI/MCP access:

- no upstream companion skills
- no hooks
- no graph-first instruction injection

Hook-enabled setup and full upstream integration are separate, explicit user choices. Keep human-facing setup, update,
and troubleshooting details in `docs/code-review-graph.md` or `.zazz/docs/code-review-graph.md` when that project doc
exists.

## Discovery

Load this file only when graph context is in scope:

- changed-file count is greater than 10
- user requested graph, blast-radius, impact, token-efficient review, or tool-assisted review
- smaller PR touches shared APIs, auth, migrations, data paths, test infrastructure, or files with many
  callers/dependents

Check access in this order:

1. Persistent CLI: `command -v code-review-graph`
1. On-demand CLI: `uvx code-review-graph --version`
1. MCP tools in the current tool list, such as `get_minimal_context_tool`, `detect_changes_tool`,
   `get_review_context_tool`, `get_impact_radius_tool`, `get_affected_flows_tool`, and `query_graph_tool`

If neither CLI nor MCP access is available for a large review, prompt:

```text
This review touches <N> changed files, so `code-review-graph` would likely reduce token
usage and improve review quality by adding blast-radius and graph-derived context before
I read broad file contents. I do not see it installed/configured here.

Do you want me to configure minimal CLI/MCP access now, point me at an existing install,
or continue without it for this review?
```

Continue without graph context if the user declines. For large PRs, record the absence as residual blast-radius risk.

## Setup Choices

Only install or configure with explicit user consent.

Default review-only setup:

```bash
uvx code-review-graph install --no-skills --no-hooks --no-instructions
uvx code-review-graph build
```

This configures MCP access and builds the graph without installing upstream skills, hooks, git hooks, or rule-file
instructions. Use this unless the user asks for something else.

Persistent CLI setup:

```bash
uv tool install code-review-graph
code-review-graph install --no-skills --no-hooks --no-instructions
code-review-graph build
```

Hook-enabled setup:

```bash
uv tool install code-review-graph
code-review-graph install --platform <name> --no-skills --no-instructions
code-review-graph build
```

Use hooks only with explicit consent. Upstream hook scripts call `code-review-graph` directly, not
`uvx code-review-graph`, so do not recommend hooks on a pure `uvx` on-demand setup. Target one platform; avoid
`--platform all` unless the user explicitly wants every detected/supported tool configured.

Full upstream integration:

```bash
uv tool install code-review-graph
code-review-graph install --platform <name>
code-review-graph build
```

Use full integration only when the user explicitly wants upstream skills, hooks, and graph-first instruction injection.

Supported platform keys in the checked installer include `codex`, `claude`, `claude-code`, `cursor`, `windsurf`, `zed`,
`continue`, `opencode`, `antigravity`, `gemini-cli`, `qwen`, `kiro`, `qoder`, `copilot`, `copilot-cli`, and `all`. If a
requested AI tool is not listed, do not invent a platform key; use CLI output and tell the user the installer may not
support that tool yet.

If network/package installation needs approval, request approval after the user consents. If `uv` is unavailable, use
`pipx install code-review-graph` as the next isolated persistent option. Use `pip install code-review-graph` only when
the user is comfortable installing into the active Python environment.

After setup:

1. Verify: `uvx code-review-graph --version` or `code-review-graph --version`.
1. Build or refresh from the repo under review: `build` or `update --brief`.
1. If MCP config changed, tell the user their AI tool may need a restart; continue with CLI output for the current
   review.

## Usage During Review

Prefer the CLI for the first graph pass. It is compact, auditable, and works even when MCP tools have not appeared yet.

Command form:

- On-demand/default: `uvx code-review-graph ...`
- Persistent install: `code-review-graph ...`
- Local checkout while developing the tool: `uv run code-review-graph ...`

Use:

```bash
uvx code-review-graph detect-changes --brief
```

when the graph should already be fresh.

Use:

```bash
uvx code-review-graph update --brief
```

after a rebase, large change set, stale graph, or first review pass after edits.

If no graph exists, run:

```bash
uvx code-review-graph build
uvx code-review-graph update --brief
```

When MCP tools are visible, use them for targeted follow-up rather than broad file loading:

- `get_minimal_context_tool(task="review changes")`
- `get_review_context_tool(base="<fixed-point>")`
- `get_impact_radius_tool(base="<fixed-point>")`
- `get_affected_flows_tool(...)`
- `query_graph_tool(pattern="callers_of", target=<name>)`
- `query_graph_tool(pattern="tests_for", target=<name>)`

Capture a concise graph summary for dispatch:

- **Graph status:** unavailable, declined, CLI-only, or MCP tools available
- **Graph command/tools used:** exact commands or tool names
- **Risk/blast radius:** impacted files/functions/flows and high-risk hotspots
- **Test signals:** graph-reported missing or weak test coverage, if any
- **Token/context savings:** include if reported
