---
name: architecture-doc-builder
description: >-
  Help a user create, draft, refine, or update a long-lived architecture document for a feature or subsystem; use when
  the user wants to define or improve system design, module placement, per-roadmap-increment sequence diagrams, data model
  vision, and technical open questions. Can be project-level or paired with a feature requirements document; does
  not replace feature-doc-builder.
---

# Architecture Doc Builder Skill

## Startup Sequence

Before starting the dialogue:

1. Use `AGENTS.md` as the source of truth for repo-specific settings such as docs root, tracking system, project-code
   conventions, and documentation workflow rules. Read it if that context is not already available.
1. Determine whether the architecture document is project-level or feature-level. For a feature-level architecture
   document, locate the paired feature requirements document; if no feature requirements document exists yet, stop and
   recommend `feature-doc-builder` first.
1. Identify whether you are creating a new architecture document, evolving an existing one, or converting a proposal
   or transcript into a draft.
1. Find the standards index and any existing architecture documents that should shape the discussion.
1. Then begin the dialogue and keep the conversation at architecture scope rather than implementation-task scope.

## Mission

Create or evolve an architecture document that explains the system design of a feature or subsystem at the technical
level — module layout, per-roadmap-increment system and sequence diagrams, data model vision, cross-cutting concerns
(permissions, errors, OpenAPI, settings, deployment), and technical open questions.

The architecture document should help answer:

- how is this feature shaped inside the codebase
- where does each piece of new code live and why
- what does the system look like at each roadmap increment
- which sequence of components participates in each use case
- which technical decisions still need to be made

This skill is for architecture definition and evolution. It is not a deliverable-specification skill and it does not
replace deliverable specification authoring or feature-level product definition.

It should help the lead developer or architect articulate technical decisions and per-roadmap-increment system shape that
later inform deliverable design and acceptance.

## Primary Audience

Work primarily with:

- lead developer or architect
- senior engineer driving the feature
- technical stakeholders with system context

Secondary audiences for the resulting architecture document:

- developers onboarding to the project
- the development team designing deliverables
- future agents that need technical context before creating deliverable specifications

## Docs Root Convention

Use the repo docs root declared in `AGENTS.md`, the standards index, or another
repo-local orientation document as the base for Zazz methodology artifacts. Example
paths in this skill may use `<DOCS_ROOT>/...` as shorthand.

Important: do not infer that a directory literally named `docs/` is the docs root. Some
repos use a Zazz root such as `.zazz/`, with `.zazz/docs/` reserved for imported
reference guides. In that layout, architecture documents belong under
`.zazz/architecture/`, not under `.zazz/docs/architecture/`.

## What This Skill Produces

Primary artifact:

- Project-level architecture: `<DOCS_ROOT>/architecture/project-architecture.md`
- Feature-level architecture: `<DOCS_ROOT>/architecture/{feature-key}-architecture.md`

Supporting discovery artifact:

- create or update `<DOCS_ROOT>/architecture/index.yaml` when the architecture document is created or materially revised

## Boundaries

### This skill does

- define the technical shape of a feature inside the codebase
- specify module placement, package layout, and code organization rationale
- produce system diagrams scoped per roadmap increment
- produce sequence diagrams scoped per roadmap increment, one per significant use case
- define cross-cutting concerns (permissions, errors, OpenAPI, settings, deployment, IAM)
- capture data model vision for future roadmap increments
- record technical open questions and trade-offs
- ingest proposals or design transcripts and turn them into an architecture document draft
- produce handoff guidance for later deliverable specifications

### This skill does not

- write deliverable-level acceptance criteria or implementation tasks
- replace `feature-doc-builder` (which owns product purpose, value, feature roadmap increments, user flows, permission
  catalog at concept level)
- replace `proposal-builder` when the team is still deciding whether or how to proceed
- implement the feature
- restate content already in the project or feature requirements document

Artifact boundaries:

- `proposal-builder` helps decide whether or how to proceed
- `feature-doc-builder` defines the long-lived feature, feature roadmap increments, and user-facing purpose
- `architecture-doc-builder` defines the technical system shape and per-increment diagrams
- `spec-builder` defines one deliverable's execution contract

## Pairing With the Feature Document

Feature-level architecture documents and feature requirements documents are paired by name. If the feature requirements
document is `<DOCS_ROOT>/features/reporting.md`, the feature-level architecture document is
`<DOCS_ROOT>/architecture/reporting-architecture.md`. They cross-reference each other.

Project-level architecture documents also live under `<DOCS_ROOT>/architecture/`, but they are paired with `project.md`
instead of a single feature requirements document. Use a project-level architecture document for cross-cutting system
shape: major services, modules, data stores, runtime boundaries, integration patterns, and decisions that affect many
features.

