---
last_updated_at: 2026-05-25
---

# Docs hygiene

This standard governs how standards documents and agent guides under `docs/standards/` and elsewhere in the repository
are written. It covers voice, example structure, how to reference external systems (MCP servers, database tables),
cross-document linking, cleanup discipline, and what these documents must not contain. The audience is anyone authoring
or modifying a markdown document that an agent or human reviewer will consume as a prescriptive reference.

## Overview

Standards docs in this public baseline serve two consumers at once: humans during code review, and implementation or review agents
during automated work. Both expect the same shape — a category-grouped guide with prescriptive prose, paired Desired ✅
/ Not-desired ❌ examples, and clear source notes when rules come from specific precedent. Documents that drift from this shape lose their value to
agents (vague phrasing, missing examples) and to humans (no audit trail back to the originating reviewer convergence).

Every convention in a standards doc should cite durable evidence when available: a sibling standard, a repo-relative
source example, a public issue or PR, or a short provenance note such as "review precedent" when the originating
discussion is not public. Public standards MUST NOT require restricted PRs, restricted repos, local worktrees, or
machine-specific paths to understand the rule.

### How agents consume these docs

An implementation or review agent loads `docs/standards/index.yaml`, scans each `applies_to` entry against the files
and activities in scope for its current task, and then reads only the standards documents that match. Each document is
self-contained — there is no implicit cross-document include order, no shared prelude, and no hidden severity gradient.
The agent reads the prose, follows the Desired examples, rejects code that resembles the Not-desired examples, and
treats every statement as binding.

For this to work, each standard must be:

- short enough to load into context alongside the task's working files
- dense enough that every sentence carries a rule, a citation, or an example
- structured so an agent scanning section headings can locate the relevant sub-topic quickly

### How humans consume these docs

A human reviewer opens the standard during code review when a pattern looks unusual or a junior contributor asks "why
this shape?". They scan the section headings, find the relevant sub-topic, read the prose, and follow the citation back
to the originating PR thread to see the full reasoning if they need it. They do not read the standard cover-to-cover on
every review.

The Desired / Not-desired pairs serve as anchor patterns the reviewer can point to in a new PR comment: "this matches
the Not-desired example in [docs-hygiene.md §Voice](...) — please adopt the Desired form."

## Voice

Standards documents and agent guides use RFC-2119 keywords in uppercase for every prescriptive directive: `MUST`,
`MUST NOT`, `SHOULD`, `SHOULD NOT`, `ONLY USE`. Weak forms (`We will`, `We try to`, `Usually`, `Generally`) do not
appear in requirements. Agents follow uppercase MUST / MUST NOT lines more reliably than hedged "we will" prose
(review precedent at
`docs/standards/database-guide.md`).

The voice is active and direct. "Use X" rather than "Should probably use X." "Do not use Y" rather than "Try not to use
Y." If an exception exists, name it concretely instead of softening the rule.

### Desired ✅

```markdown
## Directive: Enforce Uniqueness via Declarative Constraints

Standard: Always use `ALTER TABLE … ADD CONSTRAINT … UNIQUE` to enforce
column uniqueness.

Restriction: Never use `CREATE UNIQUE INDEX`.

Rationale: Constraints clearly document business intent, are ANSI SQL
standard compliant, and allow for Foreign Key references, which unique
indexes alone do not support in all scenarios.
```

### Not desired ❌

```markdown
## Uniqueness in tables

We will normally use `ALTER TABLE … ADD CONSTRAINT … UNIQUE`. Try not
to use `CREATE UNIQUE INDEX`.
<!-- agents underweight non-RFC-2119 prose; "we will normally" reads
     as optional even when intended as a requirement -->
```

(Source: review precedent.)

## Paired Desired and Not-desired examples

Every prescriptive directive includes both a Desired ✅ example showing the canonical form and a Not-desired ❌ example
showing the rejected form. A directive without paired examples is incomplete — the abstract rule alone gives the agent
nothing to pattern-match against (review precedent
at `docs/standards/database-guide.md`).

Not-desired examples must be real. Lift them from a review comment when it is public, from pre-fix code in repo
history, or from current code that the rule explicitly rejects. Cite the repo-relative source or public URL as a trailing comment
inside the block. If no real Not-desired example exists for a rule, omit the Not-desired block — a fabricated bad
example misleads readers about what the rule rejects in practice.

### Desired ✅

````markdown
### Naming Convention: Unique Constraints

