# Proposals

Proposals are durable decision artifacts for uncertainty. Use them when the team needs to compare options, document tradeoffs, or align stakeholders before changing product or architecture direction.

## When To Use

Use a proposal for:

- product direction that is not yet agreed
- technical direction with meaningful tradeoffs
- workflow or methodology changes
- expensive or risky implementation approaches
- stakeholder decisions that need a durable record

Skip a proposal when the path is obvious and a feature document or deliverable specification can state the decision directly.

## Recommended Contents

- Problem statement
- Goals and non-goals
- Options considered
- Tradeoff analysis
- Recommendation
- Decision outcome
- Links to follow-up feature, architecture, or specification docs

## Storage

Store proposals in the repo's declared durable storage surface. In committed Markdown
mode, use `<DOCS_ROOT>/proposals/` by default. If the team uses GitHub Wiki,
Confluence, Google Docs, SharePoint, or another document surface for stakeholder
review, keep a stable pointer in `AGENTS.md`, an index page, or a repo-tracked pointer
with title, owner, status, and link.

Do not store accepted proposal outcomes only under `<DOCS_ROOT>/ephemeral/`; that
directory is for active scratch and execution records.

## Workflow

1. Draft the proposal with the relevant stakeholders.
2. Iterate until the recommendation is decision-ready.
3. Record the decision outcome.
4. Promote the durable result into `project.md`, architecture, feature docs, standards, or specifications as appropriate.

## Relevant Skills

| Skill | How it helps efficiency |
| ----- | ----------------------- |
| `proposal-builder` | Guides option comparison, tradeoff analysis, recommendation drafting, and decision capture without premature implementation. |
| `architecture-doc-builder` | Turns accepted technical proposals into durable architecture guidance. |
| `feature-doc-builder` | Turns accepted product proposals into durable feature requirements and roadmap-increment direction. |
| `spec-builder` | Converts an approved proposal outcome into the first bounded deliverable when the direction is ready to execute. |
| `gh-wiki` | Updates proposal pages or accepted-decision summaries when GitHub Wiki is the durable docs surface. |
| `confluence` | Drafts or updates proposal pages for Confluence-backed repos. |
| `doc-check` | Catches documentation hygiene issues before proposal artifacts are reviewed or committed. |

## Related Sections

- [Features and Project Milestones](./features-and-milestones.md)
- [Architecture](./architecture.md)
- [Document Storage](./document-storage.md)
