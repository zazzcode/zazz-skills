---
name: feature-doc-builder
description: Help a user create, draft, refine, or update a long-lived feature document for a product capability; use when the user wants to define or improve feature purpose, current state, milestone roadmap, and feature-level direction before or alongside deliverable planning.
---

# Feature Doc Builder Skill

## Startup Sequence

Before starting the dialogue:

1. Use `AGENTS.md` as the source of truth for repo-specific settings such as docs root, tracking system, project-code
   conventions, and documentation workflow rules. Read it if that context is not already available.
1. Identify whether you are creating a new feature document, evolving an existing one, or converting a transcript into
   a draft.
1. Find the standards index and any existing feature documents or milestone references that should shape the
   discussion.
1. Then begin the dialogue and keep the conversation at feature scope rather than deliverable implementation scope.

## Mission

Create or evolve a feature requirements document that explains a long-lived application capability at the product and system level.

The feature requirements document should help answer:

- why this feature exists
- what value it creates
- what is live today
- what still needs to be built
- how the work should be organized into milestones

This skill is for feature definition and feature evolution. It is not an implementation-planning skill and it does not
replace deliverable specification authoring.

It should help the Product Owner articulate feature-level success criteria and milestone outcome criteria that later
inform deliverable acceptance criteria.

## Primary Audience

Work primarily with:

- product owner
- project owner
- stakeholders with domain context

Secondary audiences for the resulting feature requirements document:

- developers onboarding to the project
- the development team reviewing feature intent and milestone breakdown
- future agents that need product context before creating deliverable specifications

## Docs Root Convention

Use the repo docs root declared in `AGENTS.md` as the base for methodology docs. Example paths in this skill may use
`<DOCS_ROOT>/...` as shorthand.

## What This Skill Produces

Primary artifact:

- `<DOCS_ROOT>/features/{feature-key}.md`

Supporting discovery artifact:

- update `<DOCS_ROOT>/features/index.yaml` when the feature document is created or materially revised

## Boundaries

### This skill does

- define the feature's purpose, value, and current state
- capture feature-level success criteria and milestone outcomes
- capture system-level behavior and important user/system flows
- decompose feature evolution into milestones
- identify what is live, planned, proposed, or deferred
- ingest transcripts or meeting notes and turn them into a feature document draft
- produce handoff guidance for later deliverable specifications

### This skill does not

- write deliverable-level acceptance criteria for implementation tasks
- produce execution-ready task decomposition
- replace proposal analysis when the team is still deciding whether to pursue an idea
- implement the feature

Artifact boundaries:

- `proposal-builder` helps decide whether or how to proceed
- `feature-doc-builder` defines the long-lived feature and milestone roadmap
- `spec-builder` defines one deliverable's execution contract

## Interaction Modes

### Mode A: Live owner dialogue (default)

Use a conversational process with a product owner, project owner, or stakeholder to draw out the feature's why, current
state, and future milestones.

### Mode B: Transcript ingestion

If the user provides a transcript or meeting notes:

1. summarize the core problem, goals, and decisions
1. infer the feature's intent and current/planned states
1. identify open questions and missing milestone detail
1. generate or refresh the feature document draft

### Mode C: Existing feature-document revision

When the user already has a feature document:

1. read the current feature document
1. identify what changed after the latest milestone or discussion
1. update current-state sections, milestone statuses, and flows
1. preserve long-lived feature intent while refreshing stale sections

### Mode D: Development mode

If the owner says "development mode" or equivalent, the focus is on improving this skill itself. In development mode,
you may edit `.agents/skills/feature-doc-builder/SKILL.md`. Outside development mode, this file is read-only.

## Human-Facing Usage Guidance

This is an interactive, back-and-forth skill.

The owner does not need to provide a complete feature document up front. A strong starting prompt plus iterative
dialogue is enough. The agent should:

- ask clarifying questions about the feature's value and current state
- help distinguish current behavior from planned future behavior
- help define or revise the next few meaningful milestones
- draft the feature document early enough that the owner can react to a concrete document

This skill should feel like a structured product-definition conversation, not an implementation planning session.

### Example starter prompts

#### Example 1: New feature document

```text
Use feature-doc-builder.
I want to create a feature document for role-based access control in our application.
This feature needs to explain why RBAC matters, what the system does today, what needs to be added, and how we should break it into milestones.
Please guide me through this in a back-and-forth dialogue and draft the feature document as we refine it.
```

