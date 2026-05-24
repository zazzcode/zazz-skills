# QA Skill — User Guide

How to use the QA skill to verify a deliverable against its deliverable specification, tests, and standards.

## What It Does

The QA skill is the primary verification skill in the Zazz methodology.

It should:
- validate acceptance criteria
- run and review test evidence
- inspect test quality: structure, scope, assertions, fixtures, realistic edge-case coverage, and low-value test volume
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
Please verify it against the deliverable specification, tests, and standards, and create rework content if anything fails.
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
- test-quality findings when tests are missing, unrealistic, duplicate, brittle, poorly scoped, or low-signal
- rework task content when needed
- PR-ready verification evidence when the deliverable is ready for review

Use [`VERIFICATION-EVIDENCE-TEMPLATE.md`](./VERIFICATION-EVIDENCE-TEMPLATE.md) to
structure QA evidence. Use `pr-builder` when that evidence needs to become a PR title
and body.

## Notes

- Use this after implementation, not before.
- If issues are found, the skill should create actionable rework content, not vague criticism.
- QA should prefer strong, compact evidence over test volume. It should inspect existing/added tests and flag both missing coverage and test clutter.
- Tests are part of the deliverable contract. If QA finds that tests were weakened to fit the implementation, or that the specification's test plan is itself weak, it should route that back as rework or a specification-gap finding for Owner approval.
- Human review and merge authority still stay with the Deliverable Owner or another authorized reviewer.
