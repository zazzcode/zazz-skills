---
name: conformance
description: Identify and apply a small, PR-sized code or documentation change that brings a bounded area of a repo into conformance with a named standard, guide, or convention document, then verify and prepare PR-ready evidence. Use when the user wants standards-driven maintenance, legacy-code cleanup, drift prevention, an automated or on-demand conformance pass, a ready-for-review conformance PR, a focused conformance fix, or an incremental cleanup against standards for a specific package, service, module, file, or docs area.
---

# Conformance

Apply one small, topically isolated change that brings a bounded part of a repo into conformance with a named standard. The change should be suitable for a focused PR and should keep existing code and docs from drifting away from the standards the team has adopted.

Use standards as the authority. Conformance work can inspect legacy or existing code for drift, but it must not invent new rules. If the needed rule does not exist, recommend creating or updating a standard before applying broad cleanup.

Stay language- and stack-agnostic. Do not assume any particular programming language, runtime, framework, package
manager, architecture layer, or diagnostic toolchain. Discover the repo's standards, manifests, scripts, CI jobs, and
local instructions, then use the diagnostics and test commands that apply to the bounded area.

The intended operating model is relatively hands-off when the repo has strong deterministic gates and sufficient tests:
run a localized pass on demand, apply a safe fix independently, verify it, run self-review, address self-review
findings that stay within scope, and open a ready-for-review PR for human approval. Treat it like an automated
dependency-update PR: routine, bounded, evidence-backed, and easy for a reviewer to sign off.

## Autonomy Modes

- **Ready PR mode**: Use when the user asks for an automated pass or PR and the safety envelope is strong. Apply the
  fix, run required checks, run self-review, address in-scope self-review findings, and prepare a ready-for-review PR.
- **Patch mode**: Use when PR tooling is unavailable or the user asks only for local changes. Apply and verify the fix,
  then return PR-ready evidence.
- **Triage mode**: Use when the standard, scope, tests, or expected behavior are unclear. Identify candidates and ask
  for direction before editing.

## Workflow

1. Identify the governing standard and bounded code area. Prefer an explicit user-provided standard section plus path, package, service, module, or file list.
2. If the user provides only a standard, inspect the standards index or guide metadata for `applies_to` paths and choose a conservative bounded area. If several areas are plausible, present the best 2-4 options.
3. Read the named guide or standard. Extract required structure, naming conventions, test expectations, mocking rules, evidence requirements, forbidden shapes, halt conditions, and explicit path patterns.
4. Discover the bounded area's language, framework, runtime, package manager, test runner, and diagnostic commands from repo files and instructions. Use neutral repo-local evidence instead of assuming a default stack.
5. Discover relevant files inside the bounded area. Avoid expanding into unrelated packages, generated code, vendored dependencies, or broad formatting churn.
6. Confirm the autonomy mode and safety envelope: existing tests, deterministic gates, expected behavior preservation, and whether the repo permits automated PR preparation for this kind of change.
7. Check for overlapping in-flight work when the repo has PR or task metadata available. Avoid duplicating a conformance fix already underway.
8. Identify candidate non-conformances with file locations, violated standard section, estimated change size, likely verification command, and risk.
9. Select one PR-sized change. Prefer the smallest fix that clearly improves conformance without mixing unrelated cleanup.
10. Apply only that change.
11. Run the narrowest relevant formatter, linter, type check, doc check, or test command. Broaden only if the changed file is shared or the standard requires broader validation.
12. Run self-review when the repo has an automated review workflow. Fix self-review findings that are within the same standard, bounded area, and risk envelope; leave wider findings as follow-up candidates.
13. Summarize the change, the standard rule satisfied, verification results, self-review result, and remaining conformance candidates. If the user asked for PR preparation and repo policy allows it, package the result as a ready-for-review PR. Use draft only when repo policy requires draft-first PRs or evidence is incomplete.

## Selection Rules

- Keep the fix under roughly 100 changed lines unless the user approves a broader sweep.
- Do not combine renaming, restructuring, formatting, and behavior changes unless they are inseparable.
- Do not invent a rule that is not in the standard. General engineering judgment can identify risk, but the conformance fix must cite the standard rule it satisfies.
- Preserve behavior unless the standard explicitly requires behavior change.
- Prefer deterministic enforcement when available: formatter, linter, type checker, schema validator, accessibility checker, doc checker, or test suite.
- Treat missing deterministic tooling as a standards gap. Do not replace explicit evidence requirements with intuition.
- Keep conformance work reviewable. A good output can become a small PR with one theme, clear evidence, and a short list of follow-up candidates.
- Be more autonomous only when tests and deterministic checks cover the affected behavior. If coverage is weak, keep the pass smaller, produce clearer residual risk, or stop for human direction.
- Prefer repeated localized passes over one sweeping cleanup. The goal is a stream of easy approvals, not a heroic migration diff.
- If every candidate is ambiguous or high risk, present the best 2-4 options and ask the user to choose.

## Ready PR Criteria

Prepare a ready-for-review PR only when all are true:

- the fix is bound to one named standard and one bounded repo area
- required formatter, linter, type, schema, doc, or test checks pass or have explained non-blocking failures
- automated self-review has no unresolved in-scope findings
- the PR body can cite the standard section, changed files, verification commands, self-review result, and residual risk
- merge still requires human approval

Use a draft PR, local patch, or triage output instead when these criteria are not met.

## Output

Return:

- changed file(s)
- standard section or rule satisfied
- verification command(s) and result
- self-review command(s), findings, and follow-up fixes when run
- remaining candidate conformance issues deliberately left for later
- PR-ready summary of why the change prevents standards drift
- ready-for-review PR title/body when PR preparation is requested
