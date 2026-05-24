# Regular / Non-Stacked Workflow (spec-builder)

Use this workflow for every non-stacked topology:

- single-deliverable branch
- milestone branch with multiple deliverables/specifications in one branch
- sibling branches where each branch has its own specification or small specification group

The stable rule is one deliverable per specification. The flexible part is where those
deliverables live during implementation and review.

For features and deliverables, the specification must approve the review shape before
implementation starts. Use this workflow to document one PR, one milestone PR, sibling
PRs, or a large exception; if a stack is the right shape, switch to the stacked workflow
before drafting implementation guidance.

## Naming and location

- Specification path: `<DOCS_ROOT>/specifications/<slug>.md` when committed in Git.
- For milestone branches, use a consistent ordered naming pattern, for example:
  - `<DOCS_ROOT>/specifications/m2-spec-1-service-layer-foundation.md`
  - `<DOCS_ROOT>/specifications/m2-spec-2-cli-refactor.md`
  - `<DOCS_ROOT>/specifications/m2-spec-3-http-route.md`
- External specification storage: Zazz Board or the repo-declared tracking system when
  specifications are not committed in Git.
- Run log path/location: follow the repo's declared policy; use an ignored local file,
  committed support artifact, Zazz Board note, external tracker entry, or combination.
  Repos that do not use Zazz Board may rely exclusively on `<DOCS_ROOT>/execution/`.
  When the Owner uses Zazz Board, prefer it for execution records that need to be shared
  across worktrees, agents, and sessions.
- The integration branch worktree (e.g. `dev/`, `main/`) is read-only except for sync.
  Never write specifications or implementation files into it — always work from your feature
  worktree.

## Workflow

1. Confirm the active worktree and intended review artifact.
2. Confirm whether this is:
   - one deliverable / one specification / one PR;
   - multiple deliverables / multiple specifications / one PR;
   - multiple sibling branches / separate PRs.
3. Record the decomposition rationale: why this review shape is approved and why the
   alternatives were rejected.
4. Resolve the specification path under `<DOCS_ROOT>/specifications/`, or the Zazz
   Board/external tracking location when the repo does not commit specifications.
5. Resolve the run-log path/location. Reuse the milestone/effort run log when multiple specifications
   share one branch or one review artifact.
6. Copy `regular-specification-template.md` to the specification path. Fill placeholders interactively
   with the Owner.
7. Read this skill's bundled `references/spec-driven-development-methodology.md`.
8. Read `docs/standards/index.yaml` from the active worktree when present; load standards whose
   `applies_to` matches files this specification will affect.
9. Iterate to Owner approval.

## Output

- One specification file or external specification record for the deliverable.
- A run-log path/location referenced by the specification when a run log is used.
- No separate plan file.

For milestone branches, repeat this workflow once per deliverable/specification while preserving
one shared run log and one intended PR review artifact.
