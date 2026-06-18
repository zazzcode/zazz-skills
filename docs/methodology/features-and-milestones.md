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

## Related Sections

- [Specifications](./specifications.md)
- [Code Generation](./code-generation.md)
- [Testing and Validation](./testing-and-validation.md)
