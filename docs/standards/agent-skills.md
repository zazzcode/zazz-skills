---
last_updated_at: 2026-07-04
---

# Agent Skills

This standard governs creating and modifying shared agent skills under `.agents/skills/`. It keeps skills compatible
with the open Agent Skills format and usable across skill-aware harnesses such as Codex, Claude Code, Cursor, and
similar agents that load `SKILL.md` files through progressive disclosure.

## Directory Shape

Each skill MUST live in its own directory under `.agents/skills/`, and the directory name MUST match the `name` value
in `SKILL.md`.

### Desired

```text
.agents/skills/handoff/
  SKILL.md
```

```yaml
---
name: handoff
description: Create or update platform-neutral handoff documents for agents and developers when work needs to be paused, transferred, resumed in another session, or cataloged as follow-up context.
---
```

### Not desired

```text
.agents/skills/handoff-notes/
  SKILL.md
```

```yaml
---
name: handoff
description: Create handoff notes.
---
```

The folder and `name` disagree, which weakens discovery and makes runtime-specific skill selectors harder to reason
about.

## Front Matter

Every `SKILL.md` MUST start with YAML front matter containing only these top-level fields:

- `name`
- `description`
- `metadata`, only when extra fields are needed

Put all non-standard fields under `metadata`. Do not add provider-specific or local routing fields at the top level.

### Desired

```yaml
---
name: zazz-board
description: "CLI-first companion skill for service-assisted repos that use Zazz Board; use it to create and manage deliverables, tasks, relations, notes, statuses, and file locks through zazzctl, with live OpenAPI as the protocol validation and fallback surface."
metadata:
  type: rule
  required_for: ["qa-testing", "spec-builder", "pr-builder"]
---
```

### Not desired

```yaml
---
name: zazz-board
type: rule
description: "CLI-first companion skill for service-assisted repos that use Zazz Board."
required_for: ["qa-testing", "spec-builder", "pr-builder"]
---
```

`type` and `required_for` are extra top-level fields. Some harnesses tolerate them, but `metadata` is the portable
extension point.

## Description Quality

The `description` field is the primary discovery surface. It MUST describe both what the skill does and when an agent
should use it. Front-load important trigger words because some harnesses shorten long descriptions when many skills
are available.

Descriptions SHOULD be concise, specific, and trigger-focused. Avoid generic wording that could match almost any task.

### Desired

```yaml
description: Create or update platform-neutral handoff documents for agents and developers when work needs to be paused, transferred, resumed in another session, or cataloged as follow-up context; use for ephemeral HANDOFF notes, issue catalogs, continuation plans, next-session briefs, and cross-agent summaries.
```

### Not desired

```yaml
description: Helps with notes.
```

The second description does not give an agent enough signal to invoke the skill reliably.

## Body Structure

The Markdown body after front matter is instruction content, not discovery metadata. Body headings MAY vary by skill,
but they SHOULD make the workflow easy to scan.

Common useful sections include:

- purpose or use statement
- core rules
- workflow
- required references or scripts
- recommended output sections
- validation or halt conditions

Do not cargo-cult headings from another provider's example when the headings do not fit the workflow.

## Progressive Disclosure

`SKILL.md` SHOULD remain the concise entry point for routing, activation criteria, and the minimum workflow. Move
large checklists, templates, provider-specific command recipes, review axes, or long examples into sibling files such
as `references/`, `scripts/`, or `assets/` when they are not needed on every activation.

When `SKILL.md` references companion files, use paths relative to the skill root and say when to load them.

### Desired

```markdown
For stacked branch command details, read `stacked-branch-workflow.md` when the approved review shape is a stack.
```

### Not desired

```markdown
See the references folder for more details.
```

The not-desired form does not tell the agent which file matters or when to load it.

## Validation

Before committing skill changes, validate all checked-in skills:

```bash
ruby -e 'require "yaml"; Dir[".agents/skills/*/SKILL.md"].sort.each do |path| fm=File.read(path).split(/^---\s*$/,3)[1] or raise "missing frontmatter: #{path}"; data=YAML.safe_load(fm); extras=data.keys-["name","description","metadata"]; raise "extra top-level fields #{path}: #{extras.join(",")}" if extras.any?; raise "missing name: #{path}" unless data["name"]; raise "missing description: #{path}" unless data["description"]; raise "folder/name mismatch: #{path}" unless File.basename(File.dirname(path)) == data["name"]; end; puts "all skill frontmatter portable"'
```

Also run `git diff --check` and the repo's documentation checks before committing standards or skill edits.

## Related Standards

- [code-structure.md](code-structure.md) for file size, contextual splitting, and incrementally discoverable skills.
- [docs-hygiene.md](docs-hygiene.md) for Markdown voice, examples, linking, and cleanup discipline.
