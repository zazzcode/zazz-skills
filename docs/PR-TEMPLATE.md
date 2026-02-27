# Pull Request Template

**For use by QA Agent when creating PRs after successful verification.**

---

## Deliverable: {DELIVERABLE_ID}
**Project Code**: {PROJECT_CODE}  
**Branch**: `zazz/{DELIVERABLE_ID}`  
**Target Branch**: `main` (or development branch)

---

## Summary

{One-paragraph summary of what this deliverable accomplishes. Reference the SPEC and PLAN.}

---

## Acceptance Criteria Status

### Primary Acceptance Criteria
- [ ] **AC-1**: {Description} ✓ **VERIFIED**
- [ ] **AC-2**: {Description} ✓ **VERIFIED**
- [ ] **AC-3**: {Description} ✓ **VERIFIED**
{Add all AC from deliverable}

### Additional Criteria
- [ ] All automated tests pass ✓
- [ ] Code analysis complete (no critical issues) ✓
- [ ] Performance within spec ✓
- [ ] Security scan complete (no high/critical vulnerabilities) ✓

---

## Testing Summary

### Unit Tests
- **Total**: {X} tests
- **Passed**: {X}
- **Failed**: {0}
- **Coverage**: {X}%

### Integration Tests
- **Total**: {X} tests
- **Passed**: {X}
- **Failed**: {0}

### End-to-End Tests
- **Total**: {X} tests
- **Passed**: {X}
- **Failed**: {0}

### Performance Tests
- **Metric**: {e.g., API response time}
- **Result**: {e.g., 87ms avg (spec: <100ms)} ✓
- **Metric**: {e.g., Memory usage}
- **Result**: {e.g., 45MB (spec: <50MB)} ✓

---

## Code Analysis

### Performance
{Summary of performance analysis findings. E.g., "No performance bottlenecks identified. All API calls under 100ms. Database queries optimized with proper indexing."}

### Security
{Summary of security scan results. E.g., "Security scan completed. No high or critical vulnerabilities. 2 low-priority informational findings (non-blocking): [list them]."}

### Best Practices
{Summary of code quality review. E.g., "Code follows project conventions in AGENTS.md. Proper error handling, logging, and type safety implemented. ESLint/Prettier checks pass."}

---

## Task Summary

### Tasks Completed
- **Total tasks**: {X}
- **Initial tasks**: {X}
- **Rework tasks**: {X}
- **Total commits**: {X}

### Task Breakdown
| Task ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| TASK-1 | {description} | COMPLETED | Initial implementation |
| TASK-2 | {description} | COMPLETED | Initial implementation |
| TASK-5 | {description} | COMPLETED | Rework after QA finding |
| ... | ... | ... | ... |

---

## Rework History

{If no rework, state "No rework required. Initial implementation passed all QA checks."}

{If rework occurred, list each rework task:}

### Rework Cycle 1
**Issue**: {Description of what QA found}  
**Root Cause**: {Why the issue occurred}  
**Resolution**: {How it was fixed}  
**Task ID**: TASK-{X}  
**Status**: ✓ **VERIFIED**

### Rework Cycle 2
**Issue**: {Description}  
**Root Cause**: {Why}  
**Resolution**: {How}  
**Task ID**: TASK-{X}  
**Status**: ✓ **VERIFIED**

---

## Files Changed

### New Files ({X} files)
- `src/new-module.ts` – {Brief description}
- `tests/new-module.test.ts` – {Brief description}

### Modified Files ({X} files)
- `src/existing-module.ts` – {What changed}
- `src/config.ts` – {What changed}

### Deleted Files ({X} files)
- `src/deprecated-module.ts` – {Why deleted}

---

## Dependencies

### New Dependencies Added
{If none, state "None"}

- `package-name@version` – {Why added}

### Dependencies Updated
{If none, state "None"}

- `package-name` – {from version} → {to version} – {Why updated}

---

## Migration/Deployment Notes

{Any special instructions for deploying this change. E.g., database migrations, environment variable updates, breaking changes.}

{If none, state "No special deployment steps required."}

---

## Screenshots/Evidence (Optional)

{If applicable, include screenshots, logs, or other evidence demonstrating AC verification. E.g., API response examples, UI screenshots, performance graphs.}

---

## QA Agent Sign-off

**Created by**: QA Agent (Zazz Board Workflow)  
**Agent ID**: {QA_AGENT_ID}  
**Date**: {ISO 8601 timestamp}  
**Deliverable Status**: IN_REVIEW  
**QA Verdict**: ✓ **APPROVED FOR DELIVERABLE OWNER REVIEW**

---

## Deliverable Owner Checklist

- [ ] Code reviewed for quality and maintainability
- [ ] Architectural changes align with project goals
- [ ] Documentation updated (README, API docs, etc.)
- [ ] Acceptance criteria verified independently
- [ ] Deployment plan reviewed
- [ ] Approved for merge

---

## Related Links

- **Deliverable**: [Link to Zazz Board deliverable]
- **SPEC**: [Link to deliverable specification]
- **PLAN**: [Link to implementation plan]
- **Task Graph**: [Link to Zazz Board task view]
- **CI/CD Run**: [Link to automated test results]

---

**Co-Authored-By**: Warp <agent@warp.dev>