Use prefix `UQ_` followed by the table name and columns.

**Good**

```sql
ALTER TABLE Accounts
ADD CONSTRAINT UQ_Accounts_Email UNIQUE (Email);
```

**Bad**

```sql
CREATE UNIQUE INDEX IX_Accounts_Email ON Accounts (Email);
```
````

### Not desired ❌

```markdown
### Naming Convention: Unique Constraints

Use prefix `UQ_` followed by the table name and columns.
<!-- the rule is stated but never illustrated; the agent has to invent
     the canonical form and the rejected form on its own -->
```

(Source: review precedent.)

### Sourcing real Not-desired examples

A Not-desired ❌ block contains code or markdown that an author would write if they did not know the rule. The example
is lifted from one of three sources, in priority order:

- Public review comments that established the rule — the "change X → Y" snippet, where X is the Not-desired shape.
- Pre-fix code accessible through repo history — the file blob at the commit before the fix landed.
- Existing code in the integration branch that the rule explicitly rejects, when the rule is about "stop doing X" and there are still
  files showing X.

Cite the source as a trailing comment inside the code block. The citation comment is part of the example, not a
separate sentence outside it. This keeps the provenance attached to the bad pattern when the section is copied or
excerpted.

If none of those three sources yields a real example, omit the Not-desired block entirely. A standard with only a
Desired example is acceptable. A fabricated Not-desired example — invented by inverting the rule, or written by the
author as "what the rule rejects" — misleads readers about what the rule rejects in practice and undermines the
citation trail that makes the standard verifiable.

## References to MCP servers and their tools

Agent guides name MCP servers and their tools explicitly, using backticks. Write "the `sqlserver` MCP server" and "the
`ping` tool exposed by the `sqlserver` MCP server" — not "the MCP server" or "the SQL Server tool." When a guide
directs the agent to perform a connectivity or capability check, name the specific tool and state the fallback behavior
so the agent knows what to invoke and what to do when the tool is unavailable
(review precedent).

### Desired ✅

```markdown
Use the `ping` tool exposed by the `sqlserver` MCP server to determine
if you have access. If you do not have access, stop and request it as
input for the table(s) being modified.
```

### Not desired ❌

```markdown
Use the MCP server to verify access.
<!-- "the MCP server" is ambiguous when multiple MCP servers are
     configured; "verify access" gives no concrete tool name -->
```

(Source: review precedent.)

## References to database tables

When an agent guide directs the agent to consult a database table for context, include a copy-pasteable `SELECT` query
that names exact columns. Where the same lookup commonly resolves to a small set of values (e.g., specific error codes
mapped to specific situations), name those values inline. A prose direction like "look up the error in the Error table"
forces the agent to guess column names and query shape, and increases the chance the agent picks a less-appropriate
value that happens to match a substring ([database-sproc-errors.md](./database-sproc-errors.md)).

### Desired ✅

````markdown
Look up the error code in `dbo.Error` via the `sqlserver` MCP server:

```sql
select ErrorID, ErrorCode, ErrorMessage from dbo.Error
```

Common situations:

- Unique Index violations: SQLServer error_number 2627, 2601 → `gcDuplicateData`
- Foreign Key violations: SQLServer error_number 547 → `gcNoParentRecord`
````

### Not desired ❌

```markdown
Look up the error in the Error table.
<!-- no column list, no query shape, no mapping from common SQLServer
     error numbers to the application error codes the agent should
     return -->
```

(Source: review precedent.)

## Cross-document linking

Markdown documents outside `CLAUDE.md` cross-reference each other using relative-path markdown links. `@include` is a
agent runtime mechanism scoped to `CLAUDE.md`; in any other markdown file it silently does nothing — the include line
renders as literal text and the referenced content never reaches the reader
(review precedent).

This applies to every markdown file in the repository except `CLAUDE.md` files, regardless of location. A standard, a
guide, a feature doc, an architecture doc, a README — all cross-link with normal relative-path links.

### Desired ✅

```markdown
See [docs/standards/database-guide.md](../standards/database-guide.md)
for the canonical patterns.
```

### Not desired ❌

```markdown
@include docs/standards/database-guide.md
<!-- silent no-op outside CLAUDE.md; readers (and agents) never see
     the referenced content -->
```

(Source: review precedent.)

## Cleanup discipline

