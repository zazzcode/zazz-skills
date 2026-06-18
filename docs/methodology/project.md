# Project Document

`project.md` is the top-level durable orientation document for a software project. It explains what the project is for, who it serves, what major capabilities already exist, and what product principles should guide future work.

## Purpose

Use `project.md` to keep project-level context out of transient chats and deliverable specifications. A contributor or agent should be able to read it and understand the product before reading feature, architecture, or implementation docs.

`project.md` is not a backlog, sprint plan, changelog, or implementation log. Keep it stable and concise.

## Recommended Contents

- Product purpose and value proposition
- Primary users and important user goals
- Major established capabilities
- Current operating assumptions and constraints
- Links to active feature requirements documents
- Links to project-level architecture documents
- Glossary for domain language that appears across features
- Known boundaries: what the project intentionally does not do

## Maintenance Rules

- Update `project.md` when a deliverable changes the durable understanding of the product.
- Link to detailed feature or architecture docs instead of inlining them.
- Prefer repo-relative links.
- Keep examples generic enough that a future contributor can understand them without reading old PR discussions.

## Relevant Skills

| Skill | How it helps efficiency |
| ----- | ----------------------- |
| `feature-doc-builder` | Turns durable project context into focused feature requirements without rebuilding product background in every conversation. |
| `architecture-doc-builder` | Connects project-level capability direction to system design, reducing repeated discovery before each deliverable. |
| `proposal-builder` | Captures uncertain direction as a decision artifact before it leaks into implementation churn. |
| `conformance` | Applies small standards-alignment updates when `project.md` drifts from the repo's documented conventions. |
| `doc-check` | Verifies documentation hygiene before changes are committed. |

## Related Sections

- [Architecture](./architecture.md)
- [Features and Milestones](./features-and-milestones.md)
- [Specifications](./specifications.md)
