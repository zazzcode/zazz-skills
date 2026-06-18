# Self-Review

Self-review is an author-side automated review pass on a draft PR or local diff before human review.

## Purpose

Self-review catches issues while the author or agent still owns the draft. It reduces review noise and helps ensure the PR has clear evidence, correct scope, and standards alignment before human reviewers spend time on it.

Self-review does not approve, merge, or replace human review.

## When To Run

Run self-review:

- after implementation and QA evidence are in place
- before marking a PR ready for human review
- after large rework that changes the review surface
- before asking a human to spend review time on a complex diff

## Review Axes

Use `pr-review` when available. It separates two concerns:

- Standards axis: repo conventions, test quality, maintainability, security, redundancy, and code structure.
- Spec axis: acceptance criteria, scope, intended behavior, and whether the implementation matches the governing contract.

Keeping the axes separate prevents a clean implementation of the wrong thing from looking like a pass, and prevents correct behavior from hiding standards problems.

## Graph-Assisted Review

For large or high-risk diffs, `pr-review` may use `code-review-graph` as a context accelerator before the Standards and Spec axes inspect source. The graph helps identify changed symbols, likely blast radius, read-first files, and reviewability signals.

Treat graph output as advisory. Stock risk scores, test-gap counts, affected-flow counts, and token-savings percentages are signals to investigate, not approval criteria. See [Code Review Graph in Zazz](../code-review-graph.md) for the methodology guidance and the planned Zazz-specific fork direction.

## Output

Self-review should produce:

- findings ordered by severity
- file and line references where possible
- test or evidence gaps
- scope or specification drift
- residual risks
- a short readiness recommendation

## Relevant Skills

| Skill | How it helps efficiency |
| ----- | ----------------------- |
| `pr-review` | Separates standards review from specification review so the draft can catch both wrong-implementation and wrong-scope problems early. |
| `qa-testing` | Provides validation evidence and rework history that helps self-review focus on residual risk instead of rediscovering basic behavior. |
| `pr-builder` | Refreshes the draft PR body after self-review fixes or new evidence change the reviewer-facing story. |
| `conformance` | Turns one standards finding into a bounded conformance fix without widening self-review into a broad refactor. |
| `doc-check` | Verifies documentation updates that are part of the review package. |

## Related Sections

- [PR Creation](./pr-creation.md)
- [Testing and Validation](./testing-and-validation.md)
- [Human Review and Merge](../human-in-loop-pr-review-strategy.md)
