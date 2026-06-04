---
last_updated_at: 2026-06-04
---

# Code structure

This standard governs file size, contextual splitting, module cohesion, agent-skill discoverability, duplicated code,
and duplicated runtime work. It applies to authored source files, tests, scripts, standards documents, and agent-facing
guides. The goal is to keep implementation work reviewable by humans and small enough for agents to load with the
task-specific code they are changing.

## File-size thresholds

Authored files MUST stay small enough to review and load with the surrounding task context. Treat line count as a
reviewability signal, not a formatting game ([PR #184](https://github.com/ASLQB/qb-mono/pull/184)).

- Files under 400 lines are preferred.
- Files over 400 lines SHOULD be split by context. If the file is intentionally cohesive, document the reason in the PR
  and expect a pebble-level review comment.
- Files over 600 lines MUST be split before approval unless the reviewer accepts a concrete exception.
- Large test-harness data files MAY exceed the threshold, but they still SHOULD be flagged as pebble-level maintenance
  and reviewability cost.

The same thresholds apply to code, tests, scripts, configuration, standards documents, `SKILL.md` files, and skill
companion modules.

### Desired ✅

```text
docs/standards/data-layer-results.md
docs/standards/data-layer-errors.md
docs/standards/data-layer-templates.md
```

Each file maps to a different work context: result handling, error mapping, and canonical templates.

### Not desired ❌

```text
docs/standards/data-layer-guide.md  # legacy oversized guide covering many data-layer topics
```

A single large guide forces unrelated rules into context for a narrow task. Source:
[data-layer-guide.md on `dev`](https://github.com/ASLQB/qb-mono/blob/dev/docs/standards/data-layer-guide.md).

## Split by work context

When a file approaches the threshold, split it by the reason an agent or reviewer would load it. Do not split by page
count, midpoint, or generic `part-1` / `part-2` names. Contextual splits preserve focus and make `index.yaml` discovery
meaningful ([PR #184](https://github.com/ASLQB/qb-mono/pull/184);
[docs-hygiene.md](./docs-hygiene.md#how-agents-consume-these-docs)).

Good split boundaries include:

- layer boundary: HTTP, service, data, database, frontend
- task type: schemas, authorization, tests, migrations, templates
- artifact type: source module, test fixture, generated data, skill command recipe
- consumer need: implementation guidance, review checklist, troubleshooting, examples

### Desired ✅

```text
frontend.md
frontend-forms-ui.md
```

Data-flow and CRUD rules live separately from form/UI/testing rules because agents usually need one context at a time.

## Skills are incrementally discoverable

Agent skills MUST keep the entry-point `SKILL.md` focused on routing, activation criteria, and the minimum workflow.
Move task-specific checklists, provider details, command recipes, review axes, and templates into companion files that
the skill loads only when needed. This mirrors the standards-index model: agents should discover the smallest useful
context rather than load a whole skill for one subtask ([PR #184](https://github.com/ASLQB/qb-mono/pull/184)).

### Desired ✅

```text
.agents/skills/pr-review/SKILL.md
.agents/skills/pr-review/standards-axis.md
.agents/skills/pr-review/spec-axis.md
```

The entry point routes the work; each axis file holds the detailed checklist for one review context.

## Avoid agentic slop

New code SHOULD remove complexity or express domain intent. Do not add structure that exists only because it is easy
for an agent to generate. Flag or rewrite patterns that create review noise, hidden maintenance cost, or a second
source of truth ([PR #184](https://github.com/ASLQB/qb-mono/pull/184)).

Common slop patterns:

- duplicated helpers, constants, fixtures, or type definitions instead of reusing local patterns
- abstraction layers that wrap one call site without reducing complexity
- generic utility names that hide domain meaning
- defensive branches for impossible states without a caller contract or test
- comments that narrate obvious code rather than explaining a real constraint
- broad rewrites, formatting churn, or import churn unrelated to the deliverable
- parallel implementations of existing behavior
- dead compatibility paths, unused options, or speculative extension points
- error handling that catches too broadly, swallows useful context, or invents inconsistent response shapes

## Compute once, return many

Duplicated runtime work is a structure problem even when the code itself is not duplicated. If one logical request
needs multiple shapes from the same expensive source, compute that source once and return all required shapes from the
same execution. Do not re-run a query, view, stored procedure, external API call, or large aggregation because an
earlier layer discarded an intermediate result. The data-layer multiple-result-set standard applies this pattern to
stored procedures ([data-layer-results.md](./data-layer-results.md#multiple-result-sets--compute-once-return-many);
[PR #184](https://github.com/ASLQB/qb-mono/pull/184)).

## Preserve provenance when moving rules

When splitting a standard, skill, or guide, moved rules MUST keep their hard references to PR comments, precedent
files, sibling standards, or best-practice sources. Do not turn a cited rule into uncited prose during cleanup. This is
the same citation requirement used by the docs-hygiene standard
([PR #85](https://github.com/ASLQB/qb-mono/pull/85#discussion_r3006917960);
[PR #177](https://github.com/ASLQB/qb-mono/pull/177#discussion_r3275207714)).

### Desired ✅

```markdown
HTTP routes return 422 for validation
([PR #177](https://github.com/ASLQB/qb-mono/pull/177#discussion_r3266677563)).
```

### Not desired ❌

```markdown
HTTP routes should probably use 422 for validation.
```

The uncited sentence loses the review thread that established the rule. Source:
[docs-hygiene-reference-structure.md](https://github.com/ASLQB/qb-mono/blob/dev/docs/standards/docs-hygiene-reference-structure.md).
