# Proposal Builder Skill — User Guide

How to use the Proposal Builder skill to create a high-quality Proposal (`-PROP`) for a feature, a deliverable, or both.

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
- Feature proposal: `features/{feature-key}/{feature-key}-PROP.md`
- Deliverable proposal: `deliverables/{deliverable-id}/{deliverable-id}-PROP.md`

---

## Notes

- Proposal is exploratory and non-authoritative.
- FRD/SPEC remain authoritative contracts.
- The skill should reference project standards while comparing approaches.
- Proposal discussion can include technical implementation direction; final implementation contract still belongs in SPEC/PLAN.
- After proposal sign-off, transition to specification phase (typically via `spec-builder`) using the proposal handoff summary.
