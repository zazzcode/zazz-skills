# Project Governance - Proposal (`-PROP`)
Status: Draft
Owner: Project governance discussion
Scope: Framework and process model

## Problem Statement
The framework now clearly separates feature requirements (`-FRD`) from deliverable execution (`-SPEC`), but project-level governance still needs clearer rules for:
- defining features in a consistent way (as user journeys + requirements),
- managing proposals as idea-iteration artifacts,
- linking features, proposals, deliverables, and milestones in a way that scales across repositories.

## Proposal Summary
Treat the **Project** as the highest-level governance object.

Within a project:
- **Features** capture long-lived user journeys and requirements.
- **Proposals** capture exploratory ideation and debate (feature-scoped, deliverable-scoped, or both).
- **Deliverables** are implementation increments with explicit acceptance and test-driven validation.
- **Milestones** gate feature capability progression by date using collections of deliverables.

User-journey-first principle:
- Feature definition starts with user journeys, and those journeys define feature boundaries.
- Journeys may represent human users, agents, and other software systems/integrations.
- Feature requirements should be organized around these journeys before implementation increments are defined.

## Goals
- Preserve project-level clarity when work spans multiple repositories.
- Keep feature discussion separate from deliverable execution discussion.
- Support proposal flexibility without making proposals authoritative contracts.
- Allow many-to-many feature↔deliverable relationships.

## Non-Goals
- Defining API schema changes for board services.
- Locking the project to one proposal workflow forever.
- Replacing deliverables as the core execution unit.

## Proposed Governance Model
### 1) Project as top-level context
- A project may contain many features, proposals, deliverables, and milestones.
- A project may span multiple repositories.

### 2) Feature model
- Feature = user journey + requirement context (what/why, not implementation how).
- One long-lived FRD per feature.
- Features evolve over time through many deliverables.
- User journeys are the primary signal for splitting/merging feature boundaries.

### 3) Proposal model
- Proposal = optional ideation mechanism, not an authoritative contract.
- Proposal scope can be:
  - feature-scoped,
  - deliverable-scoped,
  - joint (feature + deliverable).
- Proposal content may include both user-journey debate and technical implementation tradeoffs.

### 4) Deliverable model
- Deliverable = implementation increment with concrete acceptance criteria and a Deliverable SPEC.
- Deliverables can be:
  - Feature Increment
  - Shared Support Increment
  - Chore/Maintenance Increment
  - Refactor Increment
  - Bug/Defect Fix Increment

### 5) Milestone model
- Milestones are date-gated capability progression targets.
- Milestones group deliverables; they do not require full feature completion.

## Relationship Rules
- Feature↔Deliverable is many-to-many at the requirements layer.
- Requirement-changing deliverables should link to one or more features.
- Shared support work may satisfy multiple features.
- Chores may be feature-agnostic.
- Refactors are feature-linked only when they affect user-journey requirements.

## Directory Strategy (Project Docs Root)
Keep feature and deliverable discussions physically separated:
- `features/` for feature FRDs and feature-scoped proposals
- `deliverables/` for deliverable SPEC/PLAN/PROP artifacts
- `standards/` for reusable implementation standards
- optional `milestones/` for milestone artifacts

Suggested examples:
- `features/project-governance/project-governance-FRD.md`
- `features/project-governance/project-governance-PROP.md`
- `deliverables/DLV-142/DLV-142-SPEC.md`
- `deliverables/DLV-142/DLV-142-PROP.md` (optional)

## Acceptance Criteria
- Project-level language explicitly treats project as top-level governance context.
- Feature discussion and deliverable discussion are clearly separated in both model and directory strategy.
- Proposal semantics are explicit: optional, exploratory, and attachable to feature/deliverable/both.
- Deliverable increment subtypes are explicitly documented.
- User journeys (human, agent, system) are explicitly documented as the core driver of feature definition.

## Open Questions
- Should project-level (cross-feature) proposals live in a dedicated `proposals/` directory, or always attach to `features/` / `deliverables/`?
- Should there be a project-level index file for feature/proposal/deliverable linking across repositories?
