---
last_updated_at: 2026-06-15
---

# Spec hygiene

This standard governs how deliverable specifications under `docs/specifications/` are written so they stay portable,
verifiable, and reviewable. It covers path and link portability, linking instead of inlining, how to reference work
that is not yet merged, and the content-quality bar a reviewer holds a specification to. The audience is anyone
authoring or reviewing a specification — human or agent.

For the general markdown conventions that apply to every document in the repository — RFC-2119 voice, paired
Desired/Not-desired examples, relative-path cross-linking, cleanup discipline, and the rule that working-doc
identifiers must not leak into committed code — follow [docs-hygiene.md](./docs-hygiene.md) and
[docs-hygiene-reference-structure.md](./docs-hygiene-reference-structure.md). This standard adds only the rules
specific to specifications and does not restate those.

## Specifications are often uncommitted

A specification is the contract for one deliverable. It may be committed under `docs/specifications/{slug}.md`, or it
may live only on its feature branch while the PR is open, or in an external tracker. All three are normal. Treat a
specification as portable reference material that any reviewer or agent might open from any worktree, on any branch,
before or after merge. The rules below follow from that: nothing in a specification may depend on one machine's
directory layout or on a file that only exists in the author's checkout.

## Paths are repository-relative, never absolute

Every path a specification names — in prose, in a markdown link, in a required-reading list, in an agent prompt — MUST
be relative to the repository root. Absolute machine paths and paths that climb into a sibling checkout MUST NOT
appear. They resolve only for the author, break for other reviewers and agents, and silently encode one person's
checkout layout into a shared document
.

### Desired ✅

```markdown
Open `docs/standards/index.yaml` and load only the standards whose
`applies_to` matches this deliverable's file list.
```

### Not desired ❌

```markdown
Open `<absolute-checkout-path>/docs/standards/index.yaml`
and load only the matching standards.
<!-- machine-specific checkout path; resolves only for the author and
     breaks for every other reviewer/agent.
```

## Link to standards and prior specifications; do not inline them

A specification references standards, prior specifications in the same effort, and existing-code patterns by
relative-path link and section number. It MUST NOT paste their content inline. Inlining duplicates a source that has
its own home and its own lifecycle: the copy drifts the moment the original changes, and it inflates the specification
past the size a reviewer or agent can hold in context. When the implementing contract genuinely needs a constraint from
another document, link to that document's section and state the one constraint — not the whole section
.

This is also why a superseded specification is a liability once its deliverable ships: later specifications should link
to it as historical context, not copy its contents forward to "stand alone."

### Desired ✅

```markdown
### Required reading

- [reporting-m3-d1-frontend-pdf-slice-SPEC.md §4 Decisions](./reporting-m3-d1-frontend-pdf-slice-SPEC.md) —
  the page-slug vs apiSlug split this deliverable reuses.
- [frontend.md](../standards/frontend.md) — RTK Query placement and response-schema discipline.
```

### Not desired ❌

```markdown
### 1.d Pathfinder pattern — INLINED (this SPEC stands alone)

The prior PR shipped the viewer + hook + state-machine + registry...
<!-- hundreds of lines of another spec's content pasted forward so the
     document "stands alone"; drifts from the source and bloats the spec.
```

## Reference unmerged work by relative path, annotated

A specification may legitimately depend on a file that is not yet on the integration branch — an in-flight standard, a
sibling deliverable's spec, a not-yet-merged PR. Reference it by the repository-relative path it will have once merged,
and annotate the dependency as not-yet-merged with the PR number so a reader knows why the link may not resolve on
the integration branch yet. Do not reach outside the repository to another worktree's absolute path to "make the link work today"
.

### Desired ✅

```markdown
Follow the iterated standards at `docs/standards/` (not yet merged to the
integration branch; tracked in PR 1234).
```

### Not desired ❌

```markdown
Follow the iterated standards at
`../sibling-worktree/docs/standards/`.
<!-- points at a second checkout because the files are
     not yet merged; unreadable from any other checkout.
```

