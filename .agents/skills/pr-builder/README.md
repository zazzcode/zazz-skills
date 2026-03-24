# PR Builder Skill — User Guide

How to use the PR Builder skill to prepare a reviewer-ready pull request title and body.

## What It Does

The PR Builder skill packages completed work for human review.

It helps produce:
- a clear PR title
- a concise, accurate PR body
- testing and verification summaries
- manual validation guidance
- risks, rollout notes, and follow-ups when needed

This skill does not approve or merge pull requests.

## When to Use It

Use this skill when:
- implementation and QA are complete or nearly complete
- you want help writing or polishing a PR
- the repo has PR templates or review conventions
- you need a stronger reviewer-facing summary of the work

## What You Should Have Ready

The skill works best with:
- the current diff or branch
- commit history or a change summary
- test results
- manual validation notes
- SPEC and PLAN context when the work follows Zazz

## Example Prompts

```text
Use pr-builder.
Please draft a reviewer-ready PR title and body from the current branch, including testing and manual validation notes.
```

```text
Use pr-builder.
The deliverable is complete and QA passed.
Please prepare the PR description from the current diff, SPEC, PLAN, and test evidence.
```

```text
Use pr-builder.
We have a PR template in this repo.
Please use it and fill it out accurately from the repository state.
```

## Output

The skill should produce:
- a title that states the outcome clearly
- a body that explains what changed, why, how it was verified, and what reviewers should focus on

## Notes

- The skill should not invent tests or verification that did not happen.
- It should match repo templates when they exist.
- Final review, approval, and merge remain human responsibilities.
