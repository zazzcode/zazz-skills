# Code Generation

Code generation is the implementation phase after a deliverable specification is approved. The agent or contributor works from the specification, relevant standards, and repo instructions.

## Required Inputs

- Approved deliverable specification
- Repo instructions from `AGENTS.md`
- Relevant standards from `<DOCS_ROOT>/standards/index.yaml`
- Feature and architecture context linked by the specification
- Run log or execution-record location

## Worktree Discipline

Active implementation happens in an isolated worktree. The normal rule is one active deliverable per worktree. A stacked branch lane is acceptable when the deliverable naturally decomposes into ordered review layers.

Before editing:

1. Confirm the current branch and worktree.
2. Read the specification and required standards.
3. Identify the file scope and halt conditions.
4. Run or inspect the baseline checks that matter for the change.

## Implementation Loop

1. Make the smallest coherent change toward an acceptance criterion.
2. Add or update tests that prove the behavior.
3. Run the narrowest meaningful checks.
4. Record progress, failures, and decisions in the run log.
5. Repeat until the specification is satisfied or a halt condition is reached.

## Halt Conditions

Stop and ask for owner direction when:

- an open question blocks implementation
- the implementation requires scope outside the specification
- a required standard conflicts with the specification
- a test fails repeatedly for a non-obvious reason
- reference data or environment access is missing
- the implementation reveals a product or architecture decision that was not approved

## Related Sections

- [Specifications](./specifications.md)
- [Testing and Validation](./testing-and-validation.md)
- [PR Creation](./pr-creation.md)
