# Debug Skill — User Guide

How to use the Debug skill to investigate unexpected behavior, trace bugs, and diagnose broken environments.

## What It Does

The Debug skill guides structured investigation of a problem before touching production code or infrastructure.

It helps with:
- forming and testing a hypothesis about the root cause
- identifying the smallest reproduction case
- tracing execution paths through logs, traces, and code
- diagnosing broken environments (missing config, bad state, version mismatches)
- distinguishing a code bug from a data bug from an environment bug
- deciding when enough is understood to write a fix vs. when more investigation is needed

This skill is for investigation. It does not implement fixes. Once the root cause is confirmed, hand off to `spec-builder` for a bounded fix deliverable.

## When to Use It

Use this skill when:
- behavior does not match the spec or the feature document
- a test is failing and the cause is not immediately obvious
- a production issue needs a root-cause diagnosis before a fix lands
- an environment is behaving unexpectedly (wrong config, broken deps, stale state)
- you want a structured second opinion before assuming you know the cause

Do not use this skill to rubber-stamp a fix you already decided to make. Use it when the cause is genuinely unclear.

## Methodology Fit

Investigation is a normal part of delivery. When a debug session reveals:
- a bug in the current deliverable: record findings in the run log and continue with the fix in the same SPEC
- a bug outside the current deliverable scope: create a new deliverable via `spec-builder` before touching out-of-scope code
- a spec ambiguity: stop and resolve the ambiguity in the SPEC before implementing

## Example Prompts

```text
Use debug.
A test is failing after my last commit but the error message is misleading.
Please help me trace the actual failure path.
```

```text
Use debug.
Our API is returning 500 for one specific request shape in production.
We have logs. Please help me form a hypothesis and identify what to check next.
```

```text
Use debug.
My local environment is broken — tests pass in CI but fail locally.
Please help me diagnose whether this is a config, dependency, or code issue.
```

```text
Use debug.
I think I know the cause of this bug but I'm not fully confident.
Please help me verify my hypothesis before I write the fix.
```

## How the Dialogue Works

The skill works through a structured investigation loop:

1. **Symptom** — what is the observed behavior vs. expected behavior?
2. **Scope** — is this a code bug, data bug, environment bug, or spec ambiguity?
3. **Hypothesis** — what is the most likely cause given the evidence?
4. **Evidence** — what logs, traces, test output, or code paths support or contradict the hypothesis?
5. **Reproduction** — can the problem be reproduced reliably? What is the smallest case?
6. **Conclusion** — is the root cause confirmed? What is the fix boundary?

The skill asks focused questions, helps read evidence, and keeps the investigation from widening unnecessarily.

## What You Should Have Ready

The more of these you can provide, the faster the diagnosis:
- description of the symptom (what happened vs. what should have happened)
- relevant logs, error messages, or stack traces
- the last change that might have introduced the problem
- whether the problem is reproducible and under what conditions
- any hypotheses you already have

## Output

The skill should produce:
- a confirmed or falsified root cause statement
- the evidence chain that supports the conclusion
- a recommended fix boundary (what file/layer/scope the fix should touch)
- a handoff summary suitable for use as input to `spec-builder` when a new deliverable is needed

## Notes

- Do not widen scope during investigation. If the bug touches out-of-scope code, note it and stop.
- Prefer reading existing evidence over adding new instrumentation. Add logging only when existing signals are insufficient.
- The goal of investigation is a confident root cause, not a complete audit of the surrounding code.
- If the investigation reveals the behavior is correct and the spec is wrong, surface that as a spec question rather than a fix.
