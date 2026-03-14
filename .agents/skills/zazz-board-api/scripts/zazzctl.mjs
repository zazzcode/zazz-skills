#!/usr/bin/env node
/**
 * zazzctl (Node canonical CLI)
 * Cross-platform board API adapter for all agent skills.
 */

const DEFAULT_BASE_URL = 'http://localhost:3030';
const DEFAULT_TOKEN = '550e8400-e29b-41d4-a716-446655440000';
const DEFAULT_PROJECT = 'ZAZZ';

const env = process.env;
const config = {
  baseUrl: env.ZAZZ_API_BASE_URL || DEFAULT_BASE_URL,
  token: env.ZAZZ_API_TOKEN || DEFAULT_TOKEN,
  projectCode: env.ZAZZ_PROJECT_CODE || DEFAULT_PROJECT,
  pretty: env.ZAZZCTL_PRETTY !== '0',
  profile: (env.ZAZZCTL_PROFILE || 'generic').toLowerCase(),
};

let lastHttp = 0;
let lastBody = {};

const PROFILE_ALLOW = {
  generic: null,
  worker: new Set([
    'deliverable:list',
    'deliverable:get',
    'deliverable:tasks',
    'task:list',
    'task:create',
    'task:get',
    'task:update',
    'task:status',
    'task:block',
    'task:unblock',
    'task:note',
    'task:delete',
    'task:readiness',
    'relation:list',
    'relation:add',
    'relation:delete',
    'graph:get',
    'lock:list',
    'lock:acquire',
    'lock:heartbeat',
    'lock:release',
    'exec:begin',
    'exec:tick',
    'exec:complete',
  ]),
  planner: new Set([
    'deliverable:list',
    'deliverable:get',
    'deliverable:update',
    'deliverable:status',
    'deliverable:approve',
    'deliverable:tasks',
    'task:list',
    'task:get',
    'task:readiness',
    'relation:list',
    'graph:get',
  ]),
  spec_builder: new Set([
    'deliverable:create',
    'deliverable:update',
    'deliverable:status',
    'deliverable:get',
    'deliverable:list',
  ]),
};

function usage() {
  const text = `Usage: zazzctl [--profile generic|worker|planner|spec_builder] <resource> <action> [options]

Resources:
  deliverable  list|get|create|update|status|approve|tasks
  task         list|create|get|update|status|block|unblock|note|delete|readiness
  relation     list|add|delete
  graph        get
  lock         list|acquire|heartbeat|release
  exec         begin|tick|complete

Environment:
  ZAZZ_API_BASE_URL (default: ${DEFAULT_BASE_URL})
  ZAZZ_API_TOKEN    (default fallback: seed token)
  ZAZZ_PROJECT_CODE (default: ${DEFAULT_PROJECT})
  ZAZZCTL_PRETTY    (1 pretty JSON, 0 compact)
  ZAZZCTL_PROFILE   (generic|worker|planner|spec_builder)

Examples:
  zazzctl --profile worker exec begin --deliverable-id 8 --task-id 25 --agent-name worker-1 --file api/src/routes/fileLocks.js
  zazzctl --profile planner deliverable update --deliverable-id 4 --json '{"planFilepath":".zazz/deliverables/ZAZZ-6-PLAN.md"}'
  zazzctl --profile spec_builder deliverable create --name "Agent Tokens" --type FEATURE --spec-filepath ".zazz/deliverables/ZAZZ-6-agent-tokens-SPEC.md"
`;
  process.stderr.write(text);
}

function dieUsage(message) {
  process.stderr.write(`zazzctl: ${message}\n`);
  usage();
  process.exit(2);
}

function isSuccess(status) {
  return status >= 200 && status < 300;
}

function isClientError(status) {
  return status >= 400 && status < 500;
}

function httpToExit(status, body) {
  if (isSuccess(status)) return 0;
  if (status === 409 && body?.error === 'FILE_LOCK_CONFLICT') return 10;
  if (isClientError(status)) return 20;
  return 30;
}

function toPrintedJson(value) {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value ?? {}, null, config.pretty ? 2 : 0);
  } catch {
    return JSON.stringify({ value: String(value) }, null, config.pretty ? 2 : 0);
  }
}

function printBody(value) {
  process.stdout.write(`${toPrintedJson(value)}\n`);
}

