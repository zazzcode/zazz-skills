---
name: debug
description: >-
  Guide structured investigation of unexpected behavior, failing tests, or broken environments;
  use when the root cause of a bug or issue is unclear and needs systematic diagnosis before a fix is written.
  Produces a confirmed root cause and handoff summary for spec-builder. Does not implement fixes.
---

# Debug Skill

## Required Repo Extension Check

Before doing anything else, check for `.claude/skill-extensions/debug/EXTENSION.md`. If it exists,
read it immediately after this `SKILL.md` and apply it as repo-specific guidance.

## Startup Sequence

1. Check for the repo extension file above and read it if present.
2. Read `AGENTS.md` if available to understand repo-specific environment, test commands, and log locations.
3. Ask for the symptom if not already provided: what was observed vs. what was expected?
4. Begin the investigation loop. Do not jump to a fix.

## Mission

Guide the user through a structured root-cause investigation. The output is a confirmed root cause and
a fix boundary recommendation — not an implementation.

This skill ends when the cause is confirmed and the fix scope is clear. Implementation belongs in a
deliverable SPEC produced by `spec-builder`.

## Investigation Loop

Work through these stages. Revisit earlier stages if new evidence contradicts the current hypothesis.

### 1. Symptom

Establish:
- what behavior was observed
- what behavior was expected
- when the problem was first noticed and whether it is new or long-standing
- whether it is reproducible and under what conditions

### 2. Scope Classification

Classify the problem before investigating further. Most bugs fall into one of:

- **Code bug** — the implementation does not match the spec or feature intent
- **Data bug** — the code is correct but the data in the system is in an unexpected state
- **Environment bug** — the code and data are correct but the environment is misconfigured or has stale state
- **Spec ambiguity** — the spec did not define this case and the implementation made a choice that turns out to be wrong

The fix approach is different for each class. Do not treat a data bug as a code bug or vice versa.

### 3. Hypothesis

Form the most specific hypothesis that fits the current evidence. A good hypothesis:
- names a specific component, function, or configuration path
- predicts a specific observable consequence
- is falsifiable with available evidence

Avoid hypotheses of the form "something is broken somewhere."

### 4. Evidence Gathering

Read what is already available before adding new instrumentation:
- error messages and stack traces
- application logs and structured log fields
- test output and failure messages
- recent git commits that touched relevant code
- configuration files and environment variables

If existing evidence is insufficient, add the minimum necessary logging or assertions to generate signal.
Remove diagnostic instrumentation before the fix is finalized.

### 5. Reproduction

Establish the smallest reliable reproduction case:
- can the problem be triggered consistently?
- what is the minimal input or state that triggers it?
- does the problem disappear under certain conditions (and why)?

A reproduction case that cannot be reduced is a warning that the hypothesis may be wrong.

### 6. Conclusion

Confirm or falsify the hypothesis based on evidence. A confirmed conclusion:
- names the specific root cause
- explains the mechanism (why does this input cause this outcome?)
- identifies the fix boundary (which file, function, layer, or config should change)
- notes whether the fix is in scope for the current deliverable or requires a new one

## Scope Discipline

- Do not widen the investigation beyond what is needed to confirm the root cause.
- If the investigation reveals a related problem outside the current scope, note it and stop. Do not fix it.
- If the cause turns out to be a spec ambiguity, surface it as a spec question rather than implementing a choice.
- If the cause is a data problem, the fix may be a migration or admin action rather than a code change.

## Handoff to spec-builder

When the root cause is confirmed, produce a handoff summary:

1. Root cause statement (one paragraph, specific)
2. Evidence chain (the key observations that led to the conclusion)
3. Fix boundary (which scope the fix should touch)
4. Delivery topology recommendation (fix within current deliverable, new deliverable, or ops action)
5. Any related issues discovered that are out of scope for this fix

This summary is the input to `spec-builder` if a new deliverable is needed.

## Quality Bar

The investigation is complete when:
- the root cause is stated specifically (not "something in the auth layer")
- the fix boundary is scoped to a single layer or component
- the reproduction case is documented
- the evidence chain would convince a skeptical reviewer

## Development Mode

If the user says "development mode", the focus is on improving this skill itself. In development mode,
you may edit `.agents/skills/debug/SKILL.md`. Outside development mode, this file is read-only.
