# PR Builder Skill — User Guide

How to use the PR Builder skill to prepare a reviewer-ready pull request title and body.

## What It Does

The PR Builder skill packages completed work for human review.
It can be used directly by a human or by an agent running the `qa` skill to prepare reviewer-facing PR content after verification.

It helps produce:
- a clear PR title
- a concise, accurate PR body
- a governing context block with the right deliverable, ticket, or spec links near the top
- testing and verification summaries
- reviewer notes with a checklist tied to acceptance criteria from the SPEC or PLAN when available
- a clear split between automated coverage and manual confirmation still expected
- some level of user acceptance testing when the change warrants human confirmation
- additional verification guidance only when domain-specific checks materially help review
- clear draft/ready-for-review signaling when relevant
- risks or rollout notes only when they matter to review of the current PR

This skill does not approve or merge pull requests.

## When to Use It

Use this skill when:
- implementation and QA are complete or nearly complete
- you want help writing or polishing a PR
- an agent running the `qa` skill needs to prepare the PR package from completed verification evidence
- the repo has PR templates or review conventions
- you need a stronger reviewer-facing summary of the work
- you want the PR to emphasize functional change rather than a file-by-file inventory

## What You Should Have Ready

The skill works best with:
- the current diff or branch
- commit history or a change summary
- the primary work item link or ticket ID
- the governing SPEC and PLAN, especially the acceptance criteria and verification expectations
- test results
- manual validation notes
- any domain-specific verification notes that matter for this PR

## Example Prompts

```text
Use pr-builder.
Please draft a reviewer-ready PR title and body from the current branch, including testing and manual validation notes.
```

```text
Use pr-builder.
The deliverable is complete and an agent running the qa skill finished verification.
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
- a body that starts with the governing context the reviewer needs
- a concise explanation of why the PR exists
- a functional overview of what changed without overwhelming file-level detail
- a clear draft indicator when the PR is not ready for full review
- a reviewer-notes checklist that a human can quickly work through in the PR
- reviewer instructions for validating acceptance criteria, grounded in the SPEC or PLAN when available
- explicit automated test confirmation so reviewers know what was already proven and whether the relevant suites passed
- manual testing and UAT guidance for what still needs human confirmation
- additional domain-specific verification steps only when they materially help the reviewer validate the change
- a short reminder that reviewers should confirm scope and do a cursory code-quality inspection

## Governing Context

The skill should inspect repo guidance before drafting:
- `.agents/skill-extensions/pr-builder/EXTENSION.md`
- `AGENTS.md`
- repo PR templates
- deliverable paths, branch names, and ticket references

Use `AGENTS.md` as the source of truth for repo-specific settings such as tracking system, project-code conventions, and review workflow rules. Read it when that context is not already available.

This is how the skill determines whether the repo is primarily using Zazz, Jira, Avaza, or another tracking system.

When the governing system is clear:
- put the primary deliverable or ticket link first near the top of the PR
- include SPEC and PLAN links when they are part of the review contract
- include extra links only when they materially help the reviewer
- ask the user for the authoritative PR-specific ID or URL if it is not already available

When it is not clear:
- ask the user which system should anchor the PR instead of guessing

The skill may use repo structure to recognize the project's system, but it should not guess authoritative Jira issue keys, Zazz deliverable IDs, or Avaza task URLs from weak signals like branch names.

## Default Template

If the repo does not provide a stronger PR template, use [`PR-TEMPLATE.md`](./PR-TEMPLATE.md).

Before falling back to the skill template, the skill should check for repo-native templates such as:
- `.github/pull_request_template.md`
- `.github/PULL_REQUEST_TEMPLATE.md`
- templates under `.github/pull_request_template/` or `.github/PULL_REQUEST_TEMPLATE/`

If a repo template exists:
- use it as the primary structure
- preserve its headings and required prompts
- weave the PR Builder recommendations into that structure instead of replacing it
- add only small missing reviewer-facing context when needed

If no repo template exists:
- use [`PR-TEMPLATE.md`](./PR-TEMPLATE.md) as the default structure

Teams that do not already have a PR template can also copy this file into the repo as:
- `.github/pull_request_template.md`

That makes the same baseline PR structure available to both:
- humans opening PRs directly in GitHub
- agents or tools that inspect repo-native PR templates before drafting

That template is intentionally focused on:
- why the PR exists
- what changed functionally
- whether the PR is draft or ready for review
- how a reviewer should validate the acceptance criteria from the SPEC or PLAN when available
- what automated tests were run, whether they passed, and what still needs manual confirmation
- some level of user acceptance testing when the change warrants it
- any additional team- or domain-specific verification that materially helps review
- what scope and code-quality checks the reviewer should perform

It intentionally avoids a generic file-by-file changed list unless a specific area deserves attention.
It also avoids turning the PR into a backlog for future work outside the scope of the current change.
It is also intentionally generic so repo templates and `.agents/skill-extensions/pr-builder/EXTENSION.md` can layer on stricter team-specific process.
It should omit optional sections entirely when those topics are not relevant to the PR.

## Notes

- The skill should not invent tests or verification that did not happen.
- It should use the SPEC or PLAN as the acceptance-check source when those documents exist.
- It should avoid asking reviewers to manually repeat checks already well-covered by automated tests.
- It should keep the fallback template generic and rely on repo conventions or extensions for stricter process requirements.
- It should match repo templates when they exist.
- Final review, approval, and merge remain human responsibilities.