#### Example 2: Update an existing feature document after a milestone

```text
Use feature-doc-builder.
We already have a feature document for our billing feature, and milestone 1 has shipped.
Please help me update the feature document so it reflects the current live behavior, marks milestone 1 complete, and refines the next milestones based on what we learned.
```

#### Example 3: Transcript-first feature-document drafting

```text
Use feature-doc-builder.
I am pasting notes from a product and engineering meeting about a new approvals workflow.
Please infer the feature intent, current state, likely milestones, and open questions, then draft a feature document and ask follow-up questions where the discussion was ambiguous.
```

### Prompt structure that works well

The best starting prompts usually include:

- the feature name
- why the feature matters
- what is known about the current state
- whether this is a new feature document or an update
- a request for iterative dialogue and drafting

## Dialogue Principles

- Start with the problem and business/domain value before discussing solution shape.
- Keep the discussion at the feature level, not the deliverable-task level.
- Ask about current state explicitly. A feature document must describe what the application does today, not just the
  future vision.
- Distinguish what is live, planned, proposed, and deferred.
- Treat milestones as meaningful increments of user or system value.
- Push back when the conversation collapses into low-level implementation detail that belongs in standards or
  deliverable specifications.
- Use transcripts as evidence, not truth. Surface inferred assumptions and ask for confirmation.

### No padding

Every sentence, table row, diagram, and section must justify its presence. Do not:

- repeat the same point across sections to fill a template
- include user flows, use cases, or examples that cannot realistically occur (e.g. a UI flow that the UI itself
  prevents)
- include sequence diagrams or scenarios that describe behavior generic to every route or every feature rather than
  this specific feature
- pad out a section with boilerplate text to give it more apparent substance
- add sentences that summarize what the next section is about to say

If a sentence or section is removed and the document still answers the same questions equally well, the sentence or
section was padding and should have been left out. Prefer a short, dense document over a long, repetitive one.

## Required Inputs

Before drafting a serious feature document, elicit or infer:

1. feature name and feature key
1. problem statement
1. business/domain justification
1. who is affected
1. current state of the system
1. desired future state
1. major system concepts or entities involved
1. milestone breakdown or at least a first-pass milestone model

If important inputs are missing, continue the dialogue and mark assumptions explicitly.

## Standards and Feature Context Integration

Process:

1. Read `<DOCS_ROOT>/features/index.yaml` if it exists to avoid duplicating or overlapping an existing feature doc.
1. Read `<DOCS_ROOT>/standards/index.yaml` only as needed for system-level constraints that materially shape the
   feature.
1. Reference standards where they affect feature boundaries or milestone decomposition, but do not restate detailed
   implementation rules inside the feature document.

The feature document should stay product/system-oriented. Detailed coding conventions remain in standards.
Deliverable-level test and execution detail remains in deliverable specifications.

## Feature Document Content Requirements

Each feature document draft should usually include:

1. Feature title and summary
1. Current milestone and next milestone
1. Introduction / problem statement
1. Why this feature matters
1. Current state
1. Feature-level success criteria
1. Core concepts / domain model
1. User flows and system flows
1. Milestone overview table
1. Milestone detail sections with milestone outcome criteria
1. Risks, constraints, and non-goals
1. Open questions
1. Deliverable handoff considerations

### What "current state" means

The feature document must explain what the application actually does today as of the latest completed milestone. This
is one of the most important distinctions between a feature document and a proposal.

### What "milestone" means

A milestone is a meaningful feature increment that advances the capability. A milestone may contain one or more
deliverables. The feature document should make the milestone sequence intelligible to both stakeholders and the
development team.

Every milestone must have **all three** of:

1. **A target completion date.** Use a concrete date when known; use `TBD` as a placeholder when not. A date or `TBD`
   is required — never leave the field absent. This applies to the milestone overview table and to each milestone's
   detail section heading.
1. **A capability statement.** One sentence answering "at the end of this milestone, what can the user or system do
   that it could not do before?"
1. **A deliverables list.** The concrete shippable units (backend service, route, UI page, migration, etc.) that
   together produce the milestone's capability. The list does not need to enumerate sub-tasks; that belongs in a
   deliverable specification.

When a milestone ships, replace its target date with the actual completion date and update the status accordingly
(e.g. `Complete (2026-03-25)`).

### Feature document is the source of truth for milestones

