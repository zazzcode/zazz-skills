# Standards Builder Skill — User Guide

How to use the Standards Builder skill to create and maintain coding and architecture standards for a repo using the Zazz methodology.

## What It Does

The Standards Builder skill helps teams define and evolve the standards that agents and developers load selectively via `<DOCS_ROOT>/standards/index.yaml`.

It helps with:
- creating new standard documents from scratch via structured dialogue
- updating existing standards after practices or tooling change
- structuring the `standards/index.yaml` so agents can load only what is relevant
- bootstrapping a standards directory for repos adopting Zazz for the first time

Good standards are dense, specific, and selective. This skill enforces that bar.

## What a Standard Is

A standard is a durable, repo-specific rule about how the software should be built. Standards are not:
- feature requirements (those go in feature documents)
- deliverable execution steps (those go in SPECs)
- one-off decisions (those go in proposals or commit messages)

A standard answers: "When code in this area is written or changed, what rules must it follow?"

Standards are loaded selectively by agents — only the standards relevant to the current task. A well-structured standards index is what makes selective loading work.

## When to Use It

Use this skill when:
- adopting Zazz in a new repo and no standards directory exists yet
- a recurring pattern or rule needs to be codified so agents and developers follow it consistently
- an existing standard is stale after a tooling or architecture change
- you want to restructure the standards index to improve selective loading

## The Standards Index

The `standards/index.yaml` is the entry point agents use to discover and load standards selectively.

Each entry declares:
- a slug and title
- the file path relative to the docs root
- `applies_to.paths` — which file paths or directories this standard governs
- `applies_to.activities` — which agent activities trigger this standard (e.g., `create_api_route`, `write_migration`, `add_component`)
- an optional `companion` — a related standard that should usually be loaded together

Agents read the index, match against current task context, and load only matching standards.

## Example Prompts

```text
Use standards-builder.
We have no standards directory yet. Please help me bootstrap one for a Python/FastAPI backend.
Start with the most important standards first: API route conventions, error handling, and migration rules.
```

```text
Use standards-builder.
Our database migration standard is stale — we moved from Alembic to a custom migration runner.
Please help me update it and revise the index entry.
```

```text
Use standards-builder.
I want to add a new standard for how we structure React components in this repo.
Please guide me through defining it and adding it to the index.
```

```text
Use standards-builder.
Our standards index has grown to 20 entries and agents keep loading too many of them.
Please help me restructure the index so the applies_to rules are more precise.
```

## How the Dialogue Works

1. **Identify the standard's domain** — what area of the codebase or activity does it govern?
2. **Define the rules** — what must always be true? What is forbidden? What is the rationale?
3. **Write the standard document** — dense, specific, no padding.
4. **Define the index entry** — which paths and activities should trigger loading this standard?
5. **Review for overlap** — does this standard duplicate or conflict with an existing one?

## What You Should Have Ready

- The area of the codebase the standard should govern (file paths, package names, activity types).
- Any existing patterns in the codebase that the standard should codify or correct.
- Known anti-patterns or mistakes that the standard should prevent.
- Whether this is a new standard or an update to an existing one.

## Output

Primary artifact:
- `<DOCS_ROOT>/standards/<slug>.md` — the standard document

Supporting artifact:
- updated `<DOCS_ROOT>/standards/index.yaml` — with the new or revised entry

## Standard Document Structure

A good standard document includes:

1. **Title and scope** — one sentence on what this standard governs and why
2. **Rules** — the actual rules, stated as imperatives. Avoid vague guidance. State what is required, what is forbidden, and what is preferred when options exist.
3. **Rationale** (brief) — why these rules exist. Omit if the rule is self-evidently correct.
4. **Examples** — at least one correct example and one incorrect example for non-obvious rules.
5. **Exceptions** — any known legitimate exceptions to the rules.

Keep standards short. A standard that requires extensive reading will not be loaded or followed. Prefer many focused standards over one large one.

## Quality Bar

A standard is ready when:
- the rules are stated as imperatives, not suggestions
- an agent following the standard would produce consistent output without needing to ask clarifying questions
- the `applies_to` index entries are specific enough to avoid triggering on unrelated tasks
- examples cover the most common non-obvious cases
- the document has no padding

## Notes

- Standards are durable. Do not write one-off or deliverable-specific rules into a standard.
- If a rule applies only to one feature or one deliverable, it belongs in the SPEC, not in a standard.
- Standards should be reviewed and updated as the codebase evolves. A stale standard is worse than no standard.
