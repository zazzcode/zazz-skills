# PR Creation

Pull requests package the completed deliverable for automated review, human review, and merge. Zazz uses draft-first PRs by default so implementation, evidence, and self-review can converge before the team asks for human approval.

## Draft-First Flow

1. Open a draft PR when the implementation has a coherent review shape.
2. Keep the PR scoped to one logical deliverable or one branch in a stack.
3. Fill the PR body with specification links, summary, test evidence, and known risks.
4. Run validation and self-review while the PR is still draft.
5. Mark ready only after required evidence, automated review, and rework loops are complete.

When draft PR feedback changes the implementation contract, follow [Spec-Driven
Development](./spec-driven-development.md): update affected specification sections in
place, append an Implementation And Review Change Log entry, update the execution
record, and re-verify affected acceptance criteria.

## PR Contents

A good PR body includes:

- specification or issue link
- summary of behavior changed
- scoped file or subsystem notes
- tests and validation evidence
- screenshots or API examples when useful
- migration/deployment notes when relevant
- known risks or checks not run
- owner manual verification instructions when human signoff is needed

Use `pr-builder` when the repo has enough evidence for an agent to assemble or refresh the PR body.

## Stacked PRs

Use a stacked branch lane when a deliverable is easier to review as ordered layers. Each branch should be reviewable independently and depend only on the branches below it.

Use `gh-stack` when the repo uses GitHub and dependent PRs.

## Relevant Skills

| Skill | How it helps efficiency |
| ----- | ----------------------- |
| `pr-builder` | Assembles draft PR titles and bodies from the diff, specification links, validation evidence, risks, and reviewer instructions. |
| `spec-driven` | Keeps draft PR feedback aligned with the current spec contract and change-log protocol. |
| `gh-stack` | Manages dependent branches and PRs when a deliverable is easier to review as an ordered stack. |
| `qa-testing` | Supplies concise verification evidence and unresolved findings for the PR body. |
| `jira` | Provides a future Jira-backed path for issue references; today it documents how to use repo-provided or user-provided Jira context. |
| `zazz-board` | Supplies board-backed deliverable and task context when the repo uses Zazz Board. |

## Related Sections

- [Code Generation](./code-generation.md)
- [Spec-Driven Development](./spec-driven-development.md)
- [Testing and Validation](./testing-and-validation.md)
- [Self-Review](./self-review.md)
- [Human Review and Merge](../human-in-loop-pr-review-strategy.md)