function exitWithLastResponse(forcedCode = null) {
  printBody(lastBody);
  process.exit(forcedCode ?? httpToExit(lastHttp, lastBody));
}

function requireValue(flag, value) {
  if (value === undefined || value === null || value === '') {
    dieUsage(`Missing required option: ${flag}`);
  }
}

function parseJson(text, flagName = '--json') {
  try {
    return JSON.parse(text);
  } catch {
    dieUsage(`${flagName} must be valid JSON`);
  }
}

function parseIntStrict(value, flagName) {
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    dieUsage(`${flagName} must be an integer`);
  }
  return n;
}

function parseCsv(values) {
  if (!values || values.length === 0) return [];
  return values
    .flatMap((entry) => String(entry).split(','))
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseCsvInts(csv) {
  if (!csv) return [];
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((part) => parseIntStrict(part, '--dependencies'));
}

function parseFlags(args, schema) {
  const out = {};
  for (let i = 0; i < args.length; ) {
    const flag = args[i];
    const def = schema[flag];
    if (!def) {
      dieUsage(`Unknown option: ${flag}`);
    }
    if (def.boolean) {
      out[def.key] = true;
      i += 1;
      continue;
    }
    const value = args[i + 1];
    if (value === undefined) {
      dieUsage(`Missing value for ${flag}`);
    }
    if (def.multi) {
      out[def.key] = out[def.key] || [];
      out[def.key].push(value);
    } else {
      out[def.key] = value;
    }
    i += 2;
  }
  return out;
}

function setLast(status, body) {
  lastHttp = status;
  lastBody = body;
}

function parseResponseBody(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function apiRequest(method, path, body) {
  const url = `${config.baseUrl.replace(/\/+$/, '')}${path}`;
  const headers = {
    TB_TOKEN: config.token,
    Authorization: `Bearer ${config.token}`,
  };
  const init = { method, headers };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, init);
    const text = await response.text();
    return { status: response.status, body: parseResponseBody(text) };
  } catch (error) {
    return {
      status: 0,
      body: {
        error: 'NETWORK_ERROR',
        message: 'Failed to reach API',
        detail: error?.message || String(error),
      },
    };
  }
}

async function callApi(method, path, body) {
  const result = await apiRequest(method, path, body);
  setLast(result.status, result.body);
  return result;
}

function canonicalCommandKey(resource, action) {
  return `${resource}:${action}`;
}

function assertProfileAllowed(commandKey) {
  const allow = PROFILE_ALLOW[config.profile];
  if (allow === undefined) {
    dieUsage(`Unknown profile: ${config.profile}`);
  }
  if (allow === null) return;
  if (allow.has(commandKey)) return;
  setLast(403, {
    error: 'PROFILE_FORBIDDEN',
    message: `Command ${commandKey} is not allowed for profile ${config.profile}`,
  });
  exitWithLastResponse();
}

async function handleDeliverable(action, args) {
  const defs = {
    '--project': { key: 'project' },
    '--deliverable-id': { key: 'deliverableId' },
    '--name': { key: 'name' },
    '--type': { key: 'type' },
    '--description': { key: 'description' },
    '--status': { key: 'status' },
    '--json': { key: 'json' },
    '--spec-filepath': { key: 'specFilepath' },
    '--plan-filepath': { key: 'planFilepath' },
  };
  const opt = parseFlags(args, defs);
  const project = opt.project || config.projectCode;

  if (action === 'list') {
    await callApi('GET', `/projects/${project}/deliverables`);
    exitWithLastResponse();
  }

  if (action === 'get') {
    requireValue('--deliverable-id', opt.deliverableId);
    await callApi('GET', `/projects/${project}/deliverables/${opt.deliverableId}`);
    exitWithLastResponse();
  }

  if (action === 'create') {
    requireValue('--name', opt.name);
    requireValue('--type', opt.type);
    const body = {
      name: opt.name,
      type: opt.type,
    };
    if (opt.description) body.description = opt.description;
    if (opt.specFilepath) body.specFilepath = opt.specFilepath;
    if (opt.planFilepath) body.planFilepath = opt.planFilepath;
    await callApi('POST', `/projects/${project}/deliverables`, body);
    exitWithLastResponse();
  }

  if (action === 'update') {
    requireValue('--deliverable-id', opt.deliverableId);
    requireValue('--json', opt.json);
    const body = parseJson(opt.json);
    await callApi('PUT', `/projects/${project}/deliverables/${opt.deliverableId}`, body);
    exitWithLastResponse();
  }

  if (action === 'status') {
    requireValue('--deliverable-id', opt.deliverableId);
    requireValue('--status', opt.status);
    await callApi('PATCH', `/projects/${project}/deliverables/${opt.deliverableId}/status`, {
      status: opt.status,
    });
    exitWithLastResponse();
  }

  if (action === 'approve') {
    requireValue('--deliverable-id', opt.deliverableId);
    await callApi('PATCH', `/projects/${project}/deliverables/${opt.deliverableId}/approve`, {});
    exitWithLastResponse();
  }

  if (action === 'tasks') {
    requireValue('--deliverable-id', opt.deliverableId);
    await callApi('GET', `/projects/${project}/deliverables/${opt.deliverableId}/tasks`);
    exitWithLastResponse();
  }

  dieUsage(`Unknown command: deliverable ${action}`);
}

