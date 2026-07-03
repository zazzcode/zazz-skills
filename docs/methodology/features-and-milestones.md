# Features and Milestones

Feature requirements documents describe durable product capabilities over time. Milestones organize that capability into time-boxed or reviewable phases. Deliverables are the bounded implementation slices inside a milestone.

## Feature Requirements Documents

Use a feature requirements document when a capability is expected to evolve across multiple deliverables, releases, or user workflows.

Recommended contents:

- Purpose and user value
- Current state
- Target capability
- User journeys or operating workflows
- Milestone roadmap
- Success criteria
- Key decisions and links to proposals
- Architecture links
- Open questions

## Milestones

A milestone is a coherent phase of a feature. It should be small enough to reason about, but large enough to describe a meaningful product step.

Milestones should name:

- intended outcome
- included deliverables
- excluded work
- acceptance or release criteria
- dependencies and sequencing constraints

## Time-Boxed Deliverables

Deliverables are time-boxed execution units. Each one gets a deliverable specification and should fit inside one worktree unless the team intentionally uses a stacked branch lane.

Good deliverables:

- have a clear user, system, or operational outcome
- can be verified with acceptance criteria
- have a bounded file and behavior scope
- can produce a reviewable PR

If a deliverable cannot be tested or reviewed independently, split it or move the uncertainty back to a proposal, feature doc, or architecture doc.

## Storage

Feature requirements, project plans, roadmap, and milestone history live in the repo's
declared durable storage surface. In committed Markdown mode, feature requirements
usually live under `<DOCS_ROOT>/features/`, while roadmap or plan documents may live
under `<DOCS_ROOT>/roadmap/` when the team keeps them separately from feature docs. In
wiki or knowledge-base mode, `AGENTS.md` should identify the feature, roadmap, and
milestone index pages.

Active deliverable specifications remain under `<DOCS_ROOT>/specifications/` while
RUN_LOG files, QA notes, handoffs, and scratch milestone analysis belong under
`<DOCS_ROOT>/ephemeral/` or the declared tracker/service while the work is underway. When
implementation changes shipped behavior, promote the durable feature, roadmap, or
milestone update into the declared durable docs surface.

## Relevant Skills

| Skill | How it helps efficiency |
| ----- | ----------------------- |
| `feature-doc-builder` | Builds and maintains feature requirements, milestone framing, open questions, and durable capability history. |
| `proposal-builder` | Resolves product or technical uncertainty before a feature roadmap hardens around the wrong assumption. |
| `architecture-doc-builder` | Adds design depth for features that span multiple deliverables, services, workflows, or data boundaries. |
| `spec-builder` | Slices approved milestones into executable deliverable specifications with acceptance criteria and test intent. |
| `gh-wiki` | Updates feature, roadmap, and milestone pages when the repo uses GitHub Wiki as the durable docs surface. |
| `confluence` | Drafts or updates feature, roadmap, and milestone pages for Confluence-backed repos. |
| `zazz-board` | Synchronizes feature-linked deliverables and execution state when the repo uses Zazz Board. |

## Related Sections

- [Document Storage](./document-storage.md)
- [Specifications](./specifications.md)
- [Code Generation](./code-generation.md)
- [Testing and Validation](./testing-and-validation.md)
