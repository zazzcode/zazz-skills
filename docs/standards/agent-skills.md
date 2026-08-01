---
last_updated_at: 2026-08-01
---

# Agent Skills

This standard governs creating and modifying shared agent skills under `.agents/skills/`. It keeps skills compatible
with the open Agent Skills format and usable across skill-aware harnesses such as Codex, Claude Code, Cursor, and
similar agents that load `SKILL.md` files through progressive disclosure.

`.agents/skills/` is the canonical, tool-neutral source. A consuming repository may copy or map selected skills into
a runtime-native location, but a shared skill MUST NOT depend on a particular installation path, tool call, or agent
brand unless it is explicitly an optional integration skill with a documented fallback.

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
description: "Create or update platform-neutral handoff documents for agents and developers when work needs to be paused, transferred, resumed in another session, or cataloged as follow-up context."
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
description: "Create handoff notes."
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

### YAML Safety and Portability

Front matter is parsed before the Markdown body is available. A YAML parse error can therefore make an otherwise
useful skill undiscoverable. Use conservative YAML that is accepted by all supported runtimes:

- Start the opening `---` at byte zero; use a closing `---` before the body.
- Use a lowercase, hyphenated string for `name`; it MUST match the containing directory exactly.
- Make `description` a double-quoted YAML string. This prevents `:`, `#`, `{}`, brackets, and leading punctuation in
  prose from changing YAML meaning. Escape an embedded double quote as `\"`.
- A folded block scalar (`>-`) is allowed for a deliberately multi-line description, but do not use an unquoted plain
  scalar for a shared skill description.
- Keep `metadata` to a YAML mapping of portable data. Do not put tool-specific execution instructions, paths, tokens,
  or environment-specific values in it.
- Do not use YAML anchors, aliases, tags, merge keys, multiline key syntax, duplicate keys, or provider-defined
  top-level fields. Keep the front matter declarative and small.

### Desired

```yaml
---
name: zazz-board
description: "CLI-first companion skill for service-assisted repos; use when a repo declares Zazz Board as its tracker."
metadata:
  type: integration
---
```

### Not desired

```yaml
---
name: zazz-board
description: CLI-first companion skill: use when a repo declares Zazz Board as its tracker.
runtime: codex
---
```

The unquoted colon makes the description invalid YAML, and `runtime` is an unsupported provider-specific top-level
field. This is the class of failure reported in zazz-board#24.

### Metadata Placement

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
description: "Create or update platform-neutral handoff documents for agents and developers when work needs to be paused, transferred, resumed in another session, or cataloged as follow-up context; use for ephemeral HANDOFF notes, issue catalogs, continuation plans, next-session briefs, and cross-agent summaries."
```

### Not desired

```yaml
description: "Helps with notes."
```

The second description does not give an agent enough signal to invoke the skill reliably.

## Cross-Runtime Body Guidance

Write the body as methodology or tool guidance, not as a system prompt for one product.

- Describe intent, inputs, decision points, safety boundaries, outputs, and verification evidence. Use tool names only
  when the skill is specifically about that tool.
- Refer to repo-local instructions (`AGENTS.md`), repository scripts, and relative companion files. Do not assume a
  runtime has a particular agent-spawning API, built-in browser, file-reading tool, environment variable, or home
  directory layout.
- When a workflow benefits from parallel work, state the required independent review axes and aggregation outcome;
  allow each runtime to use its native coordination mechanism.
- Treat references as progressive disclosure: name the exact relative file and when to read it. Do not require agents
  to preload large templates or every methodology document for a narrow task.
- Tool and service integrations MUST state their activation condition, prerequisite, safe fallback, and non-goals.
  A placeholder integration MUST say that it is not live rather than implying access.
- Prefer repo-native commands and deterministic checks over generic command recipes. Do not embed credentials,
  machine-specific paths, or provider-only installation instructions.

## Skill Portfolio and Admission Rules

Shared skills should add durable process knowledge or a constrained integration. They are not a substitute for a
capable model's normal ability to read code, write a focused change, run a repository command, or explain a language.

Classify each skill before adding or materially expanding it:

| Class | Purpose | Examples in this repository | Admission rule |
| --- | --- | --- | --- |
| Methodology workflow | Encodes a Zazz artifact, lifecycle, evidence, or human decision boundary. | `spec-builder`, `spec-driven`, `qa-testing`, `handoff`, `pr-builder`, `conformance` | Keep when the workflow is reusable across repositories and would otherwise be applied inconsistently. |
| Documentation/process aid | Provides a narrow, repeatable project-governance operation. | `feature-doc-builder`, `architecture-doc-builder`, `proposal-builder`, `standard-builder`, `pr-review`, `doc-check` | Keep it focused on routing, evidence, and outcomes; move long templates to references. |
| Optional integration companion | Safely connects a declared repository tool, storage surface, or command-line utility to the methodology. | `zazz-board`, `gh-issue`, `gh-stack`, `gh-wiki`, `confluence`, `jira`, `worktree`, `psql`, `sqlcmd` | Activate only when the repo declares or uses that integration; include prerequisites and a no-integration fallback. |

Do not add a generic coding skill that restates broad language syntax, framework conventions, test-writing advice, or
step-by-step implementation habits that a current model can infer from the repository and applicable standards.
Put enduring, repo-specific engineering rules in the standards library instead. If a coding helper is proposed, keep
it only when it supplies a concrete safety constraint, an external tool contract, or a repeatable methodology decision
that standards and normal model reasoning cannot provide.

Review the portfolio periodically. Retire or reduce a skill when it duplicates a standard, is an unimplemented
placeholder with no routing value, hard-codes an obsolete runtime, or has become generic advice. Preserve a short
compatibility pointer or migration note when downstream repositories may still reference its name.

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
ruby -e 'require "yaml"; Dir[".agents/skills/*/SKILL.md"].sort.each do |path| raw=File.binread(path); raise "BOM or content before frontmatter: #{path}" unless raw.start_with?("---\n"); fm=raw.split(/^---\s*$/,3)[1] or raise "missing frontmatter: #{path}"; description_line=fm.lines.find { |line| line.start_with?("description:") }; raise "description must be quoted or folded: #{path}" unless description_line&.match?(/^description:\s*(?:"|\x27|[>|])/); data=YAML.safe_load(fm, aliases: false); raise "frontmatter mapping required: #{path}" unless data.is_a?(Hash); extras=data.keys-["name","description","metadata"]; raise "extra top-level fields #{path}: #{extras.join(",")}" if extras.any?; raise "invalid name: #{path}" unless data["name"].is_a?(String) && data["name"].match?(/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/); raise "invalid description: #{path}" unless data["description"].is_a?(String) && !data["description"].empty?; raise "invalid metadata: #{path}" if data.key?("metadata") && !data["metadata"].is_a?(Hash); raise "folder/name mismatch: #{path}" unless File.basename(File.dirname(path)) == data["name"]; end; puts "all skill frontmatter portable"'
```

Also run `git diff --check` and the repo's documentation checks before committing standards or skill edits.

## Related Standards

- [code-structure.md](code-structure.md) for file size, contextual splitting, and incrementally discoverable skills.
- [docs-hygiene.md](docs-hygiene.md) for Markdown voice, examples, linking, and cleanup discipline.
