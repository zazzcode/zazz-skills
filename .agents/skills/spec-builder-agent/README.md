# Spec Builder Agent — User Guide

How to work with the Spec Builder agent to create a Deliverable Specification (SPEC) for the Zazz framework.

---

## How to Load the Skill

The skill lives at `.agents/skills/spec-builder-agent/`. Different tools discover and invoke it differently.

### Cursor

1. **Open Agent chat** — `Cmd+I` (Mac) or `Ctrl+I` (Windows/Linux).

2. **Load the skill** (pick one):
   - **Slash command**: Type `/` in the chat input, then search for `spec-builder` or `spec builder`. Select the spec-builder-agent skill.
   - **@ mention**: Type `@` and the path: `@.agents/skills/spec-builder-agent/SKILL.md`. This adds the skill file to context.
   - **Explicit request**: Say "Use the spec-builder-agent skill" or "Load the spec builder skill" at the start of your message.

3. **Start the dialogue** — e.g., "I want to create a spec for user authentication."

**Note**: Cursor auto-discovers skills in `.agents/skills/`. For reliable behavior, use `/spec-builder-agent` or @ mention the skill.

---

### Claude Code

Claude Code looks for skills in `.claude/skills/` (project) or `~/.claude/skills/` (personal). This skill is in `.agents/skills/`, so you have two options:

**Option A — Symlink** (keeps one copy):
```bash
mkdir -p .claude/skills
ln -s ../../.agents/skills/spec-builder-agent .claude/skills/spec-builder-agent
```

**Option B — Copy** the skill folder into `.claude/skills/spec-builder-agent/`.

Then:

1. **Invoke directly**: Type `/spec-builder-agent` in the Claude Code chat. The skill name (from frontmatter) becomes the slash command.
2. **Auto-load**: Describe your task—e.g., "I want to create a deliverable spec for user auth." Claude may load the skill automatically when it matches the description.
3. **Start the dialogue** — e.g., "I want to create a spec for user authentication."

---

### Warp

Warp discovers skills from `.agents/skills/` (and `.claude/skills/`, `.cursor/skills/`, etc.) at the project root. No extra setup needed.

1. **Open an Agent conversation** in Warp.

2. **Load the skill** (pick one):
   - **Slash command**: Type `/spec-builder-agent` in the chat. Warp invokes the skill directly.
   - **Natural language**: Say "Use the spec-builder-agent skill" or "Create a deliverable spec for user authentication." The agent receives all available skills and loads this one when it matches your request.
   - **List skills**: Ask "What skills do I have?" to see spec-builder-agent in the list.

3. **Start the dialogue** — e.g., "I want to create a spec for user authentication."

**Note**: Warp scans from your current directory up to the repo root. Ensure you're in the project (or a subdirectory) so the skill is discovered. Use `/open-skill` to browse or edit skills.

---

## What It Does

The Spec Builder agent conducts a **dialogue** with you to produce a comprehensive SPEC document. The SPEC defines what gets built, acceptance criteria, tests, and agent guidelines. It becomes the source of truth for the Planner, Workers, and QA.

---

## How to Start

1. Load the spec-builder-agent skill (see [How to Load the Skill](#how-to-load-the-skill) above for Cursor, Claude Code, or Warp). Load zazz-board-api too if you want board integration.
2. Tell the agent what you want to build, e.g.:
   - "I want to create a spec for user authentication"
   - "Let's define a deliverable for the API rate-limiting feature"
3. Answer the agent's questions. It will ask about problem statement, standards, features, acceptance criteria, tests, and more.

---

## Key Phrases You Can Say

| Say this | Agent does |
|----------|------------|
| **"Generate the spec"** / **"Generate a version"** / **"Create a draft"** / **"Write the spec"** / **"Draft it"** | Writes the SPEC document immediately so you can review it. You don't have to wait for the full dialogue—the agent produces the best draft from what's been discussed so far. Then you give feedback and iterate. |
| **"Development mode"** / **"We're in development mode"** / **"Run in development mode"** | **For improving the skill itself.** The focus is on iterating on SKILL.md—the spec dialogue is a way to exercise and refine the skill. Agent writes the SPEC file only (no API calls) and may edit SKILL.md based on your feedback. |

---

## Workflow

1. **Describe** — Tell the agent what you're building and why.
2. **Answer** — Respond to clarifying questions (features, edge cases, constraints, standards).
3. **Generate** — When ready, say "generate the spec" or "create a draft" to get a file to review.
4. **Iterate** — Review the draft, give feedback ("add X", "clarify Y", "AC3 should say..."), and ask for another version.
5. **Approve** — When satisfied, approve. The agent will sync the spec path to Zazz Board (unless in development mode).

---

## Output

- **File**: `.zazz/deliverables/{deliverable-name}-SPEC.md`
- **Board** (if not in development mode): The agent updates the deliverable card with the spec path (`dedFilePath`) so it's visible and stored in the database.

---

## Development Mode

**Development mode is for improving the skill itself.**

Use it when you want to iterate on the spec-builder skill—refine the dialogue flow, questions, template, or techniques. The spec generation is secondary: you run the dialogue to exercise the skill, see what it produces, and give feedback. The **primary goal** is to improve `SKILL.md` so the next session works better.

- Say **"development mode"** at any point, or set `ZAZZ_SPEC_BUILDER_DEV_MODE=1` before starting.
- Agent writes the SPEC file only (no API calls).
- Agent may edit `SKILL.md` based on your feedback—e.g., "add a question about X", "the AC format should...", "the decomposition section needs to probe for Y".

---

## Tips

- **Be specific** — "Fast" → "API response < 200ms for p99". The agent will ask if you're vague.
- **Generate early** — You can say "generate a draft" partway through to see what you have. Iterate from there.
- **Reference standards** — The agent reads `.zazz/standards/` and will discuss which apply. You can override or add exceptions.
- **Complex deliverables** — The agent will help you break them into components and define what can run in parallel vs sequential.
