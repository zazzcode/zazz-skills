# QA Frontend Agent Skill

## Purpose
Frontend specialization of the base `qa-agent` skill.
Use this when a deliverable has meaningful UI/UX, client-state, browser-interaction, accessibility, or frontend integration scope.

## Required Base Behavior
You MUST follow `.agents/skills/qa-agent/SKILL.md` as the governing base contract.
This specialization adds frontend checks; it does not replace the base QA loop.

## Specialization Focus Areas

### 1) UI/UX Behavior Validation
- Validate core user journeys against the deliverable SPEC.
- Validate loading, empty, error, and success states.
- Validate interactive behavior (forms, modals, navigation, drag/drop where applicable).
- Validate responsiveness for required breakpoints/viewports.

### 2) Accessibility Baseline
- Validate keyboard-only navigation for affected workflows.
- Validate focus order/visibility for changed UI paths.
- Validate semantic structure/labels for interactive elements.
- Record accessibility risks explicitly when full compliance is out of scope.

### 3) Frontend Data/State Integrity
- Validate client-side state transitions and cache invalidation behavior.
- Validate request/response error handling and user feedback.
- Validate optimistic update/rollback behavior when relevant.

### 4) Cross-Browser/Platform Notes
- Validate required browser targets (per project standards/spec).
- Record what was tested and what was not tested.

### 5) Frontend Code Quality/Standards
- Validate conformance with frontend standards and patterns from project docs.
- Validate component, hook, and routing patterns for consistency.
- Flag anti-patterns with concrete remediation in rework tasks.

## Rework Task Requirements (Frontend)
When deficiencies are found, rework tasks must include:
- failing/insufficient frontend test evidence
- affected user journey/AC mapping
- reproduction steps (with viewport/browser context when relevant)
- expected vs actual UI behavior
- affected files/components

## PR Evidence Additions (Frontend)
In addition to base QA PR requirements, include:
- UI journey verification notes
- accessibility verification notes
- browser/viewport coverage summary
- owner manual UI test steps with clear expected outcomes
