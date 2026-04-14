---
name: feature-doc-builder
description: Help a user create, draft, refine, or update a long-lived feature requirements document for a product capability; use when the user needs durable capability intent, current state, milestone evolution, and feature-level direction before or alongside deliverable planning.
---

# Feature Doc Builder Skill

## Required Repo Extension Check

Before doing anything else, check for `.agents/skill-extensions/feature-doc-builder/EXTENSION.md`.
If it exists, read it immediately after this `SKILL.md` and apply it as repo-specific guidance that augments this skill.

## Canonical Term

This skill's canonical artifact is a **feature requirements document**.

Some repos or users may still say "feature document" or "feature doc" as legacy shorthand. Treat those as aliases unless the repo defines a different artifact model.

## When To Use This Skill

Use this skill when the user needs to:

- define or revise a long-lived product capability
- describe what is live today versus what is planned next
- organize capability evolution into milestones
- turn notes or transcripts into a durable feature requirements document
- prepare feature-level context before deliverable SPEC authoring

Do not use this skill when the user mainly needs to:

- evaluate competing approaches before deciding whether to proceed; use `proposal-builder`
- define one bounded implementation increment; use `spec-builder`
- decompose approved work into execution tasks; use `planner`
- implement or verify code; use `worker` or `qa`

## Startup Sequence

Before starting the dialogue:

1. Check for the repo extension file above and read it if present.
2. Read `AGENTS.md` for repo-specific docs-root, tracking, and workflow rules if that context is not already available.
3. Identify whether you are creating a new feature requirements document, revising an existing one, or drafting from a transcript.
4. Read `<DOCS_ROOT>/features/index.yaml` if it exists so you do not duplicate or overlap an existing feature.
5. Read `<DOCS_ROOT>/standards/index.yaml` only when system constraints materially shape the feature boundary or milestone breakdown.
6. Keep the conversation at feature scope rather than deliverable implementation scope.

## Mission

Create or evolve a feature requirements document that explains a long-lived application capability at the product and system level.

The document should answer:

- why the capability exists
- what value it creates
- what is live today
- what still needs to be built
- how the capability should evolve across milestones

This skill is for feature definition and feature evolution. It does not replace proposal analysis, deliverable SPEC authoring, or implementation planning.

## Audience

Work primarily with:

- product owner
- project owner
- stakeholders with domain context

The resulting feature requirements document should also help:

- developers onboarding to the project
- the development team reviewing feature intent and milestone framing
- future agents that need product context before creating deliverable specs

## Docs Root Convention

Use the repo docs root declared in `AGENTS.md` as the base for framework docs. Example paths in this skill may use `<DOCS_ROOT>/...` as shorthand.

## What This Skill Produces

Primary artifact:

- `<DOCS_ROOT>/features/{feature-key}.md`

Supporting discovery artifact:

- update `<DOCS_ROOT>/features/index.yaml` when the feature requirements document is created or materially revised

## Boundaries

### This skill does

- define the feature's purpose, value, and current state
- capture feature-level success criteria and milestone outcomes
- capture important user flows and system flows
- decompose feature evolution into milestones
- distinguish what is live, planned, proposed, and deferred
- convert transcripts or meeting notes into a feature requirements document draft
- produce handoff guidance for later deliverable SPEC work

### This skill does not

- write deliverable-level acceptance criteria
- produce execution-ready task decomposition
- replace proposal analysis when the direction is still uncertain
- implement the feature

Artifact boundaries:

- `proposal-builder` decides whether or how to proceed
- `feature-doc-builder` defines the long-lived capability and milestone roadmap
- `spec-builder` defines one deliverable's execution contract

## Interaction Modes

### Mode A: Live owner dialogue

Use a conversational process with a product owner, project owner, or stakeholder to draw out the feature's value, current state, and future milestones.

### Mode B: Transcript ingestion

If the user provides notes or a transcript:

1. summarize the core problem, goals, and decisions
2. infer the feature intent, current state, and likely milestone model
3. identify open questions and assumptions
4. generate or refresh the feature requirements document draft

### Mode C: Existing-document revision

When the user already has a feature requirements document:

1. read the current document
2. identify what changed after the latest milestone or discussion
3. update current-state sections, milestone statuses, and flows
4. preserve durable feature intent while refreshing stale sections

