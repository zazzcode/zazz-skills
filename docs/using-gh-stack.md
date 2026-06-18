# Using gh-stack with a Single Worktree Lane

This note captures the workflow assessment for using one git worktree as an agent lane while managing two stacked branches inside that same directory.

## Assessment

Yes: a single long-lived worktree lane plus stacked branches is a viable workflow for a complex deliverable. The worktree gives the agent a private filesystem, dependency install, IDE state, build cache, and scratch space. The stack gives GitHub two small reviewable PRs instead of one large migration PR.

The useful mental model is:

- **One worktree = one isolated agent lane / deliverable workspace.**
- **One stack inside that worktree = multiple review branches for the same deliverable.**
- **One branch = one review unit, represented by commits, not by a remembered file list.**

This is a better fit for the next slice than two separate worktrees when the two branches are tightly related. The previous two-worktree model made it easy to isolate Branch 1 and Branch 2, but it was cumbersome when the Branch 2 work needed to react to Branch 1 changes. A single lane keeps the code physically in one place and lets `gh stack rebase --upstack` carry lower-branch updates forward.

## Worktree versus branch

A worktree is associated with **one checked-out branch at a time**, but that association is not permanent. The worktree is a working directory with its own index and checkout. You can switch which branch is checked out inside that directory, as long as Git allows the checkout.

So the lane model is:

```text
worktree directory = one working directory / one index / one checked-out branch at a time
branch stack = multiple branches you move between inside that directory
```

Example:

```bash
cd /path/to/repo-wt/dev
git worktree add ../feature-next-report-lane -b feature-next-report-svc-1 dev

cd ../feature-next-report-lane
# currently on feature-next-report-svc-1

gh stack init --base dev --adopt feature-next-report-svc-1
gh stack add feature-next-report-svc-2
# same directory, now checked out to feature-next-report-svc-2
```

After that, `gh stack bottom`, `gh stack top`, `gh stack up`, and `gh stack down` are controlled branch checkouts inside the same worktree. Dependencies, scratch output, venvs, IDE indexing, and build artifacts stay in the same folder; the checked-out branch content changes as you move up and down the stack.

Git generally does not let the same branch be checked out in two worktrees at once. That is fine for the lane workflow because the stack branches are unique to the lane.

## When Branch 2 sees Branch 1 changes

Branch 2 can see Branch 1 changes only when those Branch 1 commits are in Branch 2's history.

When Branch 2 is first created on top of Branch 1, it sees everything Branch 1 had at that moment:

```text
dev
└── feature-next-report-svc-1
    └── feature-next-report-svc-2
```

If you later switch back to Branch 1 and add a commit, Branch 2 does not automatically see that new commit:

```text
dev
└── feature-next-report-svc-1 -- new data-contract commit
    \
     feature-next-report-svc-2   # still based on the older Branch 1 tip
```

Rebase upward after Branch 1 changes:

```bash
gh stack bottom
# edit Branch 1 files
git add backend/database/sql_migrations/stored-procedure/R__dbo.app_FeatureFoo.sql
git add backend/src/data/sprocs/app_FeatureFoo.py
git commit -m "Update Report Foo data contract"

gh stack rebase --upstack
gh stack top
```

After the upstack rebase, Branch 2 sees the new Branch 1 commit:

```text
dev
└── feature-next-report-svc-1 -- new data-contract commit
    └── feature-next-report-svc-2
```

Rule:

```text
Branch 2 sees Branch 1 as of the last time Branch 2 was created from, based on, or rebased onto Branch 1.
After new Branch 1 commits, run gh stack rebase --upstack.
```

## Sync versus rebase

`gh stack sync` and `gh stack rebase --upstack` overlap, but they are best used for different moments.

Use `gh stack rebase --upstack` when you made a **local lower-branch change** and need upper branches to inherit it immediately:

```bash
gh stack bottom
# edit Branch 1 files
git add backend/database/sql_migrations/stored-procedure/R__dbo.app_FeatureFoo.sql
git add backend/src/data/sprocs/app_FeatureFoo.py
git commit -m "Update Report Foo data contract"

gh stack rebase --upstack
gh stack top
```

