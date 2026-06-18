---
name: conformance
description: Identify and apply a small, PR-sized code or documentation change that brings a bounded area of a repo into conformance with a named standard, guide, or convention document. Use when the user wants standards-driven maintenance, legacy-code cleanup, drift prevention, a focused conformance fix, or an incremental cleanup against standards for a specific package, service, module, file, or docs area.
---

# Conformance

Apply one small, topically isolated change that brings a bounded part of a repo into conformance with a named standard. The change should be suitable for a focused PR and should keep existing code and docs from drifting away from the standards the team has adopted.

Use standards as the authority. Conformance work can inspect legacy or existing code for drift, but it must not invent new rules. If the needed rule does not exist, recommend creating or updating a standard before applying broad cleanup.

## Workflow

1. Identify the governing standard and bounded code area. Prefer an explicit user-provided standard section plus path, package, service, module, or file list.
2. If the user provides only a standard, inspect the standards index or guide metadata for `applies_to` paths and choose a conservative bounded area. If several areas are plausible, present the best 2-4 options.
3. Read the named guide or standard. Extract required structure, naming conventions, test expectations, mocking rules, evidence requirements, forbidden shapes, halt conditions, and explicit path patterns.
4. Discover relevant files inside the bounded area. Avoid expanding into unrelated packages, generated code, vendored dependencies, or broad formatting churn.
5. Check for overlapping in-flight work when the repo has PR or task metadata available. Avoid duplicating a conformance fix already underway.
6. Identify candidate non-conformances with file locations, violated standard section, estimated change size, likely verification command, and risk.
7. Select one PR-sized change. Prefer the smallest fix that clearly improves conformance without mixing unrelated cleanup.
8. Apply only that change.
9. Run the narrowest relevant formatter, linter, type check, doc check, or test command. Broaden only if the changed file is shared or the standard requires broader validation.
10. Summarize the change, the standard rule satisfied, verification results, and remaining conformance candidates.

## Selection Rules

- Keep the fix under roughly 100 changed lines unless the user approves a broader sweep.
- Do not combine renaming, restructuring, formatting, and behavior changes unless they are inseparable.
- Do not invent a rule that is not in the standard. General engineering judgment can identify risk, but the conformance fix must cite the standard rule it satisfies.
- Preserve behavior unless the standard explicitly requires behavior change.
- Prefer deterministic enforcement when available: formatter, linter, type checker, schema validator, accessibility checker, doc checker, or test suite.
- Treat missing deterministic tooling as a standards gap. Do not replace explicit evidence requirements with intuition.
- Keep conformance work reviewable. A good output can become a small PR with one theme, clear evidence, and a short list of follow-up candidates.
- If every candidate is ambiguous or high risk, present the best 2-4 options and ask the user to choose.

## Output

Return:

- changed file(s)
- standard section or rule satisfied
- verification command(s) and result
- remaining candidate conformance issues deliberately left for later
- PR-ready summary of why the change prevents standards drift
