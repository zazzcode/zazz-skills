# Backend QA Skill — User Guide

How to use the Backend QA specialization for deliverables with significant backend scope.

## What It Does

`qa-backend` extends the base `qa` skill with backend-focused verification.

It adds emphasis on:
- API contract validation
- auth and authorization behavior
- schema and data integrity
- backend performance and operational quality
- backend standards and architecture patterns

## When to Use It

Use this skill when the deliverable includes:
- API routes
- service logic
- schema or persistence changes
- auth or authz behavior
- backend performance or security concerns

## How to Use It

Use it together with the base `qa` skill.

Example:

```text
Use qa and qa-backend.
This deliverable changes API routes, auth checks, and persistence behavior.
Please run a backend-focused QA pass and create rework content for anything that fails.
```

## Output

In addition to the base QA output, this skill should add:
- API verification notes
- auth/authz findings
- backend data-integrity findings
- backend-specific PR evidence

## Notes

- This is a specialization, not a replacement for `qa`.
- It works best when the SPEC clearly describes backend behavior and expected test coverage.
