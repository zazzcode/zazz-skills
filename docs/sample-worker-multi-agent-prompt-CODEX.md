Execute deliverable ZAZZ-6 from:
- SPEC: /Users/michael/Dev/zazz-board/multiple-agent-tokens-feature/.zazz/deliverables/ZAZZ-6-multiple-agent-tokens-feature-SPEC.md
- PLAN: /Users/michael/Dev/zazz-board/multiple-agent-tokens-feature/.zazz/deliverables/ZAZZ-6-multiple-agent-tokens-feature-PLAN.md

Execution requirements:
1. Use multi-agent execution with 3 subagents in parallel whenever dependencies allow.
2. Enforce strict disjoint file ownership per subagent. If file ownership overlaps, serialize those tasks.
3. Use the worker-agent and zazz-board-api skills and the zazzctl CLI for board operations.
4. Apply harness-aware locking policy:
   - If subagents are isolated with disjoint ownership + parent-controlled merges, API file locks may be skipped for those internal subagents.
   - If any external concurrency risk is detected, use API file locks via zazzctl exec begin/tick/complete.
5. Parent agent must integrate/merge subagent outputs, run required tests, and only then update board statuses.
6. Keep board truth synced continuously (task creation, relations, status, blockers, notes).
7. Run full verification from the PLAN test matrix before declaring done.

Process:
- Start with a brief execution map: which PLAN steps are assigned to which subagent and file ownership per subagent.
- Then execute.
- Report progress after each phase and include blockers/decisions immediately.  Blocked tasks should be updated using the zazzctl CLI
