# Proposal Builder Skill — User Guide

How to use the Proposal Builder skill to create a high-quality proposal document for a feature, a deliverable, or both.

---

## What It Does

The Proposal Builder skill acts as a **facilitator + scribe**.
It helps stakeholders discuss:
- why a change should be done (business and technical justification)
- expected value and outcomes
- alternative approaches and tradeoffs
- high-level implementation considerations (`how` options), not just intent
- risks, constraints, and open questions

Then it drafts/iterates a proposal document.

## How the Dialogue Works

This is an interactive, back-and-forth skill.

You do not need to provide every detail up front. A good starting prompt is usually enough to begin. The agent should then:

- ask clarifying questions
- surface tradeoffs and alternatives
- draft a proposal early
- refine the proposal with you over multiple turns

Expect a collaborative working session, not a one-shot document generator.

---

## When to Use It

Use this skill when:
- you’re exploring a new feature direction
- you want to compare implementation approaches before committing
- there’s stakeholder disagreement and you need structured decision support
- you want a proposal before writing/updating SPEC

---

## Input Modes

1. **Live dialogue** — one or more humans discuss with the skill in an agent session.
2. **Transcript mode** — paste meeting transcript text and ask the skill to draft/update the proposal.
3. **Transcript + Q&A mode** — start from transcript extraction, then run a focused follow-up question/answer session to close gaps.
4. **Zoom live facilitation (experimental)** — when integration exists, the agent listens to live discussion and asks clarifying questions in Zoom chat.

---

## Transcript-First Workflow (Recommended)

Use this when you’ve already had a proposal discussion call:

1. Paste transcript text from the call.
2. Ask it to extract:
   - problem statement
   - key arguments
   - options considered
   - tradeoffs raised
   - risks, assumptions, and open questions
3. Have it generate a first proposal draft from that extraction.
4. Run a short Q&A pass to resolve ambiguities and fill missing details.
5. Regenerate/refine the proposal.

This gives you faster convergence and avoids rehashing the full conversation.

---

## Future Capability: Zoom Listening

Future direction (not required for current workflow):
- subscribe to live meeting audio/transcript stream (e.g., Zoom transcript feed)
- continuously capture arguments, decisions, and unresolved questions
- proactively prompt participants with missing decision questions
- produce rolling proposal updates during/after the call

Current practical approach is transcript ingestion + interactive follow-up.

### Zoom Chat Facilitation Pattern
When live integration exists, the proposal workflow should:
- ask one focused question at a time in chat
- tag question intent (scope/value/alternative/risk/decision)
- summarize unresolved items every few questions
- convert participant responses into proposal updates

---

## Key Phrases You Can Use

- “Use proposal-builder”
- “We want to propose a new feature”
- “Draft a proposal for this deliverable”
- “Generate proposal”
- “Here is transcript text — extract decisions and draft proposal”

## Example Starter Prompts

Use prompts like these:

### Example 1: New feature proposal

```text
Use proposal-builder.
I want to create a proposal for adding role-based access control to our application.
The main goal is to support admin-managed roles and permissions across the API and UI.
Please guide me through the proposal in a back-and-forth dialogue and help me compare implementation approaches before drafting the document.
```

### Example 2: Deliverable-focused proposal

```text
Use proposal-builder.
I want a proposal for whether we should add a CLI workflow for managing Zazz Board deliverables instead of relying only on direct API usage.
Please help me think through the value, alternatives, risks, and recommendation.
```

### Example 3: Transcript-first proposal

```text
Use proposal-builder.
I am pasting a meeting transcript about a proposed feature.
Please extract the problem statement, options, tradeoffs, risks, and open questions, then draft a proposal and ask follow-up questions where the transcript is ambiguous.
```

### Prompt structure that works well

The best starting prompts usually include:

- what the proposal is about
- whether it is feature-scoped, deliverable-scoped, or both
- why it matters
- whether you want live dialogue, transcript ingestion, or both
- a request for iterative drafting

---

## Output

A proposal document with:
- context/problem
- business + technical justification (the **why**)
- alternatives and tradeoffs
- implementation strategy options and constraints (the **how** discussion at proposal level)
- recommendation
- risks, dependencies, open questions
- discussion log highlights (especially for multi-person dialogue)
- sign-off outcome and handoff notes for the next phase

Naming follows framework conventions:
- Proposal document: `proposals/{proposal-slug}.md`

---

## Notes

- Proposal is exploratory and non-authoritative.
- Feature Requirements Documents and SPECs remain authoritative contracts.
- The skill should reference project standards while comparing approaches.
- Proposal discussion can include technical implementation direction; final implementation contract still belongs in SPEC/PLAN.
- After proposal sign-off, transition to `feature-doc-builder`, `spec-builder`, or both using the proposal handoff summary.
