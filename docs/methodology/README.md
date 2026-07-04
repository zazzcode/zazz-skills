# Methodology Sections

This directory contains the focused sections behind the [Zazz methodology overview](../../zazz-methodology.md).

Read in workflow order:

1. [Project Document](./project.md)
2. [Document Storage](./document-storage.md)
3. [Architecture](./architecture.md)
4. [Proposals](./proposals.md)
5. [Features and Project Milestones](./features-and-milestones.md)
6. [Specifications](./specifications.md)
7. [Spec-Driven Development](./spec-driven-development.md)
8. [Deterministic Quality Gates and Conformance](./deterministic-quality.md)
9. [Code Generation](./code-generation.md)
10. [Testing and Validation](./testing-and-validation.md)
11. [PR Creation](./pr-creation.md)
12. [Self-Review](./self-review.md)
13. [Human Review and Merge](../human-in-loop-pr-review-strategy.md)

Use only the sections relevant to the current work. Small fixes may start at specifications; larger capabilities usually start with project, architecture, proposal, or feature context.

Each section should be useful for its stage without requiring every other section. Follow
links when the workflow moves to a new stage, not as a requirement to preload the full
methodology.

Each section includes a `Relevant Skills` table that explains which skills apply and how they improve process efficiency.

## Skill Map

| Stage | Primary skills |
| ----- | -------------- |
| Project orientation | `feature-doc-builder`, `architecture-doc-builder`, `proposal-builder` |
| Document storage | `gh-wiki`, `confluence`, `doc-check`, `zazz-board`, `jira` |
| Architecture direction | `architecture-doc-builder`, `proposal-builder`, `spec-builder` |
| Proposals and decisions | `proposal-builder`, `feature-doc-builder`, `architecture-doc-builder` |
| Features and project milestones | `feature-doc-builder`, `architecture-doc-builder`, `spec-builder` |
| Deliverable specifications | `spec-builder`, `zazz-board`, `jira` |
| Spec-driven development | `spec-driven`, `qa-testing`, `pr-builder`, `pr-review`, `zazz-board`, `jira` |
| Deterministic quality gates and standards conformance | `standard-builder`, `conformance`, `doc-check`, `qa-testing` |
| Code generation | `worktree`, `conformance`, `psql`, `sqlcmd`, `zazz-board` |
| Testing and validation | `qa-testing`, `pr-review`, `conformance`, `psql`, `sqlcmd` |
| PR creation | `pr-builder`, `gh-stack`, `qa-testing` |
| Automated self-review | `pr-review`, `qa-testing`, `pr-builder`, `conformance` |
| Human review and merge | `pr-review`, `gh-stack`, `doc-check` |