async function handleTask(action, args) {
  const defs = {
    '--project': { key: 'project' },
    '--deliverable-id': { key: 'deliverableId' },
    '--task-id': { key: 'taskId' },
    '--title': { key: 'title' },
    '--prompt': { key: 'prompt' },
    '--description': { key: 'description' },
    '--status': { key: 'status' },
    '--priority': { key: 'priority' },
    '--agent-name': { key: 'agentName' },
    '--phase': { key: 'phase' },
    '--phase-step': { key: 'phaseStep' },
    '--dependencies': { key: 'dependencies' },
    '--json': { key: 'json' },
    '--reason': { key: 'reason' },
    '--note': { key: 'note' },
  };
  const opt = parseFlags(args, defs);
  const project = opt.project || config.projectCode;

  if (action === 'list') {
    requireValue('--deliverable-id', opt.deliverableId);
    await callApi('GET', `/projects/${project}/deliverables/${opt.deliverableId}/tasks`);
    exitWithLastResponse();
  }

  if (action === 'create') {
    requireValue('--deliverable-id', opt.deliverableId);
    requireValue('--title', opt.title);
    const body = { title: opt.title };
    if (opt.prompt) body.prompt = opt.prompt;
    if (opt.description) body.description = opt.description;
    if (opt.status) body.status = opt.status;
    if (opt.priority) body.priority = opt.priority;
    if (opt.agentName) body.agentName = opt.agentName;
    if (opt.phase !== undefined) body.phase = parseIntStrict(opt.phase, '--phase');
    if (opt.phaseStep) body.phaseStep = opt.phaseStep;
    const deps = parseCsvInts(opt.dependencies || '');
    if (deps.length > 0) body.dependencies = deps;
    await callApi('POST', `/projects/${project}/deliverables/${opt.deliverableId}/tasks`, body);
    exitWithLastResponse();
  }

  if (action === 'get') {
    requireValue('--deliverable-id', opt.deliverableId);
    requireValue('--task-id', opt.taskId);
    await callApi(
      'GET',
      `/projects/${project}/deliverables/${opt.deliverableId}/tasks/${opt.taskId}`,
    );
    exitWithLastResponse();
  }

  if (action === 'update') {
    requireValue('--deliverable-id', opt.deliverableId);
    requireValue('--task-id', opt.taskId);
    requireValue('--json', opt.json);
    await callApi(
      'PUT',
      `/projects/${project}/deliverables/${opt.deliverableId}/tasks/${opt.taskId}`,
      parseJson(opt.json),
    );
    exitWithLastResponse();
  }

  if (action === 'status') {
    requireValue('--deliverable-id', opt.deliverableId);
    requireValue('--task-id', opt.taskId);
    requireValue('--status', opt.status);
    const body = { status: opt.status };
    if (opt.agentName) body.agentName = opt.agentName;
    await callApi(
      'PATCH',
      `/projects/${project}/deliverables/${opt.deliverableId}/tasks/${opt.taskId}/status`,
      body,
    );
    exitWithLastResponse();
  }

  if (action === 'block') {
    requireValue('--deliverable-id', opt.deliverableId);
    requireValue('--task-id', opt.taskId);
    requireValue('--reason', opt.reason);
    await callApi(
      'PUT',
      `/projects/${project}/deliverables/${opt.deliverableId}/tasks/${opt.taskId}`,
      { isBlocked: true, blockedReason: opt.reason },
    );
    exitWithLastResponse();
  }

  if (action === 'unblock') {
    requireValue('--deliverable-id', opt.deliverableId);
    requireValue('--task-id', opt.taskId);
    await callApi(
      'PUT',
      `/projects/${project}/deliverables/${opt.deliverableId}/tasks/${opt.taskId}`,
      { isBlocked: false, blockedReason: null },
    );
    exitWithLastResponse();
  }

  if (action === 'note') {
    requireValue('--deliverable-id', opt.deliverableId);
    requireValue('--task-id', opt.taskId);
    requireValue('--note', opt.note);
    const body = { note: opt.note };
    if (opt.agentName) body.agentName = opt.agentName;
    await callApi(
      'PATCH',
      `/projects/${project}/deliverables/${opt.deliverableId}/tasks/${opt.taskId}/notes`,
      body,
    );
    exitWithLastResponse();
  }

  if (action === 'delete') {
    requireValue('--deliverable-id', opt.deliverableId);
    requireValue('--task-id', opt.taskId);
    await callApi(
      'DELETE',
      `/projects/${project}/deliverables/${opt.deliverableId}/tasks/${opt.taskId}`,
    );
    exitWithLastResponse();
  }

  if (action === 'readiness') {
    requireValue('--task-id', opt.taskId);
    await callApi('GET', `/projects/${project}/tasks/${opt.taskId}/readiness`);
    exitWithLastResponse();
  }

  dieUsage(`Unknown command: task ${action}`);
}

