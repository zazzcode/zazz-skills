# QA Skill — User Guide

How to use the QA skill to verify a deliverable against its SPEC, PLAN, tests, and standards.

## What It Does

The QA skill is the primary verification skill in the Zazz framework.

It should:
- validate acceptance criteria
- run and review test evidence
- identify code quality or standards gaps
- create rework task content when the work is not ready
- package reviewer-ready evidence once the deliverable converges

This skill is designed to find issues, not to rubber-stamp work.

## When to Use It

Use this skill when:
- implementation is ready for verification
- a worker wave has completed
- you want an explicit pass/fail judgment against the deliverable contract
- you need rework content or final review evidence

## Compatibility

- **Skills-assisted**: verify from repo state, tests, and terminal workflow.
- **Service-assisted**: verify the same work while also integrating with Zazz Board task and rework flow.

## Specializations

This base skill can be extended with:
- `qa-backend` for API, schema, auth, and backend-heavy work
- `qa-frontend` for UI, accessibility, and frontend-heavy work

For mixed deliverables, the agent may use the base QA skill plus one or both specializations.

## Example Prompts

```text
Use qa.
The deliverable implementation is ready.
Please verify it against the SPEC, PLAN, tests, and standards, and create rework content if anything fails.
```

```text
Use qa and qa-backend.
This deliverable adds new API routes and auth checks.
Please run a backend-focused QA pass and package the evidence for review.
```

```text
Use qa and qa-frontend.
This deliverable changes a major UI workflow.
Please verify acceptance criteria, accessibility, and owner sign-off items.
```

## Output

The skill should produce:
- acceptance-criteria verification evidence
- test results and code-quality findings
- rework task content when needed
- PR-ready verification notes when the deliverable is ready for review

## Notes

- Use this after implementation, not before.
- If issues are found, the skill should create actionable rework content, not vague criticism.
- Human review and merge authority still stay with the Deliverable Owner or another authorized reviewer.