**Feature-level architecture documents are subservient to the feature requirements document.** The feature
requirements document is the canonical source of truth for feature roadmap increments, capability statements, and
candidate deliverable lists. Project milestone names, dates, and deliverable assignments belong to the declared project
planning source of truth, not the feature architecture document.

For feature-level architecture, the feature document owns:

- purpose and value
- **feature roadmap increments — names, order, capability statements, candidate deliverables**
- permission catalog and concept-level permission model
- user-facing flows at product level
- product-level open questions

The architecture document owns:

- system design and module placement
- per-increment system diagrams
- per-increment sequence diagrams for each significant use case
- data model vision (current + future)
- cross-cutting concerns (errors, OpenAPI, deployment, IAM)
- technical open questions

### Mirror rule

When drafting or updating a feature-level architecture document:

1. Read the paired feature requirements document's feature roadmap overview and roadmap increment detail headings first.
1. Use the same roadmap increment names, in the same order, in the architecture document.
1. Do **not** introduce a roadmap increment that does not appear in the feature document.
1. Do **not** rename or reorder roadmap increments in the architecture document.
1. Do **not** record project milestone dates in the architecture document. Reference the declared project milestone
   source of truth when timeline context is needed.
1. If the architecture work reveals that a roadmap increment needs to be added, split, merged, or renamed, stop and
   propose that change in the feature requirements document first. Update the feature requirements document, then mirror
   the change in the architecture document.

### Roadmap increments should be major sections, not interleaved

Each roadmap increment gets its own top-level (`##`) section in the architecture document when the feature architecture
needs staged technical evolution. Within that section, place everything specific to that increment: the system diagram
for that increment, technical sequence diagrams for that increment's use cases, increment-specific module additions,
and the end-of-increment summary. Do not interleave technical content from multiple increments inside the same section.
Cross-cutting material that genuinely applies across all increments (architecture summary, final module placement,
cross-cutting concerns, open questions) lives in dedicated sections before or after the per-increment sections. The
result is that a reader can read one roadmap increment's section start-to-finish without confusing it with a project
milestone.

Avoid duplicating content. Cross-reference the feature requirements document for the "why" and roadmap increment
definitions; reference the project milestone source of truth for timeline dates when needed. The architecture document
should describe the "how" at each roadmap increment.

For project-level architecture, use `project.md` and any relevant standards as the durable product/system context.
Do not invent feature roadmap increments when the architecture scope is project-wide.

## Interaction Modes

### Mode A: Live lead-developer dialogue (default)

Use a conversational process with a lead developer or architect to draw out the system shape and per-increment
technical evolution. Confirm assumptions by reading the code where assertions can be verified directly.

### Mode B: Proposal or transcript ingestion

If the user provides a proposal document or technical-discussion transcript:

1. summarize the proposed system shape and decisions
1. infer current state and future roadmap-increment intent
1. identify open questions and missing technical detail
1. generate or refresh the architecture document draft

### Mode C: Existing architecture-document revision

When the user already has an architecture document:

1. read the current architecture document
1. identify what changed after the latest roadmap increment or design discussion
1. update current-state diagrams, roadmap-increment sections, and open questions
1. preserve long-lived technical intent while refreshing stale sections

### Mode D: Development mode

If the user says "development mode" or equivalent, the focus is on improving this skill itself. In development mode,
you may edit `.agents/skills/architecture-doc-builder/SKILL.md`. Outside development mode, this file is read-only.

## Human-Facing Usage Guidance

This is an interactive, back-and-forth skill.

The lead developer does not need to provide a complete architecture document up front. A strong starting prompt plus
iterative dialogue is enough. The agent should:

- ask clarifying questions about system shape, module placement, and per-roadmap-increment evolution
- read the code to verify module names, existing patterns, and conventions before asserting them in the document
- distinguish current behavior from planned future behavior in diagrams
- help define per-roadmap-increment system and sequence diagrams
- draft the architecture document early enough that the user can react to a concrete document

This skill should feel like a structured system-design conversation, not a deliverable-specification session.

### Example starter prompts

#### Example 1: New architecture document paired with an existing feature document

```text
Use architecture-doc-builder.
We have a feature document at <DOCS_ROOT>/features/reporting.md.
Help me draft the paired architecture document that defines module placement, per-roadmap-increment system diagrams,
sequence diagrams for each use case, and the data model vision for the final increment.
```

#### Example 2: Update an existing architecture document after a roadmap increment

