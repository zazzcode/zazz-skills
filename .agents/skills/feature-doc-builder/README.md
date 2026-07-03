# Feature Doc Builder Skill — User Guide

How to use the Feature Doc Builder skill to create or update a long-lived feature document.

## What It Does

The Feature Doc Builder skill helps define a product capability over time.

It is designed to capture:

- why the feature exists
- what the system does today
- what still needs to be built
- how the feature should evolve through roadmap increments
- which project milestones or timeline windows the feature work may contribute to

This is a feature-level skill, not a deliverable-specification skill.

## When to Use It

Use this skill when:

- you are defining a new long-lived feature
- you need to update a feature document after a roadmap increment shipped
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
- help define meaningful feature roadmap increments
- distinguish feature roadmap increments from project milestones
- draft the feature document early so you can refine it

## Example Prompts

```text
Use feature-doc-builder.
I want to create a feature document for role-based access control.
Please help me define the purpose, current state, feature roadmap increments, related project milestone context, and next expected deliverables.
```

```text
Use feature-doc-builder.
Roadmap increment 1 for our billing feature shipped.
Please update the feature document so it reflects what is live now and refine the next increments.
```

```text
Use feature-doc-builder.
I am pasting a stakeholder workshop transcript.
Please infer the feature intent, current state, roadmap increments, related project milestone context, and open questions, then draft the feature document.
```

## Workflow

1. Start with the capability you want to define or update.
1. Answer questions about purpose, current behavior, and future direction.
1. Review the first draft.
1. Refine roadmap increment boundaries and success criteria.
1. Approve the feature document and use it to inform later deliverable specification work.

## Notes

- Use `proposal-builder` first if the team is still deciding whether or how to proceed.
- Use `spec-builder` later when you are ready to define one bounded deliverable from the feature.
- Use project milestone language for project-scoped timeline commitments; a project milestone can contain deliverables from multiple features.
- This skill is especially useful for durable product context that should outlive any single implementation increment.
