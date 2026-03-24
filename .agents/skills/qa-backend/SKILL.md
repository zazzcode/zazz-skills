---
name: qa-backend
description: Run backend-focused QA on top of the base qa skill for deliverables involving APIs, services, schema, persistence, auth/authz, or backend performance and security; adds API contract validation, data-integrity checks, and backend code-quality analysis.
---

# Backend QA Skill

## Required Repo Extension Check

Before doing anything else, check for `.agents/skill-extensions/qa-backend/EXTENSION.md`.
If it exists, read it immediately after this `SKILL.md` and apply it as repo-specific guidance that augments this skill.

## Startup Sequence

Before performing backend QA:
1. Check for the repo extension file above and read it if present.
2. Read `.agents/skills/qa/SKILL.md` and treat it as the governing base contract.
3. Use `AGENTS.md` as the source of truth for repo-specific settings such as docs root, tracking system, project-code conventions, and QA workflow rules. Read it if that context is not already available, then load the standards index and the backend-relevant standards for this deliverable.
4. Read the SPEC, PLAN, task context, and changed backend surfaces before judging behavior.
5. Then execute the backend-specific QA pass without weakening the base QA loop.

## Overview
Backend specialization of the base `qa` skill. Use this when a deliverable has API, service, schema, data-integrity, auth/authz, or backend performance/security scope.

## Required Base Behavior
You MUST follow `.agents/skills/qa/SKILL.md` as the governing base contract.
This specialization adds backend checks; it does not replace the base QA loop.

## Specialization Focus Areas

### 1) API Contract Validation
- Validate routes against SPEC-defined behavior and status semantics.
- Validate happy-path, edge-case, and negative-path behavior.
- Validate request validation and error response structure.

### 2) Auth/Authz + Security Controls
- Validate authentication and authorization behavior for relevant routes.
- Validate tenant/project boundary controls where applicable.
- Validate input-handling and obvious security-risk paths.

### 3) Data Integrity + Persistence
- Validate schema and data mutations match SPEC intent.
- Validate transactional integrity/idempotency where applicable.
- Validate migration/seed/runtime data assumptions impacted by the change.

### 4) Backend Performance/Operational Quality
- Validate performance thresholds defined by SPEC.
- Validate error handling and observability behaviors expected by standards.
- Validate no regressions in critical service flows.

### 5) Backend Code Quality/Standards
- Validate conformance with backend standards and architecture patterns.
- Validate service boundaries, layering, and data-access patterns.
- Flag anti-patterns with concrete remediation in rework tasks.

## Rework Task Requirements (Backend)
When deficiencies are found, rework tasks must include:
- failing/insufficient backend test evidence
- impacted AC/API contract mapping
- reproduction steps (including payload examples when relevant)
- expected vs actual backend behavior
- affected files/services/routes/schema objects

## PR Evidence Additions (Backend)
In addition to base QA PR requirements, include:
- API contract verification summary
- auth/authz verification summary
- data-integrity verification notes
- owner manual backend validation steps (API-level smoke checks and expected outcomes)
