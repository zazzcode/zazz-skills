# Swagger Documentation Enhancement Guide

Implementation guide for making the Zazz Board API documentation human-readable and AI-agent-consumable. Agents fetch the spec at runtime and infer routes from descriptions—see `zazz-skills.md` for agent workflow and methodology.

---

## 1. Current State & Gaps

| Gap | Impact | Affected |
|-----|--------|----------|
| No `/docs/json` endpoint | Agents cannot fetch spec programmatically | All agents |
| No response schemas | Agents cannot validate/parse responses | All routes |
| Undocumented routes | No params/body validation or docs | 4 core + 5 image + users/me |
| Inline schemas in projects.js | Hard to maintain, inconsistent | 15+ routes |
| Global security only | Public endpoints misdocumented | /health, /, /db-test, /token-info |
| Hardcoded base URL | Production spec has wrong URLs | server.js |
| Scoped image route formats undocumented | Agents guess wrong body structure and scope params | POST /projects/:code/deliverables/:delivId/tasks/:taskId/images/upload |

**Path param confusion**: Projects use `/projects/:id` (numeric) for some routes and `/projects/:code` (e.g. ZAZZ) for others. Descriptions should clarify which to use where.

---

## 2. Implementation Phases

### Phase 1: P0 — Agent Blockers (Do First)

| # | Task | File | Details |
|---|------|------|---------|
| 1 | Add `/docs/json` | `api/src/server.js` | Explicit route; decide if public or auth-required |
| 2 | Configurable base URL | `api/src/server.js` | Use `process.env.API_BASE_URL || BASE_URL` in OpenAPI `servers` |
| 3 | Add scoped image route schemas | `api/src/routes/images.js` | Task + deliverable + project image routes; upload body: `{ images: [{ originalName, contentType, fileSize, base64Data }] }` |

**Code: `/docs/json` endpoint**

```javascript
// In server.js, after app.register(swagger, ...) and app.register(routes, ...)
app.get('/docs/json', {
  schema: { hide: true }
}, async (request, reply) => {
  reply.type('application/json');
  return app.swagger();
});
```

### Phase 2: P1 — Core Documentation

| # | Task | Scope | Details |
|---|------|-------|---------|
| 4 | Add response schemas | Deliverable/task routes | 200/201 success shapes for create task, get task, update status, list tasks |
| 5 | Add core route schemas | `api/src/routes/index.js` | Minimal schemas for `/health`, `/`, `/users/me` |
| 6 | Add image schemas | `api/src/routes/images.js` | Params, body, responses for all project-scoped image endpoints |

**Endpoints agents use** (prioritize descriptions and response schemas):

| Intent | Endpoints |
|--------|-----------|
| List projects | `GET /projects` |
| List deliverables | `GET /projects/:projectCode/deliverables` |
| Get deliverable (SPEC, plan paths) | `GET /projects/:projectCode/deliverables/:id` |
| List tasks | `GET /projects/:projectCode/deliverables/:id/tasks` |
| Create task | `POST /projects/:code/deliverables/:delivId/tasks` |
| Set task relations | `POST /projects/:code/tasks/:taskId/relations` |
| Update task status | `PATCH /projects/:code/tasks/:taskId/status` |
| Update task | `PUT /projects/:code/deliverables/:delivId/tasks/:taskId` |
| Update deliverable status | `PATCH /projects/:projectCode/deliverables/:id/status` |

### Phase 3: P2 — Quality & Consistency

| # | Task | Scope | Details |
|---|------|-------|---------|
| 7 | Public vs protected | OpenAPI | Add `security: []` to schemas for `/health`, `/`, `/db-test`, `/token-info` |
| 8 | Standard error schema | `api/src/schemas/validation.js` | Define once; reference in route responses for 400, 401, 403, 404, 409, 500 |
| 9 | Move inline schemas | `api/src/routes/projects.js` | Kanban, status, deliverable-task routes → `validation.js` |
| 10 | Add tags | All schemas | Match tags in server.js |

### Phase 4: P3 — Enhancement

| # | Task | Scope |
|---|------|-------|
| 11 | Add summary/description | All schemas—critical for agent inference |
| 12 | Add examples | Key request/response schemas |
| 13 | Use responseSchemas | Wire up existing `responseSchemas.error` in validation.js |
| 14 | Clean taskSchemas | Remove or deprecate orphaned `taskSchemas` (legacy task routes) |

---

## 3. Reference: Schema Patterns

### Operation metadata (description-driven; agents infer from these)

```javascript
{
  tags: ['deliverables'],
  summary: 'Get deliverable by ID',
  description: 'Returns deliverable with path to deliverable specification (dedFilePath), planFilePath, prdFilePath for document retrieval. Use projectCode (e.g. ZAZZ) and numeric deliverable id.',
  params: { ... },
  body: { ... },
  response: { ... }
}
```

### Response schema (success)

```javascript
response: {
  200: {
    description: 'Task updated',
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Task ID' },
      title: { type: 'string' },
      status: { type: 'string', enum: ['TO_DO', 'READY', 'IN_PROGRESS', 'QA', 'COMPLETED'] },
      deliverableId: { type: 'number' },
      projectId: { type: 'number' }
    }
  },
  404: { description: 'Task or deliverable not found', ... }
}
```

### Standard error response (define in validation.js, reference everywhere)

```javascript
export const errorResponseSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'number', example: 400 },
    error: { type: 'string', example: 'Bad Request' },
    message: { type: 'string', example: 'Invalid request parameters' }
  }
};
```

### Image upload body

```javascript
body: {
  type: 'object',
  required: ['images'],
  properties: {
    images: {
      type: 'array',
      items: {
        type: 'object',
        required: ['originalName', 'contentType', 'fileSize', 'base64Data'],
        properties: {
          originalName: { type: 'string' },
          contentType: { type: 'string', pattern: '^image/' },
          fileSize: { type: 'integer', minimum: 1 },
          base64Data: { type: 'string' }
        }
      }
    }
  }
}
```

---

## 4. Implementation Checklist

**Phase 1**
- [ ] Add `/docs/json` to server.js
- [ ] Use API_BASE_URL in OpenAPI servers
- [ ] Add project-scoped image route schemas

**Phase 2**
- [ ] Response schemas on core workflow endpoints (table in 2.2)
- [ ] Schemas for /health, /, /users/me

**Phase 3**
- [ ] security: [] on public endpoints
- [ ] Standard error schema + wire to routes
- [ ] Move projects.js inline schemas to validation.js
- [ ] tags on all schemas

**Phase 4**
- [ ] summary/description on all schemas (critical for agent inference)
- [ ] Examples on key routes
- [ ] Use responseSchemas from validation.js
- [ ] Clean up orphaned taskSchemas

---

## 5. Verification

1. `GET /docs/json` returns valid OpenAPI 3.1 JSON
2. Core workflow routes have clear descriptions and response schemas
3. Public endpoints use `security: []`
4. Agent can fetch spec and infer operations from descriptions
