---
name: conformance
description: Identify and apply a single, atomic code or documentation change that brings a file closer to a prescriptive guide, standard, or convention document. Use when the user wants one focused conformance fix, a small standards-alignment pass, or an incremental cleanup against a named guide.
---

# Conformance

Apply one small, topically isolated change that brings a file into conformance with a guide document. The change should be representable as a single atomic commit.

## Workflow

1. Read the guide or standard named by the user. Extract naming conventions, structural patterns, required signatures, required examples, forbidden shapes, and explicit file paths or path patterns.
2. Discover relevant files. If the user named a file, use only that file. Otherwise, infer candidate files from the guide's path rules, headings, examples, and the current diff.
3. Check for overlapping in-flight work when the repo has PR or task metadata available. Avoid duplicating a conformance fix already underway.
4. Identify candidate non-conformances with approximate file locations, violated guide rule, estimated change size, and risk.
5. Select one atomic change. Prefer the smallest fix that clearly improves conformance without mixing unrelated cleanup.
6. Apply only that change.
7. Run the narrowest relevant formatter, linter, or test command. Broaden only if the changed file is shared or the guide requires broader validation.
8. Summarize the change, the guide rule satisfied, and verification results.

## Selection Rules

- Keep the fix under roughly 100 changed lines unless the user approves a broader sweep.
- Do not combine renaming, restructuring, formatting, and behavior changes unless they are inseparable.
- Do not invent a rule that is not in the guide. General engineering judgment can identify risk, but the conformance fix must cite the guide rule it satisfies.
- Preserve behavior unless the guide explicitly requires behavior change.
- If every candidate is ambiguous or high risk, present the best 2-4 options and ask the user to choose.

## Output

Return:

- changed file(s)
- guide or standard rule satisfied
- verification command(s) and result
- any remaining candidate conformance issues deliberately left for later
