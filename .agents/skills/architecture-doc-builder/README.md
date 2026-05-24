# Architecture Doc Builder Skill — User Guide

How to use the Architecture Doc Builder skill to create or update a long-lived architecture document paired with a
feature document.

## What It Does

The Architecture Doc Builder skill helps define the technical shape of a feature over time.

It is designed to capture:

- module placement and code organization
- what the system looks like at each milestone
- sequence diagrams for each significant use case at each milestone
- cross-cutting concerns (permissions, errors, OpenAPI, deployment, IAM)
- data model vision for milestones that introduce persistence
- technical open questions

This is an architecture-level skill, not an implementation-planning skill and not a feature-definition skill.

## When to Use It

Use this skill when:

- you have a feature document and need its paired architecture document
- a milestone shipped and the architecture document needs to be refreshed
- you have a proposal that has been approved and needs to become a working architecture document
- you need architecture-level context before creating deliverable specifications

## Pairing With Feature Doc Builder

This skill is the technical counterpart to `feature-doc-builder`. They share a feature key and cross-reference each
other. The feature document owns purpose, milestones, and user flows; the architecture document owns system design,
module placement, and per-milestone diagrams. Avoid duplicating content between the two.

If no feature document exists yet, use `feature-doc-builder` first.

## What It Produces

- an architecture document under `<DOCS_ROOT>/architecture/`
- updates to `<DOCS_ROOT>/architecture/index.yaml` when appropriate
- a clean handoff into later deliverable-spec work

## How the Dialogue Works

This is an interactive skill.

You do not need to provide a full architecture document up front. A good starting prompt is enough. The agent should:

- read the paired feature document first
- read the codebase to verify module names and patterns
- ask about module placement and per-milestone evolution
- draft the architecture document early so you can refine it

## Example Prompts

```text
Use architecture-doc-builder.
We have a feature document at docs/features/reporting.md.
Help me draft the paired architecture document with per-milestone system and sequence diagrams.
```

```text
Use architecture-doc-builder.
Milestone 2 of the reporting feature shipped.
Please update the architecture document so M2 reflects what is now live and refine M3 and M4 diagrams.
```

```text
Use architecture-doc-builder.
I have a proposal in docs/proposals/reports-s3-to-client-architecture.md that we've committed to.
Please draft the architecture document from it, with per-milestone diagrams, and ask follow-up questions where
the proposal is ambiguous.
```

## Workflow

1. Start from the paired feature document.
1. Answer questions about module placement, per-milestone system shape, and use cases.
1. Review the first draft.
1. Refine per-milestone diagrams and cross-cutting decisions.
1. Approve the architecture document and use it to inform later deliverable specification work.

## Notes

- Use `proposal-builder` first if the team is still deciding whether or how to proceed.
- Use `feature-doc-builder` to create or evolve the paired feature document.
- Use `spec-builder` later when you are ready to define one bounded deliverable.
- This skill should produce per-milestone diagrams, not one cumulative diagram. Each milestone owns its own
  system and sequence diagrams.