async function handleRelation(action, args) {
  const defs = {
    '--project': { key: 'project' },
    '--task-id': { key: 'taskId' },
    '--related-task-id': { key: 'relatedTaskId' },
    '--type': { key: 'relationType' },
  };
  const opt = parseFlags(args, defs);
  const project = opt.project || config.projectCode;

  if (action === 'list') {
    requireValue('--task-id', opt.taskId);
    await callApi('GET', `/projects/${project}/tasks/${opt.taskId}/relations`);
    exitWithLastResponse();
  }

  if (action === 'add') {
    requireValue('--task-id', opt.taskId);
    requireValue('--related-task-id', opt.relatedTaskId);
    requireValue('--type', opt.relationType);
    await callApi('POST', `/projects/${project}/tasks/${opt.taskId}/relations`, {
      relatedTaskId: parseIntStrict(opt.relatedTaskId, '--related-task-id'),
      relationType: opt.relationType,
    });
    exitWithLastResponse();
  }

  if (action === 'delete') {
    requireValue('--task-id', opt.taskId);
    requireValue('--related-task-id', opt.relatedTaskId);
    requireValue('--type', opt.relationType);
    await callApi(
      'DELETE',
      `/projects/${project}/tasks/${opt.taskId}/relations/${opt.relatedTaskId}/${opt.relationType}`,
    );
    exitWithLastResponse();
  }

  dieUsage(`Unknown command: relation ${action}`);
}

async function handleGraph(action, args) {
  if (action !== 'get') {
    dieUsage(`Unknown command: graph ${action}`);
  }
  const defs = {
    '--project': { key: 'project' },
    '--deliverable-id': { key: 'deliverableId' },
  };
  const opt = parseFlags(args, defs);
  const project = opt.project || config.projectCode;
  requireValue('--deliverable-id', opt.deliverableId);
  await callApi('GET', `/projects/${project}/deliverables/${opt.deliverableId}/graph`);
  exitWithLastResponse();
}