Use `gh stack sync` for **routine remote synchronization**:

- after the integration branch moved;
- after Branch 1 was merged;
- after remote PR/stack state changed;
- before pushing/submitting an updated stack state.

`gh stack sync` is broader. It fetches, fast-forwards the trunk/integration branch when possible, cascade-rebases stack branches onto updated parents, pushes the active branches, and syncs PR state from GitHub.

Typical post-merge flow after Branch 1 lands:

```bash
gh stack top
gh stack sync
gh stack view --json
```

Then verify that Branch 2's diff contains only Branch 2 work:

```bash
git diff --name-only <integration-branch>...HEAD
```

For report migrations, Branch 2 should no longer show Branch 1-owned data-layer files after sync. If it does, inspect before continuing:

```bash
git log --oneline --decorate --graph --max-count=20
gh stack view --json
```

Practical rule:

```text
Local Branch 1 changed -> gh stack rebase --upstack
Remote/integration/PR state changed -> gh stack sync
Branch 1 merged -> gh stack sync, then verify Branch 2 diff
```

## Important caveat: file ownership is still manual

`gh-stack` does **not** remember that a particular file "belongs" to Branch 1 or Branch 2. It tracks:

- the ordered branch stack;
- each branch's parent/base branch;
- local stack metadata in `.git/gh-stack`;
- push / submit / rebase / navigation state.

Git itself determines branch contents from commits. That means files are associated with a branch only after you commit those changes on that branch.

If you are on the Branch 2 tip and realize a data-layer file belongs in Branch 1:

1. Save or commit any Branch 2 work that should stay on Branch 2.
1. Navigate down to Branch 1.
1. Make or stage only the Branch 1 changes.
1. Commit them on Branch 1.
1. Rebase the upper branch.
1. Navigate back to Branch 2.

Example:

```bash
gh stack down
git add backend/database/sql_migrations/stored-procedure/R__dbo.app_FeatureFoo.sql
git add backend/src/data/sprocs/app_FeatureFoo.py
git commit -m "Add Report Foo data layer"

gh stack rebase --upstack
gh stack up
```

If your working tree contains mixed changes, use `git add -p` or path-specific `git add` so the current branch receives only the intended hunks.

## Setup

The local clone is at:

```bash
/path/to/gh-stack
```

The extension can be installed from GitHub:

```bash
gh extension install github/gh-stack
```

