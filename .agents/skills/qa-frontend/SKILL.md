---
name: qa-frontend
description: Run frontend-focused QA on top of the base qa skill for deliverables involving UI flows, client state, browser interactions, accessibility, or frontend integrations; adds user-journey validation, accessibility checks, viewport coverage, and frontend code-quality analysis.
---

# Frontend QA Skill

## Required Repo Extension Check

Before doing anything else, check for `.agents/skill-extensions/qa-frontend/EXTENSION.md`.
If it exists, read it immediately after this `SKILL.md` and apply it as repo-specific guidance that augments this skill.

## Startup Sequence

Before performing frontend QA:
1. Check for the repo extension file above and read it if present.
2. Read `.agents/skills/qa/SKILL.md` and treat it as the governing base contract.
3. Use `AGENTS.md` as the source of truth for repo-specific settings such as docs root, tracking system, project-code conventions, and QA workflow rules. Read it if that context is not already available, then load the standards index and the frontend-relevant standards for this deliverable.
4. Read the SPEC, PLAN, task context, and changed UI surfaces before judging behavior.
5. Then execute the frontend-specific QA pass without weakening the base QA loop.

## Overview
Frontend specialization of the base `qa` skill. Use this when a deliverable has meaningful UI/UX, client-state, browser-interaction, accessibility, or frontend integration scope.

## Required Base Behavior
You MUST follow `.agents/skills/qa/SKILL.md` as the governing base contract.
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
