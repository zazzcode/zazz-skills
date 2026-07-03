# zazzctl (Canonical Board CLI)

Canonical location:
- `.agents/skills/zazz-board/scripts/zazzctl.mjs`

Role in the methodology:
- `zazzctl` is the primary agent/operator interface for Zazz Board operations
- this repository defines the expected agent-facing command contract
- [zazz-board](https://github.com/zazzcode/zazz-board) is the reference implementation that should keep the CLI and API in sync

Runtime:
- Node.js 22+

Environment loading:
- `zazzctl` automatically discovers and loads a repo `.env` when present.
- Existing exported environment variables take precedence over values from the env file.
- Set `ZAZZCTL_ENV_FILE=/path/to/.env` to force a specific env file.
- Set `ZAZZCTL_NO_ENV=1` to disable env-file auto-loading.

Quick start:
```bash
node .agents/skills/zazz-board/scripts/zazzctl.mjs help
node .agents/skills/zazz-board/scripts/zazzctl.mjs help deliverable
node .agents/skills/zazz-board/scripts/zazzctl.mjs help exec begin
```

Source-of-truth model:
- use CLI help and commands first for normal agent work
- use OpenAPI in `zazz-board` as the protocol-validation and fallback surface
- if a capability is missing from the CLI, improve the CLI/skill contract rather than teaching agents to permanently bypass it

Environment:
```bash
export ZAZZ_API_BASE_URL="http://localhost:3030"
export ZAZZ_API_TOKEN="${ZAZZ_API_TOKEN:-660e8400-e29b-41d4-a716-446655440101}"
export ZAZZ_PROJECT_CODE="ZAZZ"
```

If the repo keeps these values in `.env`, `zazzctl` will pick them up automatically when run from that repo.

Profiles:
- `worker`: execution task/relation/lock workflow; read-only deliverable ops
- `planner`: specification setup updates and read checks
- `spec_builder`: deliverable create/status/update for specification sync
- `generic`: unrestricted adapter (use sparingly)

The `worker` and `planner` names are CLI permission profiles, not methodology skill names.

Examples:
```bash
# Execution claim + lock protocol
node .agents/skills/zazz-board/scripts/zazzctl.mjs --profile worker exec begin \
  --deliverable-id 8 --task-id 25 --agent-name implementation-agent-1 --file src/routes/example.js

# `planner` profile sets specification status and execution-contract path
node .agents/skills/zazz-board/scripts/zazzctl.mjs --profile planner deliverable status \
  --deliverable-id 4 --status PLANNING
node .agents/skills/zazz-board/scripts/zazzctl.mjs --profile planner deliverable update \
  --deliverable-id 4 --json '{"specFilepath":"<DOCS_ROOT>/specifications/sample-feature.md"}'

# Spec builder creates deliverable, sets BACKLOG, then saves specification filepath
node .agents/skills/zazz-board/scripts/zazzctl.mjs --profile spec_builder deliverable create \
  --name "sample-feature" --type FEATURE
node .agents/skills/zazz-board/scripts/zazzctl.mjs --profile spec_builder deliverable status \
  --deliverable-id 4 --status BACKLOG
node .agents/skills/zazz-board/scripts/zazzctl.mjs --profile spec_builder deliverable update \
  --deliverable-id 4 --json '{"specFilepath":"<DOCS_ROOT>/specifications/sample-feature.md"}'
```
