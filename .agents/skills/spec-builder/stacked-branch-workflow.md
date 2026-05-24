# Stacked Branch Workflow (spec-builder)

Use this workflow only when the specification-time review decision is that the artifact
needs multiple dependent PRs.

Stacked work is implemented as **multiple branches inside one lane worktree** using
`gh-stack`. Do not create stacked worktrees; that topology is too difficult to manage
after even two worktrees.

Do not use this workflow as PR-time cleanup for an oversized implementation. If coding
has already started and a stack now seems necessary, revise the specification with Owner
sign-off before continuing.

Agents may push stack branches and create/update PRs when instructed, but they never
merge directly to `dev`. Lower branches reach `dev` only after human PR review and the
PR lands.

For command-level stack guidance, prefer the separate `gh-stack` skill when available.
If that skill is not available, use the summary in this file and ask the Owner to
review command details before implementation.

Mental model:

- **One worktree** = one isolated agent lane, usually for one deliverable, but it may
  contain multiple deliverables when they are intentionally implemented as one stack.
- **One stack inside that worktree** = multiple review branches for the same deliverable
  or tightly related deliverable group.
- **One branch** = one review unit, represented by commits, not by a remembered file
  list.
- The worktree has one working directory, one index, and one checked-out branch at a
  time. `gh stack bottom/top/up/down` are controlled branch checkouts inside the same
  directory.

For why and how stacked work runs, see the SKILL.md "Stacked mode — additional
concerns" section. This file is workflow only.

## Naming and location

- **Stacked specification**: `<DOCS_ROOT>/specifications/<slug>.md` when committed in
  Git, or Zazz Board / the repo-declared tracking system when external.
- **Lane worktree dir**: repo-conventional flat worktree name, usually matching the
  deliverable or branch slug where practical.
- **Stacked branch names**: flat branch names managed by `gh-stack`; avoid `/` so branch
  names map cleanly to sibling worktree directories and tooling.
- **Run log**: follow the repo's declared storage policy; use sections per branch or per
  deliverable when useful.

No separate plan files are created. Branch-specific execution phases, ACs, halt conditions, and
implementation prompts live in the stacked specification and run log.

## Required specification contents beyond the standard quality bar

The `stacked-specification-template.md` enforces these. Fill the template; don't reinvent the
section list.

1. **Stacked-branch model section** — why branches are stacked, the rebase rule,
   single-lane topology, why separate PR review is needed, and which alternatives were
   rejected.
2. **End-to-end execution flow** — sequence diagram + slice-ownership diagram showing
   where the seam falls.
3. **Per-branch scope, decisions, ACs** — one section per branch. Each branch numbers
   its own ACs.
4. **No-drift AC for upper branches** — verifies the upper branch does not accidentally
   modify lower-branch-owned files.
5. **Integration & shared concerns** — locked public symbols crossing the seam, data
   shape, shared decimal/rounding rules, fixture ownership, case matrix.
6. **Cross-branch acceptance bar** — the stacked PRs together satisfy all per-branch
   ACs plus the seam/no-drift rule.

## Workflow

1. Confirm `<slug>` (kebab-case; used in lane worktree, branch names, specification, and run log).
2. Confirm that stacked review is actually needed. If one PR can review the milestone,
   use a milestone branch instead. If independent PRs can review the work, use sibling
   branches instead.
3. Resolve the specification path or external specification record.
4. Read this skill's bundled `references/spec-driven-development-methodology.md`.
5. Read the `gh-stack` skill if present; use its bundled single-worktree-lane reference
   and non-interactive command rules for stack setup examples.
6. Read a project-local prior stacked specification if the Owner points to one for calibration.
7. If no `gh-stack` skill is available, continue with this workflow's summary and flag
   command-level stack guidance for Owner review.
8. Read `docs/standards/index.yaml` from the active lane worktree; load only relevant
   standards.
9. Copy `stacked-specification-template.md` to the specification path or external record and fill placeholders
   interactively with the Owner.
10. Iterate until the seam contract is concrete. Upper branches build on lower branches
   through the stack; vague seams create expensive upstack propagation.
11. Run the calibration check from SKILL.md before presenting.

## gh-stack rules to preserve in specifications

When the stacked specification includes commands or implementation prompts, carry these
non-interactive rules from the `gh-stack` skill:

- Always provide branch names to `gh stack init`, `gh stack add`, and
  `gh stack checkout`.
- Always use `gh stack view --json`; plain `gh stack view` opens an interactive TUI.
- Always use `gh stack submit --auto` when creating PRs; add `--draft` when draft PRs
  are desired.
- Use `--remote origin` for `push`, `submit`, `sync`, `link`, or `checkout` when the
  repo has multiple remotes, or preconfigure `git config remote.pushDefault origin`.
- Configure `git config rerere.enabled true` before stack setup to avoid rerere prompts
  and remember conflict resolutions.
- Prefer normal `git add` / `git commit` over `gh stack add -Am` so branch ownership is
  deliberate.
- When changing a lower branch after upper branches exist, navigate down, commit there,
  run `gh stack rebase --upstack`, then navigate back up.
- Use `gh stack rebase --upstack` after a local lower-branch change. Use
  `gh stack sync` for routine remote/integration/PR-state synchronization, especially
  after the lower PR has merged.
- If a rebase exits with code 3, resolve conflict markers, stage files, and run
  `gh stack rebase --continue`; abort with `gh stack rebase --abort` if resolution is
  unsafe.

## Rebase rule

State this explicitly in the specification:

An upper branch rebases upstack from its lower branch until the lower PR lands on the
integration branch through human review. After the lower PR lands, the upper branch
rebases on `origin/{{ integration-branch }}`. Never squash-rebase an upper branch onto
the integration branch directly while stacked; that absorbs lower-branch commits into
the upper PR and breaks the no-drift acceptance criterion.

Branch 2 sees Branch 1 as of the last time Branch 2 was created from, based on, or
rebased onto Branch 1. After new Branch 1 commits, run `gh stack rebase --upstack`.
After the Branch 1 PR lands, run `gh stack sync`, then verify Branch 2's remaining diff
against the integration branch.

`gh-stack` tracks branch order and PR relationships. It does not remember which files
belong to which branch. The agent must be on the intended branch and stage intended
paths or hunks before committing.
