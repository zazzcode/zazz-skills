# Specifications

Deliverable specifications are the execution contracts for bounded work. They translate durable project, feature, architecture, and standards context into one implementable slice.

## Purpose

A specification should let a fresh agent or contributor implement the deliverable without reconstructing intent from chat history. It is not the permanent product narrative; durable product knowledge belongs in `project.md`, feature requirements documents, architecture, and standards.

## Required Contents

- Deliverable title and status
- Source context and required reading
- Scope and exclusions
- Acceptance criteria
- Implementation guidance, including important sequencing
- Test plan and required evidence
- Standards that must be loaded
- Halt conditions
- Owner signoff requirements
- Run log or execution-record location

## Acceptance Criteria

Acceptance criteria must be testable from the criterion itself. Each criterion should name the behavior, boundary, expected result, and verification method.

Weak:

```text
The dashboard works correctly.
```

Strong:

```text
When the API returns no records, the dashboard renders the empty state with no table rows and no error banner. Verified by the empty-result component test and one browser check.
```

## Storage

When stored on disk, specifications live under `<DOCS_ROOT>/specifications/`. Repos may also store specifications in an external tracker or service if `AGENTS.md` declares that policy and gives agents a stable lookup path.

## Execution Records

Mutable run logs, QA findings, handoff notes, and recovery notes belong under `<DOCS_ROOT>/execution/` or in the repo-declared external execution system. Do not bury execution state in long-lived feature or architecture documents.

## Relevant Skills

| Skill | How it helps efficiency |
| ----- | ----------------------- |
| `spec-builder` | Produces bounded execution contracts with scope, acceptance criteria, implementation guidance, test plan, standards, and halt conditions. |
| `feature-doc-builder` | Supplies durable feature and milestone context so the specification does not need to restate long-lived product narrative. |
| `architecture-doc-builder` | Supplies design decisions and sequencing constraints that keep implementation aligned with intended system shape. |
| `jira-api` | Provides a future Jira-backed context path for issue scope and acceptance criteria; today it documents fallback behavior for user-provided Jira context. |
| `zazz-board-api` | Creates or synchronizes board-backed deliverables and specification paths when the repo uses Zazz Board. |
| `doc-check` | Verifies specification hygiene and formatting before the contract is treated as ready. |

## Related Sections

- [Code Generation](./code-generation.md)
- [Testing and Validation](./testing-and-validation.md)
- [PR Creation](./pr-creation.md)