async function handleLock(action, args) {
  const defs = {
    '--project': { key: 'project' },
    '--deliverable-id': { key: 'deliverableId' },
    '--task-id': { key: 'taskId' },
    '--agent-name': { key: 'agentName' },
    '--phase-step': { key: 'phaseStep' },
    '--ttl-seconds': { key: 'ttlSeconds' },
    '--file': { key: 'fileInputs', multi: true },
    '--files': { key: 'fileInputs', multi: true },
  };
  const opt = parseFlags(args, defs);
  const project = opt.project || config.projectCode;

  if (action === 'list') {
    requireValue('--deliverable-id', opt.deliverableId);
    await callApi('GET', `/projects/${project}/deliverables/${opt.deliverableId}/locks`);
    exitWithLastResponse();
  }

  requireValue('--deliverable-id', opt.deliverableId);
  requireValue('--task-id', opt.taskId);
  requireValue('--agent-name', opt.agentName);

  const files = parseCsv(opt.fileInputs || []);
  const body = {
    taskId: parseIntStrict(opt.taskId, '--task-id'),
    agentName: opt.agentName,
  };
  if (opt.phaseStep) body.phaseStep = opt.phaseStep;
  if (opt.ttlSeconds !== undefined) {
    body.ttlSeconds = parseIntStrict(opt.ttlSeconds, '--ttl-seconds');
  }
  if (files.length > 0) {
    body.fileRelativePaths = files;
  }

  if (action === 'acquire') {
    if (!body.fileRelativePaths || body.fileRelativePaths.length === 0) {
      dieUsage('lock acquire requires at least one --file or --files');
    }
    await callApi('POST', `/projects/${project}/deliverables/${opt.deliverableId}/locks/acquire`, body);
    exitWithLastResponse();
  }
  if (action === 'heartbeat') {
    await callApi(
      'POST',
      `/projects/${project}/deliverables/${opt.deliverableId}/locks/heartbeat`,
      body,
    );
    exitWithLastResponse();
  }
  if (action === 'release') {
    await callApi('POST', `/projects/${project}/deliverables/${opt.deliverableId}/locks/release`, body);
    exitWithLastResponse();
  }

  dieUsage(`Unknown command: lock ${action}`);
}

function aggregateStatus(statuses) {
  if (statuses.every((status) => isSuccess(status))) return 200;
  if (statuses.some((status) => isClientError(status))) return 400;
  return 500;
}

