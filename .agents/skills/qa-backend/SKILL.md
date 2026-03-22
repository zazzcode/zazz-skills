---
name: qa-backend
description: Backend specialization of the base qa skill. Use when a deliverable has API, service, schema, data-integrity, auth/authz, or backend performance/security scope. Adds API contract validation, auth/authz checks, and backend code quality analysis.
---

# Backend QA Skill

## Repo Extension

Before you start, check whether this repo provides extra local guidance at `.agents/skill-extensions/qa-backend/EXTENSION.md`.
If that file exists, read it after this skill and treat it as friendly repo-specific extension guidance for how `qa-backend` should be applied in this application.

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
