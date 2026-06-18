# Methodology Sections

This directory contains the focused sections behind the [Zazz methodology overview](../../zazz-methodology.md).

Read in workflow order:

1. [Project Document](./project.md)
2. [Architecture](./architecture.md)
3. [Proposals](./proposals.md)
4. [Features and Milestones](./features-and-milestones.md)
5. [Specifications](./specifications.md)
6. [Deterministic Quality Gates and Conformance](./deterministic-quality.md)
7. [Code Generation](./code-generation.md)
8. [Testing and Validation](./testing-and-validation.md)
9. [PR Creation](./pr-creation.md)
10. [Self-Review](./self-review.md)
11. [Human Review and Merge](../human-in-loop-pr-review-strategy.md)

Use only the sections relevant to the current work. Small fixes may start at specifications; larger capabilities usually start with project, architecture, proposal, or feature context.

Each section includes a `Relevant Skills` table that explains which skills apply and how they improve process efficiency.

## Skill Map

| Stage | Primary skills |
| ----- | -------------- |
| Project orientation | `feature-doc-builder`, `architecture-doc-builder`, `proposal-builder` |
| Architecture direction | `architecture-doc-builder`, `proposal-builder`, `spec-builder` |
| Proposals and decisions | `proposal-builder`, `feature-doc-builder`, `architecture-doc-builder` |
| Features and milestones | `feature-doc-builder`, `architecture-doc-builder`, `spec-builder` |
| Deliverable specifications | `spec-builder`, `zazz-board-api`, `jira-api` |
| Deterministic quality gates and standards conformance | `standard-builder`, `conformance`, `doc-check`, `qa-testing` |
| Code generation | `worktree`, `conformance`, `psql`, `sqlcmd`, `zazz-board-api` |
| Testing and validation | `qa-testing`, `pr-review`, `conformance`, `psql`, `sqlcmd` |
| PR creation | `pr-builder`, `gh-stack`, `qa-testing` |
| Automated self-review | `pr-review`, `qa-testing`, `pr-builder`, `conformance` |
| Human review and merge | `pr-review`, `gh-stack`, `doc-check` |
