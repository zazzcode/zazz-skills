# zazzctl Command Spec (Draft v0.1)

## Purpose
`zazzctl` is a thin, vendor-neutral CLI adapter for Zazz Board API operations required by worker agents.
It standardizes command shapes, payload construction, output, and exit codes so Claude, Codex, and other agents can run the same execution protocol.

## Scope
This first version targets worker-agent board operations:
- deliverables: list/get/create/status/approve/tasks
- tasks: create/get/update/status/block/unblock/note/delete/readiness/list
- relations: add/list/delete
- graph: get (deliverable graph)
- file locks: list/acquire/heartbeat/release
- worker execution helpers: `exec begin|tick|complete`

## Non-goals (v0.1)
- No local lock-file mechanism (`.zazz` lock JSON). API locks are the source of truth.
- No local DB writes.
- No planner/spec-builder-specific orchestration commands.

## Runtime Requirements
- POSIX shell
- `curl`
- `jq`

## Script Location
- Canonical implementation: `.agents/skills/worker-agent/scripts/zazzctl`
- Root convenience wrapper: `scripts/zazzctl`

## Environment Contract
- `ZAZZ_API_BASE_URL` (default: `http://localhost:3030`)
- `ZAZZ_API_TOKEN` (default: `550e8400-e29b-41d4-a716-446655440000`)
- `ZAZZ_PROJECT_CODE` (default: `ZAZZ`)
- `ZAZZCTL_PRETTY` (`1` default, `0` for raw compact output)

## Output Contract
- Output body is always printed (JSON when API returns JSON).
- `ZAZZCTL_PRETTY=1` pretty-prints JSON.
- Composite `exec` commands return combined JSON objects with per-step results.

## Exit Code Contract
- `0`: success (`2xx`)
- `2`: CLI usage / missing args / dependency not installed
- `10`: lock conflict (`409 FILE_LOCK_CONFLICT`)
- `20`: client/API request error (`4xx` except lock conflict)
- `30`: server/network/unexpected error (`5xx`, network, malformed response)

## Command Surface

### Deliverables
- `zazzctl deliverable list [--project CODE]`
- `zazzctl deliverable get --deliverable-id ID [--project CODE]`
- `zazzctl deliverable create --name NAME --type TYPE [--description TEXT] [--project CODE]`
- `zazzctl deliverable status --deliverable-id ID --status STATUS [--project CODE]`
- `zazzctl deliverable approve --deliverable-id ID [--project CODE]`
- `zazzctl deliverable tasks --deliverable-id ID [--project CODE]`

### Tasks
- `zazzctl task list --deliverable-id ID [--project CODE]`
- `zazzctl task create --deliverable-id ID --title TITLE [--prompt TEXT] [--phase N] [--phase-step X.Y] [--status S] [--priority P] [--agent-name A] [--description D] [--dependencies CSV] [--project CODE]`
- `zazzctl task get --deliverable-id ID --task-id ID [--project CODE]`
- `zazzctl task update --deliverable-id ID --task-id ID --json '{...}' [--project CODE]`
- `zazzctl task status --deliverable-id ID --task-id ID --status STATUS [--agent-name A] [--project CODE]`
- `zazzctl task block --deliverable-id ID --task-id ID --reason REASON [--project CODE]`
- `zazzctl task unblock --deliverable-id ID --task-id ID [--project CODE]`
- `zazzctl task note --deliverable-id ID --task-id ID --note TEXT [--agent-name A] [--project CODE]`
- `zazzctl task delete --deliverable-id ID --task-id ID [--project CODE]`
- `zazzctl task readiness --task-id ID [--project CODE]`

### Relations
- `zazzctl relation list --task-id ID [--project CODE]`
- `zazzctl relation add --task-id ID --related-task-id ID --type DEPENDS_ON|COORDINATES_WITH [--project CODE]`
- `zazzctl relation delete --task-id ID --related-task-id ID --type DEPENDS_ON|COORDINATES_WITH [--project CODE]`

### Graph
- `zazzctl graph get --deliverable-id ID [--project CODE]`

### Locks
- `zazzctl lock list --deliverable-id ID [--project CODE]`
- `zazzctl lock acquire --deliverable-id ID --task-id ID --agent-name A (--file PATH | --files CSV)+ [--phase-step X.Y] [--ttl-seconds N] [--project CODE]`
- `zazzctl lock heartbeat --deliverable-id ID --task-id ID --agent-name A [--file PATH | --files CSV] [--ttl-seconds N] [--project CODE]`
- `zazzctl lock release --deliverable-id ID --task-id ID --agent-name A [--file PATH | --files CSV] [--project CODE]`

### Worker Execution Helpers
- `zazzctl exec begin --deliverable-id ID --task-id ID --agent-name A (--file PATH | --files CSV)+ [--phase-step X.Y] [--ttl-seconds N] [--status IN_PROGRESS] [--project CODE]`
  - acquire lock batch
  - if lock conflict: set `isBlocked=true` + `blockedReason='FILE_LOCK'`
  - if acquired: clear block flags and set task status (default `IN_PROGRESS`)
- `zazzctl exec tick --deliverable-id ID --task-id ID --agent-name A [--file PATH | --files CSV] [--ttl-seconds N] [--note TEXT] [--project CODE]`
  - heartbeat lock lease
  - optional task note append
- `zazzctl exec complete --deliverable-id ID --task-id ID --agent-name A [--status COMPLETED] [--file PATH | --files CSV] [--note TEXT] [--project CODE]`
  - optional note append
  - update status (default `COMPLETED`)
  - release locks

## Worker Protocol (Required)
1. Create/reconcile board task and dependencies.
2. `zazzctl exec begin ...`
3. Implement using TDD (`RED -> GREEN -> REFACTOR`).
4. `zazzctl exec tick ...` periodically while task is active.
5. On owner decision wait: `task block` with `OWNER_DECISION`.
6. On completion: `zazzctl exec complete ...`.
7. Recompute ready set and continue.

## Generic Agent Guidance
- Skills should prefer `zazzctl` for worker board writes instead of handwritten API calls.
- API remains the enforcement authority for transitions/validation.
- If `zazzctl` is unavailable, fallback direct API calls must preserve the same protocol and fields.
