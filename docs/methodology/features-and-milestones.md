# Features and Project Milestones

Feature requirements documents describe durable product capabilities over time. Project
milestones organize delivery expectations on a timeline. Deliverables are the bounded
implementation slices that can be associated with a feature for product context and
slotted into a project milestone for stakeholder planning.

The important distinction is:

- Features are functionality-centric. They explain what capability exists, why it
  matters, and how that capability may evolve through feature roadmap increments.
- Project milestones are time-centric. They communicate when stakeholders should expect
  meaningful outcomes, and a single project milestone can contain deliverables from
  multiple features, bug fixes, chores, or technical investments.
- Deliverables connect the two worlds: a deliverable may contribute to a feature while
  also being assigned to the project milestone where the owner expects it to land.

## Feature Requirements Documents

Use a feature requirements document when a capability is expected to evolve across multiple deliverables, releases, or user workflows.

Recommended contents:

- Purpose and user value
- Current state
- Target capability
- User journeys or operating workflows
- Feature roadmap increments
- Related project milestones when known
- Success criteria
- Key decisions and links to proposals
- Architecture links
- Open questions

## Feature Roadmap Increments

A feature roadmap increment is a capability-oriented step in the evolution of a
feature. It helps the team explain how the feature becomes more useful over time, but it
is not the authoritative project timeline container.

Feature roadmap increments should name:

- intended outcome
- candidate or known deliverables
- excluded work
- feature-level success criteria
- dependencies and sequencing constraints

Use roadmap increments when feature narrative needs sequencing. Use project milestones
when the team is communicating dates, timeline windows, stakeholder commitments, or
cross-feature delivery groupings.

## Project Milestones

A project milestone is a project-scoped planning container used to communicate when a
set of outcomes is expected to land. Milestones are useful because stakeholders often
care less about the internal feature boundary and more about when a coherent set of work
will be done.

Project milestones should name or expose:

- planned start and end dates, target date, or release window
- included deliverables, which may come from multiple features
- stakeholder-facing outcome
- excluded work or deferred scope
- release, acceptance, or readiness criteria
- dependencies and sequencing constraints

When a repo uses Zazz Board or another tracker as the project planning surface, that
system may be the canonical source for project milestone records, dates, deliverable
assignment, and timeline state. Feature requirements documents can link to project
milestones, but they should not duplicate or redefine the project milestone schedule.
Roadmap docs, tracker milestone records, board views, or Gantt charts can all represent
project milestones and their associated deliverables. The core methodology concept is
simpler: projects have milestones, and deliverables are assigned to those milestones for
timeline communication.

## Time-Boxed Deliverables

Deliverables are time-boxed execution units. Each one gets a deliverable specification and should fit inside one worktree unless the team intentionally uses a stacked branch lane.

Good deliverables:

- have a clear user, system, or operational outcome
- can be verified with acceptance criteria
- have a bounded file and behavior scope
- can produce a reviewable PR

If a deliverable cannot be tested or reviewed independently, split it or move the uncertainty back to a proposal, feature doc, or architecture doc.

## Storage

Feature requirements, project plans, roadmap, and project milestone history live in the
repo's declared durable storage surface. In committed Markdown mode, feature
requirements usually live under `<DOCS_ROOT>/features/`, while roadmap or plan
documents may live under `<DOCS_ROOT>/roadmap/` when the team keeps them separately from
feature docs. In wiki, knowledge-base, tracker, or Zazz Board mode, `AGENTS.md` should
identify the feature, roadmap, and project milestone sources of truth.

Active deliverable specifications remain under `<DOCS_ROOT>/specifications/` while
RUN_LOG files, QA notes, handoffs, and scratch project milestone analysis belong under
`<DOCS_ROOT>/ephemeral/` or the declared tracker/service while the work is underway. When
implementation changes shipped behavior, promote the durable feature, roadmap, or
project milestone update into the declared durable docs surface.

## Relevant Skills

| Skill | How it helps efficiency |
| ----- | ----------------------- |
| `feature-doc-builder` | Builds and maintains feature requirements, feature roadmap increments, open questions, and durable capability history. |
| `proposal-builder` | Resolves product or technical uncertainty before a feature roadmap hardens around the wrong assumption. |
| `architecture-doc-builder` | Adds design depth for features that span multiple deliverables, services, workflows, or data boundaries. |
| `spec-builder` | Slices approved deliverables from feature roadmap or project milestone context into executable specifications with acceptance criteria and test intent. |
| `gh-wiki` | Updates feature, roadmap, and project milestone pages when the repo uses GitHub Wiki as the durable docs surface. |
| `confluence` | Drafts or updates feature, roadmap, and project milestone pages for Confluence-backed repos. |
| `zazz-board` | Synchronizes project milestones, feature-linked deliverables, deliverable assignment, and execution state when the repo uses Zazz Board. |

## Related Sections

- [Document Storage](./document-storage.md)
- [Specifications](./specifications.md)
- [Code Generation](./code-generation.md)
- [Testing and Validation](./testing-and-validation.md)
