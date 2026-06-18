---
last_updated_at: 2026-05-25
---

# Docs hygiene reference structure

This standard governs exclusions, citations, section ordering, and worked structure for standards and agent guides.

## What standards docs do not contain

Standards documents are reference material, not essays and not checklists. The following do not appear:

- Severity gradings on individual items (`MUST` / `SHOULD` / `MAY` annotations as item-level metadata). RFC-2119
  keywords appear inside the prose of a rule, not as a per-item header. If a statement is in the standard, it is
  binding — there is no severity gradient inside a standard.
- Tags grading rules (`[boulder]` / `[pebble]` / `[sand]` / `[std-pattern]`). Those tags belong to PR-review
  communication, not to the standard itself.
- Reviewer-checklist sections with bracketed items inside the standard. The standard states the rule; the reviewer
  applies it.
- "Rationale" as a separate per-item header. Rationale, when needed, is one sentence woven into the prose.
- Numbered test-case lists, per the rule above
  (PR #113).
- `SPEC`, `INVARIANT`, `D-N`, `AC-N`, `OQ-N`, `PR-finding` identifiers, per the rule above
  (PR #177).
- Skill names, methodology terms, or framework-specific workflow vocabulary. Standards are project-neutral reference
  material that survives changes to the development workflow.
- Padding. Sentences that restate the section heading, preface the next sentence, or repeat a point made earlier are
  cut. If removing a sentence leaves the document equally clear, remove it.

## Citations

Every convention in a standards doc ends with at least one clickable GitHub URL citation. The citation lets any reader
click through to the PR comment, precedent file, or sibling standard that established the rule.

Citation formats, used wherever flows best in the prose:

- End-of-sentence:
  `... must be the last decorator before the view function (PR #155).`
- End-of-paragraph:
  `(Sources: PR #65; http-layer-guide.md §Endpoint Module.)`
- Bracketed mid-sentence:
  `The canonical pattern at account_list.py:213 shows ...`

Bare file paths or section names are not acceptable citations. Convert any non-URL reference to a full GitHub URL
before committing the standard.

When multiple PR comments converge on the same convention, cite all of them in the same parenthetical:

```markdown
... (PR #65; PR #155).
```

Citation URL shapes used in this codebase:

- PR review-comment thread: `review precedent
- PR top-level review or issue comment: `review precedent or
  `#pullrequestreview-<id>`
- Code line in the integration branch: `review precedent
- Code range in the integration branch: `review precedent
- Sibling standard section: `review precedent

A relative-path link to a sibling standard in the same directory (e.g., `[pr-process.md](./pr-process.md)`) is
acceptable for cross-references between unified standards in `docs/standards/`. A bare file path with no link target is
not.

### Desired ✅

```markdown
HTTP routes return 422 for validation, not 400 (PR #177; see report_get.py:120).
```

### Not desired ❌

```markdown
HTTP routes return 422 for validation, not 400 (see report_get.py).
<!-- bare file path; no clickable URL; reader cannot verify the
     convention against a specific line or PR thread -->
```

## Section ordering

Sections in a standards doc are grouped by sub-topic, not by severity or by source PR. Within a topic, place the
broader conventions (voice, structure, examples) before narrower conventions (specific tools, specific identifiers).
End with what the document does not contain — readers who reach the bottom have absorbed the positive shape of the
standard and can hold the exclusions against it.

A standard does not need a section per source PR. A single section may consolidate three PR comments that all converge
on the same convention; a single PR comment may motivate two sections if it touched two distinct sub-topics. Group by
what the reader needs to look up, not by where the rule came from. The front-matter, the citations, and
`docs/execution/findings/by-bucket/<topic>.md` together provide the provenance audit trail.

## Worked example: a well-formed section

A complete section combines a prose paragraph stating the convention with inline citations, a Desired ✅ block
illustrating the canonical shape, and a Not-desired ❌ block lifted from real source material with a citation comment.

````markdown
## References to database tables

When an agent guide directs the agent to consult a database table for
context, include a copy-pasteable `SELECT` query that names exact
columns. Where the same lookup commonly resolves to a small set of
values, name those values inline (PR #85;
precedent at `backend/docs-wip/crud-sproc-guide.md`).

### Desired ✅

```markdown
Look up the error code in `dbo.Error` via the `sqlserver` MCP server:

  select ErrorID, ErrorCode, ErrorMessage from dbo.Error

Common situations:
- Unique Index violations: SQLServer error_number 2627, 2601 → `gcDuplicateData`
```

### Not desired ❌

```markdown
Look up the error in the Error table.
```
````

The components — prose with citation, Desired with concrete content, Not-desired with a real example — make the section
legible to both an agent (which pattern-matches against the code blocks) and a human (who reads the prose and follows
the citation).
