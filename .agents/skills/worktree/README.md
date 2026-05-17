# Worktree Skill — User Guide

How to use the Worktree skill to set up and manage the required Zazz worktree model.

## What It Does

The Worktree skill helps teams work inside the Zazz methodology's required worktree model.

Official Worktrunk docs: [worktrunk.dev/worktrunk](https://worktrunk.dev/worktrunk/)

It helps with:
- setting up the opinionated bare-repo plus sibling-worktree layout
- creating, switching, and removing worktrees safely
- keeping branch names worktree-safe and flat
- repairing stale or broken worktree state
- giving humans concrete Worktrunk commands when they do not want to remember the workflow themselves
- making common human tasks such as PR review feel like a simple request instead of a command-lookup exercise

## Important Distinction

- Worktrees are required by the Zazz methodology.
- Worktrunk is optional at the methodology level.
- This specific skill requires Worktrunk. If you want to use this skill, `worktrunk` must be installed.

If a team wants to follow the methodology without Worktrunk, they can still do so with native `git worktree` commands. They just should not expect this skill to be the right tool for that environment.

## When to Use It

Use this skill when:
- you are adopting the Zazz worktree model in a repo
- you need to create or manage sibling worktrees for deliverables, proposals, or document efforts
- you want help repairing broken worktree state
- you want explicit Worktrunk command guidance that matches the methodology's rules

## What You Should Have Ready

Before using this skill, you should have:
- `git` installed
- `worktrunk` installed
- clarity on the repo's integration branch such as `main` or `dev`
- the repo's `AGENTS.md` when it exists, since it may declare repo-specific worktree rules

These commands are typically run from the repo container that holds `.bare/` plus the sibling worktrees.

## Example Prompts

```text
Use worktree.
Please set up this repo with the Zazz bare-repo plus sibling-worktree layout.
```

```text
Use worktree.
Please create a new deliverable worktree from the integration branch and keep the branch name worktree-safe.
```

```text
Use worktree.
Our worktree state is messy.
Please inspect it, explain what is broken, and repair it safely.
```

```text
Use worktree.
I do not want to remember the Worktrunk commands.
Please tell me exactly what to run to create, switch, and remove worktrees in this repo.
```

```text
Use worktree.
I need to review PR 193.
Please create the review worktree for me and tell me exactly what to run next.
```

## Human Command Examples

From the repo container:

```bash
wt -C .bare list
wt -C .bare switch --create feature-rbac
wt -C .bare switch proposal-role-management-options
wt -C .bare remove feature-rbac
```

From inside a sibling worktree:

```bash
wt -C ../.bare list
wt -C ../.bare switch pr:123
wt -C ../.bare remove feature-rbac
```

For PR review from the repo container:

```bash
wt -C .bare switch pr:193
# run repo-specific validation
wt -C .bare remove <branch-name>
```

## Output

The skill should produce:
- a clean worktree setup or management plan
- Worktrunk commands that match the repo's conventions
- safe branch and worktree naming guidance
- repair guidance when the worktree state is broken

## Notes

- The methodology requires worktrees even when a repo does not use Zazz Board.
- The methodology does not require Worktrunk, but this skill does.
- In the Worktrunk-based workflow used by this skill, ignored local files needed to run the program in the worktree are carried over as part of the worktree setup flow.
- For day-to-day Worktrunk commands, see [docs/wt-cheat-sheet.md](../../../docs/wt-cheat-sheet.md).
- For the full worktree operating model, see [docs/worktree-setup.md](../../../docs/worktree-setup.md).