### Mode D: Development mode

If the owner says "development mode" or equivalent, the focus is on improving this skill itself. In development mode, you may edit `.agents/skills/feature-doc-builder/SKILL.md`. Outside development mode, this file is read-only.

## Dialogue Principles

- Start with the problem and business or domain value before discussing solution shape.
- Keep the discussion at feature scope, not deliverable-task scope.
- Ask about current state explicitly; the document must describe what the application does today.
- Distinguish what is live, planned, proposed, and deferred.
- Treat milestones as meaningful increments of user or system value.
- Push back when the conversation collapses into implementation detail that belongs in standards or deliverable specs.
- Use transcripts as evidence, not truth; surface inferred assumptions and ask for confirmation.

## Required Inputs

Before drafting a serious feature requirements document, elicit or infer:

1. feature name and feature key
2. problem statement
3. business or domain justification
4. who is affected
5. current system state
6. desired future state
7. major system concepts or entities involved
8. milestone breakdown or at least a first-pass milestone model

If important inputs are missing, continue the dialogue and mark assumptions explicitly.

## Content Requirements

Each feature requirements document draft should usually include:

1. feature title and summary
2. current milestone and next milestone
3. introduction or problem statement
4. why this feature matters
5. current state
6. feature-level success criteria
7. core concepts or domain model
8. user flows and system flows
9. milestone overview table
10. milestone detail sections with outcome criteria
11. risks, constraints, and non-goals
12. open questions
13. deliverable handoff considerations

### Current state

Current state means what the application actually does today as of the latest completed milestone. This is one of the most important differences between a feature requirements document and a proposal.

### Milestones

A milestone is a meaningful feature increment that advances the capability. A milestone may contain one or more deliverables. The milestone sequence should be intelligible to both stakeholders and the development team.

### Feature-level success criteria

At this layer, success criteria should describe value and system outcomes rather than implementation tests. They should help later SPEC authors derive deliverable acceptance criteria, not replace them.

## Recommended Section Order

Use this order unless the owner explicitly wants a different structure:

1. Title
2. Feature summary
3. Current milestone / next milestone / services affected
4. Introduction
5. Why this feature matters
6. Concepts
7. User flows and system flows
8. Milestone overview
9. Milestone detail sections
10. Current state summary
11. Planned future evolution
12. Open questions and follow-ups

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
- What terminology should stay stable in the document?

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
- Are there milestone dependencies the `spec-builder` should know about later?
- Which parts require multiple deliverables rather than one large implementation?

## Output Naming and Placement

Use framework naming guidance:

- feature requirements document: `<DOCS_ROOT>/features/{feature-key}.md`
- features index: `<DOCS_ROOT>/features/index.yaml`

Keep `features/` flat by default. If a project later has a real need for multiple durable artifacts per feature, it may introduce subdirectories, but that is not the default framework recommendation.

## Generation Triggers

When the user says:

- "generate the feature requirements document"
- "generate the feature document"
- "draft the feature doc"
- "write the feature requirements"
- "create a feature document"

generate a draft immediately from the discussion so far, then iterate.

When the user says:

- "milestone 1 is complete"
- "update the feature requirements document"
- "update the feature document"
- "refresh the feature doc"

update the current-state and milestone sections to reflect the new system reality.

## Feature Requirements Document -> Deliverable Handoff

When the document is approved or a milestone is ready for execution, provide a handoff package for later SPEC work containing:

1. feature key and document path
2. milestone being implemented
3. current-state summary
4. desired milestone outcome
5. relevant flows and concepts
6. constraints and non-goals
7. likely deliverable slices

This handoff informs deliverable SPEC creation but does not replace `spec-builder`.

## Quality Bar

A feature requirements document draft is high quality when:

1. the feature's why is explicit and persuasive
2. the current state is accurate and concrete
3. the major concepts and flows are understandable to a new developer
4. milestones are meaningful, ordered, and not just arbitrary task buckets
5. the document helps both stakeholders and the development team
6. the handoff to later deliverables is clear without collapsing into implementation detail

## Example Use Cases

- define a new long-lived capability before any deliverable specs exist
- turn a stakeholder workshop transcript into a first feature requirements document draft
- update a feature requirements document after milestone 1 ships
- decompose a feature into milestone 1, 2, and 3 before creating individual deliverable specs
