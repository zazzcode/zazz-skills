---
name: gh-wiki
description: Placeholder workflow guidance for repos that use GitHub Wiki as a durable documentation surface; use when updating, promoting, or reviewing project overview, architecture, feature, roadmap, milestone, proposal, standard-summary, or completed-specification wiki pages. Does not assume live automation beyond repo-declared GitHub Wiki access.
---

# GitHub Wiki Skill

Use this skill when a repo's `AGENTS.md` declares GitHub Wiki as the durable surface for
project knowledge or completed specifications.

This is a placeholder workflow skill. It does not provide a custom API client. Follow the
repo-declared GitHub Wiki workflow and use normal Git/GitHub tooling only when access and
instructions are explicit.

## Startup Sequence

1. Read `AGENTS.md` and confirm GitHub Wiki is the declared source of truth for the
   artifact type you are touching.
2. Identify the artifact type: project overview, architecture, feature requirements,
   roadmap, milestone, proposal outcome, completed specification, or standards summary.
3. Find the wiki entry point, page naming convention, and update authority declared by
   the repo.
4. Read the current wiki page or repo pointer before drafting changes.
5. If wiki access, naming, or ownership is unclear, ask the owner instead of inventing a
   page path.

## Rules

- Keep local working specifications under `<DOCS_ROOT>/specifications/`; promote or mirror
  final implemented specs to GitHub Wiki only when the repo declares that policy.
- Do not put RUN_LOG files, QA notes, handoffs, recovery notes, evidence captures, or
  scratch analysis into durable wiki pages.
- Preserve stable links back to source PRs, merge commits, tracker records, and governing
  specs when available.
- Do not use the wiki as public user-facing documentation unless the repo explicitly says
  that is its product-doc surface.
- If a contract changes during implementation, update the specification body and
  `Implementation And Review Change Log` first; update the wiki after the durable outcome
  is accepted or merged.

## Output

Produce either:

- a wiki page update through the repo-declared workflow, or
- a concise draft/pointer that a human can apply when live wiki access is unavailable.