```text
Use architecture-doc-builder.
Roadmap increment 2 of the reporting feature shipped.
Please update the architecture document so increment 2 reflects what is now live in code, and refine the next increment
diagrams based on what we learned.
```

#### Example 3: Proposal-first architecture-document drafting

```text
Use architecture-doc-builder.
I have a proposal in <DOCS_ROOT>/proposals/reports-s3-to-client-architecture.md that we've now committed to.
Please draft the architecture document from that proposal, with per-roadmap-increment system and sequence diagrams, and
ask follow-up questions where the proposal is ambiguous.
```

#### Example 4: Project-level architecture document

```text
Use architecture-doc-builder.
Help me draft the project-level architecture document at <DOCS_ROOT>/architecture/project-architecture.md so it captures
the major services, runtime boundaries, data stores, integration patterns, and cross-cutting technical decisions.
```

### Prompt structure that works well

The best starting prompts usually include:

- the architecture scope: project-level or feature-level
- for feature-level architecture, the feature key and a pointer to the paired feature document
- whether this is a new architecture document, an update, or a proposal-conversion
- a request for iterative dialogue and drafting

## Dialogue Principles

- For feature-level architecture, always read the paired feature document first. For project-level architecture, read
  `project.md` and the relevant standards first.
- Verify before asserting. If the document will name a module path, a function, or a route URL, check it in the
  codebase rather than guessing.
- Keep the discussion at architecture level, not implementation-task level.
- Scope diagrams per roadmap increment. A system diagram shows what the system looks like at that increment; a sequence
  diagram shows one use case at that increment.
- Do not produce cumulative diagrams that try to show every roadmap increment at once unless explicitly used as a top-level
  summary.
- Push back when the conversation collapses into deliverable-task or code-style detail that belongs in standards or
  deliverable specifications.
- Use proposals as evidence, not truth. Surface inferred assumptions and ask for confirmation.

### No padding

Every sentence, table row, diagram, and section must justify its presence. Do not:

- include sequence diagrams for cases that cannot realistically occur (e.g. "unknown report name" when the route
  itself only fires for known names, "invalid parameters" when the UI prevents invalid input)
- include sequence diagrams that describe behavior generic to every RBAC-gated route or every feature rather than
  this specific feature
- repeat the same point across milestones when one cross-cutting section captures it once
- pad out a section with boilerplate text to give it more apparent substance
- add sentences that summarize what the next section is about to say

If a diagram, section, or sentence is removed and the document still answers the same questions equally well, it was
padding and should have been left out. Prefer a short, dense document over a long, repetitive one.

## Required Inputs

Before drafting a serious architecture document, elicit or infer:

1. architecture scope: project-level or feature-level
1. for feature-level architecture, feature key and paired feature document path
1. for feature-level architecture, roadmap increment list from the feature document
1. current state of the codebase relevant to the architecture scope
1. module placement plan
1. per-increment use cases that need sequence diagrams
1. data model vision if a future roadmap increment introduces persistence
1. cross-cutting concerns to capture (permissions, errors, OpenAPI, deployment, IAM)

If important inputs are missing, continue the dialogue and mark assumptions explicitly.

## Standards and Repo Context Integration

Process:

1. Read `<DOCS_ROOT>/architecture/index.yaml` if it exists to avoid duplicating or overlapping an existing
   architecture doc.
1. For feature-level architecture, read `<DOCS_ROOT>/features/index.yaml` and load the paired feature document.
1. For project-level architecture, read `<DOCS_ROOT>/project.md`.
1. Read `<DOCS_ROOT>/standards/index.yaml` only as needed for system-level constraints that materially shape the
   technical shape of the feature.
1. Reference standards where they affect module placement or roadmap-increment decisions, but do not restate detailed
   coding rules inside the architecture document.

The architecture document should stay system-oriented. Detailed coding conventions remain in standards. Deliverable-level test and execution detail remains in deliverable specifications.

## Architecture Document Content Requirements

Each architecture document draft should usually include:

1. Title and scope, with link to `project.md` or the paired feature document
1. Architecture summary
1. Module placement (final layout — earlier roadmap increments populate subsets)
1. Cross-cutting concerns (permissions, errors, OpenAPI, logging, deployment, IAM)
1. Roadmap-increment sections, each containing:
   - System diagram for that increment (what the system looks like at that increment)
   - Sequence diagrams, one per significant use case at that increment
   - "What is true at the end of this increment" summary
1. Open architecture questions, tagged by roadmap increment
1. References (feature doc, standards, key code paths)

### Per-roadmap-increment scope rule