async function handleExec(action, args) {
  const defs = {
    '--project': { key: 'project' },
    '--deliverable-id': { key: 'deliverableId' },
    '--task-id': { key: 'taskId' },
    '--agent-name': { key: 'agentName' },
    '--phase-step': { key: 'phaseStep' },
    '--ttl-seconds': { key: 'ttlSeconds' },
    '--status': { key: 'status' },
    '--note': { key: 'note' },
    '--file': { key: 'fileInputs', multi: true },
    '--files': { key: 'fileInputs', multi: true },
  };
  const opt = parseFlags(args, defs);
  const project = opt.project || config.projectCode;
  requireValue('--deliverable-id', opt.deliverableId);
  requireValue('--task-id', opt.taskId);
  requireValue('--agent-name', opt.agentName);

  const deliverableId = opt.deliverableId;
  const taskId = parseIntStrict(opt.taskId, '--task-id');
  const files = parseCsv(opt.fileInputs || []);
  const ttl = opt.ttlSeconds !== undefined ? parseIntStrict(opt.ttlSeconds, '--ttl-seconds') : undefined;

  if (action === 'begin') {
    if (files.length === 0) {
      dieUsage('exec begin requires at least one --file or --files');
    }
    const acquireBody = {
      taskId,
      agentName: opt.agentName,
      fileRelativePaths: files,
    };
    if (opt.phaseStep) acquireBody.phaseStep = opt.phaseStep;
    if (ttl !== undefined) acquireBody.ttlSeconds = ttl;

    const acquire = await callApi(
      'POST',
      `/projects/${project}/deliverables/${deliverableId}/locks/acquire`,
      acquireBody,
    );

    if (acquire.status === 409 && acquire.body?.error === 'FILE_LOCK_CONFLICT') {
      const block = await callApi(
        'PUT',
        `/projects/${project}/deliverables/${deliverableId}/tasks/${taskId}`,
        { isBlocked: true, blockedReason: 'FILE_LOCK' },
      );
      setLast(409, {
        acquire: acquire.body,
        acquireHttp: acquire.status,
        blockUpdate: block.body,
        blockHttp: block.status,
      });
      exitWithLastResponse(10);
    }

    if (!isSuccess(acquire.status)) {
      setLast(acquire.status, acquire.body);
      exitWithLastResponse();
    }

    const unblock = await callApi(
      'PUT',
      `/projects/${project}/deliverables/${deliverableId}/tasks/${taskId}`,
      { isBlocked: false, blockedReason: null },
    );

    const statusTarget = opt.status || 'IN_PROGRESS';
    const status = await callApi(
      'PATCH',
      `/projects/${project}/deliverables/${deliverableId}/tasks/${taskId}/status`,
      { status: statusTarget, agentName: opt.agentName },
    );

    setLast(aggregateStatus([unblock.status, status.status]), {
      acquire: acquire.body,
      acquireHttp: acquire.status,
      unblock: unblock.body,
      unblockHttp: unblock.status,
      status: status.body,
      statusHttp: status.status,
    });
    exitWithLastResponse();
  }

  if (action === 'tick') {
    const heartbeatBody = { taskId, agentName: opt.agentName };
    if (ttl !== undefined) heartbeatBody.ttlSeconds = ttl;
    if (files.length > 0) heartbeatBody.fileRelativePaths = files;

    const heartbeat = await callApi(
      'POST',
      `/projects/${project}/deliverables/${deliverableId}/locks/heartbeat`,
      heartbeatBody,
    );

    let noteStatus = 0;
    let noteBody = {};
    if (opt.note) {
      const note = await callApi(
        'PATCH',
        `/projects/${project}/deliverables/${deliverableId}/tasks/${taskId}/notes`,
        { note: opt.note, agentName: opt.agentName },
      );
      noteStatus = note.status;
      noteBody = note.body;
    }

    const aggregate = aggregateStatus([
      heartbeat.status,
      ...(noteStatus ? [noteStatus] : []),
    ]);
    setLast(aggregate, {
      heartbeat: heartbeat.body,
      heartbeatHttp: heartbeat.status,
      note: noteBody,
      noteHttp: noteStatus,
    });
    exitWithLastResponse();
  }

  if (action === 'complete') {
    let noteStatus = 0;
    let noteBody = {};
    if (opt.note) {
      const note = await callApi(
        'PATCH',
        `/projects/${project}/deliverables/${deliverableId}/tasks/${taskId}/notes`,
        { note: opt.note, agentName: opt.agentName },
      );
      noteStatus = note.status;
      noteBody = note.body;
    }

    const status = await callApi(
      'PATCH',
      `/projects/${project}/deliverables/${deliverableId}/tasks/${taskId}/status`,
      { status: opt.status || 'COMPLETED', agentName: opt.agentName },
    );

    const releaseBody = { taskId, agentName: opt.agentName };
    if (files.length > 0) releaseBody.fileRelativePaths = files;
    const release = await callApi(
      'POST',
      `/projects/${project}/deliverables/${deliverableId}/locks/release`,
      releaseBody,
    );

    const aggregate = aggregateStatus([
      ...(noteStatus ? [noteStatus] : []),
      status.status,
      release.status,
    ]);
    setLast(aggregate, {
      note: noteBody,
      noteHttp: noteStatus,
      status: status.body,
      statusHttp: status.status,
      release: release.body,
      releaseHttp: release.status,
    });
    exitWithLastResponse();
  }

  dieUsage(`Unknown command: exec ${action}`);
}

async function main() {
  const args = process.argv.slice(2);

  while (args[0] === '--profile') {
    const profileValue = args[1];
    requireValue('--profile', profileValue);
    config.profile = String(profileValue).toLowerCase();
    args.splice(0, 2);
  }

  if (args.length === 0) {
    usage();
    process.exit(2);
  }

  if (args.length === 1 && args[0] === 'help') {
    usage();
    process.exit(0);
  }

  const [resource, action, ...rest] = args;
  if (!resource || !action) {
    usage();
    process.exit(2);
  }
  if (resource === 'help' || action === 'help') {
    usage();
    process.exit(0);
  }

  const commandKey = canonicalCommandKey(resource, action);
  assertProfileAllowed(commandKey);

  if (resource === 'deliverable') {
    await handleDeliverable(action, rest);
    return;
  }
  if (resource === 'task') {
    await handleTask(action, rest);
    return;
  }
  if (resource === 'relation') {
    await handleRelation(action, rest);
    return;
  }
  if (resource === 'graph') {
    await handleGraph(action, rest);
    return;
  }
  if (resource === 'lock') {
    await handleLock(action, rest);
    return;
  }
  if (resource === 'exec') {
    await handleExec(action, rest);
    return;
  }

  dieUsage(`Unknown resource: ${resource}`);
}

main().catch((error) => {
  setLast(0, {
    error: 'CLI_RUNTIME_ERROR',
    message: error?.message || String(error),
  });
  exitWithLastResponse(30);
});
