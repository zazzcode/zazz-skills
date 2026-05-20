---
name: standards-builder
description: >-
  Help a user create, draft, refine, or update coding and architecture standards and the standards index
  for a repo using the Zazz methodology; use when the team wants to codify recurring rules, bootstrap a
  standards directory, or restructure the index so agents load standards selectively.
---

# Standards Builder Skill

## Required Repo Extension Check

Before doing anything else, check for `.claude/skill-extensions/standards-builder/EXTENSION.md`. If it exists,
read it immediately after this `SKILL.md` and apply it as repo-specific guidance.

## Startup Sequence

1. Check for the repo extension file above and read it if present.
2. Read `AGENTS.md` to determine the docs root and any declared standards loading rules.
3. Check whether `<DOCS_ROOT>/standards/index.yaml` exists.
   - If it exists: read it to understand the current standards inventory.
   - If it does not exist: flag this and offer to bootstrap the index as part of the session.
4. Identify the session mode:
   - **Bootstrap** — new repo, no standards directory yet
   - **Add** — adding a new standard to an existing standards directory
   - **Update** — revising an existing standard
   - **Restructure** — improving the index's applies_to precision without rewriting standards
5. Begin the dialogue.

## Mission

Help the team define and maintain the standards that agents load selectively during implementation, QA, and review.

The output of this skill is:
- well-structured standard documents: dense, specific, no padding
- an accurate and selective `standards/index.yaml`

This skill does not write feature requirements, SPECs, or architecture docs. It writes durable operational rules.

## Standards vs. Other Artifacts

| Artifact | What it captures |
| -------- | ---------------- |
| `project.md` | Why the software exists and what it does |
| Feature document | What a capability does, milestone by milestone |
| Architecture document | How the system is shaped technically |
| **Standard** | **How code in a given area must be written** |
| SPEC | What one deliverable must accomplish |

If a rule is specific to one feature or one deliverable, it does not belong in a standard.

## The Standards Index

Every standard must have an entry in `<DOCS_ROOT>/standards/index.yaml`. The index is what agents use to
discover and selectively load standards.

Each entry must declare:

```yaml
- slug: api-route-conventions
  title: API Route Conventions
  path: standards/api-route-conventions.md
  applies_to:
    paths:
      - "app/api/**"
      - "routers/**"
    activities:
      - create_api_route
      - modify_api_route
  companion: standards/error-handling.md   # optional
```

`applies_to.paths` uses glob patterns relative to the repo root.
`applies_to.activities` uses the activity vocabulary declared in `AGENTS.md` or the methodology.

An entry without `applies_to` rules will be loaded on every task, which defeats selective loading.

## Dialogue Principles

- **Ask about the problem before the rule.** What mistake does this standard prevent? What consistent pattern does it enforce?
- **Write rules as imperatives.** "Routes must return typed responses" not "Routes should return typed responses."
- **Prefer specific over broad.** A standard that applies to everything applies to nothing.
- **Keep documents short.** A standard that requires extensive reading will not be followed. Split large standards by domain.
- **Require examples.** At least one correct and one incorrect example for non-obvious rules.
- **No padding.** Every sentence must help an agent or developer apply the standard correctly.

## Standard Document Template

Use this structure unless the user explicitly requests a different shape:

```markdown
# <Title>

**Scope:** <one sentence — which paths or activities this governs and why>

## Rules

- <rule stated as an imperative>
- <rule stated as an imperative>

## Examples

### Correct

<example>

### Incorrect

<example with explanation of what is wrong>

## Exceptions

<any legitimate exceptions, or "None." if there are none>
```

Rationale may be added inline after a rule when the reason is not obvious. Do not add a separate Rationale section unless multiple rules share non-obvious reasons.

## Bootstrapping a New Standards Directory

When the repo has no standards directory:

1. Create `<DOCS_ROOT>/standards/` and `<DOCS_ROOT>/standards/index.yaml`.
2. Identify the three to five highest-value standards to write first:
   - look at what activities agents are likely to perform in this repo
   - look at what mistakes have already occurred in the codebase
   - prioritize standards that are non-obvious (not generic language conventions)
3. Draft each standard in order of priority.
4. Build the index entry for each standard as it is drafted.
5. Do not try to write every possible standard upfront. Start with the most important and add more as needs emerge.

## Restructuring an Existing Index

When the goal is improving selective loading (not rewriting standards):

1. Read every existing `applies_to` entry.
2. Identify overly broad entries that trigger on unrelated tasks.
3. Narrow `applies_to.paths` to specific directories or file patterns.
4. Add or refine `applies_to.activities` entries.
5. Split standards that cover multiple unrelated domains into separate documents.
6. Do not change standard rules unless the user asks.

## Quality Bar

A standard is ready when:
- rules are stated as imperatives, not suggestions
- an agent following the standard would produce consistent output
- the index entry is specific enough not to trigger on unrelated tasks
- examples cover the most common non-obvious cases
- the document has no padding

## Development Mode

If the user says "development mode", the focus is on improving this skill itself. In development mode,
you may edit `.agents/skills/standards-builder/SKILL.md`. Outside development mode, this file is read-only.