Official reference: [GitHub Stacked PRs CLI Commands](https://github.github.com/gh-stack/reference/cli/). The page includes installation, stack management, remote operations, navigation, utilities, and exit codes.

The README currently notes that GitHub stacked PR support is in private preview and the CLI will not work unless the repository has the feature enabled. If the repository does not have access yet, the same lane model is still useful, but stacked PR submission may need a different tool or manual PR bases.

Install the agent skill from the local clone by copying:

```bash
/path/to/gh-stack/skills/gh-stack
```

into the repo/worktree skill directory:

```bash
.agents/skills/gh-stack
```

## Recommended report workflow

Create one lane worktree from `dev`. Run this from the existing `dev/` worktree:

```bash
cd /path/to/repo-wt/dev
git worktree add ../feature-<feature-slug>-lane -b feature-<feature-slug>-svc-1 dev
cd ../feature-<feature-slug>-lane
```

Initialize the stack using the current Branch 1 branch, then add Branch 2:

```bash
gh stack init --base dev --adopt feature-<feature-slug>-svc-1
gh stack add feature-<feature-slug>-svc-2
```

Work bottom-up:

```bash
gh stack bottom
# implement data layer, binding, tSQLt, binding tests
git add <svc-1 paths>
git commit -m "Add <report> data layer"

gh stack top
# implement service, document, renderers, CLI, fixtures
git add <svc-2 paths>
git commit -m "Add <report> rendering and CLI"
```

When Branch 1 changes after Branch 2 exists:

```bash
gh stack bottom
# edit Branch 1 files
git add <svc-1 paths>
git commit -m "Update <report> data contract"

gh stack rebase --upstack
gh stack top
```

Push / submit:

```bash
gh stack push
gh stack submit --auto --draft
gh stack view --json
```

After Branch 1 is merged, sync the stack and verify Branch 2's remaining diff:

```bash
gh stack top
gh stack sync
gh stack view --json
git diff --name-only <integration-branch>...HEAD
```

For agents, prefer non-interactive forms:

- `gh stack init --base dev --adopt <branch>`
- `gh stack add <branch>`
- `gh stack sync`
- `gh stack submit --auto`
- `gh stack view --json`

## Branch boundaries for report migrations

Branch 1 owns the data contract:

- `app_` stored procedure;
- `vw2_` / `fn2_` helper if needed;
- Python binding;
- return-code mapping;
- tSQLt and binding tests.

Branch 2 owns the consumer side:

- report service orchestration;
- canonical document builder;
- markdown renderer;
- PDF renderer;
- CLI subcommand;
- service fixtures and report tests.

The seam is the typed binding contract. If Branch 2 needs a new column or RowType, make that change on Branch 1, then rebase Branch 2 upward.

## Detailed scenarios

These examples assume a two-branch report stack:

```text
dev
└── feature-next-report-svc-1   # Branch 1: data layer
    └── feature-next-report-svc-2   # Branch 2: service/render/CLI
```

### Scenario 1: clean bottom-up implementation

Use this when you know the Branch 1 work first, then build Branch 2 on top of it.

```bash
cd /path/to/repo-wt/feature-next-report-lane

# Start at the bottom branch.
gh stack bottom

# Edit Branch 1 files:
# - backend/database/sql_migrations/stored-procedure/R__dbo.app_FeatureFoo.sql
# - backend/src/data/sprocs/app_FeatureFoo.py
# - backend/tests/data/sprocs/test_app_FeatureFoo.py

git status --short
git add backend/database/sql_migrations/stored-procedure/R__dbo.app_FeatureFoo.sql
git add backend/src/data/sprocs/app_FeatureFoo.py
git add backend/tests/data/sprocs/test_app_FeatureFoo.py
git commit -m "Add Report Foo data layer"

# Move to the top branch.
gh stack top

# Edit Branch 2 files:
# - backend/src/svc/reports/report_foo/service.py
# - backend/src/svc/reports/report_foo/document.py
# - backend/src/svc/reports/report_foo/markdown.py
# - backend/scripts/generate-report.py

git status --short
git add backend/src/svc/reports/report_foo/
git add backend/scripts/generate-report.py
git commit -m "Add Report Foo service and CLI"
```

Result:

- Branch 1 PR contains only the data layer.
- Branch 2 PR contains only the consumer/rendering layer.
- Branch 2 has Branch 1 in its history because it is stacked on top.

### Scenario 2: mixed edited files, commit only some to the current branch

Use this when you edited several files before separating which branch they belong to.

Example state while on Branch 1:

```bash
git status --short
```

```text
 M backend/database/sql_migrations/stored-procedure/R__dbo.app_FeatureFoo.sql
 M backend/src/data/sprocs/app_FeatureFoo.py
 M backend/src/svc/reports/report_foo/service.py
 M backend/scripts/generate-report.py
```

Only the SQL and binding belong on Branch 1. Stage only those paths:

```bash
gh stack bottom
git add backend/database/sql_migrations/stored-procedure/R__dbo.app_FeatureFoo.sql
git add backend/src/data/sprocs/app_FeatureFoo.py
git commit -m "Add Report Foo stored procedure binding"
```

The service and CLI edits remain uncommitted in the worktree. Move to Branch 2 and commit them there:

```bash
gh stack top
git status --short
git add backend/src/svc/reports/report_foo/service.py
git add backend/scripts/generate-report.py
git commit -m "Wire Report Foo service into CLI"
```

If one file contains both Branch 1 and Branch 2 edits, use patch staging:

```bash
git add -p backend/src/data/sprocs/app_FeatureFoo.py
git commit -m "Update Report Foo binding contract"
```

Then switch branches and stage the remaining hunks later.

### Scenario 3: while on Branch 2, you discover Branch 1 needs a change

This is the most common stacked workflow. Do not make the data-contract change on Branch 2. Put it on Branch 1 and rebase Branch 2 upward.

First, make Branch 2 clean enough to switch. Either commit the current Branch 2 work:

```bash
gh stack top
git add backend/src/svc/reports/report_foo/
git commit -m "Start Report Foo document builder"
```

Or stash it if it is not ready:

```bash
git stash push -m "wip report foo branch 2"
```

Then move down and change Branch 1:

```bash
gh stack bottom

# Edit the SP/binding contract.
git add backend/database/sql_migrations/stored-procedure/R__dbo.app_FeatureFoo.sql
git add backend/src/data/sprocs/app_FeatureFoo.py
git commit -m "Add Report Foo adjustment columns"
```

Carry that lower-branch change upward:

```bash
gh stack rebase --upstack
gh stack top
```

If you stashed Branch 2 work, restore it after returning to the top:

```bash
git stash pop
```

Now adjust Branch 2 to the new contract and commit:

```bash
git add backend/src/svc/reports/report_foo/
git commit -m "Consume Report Foo adjustment columns"
```

### Scenario 4: you accidentally committed Branch 1 work on Branch 2

If the bad commit is the latest commit on Branch 2 and has not been pushed, move the change back into the worktree, then recommit it on the correct branch.

```bash
gh stack top
git reset --soft HEAD~1
```

Now the changes from that commit are staged. Unstage them so you can choose what belongs where:

```bash
git restore --staged .
```

Move to Branch 1 and commit only the data-layer files:

```bash
gh stack bottom
git add backend/database/sql_migrations/stored-procedure/R__dbo.app_FeatureFoo.sql
git add backend/src/data/sprocs/app_FeatureFoo.py
git commit -m "Add Report Foo data contract"
```

Rebase Branch 2 upward, then commit the remaining Branch 2 files:

```bash
gh stack rebase --upstack
gh stack top
git add backend/src/svc/reports/report_foo/
git commit -m "Add Report Foo renderer"
```

If the bad commit was already pushed or is not the latest commit, slow down and inspect the history first:

```bash
git log --oneline --decorate --graph --max-count=12
gh stack view --json
```

At that point, prefer an intentional `git rebase -i` or a follow-up corrective commit over improvising.

### Scenario 5: Branch 1 merged, sync Branch 2 onto the integration branch

Once the Branch 1 PR merges, Branch 2 should stop targeting Branch 1 and should reduce to only its own commits on top of the updated integration branch. `gh stack sync` is the normal command for that transition.

```bash
gh stack top
gh stack sync
gh stack view --json
```

Then inspect Branch 2's remaining review diff:

```bash
git diff --stat <integration-branch>...HEAD
git diff --name-only <integration-branch>...HEAD
```

For report migrations, the remaining diff should be Branch 2 territory: service, document builder, renderers, CLI, fixtures, and tests. If SQL migrations or data sprocs still appear, pause and inspect the stack state before merge.

### Scenario 6: check what each PR will contain

From Branch 1, compare against `dev`:

```bash
gh stack bottom
git diff --stat dev...HEAD
git diff --name-only dev...HEAD
```

From Branch 2, compare against Branch 1 to see only the top PR's review diff:

```bash
gh stack top
git diff --stat feature-next-report-svc-1...HEAD
git diff --name-only feature-next-report-svc-1...HEAD
```

For report migrations, Branch 2 should not modify Branch 1-owned files. A quick check:

```bash
git diff --name-only feature-next-report-svc-1...HEAD -- \
  backend/database/sql_migrations/ \
  backend/src/data/sprocs/ \
  backend/tests/data/sprocs/
```

That command should print nothing for a clean Branch 2.

## When not to use this

Use separate worktrees instead when two agents must work concurrently on different branches. A single worktree has one checked-out branch and one index. Two agents editing it at the same time will collide.

For one agent implementing one report, the single-lane stack is the better default.
