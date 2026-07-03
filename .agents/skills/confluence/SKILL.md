---
name: confluence
description: Placeholder workflow guidance for repos that use Confluence as a durable documentation surface; use when drafting, updating, promoting, or reviewing project overview, architecture, feature, roadmap, milestone, proposal, standard-summary, or completed-specification Confluence pages. Does not assume live Confluence API access unless the repo declares it.
---

# Confluence Skill

Use this skill when a repo's `AGENTS.md` declares Confluence as the durable surface for
project knowledge or completed specifications.

This is a placeholder workflow skill. It does not provide a live Confluence integration.
Use repo-declared Confluence spaces, page naming, ownership, and update processes.

## Startup Sequence

1. Read `AGENTS.md` and confirm Confluence is the declared source of truth for the
   artifact type you are touching.
2. Identify the artifact type: project overview, architecture, feature requirements,
   roadmap, milestone, proposal outcome, completed specification, or standards summary.
3. Find the Confluence space, parent page, naming convention, and update authority
   declared by the repo.
4. Read the current page or repo pointer before drafting changes.
5. If access, naming, or ownership is unclear, ask the owner instead of inventing a page.

## Rules

- Keep local working specifications under `<DOCS_ROOT>/specifications/`; promote or mirror
  final implemented specs to Confluence only when the repo declares that policy.
- Do not put RUN_LOG files, QA notes, handoffs, recovery notes, evidence captures, or
  scratch analysis into durable Confluence pages.
- Preserve stable links back to source PRs, merge commits, tracker records, and governing
  specs when available.
- Do not use Confluence as public user-facing documentation unless the repo explicitly says
  that is its product-doc surface.
- If a contract changes during implementation, update the specification body and
  `Implementation And Review Change Log` first; update Confluence after the durable outcome
  is accepted or merged.

## Output

Produce either:

- a Confluence page update through the repo-declared workflow, or
- a concise draft/pointer that a human can apply when live Confluence access is unavailable.
