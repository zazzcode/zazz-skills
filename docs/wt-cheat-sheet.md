# Worktrunk Cheat Sheet

Fast reference for daily Worktrunk development.

[Worktrunk docs](https://worktrunk.dev/worktrunk/)

## Quick Start: Review a PR

From the repo container:

```bash
wt -C .bare switch pr:123
# run repo-specific validation
wt -C .bare remove <branch-name>
```

## Quick Start: Create a Feature or Deliverable

From the repo container:

```bash
wt -C .bare switch --create <branch-name>
# do your work
git add .
git commit -m "message"
git push origin <branch-name>
wt -C .bare remove <branch-name>
```

## Why `.bare` is Central

The `.bare` directory contains the actual Git repository and manages all worktrees. Individual worktree directories are working copies linked to `.bare`.

## Where You Are and the Right Command

From the repo container:

```bash
wt -C .bare <command>
```

From inside a worktree:

```bash
wt -C ../.bare <command>
```

Or from inside `.bare`:

```bash
wt <command>
```

## Essential Commands

| Task | Command |
| ---- | ------- |
| List worktrees | `wt -C .bare list` |
| Checkout PR | `wt -C .bare switch pr:123` |
| Create branch/worktree | `wt -C .bare switch --create <branch-name>` |
| Create from base | `wt -C .bare switch --create <branch-name> --base <target>` |
| Switch worktree | `wt -C .bare switch <branch-name>` |
| Switch to integration/default | `wt -C .bare switch ^` |
| Switch to previous | `wt -C .bare switch -` |
| Remove worktree | `wt -C .bare remove <branch-name>` |
| Force remove | `wt -C .bare remove <branch-name> -D` |
| Commit changes | `wt -C .bare step commit` |
| Push to remote | `wt -C .bare step push origin/<branch-name>` |
| Rebase onto target | `wt -C .bare step rebase <target-branch>` |

## Example Workflows

### Review a PR

```bash
wt -C .bare switch pr:193
# run validation
wt -C .bare remove <branch-name>
```

### Create and push a feature

```bash
wt -C .bare switch --create my-feature
git add .
git commit -m "Add feature"
git push origin my-feature
wt -C .bare remove my-feature
```

### From inside a worktree

```bash
wt -C ../.bare list
wt -C ../.bare switch pr:123
wt -C ../.bare remove <branch-name>
```

### Branch off another branch

```bash
wt -C .bare switch --create feature-phase2 --base feature-phase1
wt -C .bare step commit
wt -C .bare step push origin/feature-phase2
```

### Rebase onto target branch

```bash
wt -C .bare step rebase dev
wt -C .bare step rebase main
wt -C .bare step rebase ^
```

## Key Points

- `-C .bare` works from the repo container
- `-C ../.bare` works from inside a sibling worktree
- `wt remove` removes the worktree and branch context together
