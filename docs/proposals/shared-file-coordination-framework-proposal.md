# Proposal: Shared-File Coordination in the Zazz Methodology

## Status

Draft

## Scope

Methodology-level proposal

## Context and Problem Statement

The methodology expects agents and harness-native subagents to reason about parallel execution, file ownership, and overlapping-file risk. That introduces a practical question:

- where should a repo declare its shared-file coordination model
- how should execution agents know whether to use Zazz Board locks, Switchman, harness-native coordination, or strict serialization
- how do we avoid agents guessing, over-inferencing, or creating inconsistent coordination behavior across repos

The current need is clarity first, not premature abstraction. Repos may use very different execution environments, and many will not use any external locking tool at all.

## Scope and Non-Goals

In scope:

- define a clear methodology approach for shared-file coordination policy
- decide whether this should live in `AGENTS.md`, a separate skill, or both
- outline a future roadmap for dedicated coordination tooling

Out of scope:

- implementing a live file-locking integration
- defining a Switchman protocol before the tool exists
- making agents responsible for discovering undeclared coordination tools

## Business Justification

- Reduces collisions and rework when multiple agents or sub-agents operate in the same deliverable.
- Gives maintainers one clear place to declare execution policy.
- Keeps methodology adoption practical for repos that do not use Zazz Board or any external coordination tool.

## Technical Justification

- Agent execution behavior should be deterministic and auditable.
- Coordination policy is repository workflow configuration, not a secret or runtime environment concern.
- File coordination is an execution concern that may vary by harness, repo, and adoption level.
- A clear policy boundary prevents agents from inventing locking behavior based on incidental repo clues.

## Alternatives Considered

## Option A: Keep Shared-File Coordination Policy in `AGENTS.md` Only

Summary:
Declare the repo's coordination model directly in `AGENTS.md`. The specification or execution contract documents it when relevant. Execution agents apply it.

Pros:

- One obvious source of truth per repo
- Easy for humans to review and update
- Works whether the repo uses Zazz Board, Switchman, or no external tool
- Minimizes methodology complexity right now

Cons:

- `AGENTS.md` can describe policy, but it does not provide implementation capability by itself
- Tool-specific operational detail may eventually outgrow a short repo policy section

## Option B: Add a Dedicated Shared-File Coordination Skill Now

Summary:
Create a new skill that determines and applies the available coordination mechanism for a repo.

Pros:

- Centralizes coordination instructions
- Could evolve into one place for tool adapters and runtime rules
- Reduces repeated wording across workflow skills

Cons:

- Too early unless the actual integrations exist
- Risks over-designing around a capability that is still mostly conceptual
- Creates another layer of indirection for repo maintainers and agents

## Option C: Use Environment Variables to Select the Coordination Mechanism

Summary:
Set env vars that tell the agent whether to use Zazz Board locks, Switchman, or harness-native coordination.

Pros:

- Easy for automation to read
- Potentially convenient in CI or managed agent environments

Cons:

- Poor visibility for humans
- Easy to drift from repo documentation
- Not a good fit for workflow policy
- Weak auditability compared with checked-in repo docs

## Tradeoff Analysis

The key tradeoff is simplicity versus future modularity.

Right now, the methodology needs:

- a single place to declare policy
- clear agent behavior when no external coordination tool exists
- no guessing

That points strongly toward `AGENTS.md` as the immediate answer.

A separate coordination skill becomes attractive later, but only once there is real implementation behind it. Until then, a skill would mostly restate policy that is better kept directly in the repo's `AGENTS.md`.

## Standards and Constraints Analysis

This proposal should align with existing methodology direction:

- `AGENTS.md` already serves as the repo source of truth for docs root, tracking system, and workflow rules
- specifications should capture execution guidance, not invent workflow policy
- agents should follow repo-declared execution policy, not infer missing infrastructure

This proposal preserves those boundaries cleanly.

## Risks and Mitigations

Risk:
`AGENTS.md` becomes too long or too operational.

Mitigation:
Keep the shared-file coordination section short and policy-oriented. Tool-specific execution detail stays in companion utility skills or future integration skills.

Risk:
Repos forget to declare any coordination policy.

Mitigation:
Make the methodology default explicit: if `AGENTS.md` is silent, assume no repo-declared external locking tool exists and use harness-native coordination with serialization for overlapping-file work.

Risk:
Different repos will need different implementations over time.

Mitigation:
Add a future coordination skill only when at least one real implementation path exists and the abstraction provides value beyond policy declaration.

## Dependencies and Sequencing Considerations

Near-term dependency:

- `AGENTS.md` template must explicitly support shared-file coordination declaration

Future dependency if external coordination grows:

- dedicated integration skills or adapters for specific mechanisms

## Recommendation

Use a simple two-layer model.

1. `AGENTS.md` should carry only a short repo policy:
   - which coordination model the repo uses
   - when it applies
   - what the fallback is
2. The deliverable specification should translate that policy into explicit execution guidance:
   - serialization hotspots
   - safe parallel streams
   - steps that must not overlap
   - phase and step sequencing implications
3. The implementation agent should apply the repo policy and the specification's sequencing guidance during execution.

Methodology default:

- If `AGENTS.md` is silent, assume no repo-declared external locking tool exists.
- In that case, use coordination native to the active agent harness.
- Serialize overlapping-file work when safe isolation is not guaranteed.

Future direction:

- Add a dedicated coordination skill only once there is a real implementation surface to wrap.
- Keep that future skill draft-only until at least one concrete mechanism exists beyond policy declaration.

## Proposed Future Skill Direction

Recommended future skill name:

- `shared-file-coordination`

Suggested role:

- companion utility skill for execution agents
- resolves how a declared repo coordination policy is actually applied
- wraps tool-specific adapters rather than forcing every workflow skill to own each mechanism directly

Suggested maturity path:

1. Draft skill only, clearly marked not implemented
2. First concrete adapter: Zazz Board locking if needed beyond current execution-agent usage
3. Second concrete adapter: Switchman, once protocol and operational rules are defined
4. Optional harness-specific adapters only if a harness exposes explicit coordination APIs worth standardizing

## Discussion Log / Notable Arguments

- Shared-file coordination should not become a maze of hierarchy and fallback rules.
- Environment variables are a poor primary source for this kind of repo policy.
- Execution agents need clarity more than flexibility.
- Many repos will have no external locking tool, so the methodology default must be explicit and safe.
- A future Switchman-style skill is likely valuable, but only when it is real enough to justify the abstraction.

## Decision Checklist

- Should the methodology formally require a `Shared-file coordination` section in repo `AGENTS.md`?
- Should the methodology add a draft `shared-file-coordination` skill to the roadmap now, without implementation?

## Open Questions

- Should the future coordination skill be generic (`shared-file-coordination`) or tool-specific (`switchman`, `zazz-locking`)?
- Should the methodology eventually normalize a common coordination vocabulary across all supported tools?
- Should the future skill expose only execution behavior, or also lightweight policy validation against `AGENTS.md`?

## Sign-off Outcome and Next-Phase Handoff

If approved, the next steps would be:

1. Keep `AGENTS.md` concise and policy-only for shared-file coordination.
2. Make deliverable specifications responsible for expressing the sequencing consequences of that policy.
3. Optionally create a draft `shared-file-coordination` roadmap skill once the team wants to formalize future integration work.
