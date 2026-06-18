# Code Generation

Code generation is the implementation phase after a deliverable specification is approved. The agent or contributor works from the specification, relevant standards, and repo instructions.

## Required Inputs

- Approved deliverable specification
- Repo instructions from `AGENTS.md`
- Relevant standards from `<DOCS_ROOT>/standards/index.yaml`
- Feature and architecture context linked by the specification
- Run log or execution-record location
- Deterministic quality gates that apply to the changed files

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

Prefer deterministic feedback before probabilistic review: run formatters, linters, type checks, schema checks,
accessibility checks, doc checks, and targeted tests as soon as they are useful. Do not weaken tool configuration,
silence rules, or skip failing gates just to converge.

## Halt Conditions

Stop and ask for owner direction when:

- an open question blocks implementation
- the implementation requires scope outside the specification
- a required standard conflicts with the specification
- a deterministic quality gate conflicts with the specification or existing product behavior
- a test fails repeatedly for a non-obvious reason
- reference data or environment access is missing
- the implementation reveals a product or architecture decision that was not approved

## Relevant Skills

| Skill | How it helps efficiency |
| ----- | ----------------------- |
| `worktree` | Creates or repairs isolated worktree lanes so implementation stays separate, recoverable, and easy to review. |
| `spec-builder` | Supplies the approved execution contract, sequencing guidance, standards list, and halt conditions. |
| `conformance` | Applies one focused standards-alignment fix against a named standard and bounded code area when implementation exposes drift. |
| `psql` | Speeds safe PostgreSQL schema inspection, read-only checks, query profiling, and function/procedure diagnostics. |
| `sqlcmd` | Speeds safe SQL Server schema inspection, stored procedure checks, timing probes, and read-only diagnostics. |
| `zazz-board-api` | Updates task state, locks, notes, and execution metadata when the repo uses Zazz Board. |

## Related Sections

- [Specifications](./specifications.md)
- [Deterministic Quality Gates](./deterministic-quality.md)
- [Testing and Validation](./testing-and-validation.md)
- [PR Creation](./pr-creation.md)
