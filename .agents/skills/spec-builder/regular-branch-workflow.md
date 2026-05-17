# Regular / Non-Stacked Workflow (spec-builder)

Use this workflow for every non-stacked topology:

- single-deliverable branch
- milestone branch with multiple deliverables/SPECs in one branch
- sibling branches where each branch has its own SPEC or small SPEC group

The stable rule is one deliverable per SPEC. The flexible part is where those
deliverables live during implementation and review.

## Naming and location

- SPEC path: `<active-worktree>/docs/implementation/<slug>-SPEC.md`.
- For milestone branches, use a consistent ordered naming pattern, for example:
  - `docs/implementation/m2-spec-1-service-layer-foundation.md`
  - `docs/implementation/m2-spec-2-cli-refactor.md`
  - `docs/implementation/m2-spec-3-http-route.md`
- Run log path: `<active-worktree>/docs/implementation/<effort-slug>-RUN-LOG.md`.
- The integration branch worktree (e.g. `dev/`, `main/`) is read-only except for sync.
  Never write SPECs or implementation files into it — always work from your feature
  worktree.

## Workflow

1. Confirm the active worktree and intended review artifact.
2. Confirm whether this is:
   - one deliverable / one SPEC / one PR;
   - multiple deliverables / multiple SPECs / one PR;
   - multiple sibling branches / separate PRs.
3. Resolve the SPEC path under `<worktree>/docs/implementation/` using the deliverable
   slug and any milestone prefix.
4. Resolve the run-log path. Reuse the milestone/effort run log when multiple SPECs
   share one branch or one review artifact.
5. Copy `regular-SPEC-TEMPLATE.md` to the SPEC path. Fill placeholders interactively
   with the Owner.
6. Read this skill's bundled `references/spec-driven-development-methodology.md`.
7. Read `docs/standards/index.yaml` from the active worktree when present; load standards whose
   `applies_to` matches files this SPEC will affect.
8. Iterate to Owner approval.

## Output

- One SPEC file for the deliverable.
- A run-log path referenced by the SPEC.
- No PLAN file.

For milestone branches, repeat this workflow once per deliverable/SPEC while preserving
one shared run log and one intended PR review artifact.