## Acceptance criteria are testable from the criterion alone

Each acceptance criterion is detailed enough that a test can be written from it without re-asking the author, and each
names the test or command that verifies it. A criterion that restates the goal ("the page works") gives the implementer
nothing to write a test against and gives the reviewer nothing to check.

### Desired ✅

```markdown
The report URL keys off the api slug when the registry entry supplies one,
otherwise the page slug, and appends query extras after the three core
keys in insertion order. Verified by the slug-precedence and
extras-ordering cases in `tests/unit/api/v1/reports.test.ts`.
```

### Not desired ❌

```markdown
The report endpoint works correctly for both report modes.
<!-- no observable contract, no verifying test named; nothing a test can
     be written from and nothing a reviewer can check -->
```

## Test plan is high-signal and proportional

The test plan proves the acceptance criteria and the realistic edge cases with the smallest meaningful set of tests —
not a coverage quota. Prefer table-driven matrices when several realistic cases share one behavior boundary; prefer one
integrated behavior test over several that only confirm a collaborator was called. When a case is intentionally omitted
because nearby coverage already proves it, the test plan says so in one line, so the omission reads as a decision
rather than a gap.

### Desired ✅

```markdown
- One table-driven case per registry entry asserting menu href + enabled
  state, so a new report adds a row rather than a copied block.
- Extras-ordering asserted once against a two-key input; single-key
  ordering is implied and not separately re-tested.
```

### Not desired ❌

```markdown
- Test the by-month link renders.
- Test the YTD link renders.
- Test the by-month link is enabled.
- Test the YTD link is enabled.
<!-- one copied block per report; the matrix is the behavior boundary and
     should be one table, not N near-identical assertions -->
```

## Decisions carry a rationale; rejected alternatives only when weighed

Each decision states the choice and a one-line reason it was made. Record a rejected alternative only when a viable one
was actually weighed in the authoring dialog; do not invent strawmen to fill a template. A decision written as a
neutral description with no "because" is incomplete.

### Desired ✅

```markdown
**Decision.** Distinguish the two reports with a registry query extra on a
shared backend route, not two routes.
**Why.** The backend already exposes one route for both period modes;
splitting on the frontend would fork code with no contract benefit today.
**Rejected alternative.** Two frontend endpoints — lost because it
duplicates the fetch path for no observable difference.
```

### Not desired ❌

```markdown
**Decision.** Use a registry query extra to distinguish the reports.
<!-- no "Why"; reads as a description, not a decision a reviewer can
     weigh -->
```

## Scope and exclusions are explicit

A specification names the files it changes (path + new/modified + reason), the directory its diff is allowed to touch,
and an explicit out-of-scope list. Speculative future work is either in scope or out of scope — never a "we might want
to" aside. Status fields (Draft/Approved) and verbatim copies of standards text do not belong in the document; workflow
state lives in the tracker and standards are cited, not restated.

## What this standard does not contain

- A reviewer checklist. Per
  [docs-hygiene-reference-structure.md §What standards docs do not contain](./docs-hygiene-reference-structure.md), a
  standard states the rule; the reviewer (or the review skill) applies it. The rules above are what a spec review
  checks.
- The full list of sections a specification must contain. That belongs to the spec-authoring workflow; this standard
  governs the quality and portability of whatever sections a specification carries.
- General markdown conventions — voice, examples, cross-linking, working-doc identifiers in code. Those live in
  [docs-hygiene.md](./docs-hygiene.md) and
  [docs-hygiene-reference-structure.md](./docs-hygiene-reference-structure.md).

## Related standards

- [docs-hygiene.md](./docs-hygiene.md) — voice, paired examples, relative-path cross-linking, cleanup discipline, and
  working-doc identifiers in committed code.
- [docs-hygiene-reference-structure.md](./docs-hygiene-reference-structure.md) — citation formats, section ordering,
  and standards-doc exclusions.
- [pr-process.md](./pr-process.md) — one logical change per PR; the scope discipline a specification's scope section
  encodes.