The milestone list — names, order, target dates, capability statements, deliverables — is owned by the feature
document. Other documents (architecture documents and deliverable specifications) may reference these milestones but must not redefine them or
introduce new ones. If a milestone needs to be added, removed, renamed, or rescoped, the change lands in the feature
document first; downstream documents are then updated to mirror the new milestone list.

### Milestones must be major sections, not interleaved

Each milestone gets its own top-level (`##`) section in the feature document. Within that section, place everything
specific to that milestone: capability statement, milestone-specific concepts, user flows, deliverables, outcome
criteria, and end-of-milestone summary. Do not interleave content from multiple milestones inside the same section.
Cross-cutting material that genuinely applies across all milestones (introduction, universal concepts, permissions
catalog, milestone overview, future topics, open questions) lives in dedicated sections before or after the
per-milestone sections. The result is that a reader can read one milestone's section start-to-finish without
encountering content about other milestones, and skim the document by milestone heading without losing context.

### Feature-level success criteria vs deliverable acceptance criteria

At the feature document level, success criteria should describe value and system outcomes, not implementation tests.
They answer questions like:

- what valuable capability exists after this milestone?
- what should be true of the product when this feature is successful?
- what outcome should later deliverables prove through acceptance criteria and TDD?

Those feature-document-level success criteria should inform later deliverable acceptance criteria, but should not replace
deliverable-level testability requirements.

## Recommended Feature Document Sections

Use this section order unless the owner explicitly asks for a different structure:

1. Title
1. Feature summary
1. Current milestone / next milestone / services affected
1. Introduction
1. Why this feature matters
1. Concepts
1. User flows and system flows
1. Milestone overview
1. Milestone detail sections
1. Current state summary
1. Planned future evolution
1. Open questions and follow-ups

## Facilitator Question Bank

### Problem and value

- What problem does this feature solve?
- Why is it necessary now?
- What business, user, or operational value does it add?
- What gets worse if we do not build this?

### Current state

- What does the system do today in this area?
- What is already shipped?
- Where are the current pain points, workarounds, or gaps?

### Domain and concepts

- What are the important nouns and concepts in this feature?
- Which actors or systems participate?
- What terminology should be stable in the feature document?

### Flows

- What are the most important user flows?
- What are the key system flows behind them?
- Which flows differ across milestones?

### Milestones

- What is the smallest meaningful first milestone?
- Which milestones unlock visible user or system value?
- Which milestones are backend-first, frontend-following, or cross-system?
- Which parts are definitely in scope now, and which should wait?

### Handoff to deliverables

- Which milestone slices are likely to become separate deliverables?
- Are there milestone dependencies the spec-builder should know about later?
- Which parts require multiple deliverables rather than one large implementation?

## Output Naming and Placement

Use methodology naming guidance:

- Feature requirements document: `<DOCS_ROOT>/features/{feature-key}.md`
- Features index: `<DOCS_ROOT>/features/index.yaml`

Keep `features/` flat by default. If a project later has a real need for multiple durable artifacts per feature, it may
introduce subdirectories, but that is not the default methodology recommendation.

## Generation Triggers

When the user says:

- "generate the feature document"
- "draft the feature doc"
- "write the feature requirements"
- "create a feature document"

...generate a draft immediately from the discussion so far, then iterate.

When the user says:

- "milestone 1 is complete"
- "update the feature document"
- "refresh the feature doc"

...update the current-state and milestone sections to reflect the new system reality.

## Feature Document -> Deliverable Handoff

When the feature document is approved or a milestone is ready for execution, provide a handoff package for later
deliverable specification work containing:

1. feature key and feature document path
1. milestone being implemented
1. current-state summary
1. desired milestone outcome
1. relevant flows and concepts
1. constraints and non-goals
1. likely deliverable slices

This handoff informs deliverable specification creation but does not replace `spec-builder`.

## Quality Bar

A feature document draft is high quality when:

1. the feature's why is explicit and persuasive
1. the current state is accurate and not hand-wavy
1. the major concepts and flows are understandable to a new developer
1. milestones are meaningful, ordered, and not just arbitrary task buckets
1. every milestone has a target completion date (or `TBD`), a one-sentence capability statement, and a deliverables
   list
1. the document helps both stakeholders and the development team
1. the handoff to later deliverables is clear without collapsing into implementation detail

## Example Use Cases

- define a new long-lived capability before any deliverable specifications exist
- turn a stakeholder workshop transcript into a first feature document draft
- update a feature document after milestone 1 ships
- decompose a feature into milestone 1, 2, and 3 before creating individual deliverable specifications
