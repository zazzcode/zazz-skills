# Feature Doc Builder Skill — User Guide

How to use the Feature Doc Builder skill to create or update a long-lived feature document.

## What It Does

The Feature Doc Builder skill helps define a product capability over time.

It is designed to capture:

- why the feature exists
- what the system does today
- what still needs to be built
- how the feature should evolve through milestones

This is a feature-level skill, not an implementation-planning skill.

## When to Use It

Use this skill when:

- you are defining a new long-lived feature
- you need to update a feature document after a milestone shipped
- you want to turn a workshop or transcript into a feature document
- you need feature-level context before creating deliverable specifications

## What It Produces

- a feature document under `<DOCS_ROOT>/features/`
- updates to `<DOCS_ROOT>/features/index.yaml` when appropriate
- a clean handoff into later deliverable-spec work

## How the Dialogue Works

This is an interactive skill.

You do not need to provide a full feature document up front. A good starting prompt is enough. The agent should:

- ask about feature purpose and current state
- identify what is already live
- help define meaningful milestones
- draft the feature document early so you can refine it

## Example Prompts

```text
Use feature-doc-builder.
I want to create a feature document for role-based access control.
Please help me define the purpose, current state, milestone roadmap, and next expected deliverables.
```

```text
Use feature-doc-builder.
Milestone 1 for our billing feature shipped.
Please update the feature document so it reflects what is live now and refine the next milestones.
```

```text
Use feature-doc-builder.
I am pasting a stakeholder workshop transcript.
Please infer the feature intent, current state, milestones, and open questions, then draft the feature document.
```

## Workflow

1. Start with the capability you want to define or update.
1. Answer questions about purpose, current behavior, and future direction.
1. Review the first draft.
1. Refine milestone boundaries and success criteria.
1. Approve the feature document and use it to inform later deliverable specification work.

## Notes

- Use `proposal-builder` first if the team is still deciding whether or how to proceed.
- Use `spec-builder` later when you are ready to define one bounded deliverable from the feature.
- This skill is especially useful for durable product context that should outlive any single implementation increment.
