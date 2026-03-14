# zazzctl (Canonical Board CLI)

Canonical location:
- `.agents/skills/zazz-board-api/scripts/zazzctl.mjs`

Runtime:
- Node.js 22+

Quick start:
```bash
node .agents/skills/zazz-board-api/scripts/zazzctl.mjs help
```

Environment:
```bash
export ZAZZ_API_BASE_URL="http://localhost:3030"
export ZAZZ_API_TOKEN="${ZAZZ_API_TOKEN:-550e8400-e29b-41d4-a716-446655440000}"
export ZAZZ_PROJECT_CODE="ZAZZ"
```

Profiles:
- `worker`: task/relation/lock/exec workflow; read-only deliverable ops
- `planner`: deliverable planning updates and read checks
- `spec_builder`: deliverable create/status/update for SPEC sync
- `generic`: unrestricted adapter (use sparingly)

Examples:
```bash
# Worker claim + lock protocol
node .agents/skills/zazz-board-api/scripts/zazzctl.mjs --profile worker exec begin \
  --deliverable-id 8 --task-id 25 --agent-name worker-1 --file api/src/routes/fileLocks.js

# Planner sets planning status and plan path
node .agents/skills/zazz-board-api/scripts/zazzctl.mjs --profile planner deliverable status \
  --deliverable-id 4 --status PLANNING
node .agents/skills/zazz-board-api/scripts/zazzctl.mjs --profile planner deliverable update \
  --deliverable-id 4 --json '{"planFilepath":".zazz/deliverables/ZAZZ-6-multiple-agent-tokens-feature-PLAN.md"}'

# Spec builder creates deliverable, sets BACKLOG, then saves SPEC filepath
node .agents/skills/zazz-board-api/scripts/zazzctl.mjs --profile spec_builder deliverable create \
  --name "multiple-agent-tokens-feature" --type FEATURE
node .agents/skills/zazz-board-api/scripts/zazzctl.mjs --profile spec_builder deliverable status \
  --deliverable-id 4 --status BACKLOG
node .agents/skills/zazz-board-api/scripts/zazzctl.mjs --profile spec_builder deliverable update \
  --deliverable-id 4 --json '{"specFilepath":".zazz/deliverables/ZAZZ-6-multiple-agent-tokens-feature-SPEC.md"}'
```
