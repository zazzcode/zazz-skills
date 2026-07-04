# Project Document

`project.md` is the top-level durable orientation document for a software project. It explains what the project is for, who it serves, what major capabilities already exist, and what product principles should guide future work.

## Purpose

Use `project.md` to keep project-level context out of transient chats and deliverable specifications. A contributor or agent should be able to read it and understand the product before reading feature, architecture, or implementation docs.

`project.md` is not a backlog, sprint plan, changelog, or implementation log. Keep it stable and concise.

## Recommended Contents

- Product purpose and value proposition
- Primary users and important user goals
- Major established capabilities
- Project milestone and roadmap links when stakeholder timeline context lives outside `project.md`
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

## Storage

The project overview lives in the repo's declared durable storage surface. In a
repo-committed Markdown mode this is usually `<DOCS_ROOT>/project.md`. In a wiki or
knowledge-base mode, `AGENTS.md` should point agents at the project overview page and
the durable docs index.

Do not store the project overview under `<DOCS_ROOT>/ephemeral/`; that directory is for
active implementation scratch and execution records.

## Relevant Skills

| Skill | How it helps efficiency |
| ----- | ----------------------- |
| `feature-doc-builder` | Turns durable project context into focused feature requirements without rebuilding product background in every conversation. |
| `architecture-doc-builder` | Connects project-level capability direction to system design, reducing repeated discovery before each deliverable. |
| `proposal-builder` | Captures uncertain direction as a decision artifact before it leaks into implementation churn. |
| `gh-wiki` | Updates the project overview when the repo uses GitHub Wiki as the durable docs surface. |
| `confluence` | Drafts or updates project overview content for Confluence-backed repos. |
| `conformance` | Applies small standards-alignment updates when `project.md` drifts from the repo's documented conventions. |
| `doc-check` | Verifies documentation hygiene before changes are committed. |

## Related Sections

- [Architecture](./architecture.md)
- [Document Storage](./document-storage.md)
- [Features and Project Milestones](./features-and-milestones.md)
- [Specifications](./specifications.md)
