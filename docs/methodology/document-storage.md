# Document Storage

Zazz separates durable project knowledge from active implementation scratch. The repo's
`AGENTS.md` declares the storage mode so agents know where to read, write, promote, and
link documents.

## Storage Surfaces

Durable documents may live in one of these declared surfaces:

- **Repo-committed Markdown**: reviewed through the same branch and PR workflow as code.
- **Repository wiki**: GitHub Wiki, GitLab Wiki, Bitbucket Wiki, or another Git-backed
  wiki attached to the repo.
- **Knowledge base**: Confluence, SharePoint, Notion, Google Docs, or another team KB.
- **Tracker-backed records**: Zazz Board, Jira, or another tracker for issue-scoped
  records and execution state.

The storage mode is per repo, and may be per document type. For example, a repo may keep
standards in committed Markdown, completed specifications in GitHub Wiki, and active
run logs in Zazz Board.

## Operating Model Declaration

Every adopting repo should declare its documentation operating model near the top of
`AGENTS.md`. Agents should follow that declaration instead of guessing from whether a
directory happens to exist.

Common operating models:

- **GitHub-only**: durable docs and specifications are committed Markdown reviewed
  through PRs.
- **GitHub plus GitHub Wiki**: committed repo docs hold standards and lightweight
  pointers; GitHub Wiki holds project overview, architecture, features, roadmap,
  project milestones, and completed implemented specs.
- **Zazz Board plus repo/wiki docs**: specifications are stored under
  `<DOCS_ROOT>/specifications/` and may be mirrored or linked to Zazz Board; Zazz Board
  holds tasks, file locks, QA notes, and execution state.
- **Jira plus Confluence**: Jira holds issue/work tracking and may hold active scope;
  Confluence holds durable project overview, architecture, features, roadmap,
  project milestones, and completed specs.
- **Hybrid**: each document type names its own source of truth.

`<DOCS_ROOT>/specifications/` is the normal local directory for deliverable
specifications authored by spec-builder and executed by implementation agents inside the
worktree. It exists even when final specifications are stored in GitHub Wiki, Jira,
Confluence, Zazz Board, or another durable system. The operating model determines
whether the local `specifications/` files are tracked in Git, ignored locally, mirrored
to another system, or promoted elsewhere after implementation.

## Durable Knowledge

Durable docs are onboarding and alignment material for contributors and agents. They are
not transient implementation logs.

Durable knowledge includes:

- project overview and product orientation
- architecture and technical decisions
- feature requirements and feature roadmap increments
- project plans, roadmap, and project milestone direction
- proposals and accepted decision outcomes
- standards
- implemented specifications when the repo's operating model treats specs as durable
  history

When durable docs live outside the application repo, keep a stable lookup path in
`AGENTS.md`, a repo-tracked index, or another declared entry point. Agents should be
able to find the current project overview, architecture, features, roadmap, project
milestones, and completed specifications without reading old chats or guessing from
repository shape.

## Ephemeral Implementation Artifacts

Active implementation artifacts live under `<DOCS_ROOT>/ephemeral/` when kept on disk.
This directory is normally ignored by Git because it contains scratch and runtime state.
Ephemeral means uncommitted and non-durable, not necessarily memory-only; these files may
persist locally until the worktree is removed.
Do not assume or create a universal subdirectory layout inside `ephemeral/`. Each repo's
`AGENTS.md` declares the exact filenames, naming convention, and whether RUN_LOG files,
QA findings, handoff notes, local evidence captures, recovery notes, or scratch
analysis are stored there at all.

Do not put durable onboarding docs, architecture decisions, feature requirements,
project plans, or specifications under `ephemeral/`.

## Completed Specifications

During implementation, the local specification file remains under
`<DOCS_ROOT>/specifications/`. The repo's operating model determines whether that
directory is tracked, ignored, mirrored to Zazz Board/Jira, or later promoted to a
durable wiki/knowledge-base surface. If the final spec lives outside the repo, keep
`specifications/` excluded from Git and do not commit those local working files.

Valid completed-spec destinations include:

- `<DOCS_ROOT>/specifications/` when specs are committed and PR-reviewed
- GitHub Wiki, GitLab Wiki, Bitbucket Wiki, or another repo wiki
- Confluence or another knowledge base
- Zazz Board, Jira, or another tracker when the repo treats that system as the durable
  spec archive

Promoted specs should include or link:

- implementation status and completion date
- PR URL and merge commit when available
- linked feature, project milestone, roadmap, and architecture context
- final acceptance criteria and evidence summary
- the `Implementation And Review Change Log`

Do not promote incomplete specs as durable history unless the owner explicitly wants a
draft snapshot.

## Wiki And Knowledge Base Curation

Repository wikis and knowledge bases are useful for agent onboarding because they can
organize project overview, architecture, features, implemented specs, plans, roadmap,
and project milestones outside the code-review path. They should still be curated.

Recommended policy:

- restrict editing to collaborators or the equivalent trusted maintainer group
- keep a stable home/index page and sidebar
- record source PRs, commits, or tracker links for significant updates
- avoid user-facing product documentation unless the repo explicitly uses the wiki as a
  public docs surface
- keep active run logs and scratch notes out of durable wiki/KB pages

When using GitHub Wiki, use `gh-wiki`. When using Confluence, use `confluence`. Both
skills are placeholder workflow guidance unless the repo declares a live integration.

## Relevant Skills

| Skill | How it helps efficiency |
| ----- | ----------------------- |
| `gh-wiki` | Reads, updates, and promotes durable project docs and completed specs in a GitHub repo wiki. |
| `confluence` | Drafts or updates durable project docs and completed specs for Confluence-backed repos. |
| `spec-builder` | Creates deliverable specs under `<DOCS_ROOT>/specifications/` according to the repo's tracked/ignored/mirrored policy. |
| `spec-driven` | Governs active spec updates, run logs, QA feedback, and completed-spec promotion timing. |
| `feature-doc-builder` | Maintains durable feature and feature roadmap knowledge in the declared storage surface. |
| `architecture-doc-builder` | Maintains durable architecture knowledge in the declared storage surface. |
| `handoff` | Creates temporary HANDOFF documents under `<DOCS_ROOT>/ephemeral/` when active context must move to a fresh session. |
| `zazz-board` | Updates tracker-backed execution records and specification metadata when the repo uses Zazz Board. |
| `jira` | Provides Jira-backed context and update guidance when the repo uses Jira. |
| `doc-check` | Checks committed Markdown docs before PR review when repo docs are the durable surface. |

## Related Sections

- [Project Document](./project.md)
- [Architecture](./architecture.md)
- [Features and Project Milestones](./features-and-milestones.md)
- [Specifications](./specifications.md)
- [Spec-Driven Development](./spec-driven-development.md)