Agent guides covering migrations, stored procedure changes, schema changes, or any operation that might tempt an
implementation agent into adjacent cleanup work include an explicit clause separating cleanup from the feature work.
Without it, agents over-eagerly chain cleanup into feature changes — renaming columns, dropping unused indexes,
reformatting unrelated code — and the PR drifts past its intended scope
(review precedent).

The clause aligns with the broader "one logical change per PR" principle. Cleanup belongs in its own PR so the diff
stays reviewable and revertible.

### Desired ✅

```markdown
Any cleanup of <thing> MUST be done in a separate PR. Do not assume
cleanup should happen as part of this operation.
```

### Not desired ❌

```markdown
Clean up old <thing> when you're done.
<!-- ambiguous wording — the agent will bundle cleanup with the
     feature change and the PR drifts past its intended scope -->
```

(Source: review precedent.)

## Test case lists in guides

Numbered test-case lists (`1. Test X`, `2. Test Y`, `3. Test Z`) do not appear in standards or guide documents. Use
prose sections, descriptive headings, or unnumbered bullet points instead. Inserting a new scenario in the middle of a
numbered list forces renumbering every subsequent entry, which discourages additions and causes merge conflicts when
multiple contributors add scenarios at the same time
(review precedent; applied in
`docs/standards/database-testing-guide.md`).

### Desired ✅

```markdown
### Test cases

- Verifies that `gcNoParentRecord` is returned on a missing FK target.
- Verifies that `gcDuplicateData` is returned on a unique-index
  violation.
- Verifies that `gcOK` is returned on a clean insert.
```

### Not desired ❌

```markdown
### Test cases

1. Verifies that `gcNoParentRecord` is returned on a missing FK target.
2. Verifies that `gcDuplicateData` is returned on a unique-index
   violation.
3. Verifies that `gcOK` is returned on a clean insert.
<!-- inserting a new scenario between 1 and 2 renumbers every
     subsequent entry and produces a noisy merge-conflict diff -->
```

(Source: review precedent.)

## Working-doc identifiers do not appear in committed files

Identifiers that anchor into uncommitted execution working docs do not appear in committed code, tests, docstrings,
inline comments, or Postman request descriptions. Specifically: `SPEC`, `INVARIANT`, `D-N`, `AC-N`, `OQ-N`, and
`PR-finding` identifiers belong to the locally-ignored `docs/execution/` working docs that drive agentic development.
Once a PR merges, future readers — and tools like `git blame` — cannot resolve these identifiers; they become orphaned
strings that hurt comprehension (review precedent).

The same rule applies to this docs-hygiene standard itself, and to every other document under `docs/standards/`.
Standards documents are committed and long-lived; they do not reference identifiers that exist only in transient
execution docs.

Architecture and feature docs under `docs/architecture/*.md` and `docs/features/*.md` may retain these identifiers
because they serve narrative spec-driven development and were not flagged in review. Files under `docs/execution/`
(locally ignored) may reference the identifiers freely — they are not part of the committed repository.

### Desired ✅

```python
def _validate_params(report_name, params):
    """Defensive gate for non-public callers; primary type validation
    runs upstream in the route handler."""
```

### Not desired ❌

```python
def _validate_params(report_name, params):
    """Defensive gate (INVARIANT 1). See SPEC AC-3."""
    # the (INVARIANT 1) and AC-3 anchors point at uncommitted execution
    # docs; after merge they read as orphaned tokens
```

(Source: review precedent.)

Concrete patterns the rule excludes from committed paths outside `docs/architecture/` and `docs/features/`:

- `SPEC` followed by an identifier (`SPEC AC-3`, `SPEC INVARIANT-2`)
- `INVARIANT` followed by a number (`INVARIANT 1`, `(INVARIANT 4)`)
- `D-` followed by a digit (deliverable identifiers like `D-2`, `D-12`)
- `AC-` followed by a digit (acceptance-criterion identifiers like `AC-1`, `AC-7`)
- `OQ-` followed by a digit (open-question identifiers like `OQ-3`)
- `PR-finding` followed by an identifier

Sweep these from docstrings, inline comments, test class and method names, test docstrings, and Postman collection
request descriptions before committing.

## Related standards

- [pr-process.md](./pr-process.md) — one logical change per PR; cleanup-discipline cross-link.
- [tooling-lint-format.md](./tooling-lint-format.md) — markdown linting and formatter rules.
- The other documents under `docs/standards/` are
  themselves the empirical reference for the conventions in this standard — they are the documents this hygiene rule
  governs.