Do not produce one cumulative diagram for all roadmap increments. Each increment owns its own system diagram and its
own sequence diagrams. A top-level cumulative summary diagram may appear in the Architecture Summary section, but it
must not replace per-increment diagrams.

### Sequence diagram coverage

For each roadmap increment, include at minimum:

- one sequence diagram for the happy path
- one sequence diagram per significant alternate path (errors, edge cases, alternate user actions)

Avoid one mega-diagram. Multiple short diagrams that each tell one use case are easier to read and easier to update.

### Distinguishing current state from future vision

Use clear section labels — "current", "in progress", "planned", "vision" — and avoid mixing current and future
components inside a single diagram. If the same diagram needs to show future components, use a dotted-line convention
or a separate diagram.

## Recommended Architecture Document Sections

Use this section order unless the user explicitly asks for a different structure:

1. Title and companion-document reference
1. Architecture summary
1. Module placement
1. Cross-cutting concerns
1. Roadmap increment 1 — current/planned state, system diagram, sequence diagrams, end-of-increment summary
1. Roadmap increment 2 — same shape
1. Roadmap increment N — same shape
1. Open architecture questions
1. References

## Facilitator Question Bank

### Module placement

- Where should the new code live, and why?
- Which existing packages should the new code sit inside?
- What is the import surface for each new component?
- Are there existing patterns in the codebase that the new shape should follow?

### Per-roadmap-increment shape

- What does the system look like at the end of each roadmap increment?
- Which components are added, which are unchanged, and which are removed at each increment?
- Which use cases differ across increments?

### Sequence diagrams

- What are the significant happy paths at this roadmap increment?
- What error paths or alternate paths deserve their own diagram?
- Which components participate in each path?

### Cross-cutting

- Which permissions gate each route at each roadmap increment?
- Which errors does the orchestrator or service layer raise, and how do they map to HTTP status codes?
- Which settings, IAM grants, or deployment changes does each roadmap increment require?
- Is OpenAPI documentation needed for any new shape (e.g. binary responses)?

### Data model

- Which roadmap increments introduce or change persistent data?
- What is the minimum viable schema for each new table?
- What is the audit and reproducibility story for stored data?

### Open questions

- Which decisions remain unresolved?
- Which decisions can wait until the corresponding roadmap increment is active?
- Which decisions block work that is currently in progress?

## Output Naming and Placement

Use methodology naming guidance:

- Project-level architecture document: `<DOCS_ROOT>/architecture/project-architecture.md`
- Feature-level architecture document: `<DOCS_ROOT>/architecture/{feature-key}-architecture.md` — must match the paired feature document's key
- Architecture index: `<DOCS_ROOT>/architecture/index.yaml`

Keep `architecture/` flat by default.

## Generation Triggers

When the user says:

- "generate the architecture document"
- "draft the architecture doc"
- "write the architecture document"
- "create an architecture document"

...generate a draft immediately from the discussion so far, then iterate.

When the user says:

- "roadmap increment N is complete"
- "update the architecture document"
- "refresh the architecture doc"

...update the relevant roadmap increment's section to reflect the new system reality, refresh diagrams, and refine the
remaining future-increment sections.

## Architecture Document -> Deliverable Handoff

When the architecture document is approved or a roadmap increment is ready for execution, provide a handoff package for
later spec work containing:

1. architecture scope, architecture document path, and project or feature document path
1. roadmap increment being implemented
1. related project milestone or target timeline, if known
1. module placement summary for that roadmap increment
1. relevant sequence diagrams
1. cross-cutting concerns that apply
1. data model expectations
1. open questions that affect implementation

This handoff informs deliverable specification creation but does not replace `spec-builder`.

## Quality Bar

An architecture document draft is high quality when:

1. its scope is clear: project-level or feature-level
1. feature-level architecture is clearly paired with a feature document and avoids duplicating its content
1. feature-level roadmap increments mirror the feature document exactly — same names, same order, no extra or renamed increments
1. no project milestone dates appear in the architecture document; dates live in the declared project milestone source of truth
1. module placement is explicit, with rationale
1. each roadmap increment has its own system diagram and use-case sequence diagrams when staged technical evolution is needed
1. diagrams accurately reflect components that exist (or are planned) and do not invent module names
1. cross-cutting concerns are captured once, not repeated per roadmap increment
1. open questions are tagged by the roadmap increment they affect
1. the handoff to later deliverables is clear without collapsing into implementation detail

## Example Use Cases

- draft an architecture document for a new feature after the feature document is approved
- convert an approved proposal into an architecture document with per-roadmap-increment diagrams
- update an architecture document after a roadmap increment ships
- refine future-increment diagrams based on what was learned in the current increment
