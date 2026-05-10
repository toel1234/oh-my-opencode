# Repository Optimization and Defect Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Stabilize the test suite, optimize tool performance, and reduce architectural technical debt.

**Architecture:**
- **Test Isolation**: Move the OMO cache directory to a unique temporary path per test execution to prevent parallel test conflicts.
- **Shim Management**: Implement a cleanup mechanism for global monkey-patches (Array.prototype.sort) to ensure test purity.
- **AST Performance**: Transition from ast-grep CLI to native NAPI bindings for significant speedups in code search and rewrite tools.
- **Discovery Caching**: Implement an asynchronous discovery layer with persistent caching for skills and agents to reduce startup latency.

**Tech Stack:**
- Bun (Test runner, Workspace)
- TypeScript
- @ast-grep/napi

---

### Task 1: Fix Test Isolation & Global State Contamination

**Files:**
- Modify: `oh-my-openagent/src/shared/agent-sort-shim.ts`
- Modify: `oh-my-openagent/test-setup.ts`

**Step 1: Implement `uninstallAgentSortShim`**

Modify `oh-my-openagent/src/shared/agent-sort-shim.ts` to store original prototypes and provide a way to restore them.

```typescript
let originalToSorted: any = null;
let originalSort: any = null;

export function uninstallAgentSortShim(): void {
  if (!installed) return;
  if (originalToSorted) Array.prototype.toSorted = originalToSorted;
  if (originalSort) Array.prototype.sort = originalSort;
  installed = false;
}

// In installAgentSortShim:
originalToSorted = Array.prototype.toSorted;
originalSort = Array.prototype.sort;
```

**Step 2: Update `test-setup.ts` to use unique temp directories**

Modify `oh-my-openagent/test-setup.ts` to isolate the cache directory and uninstall the shim.

```typescript
import { uninstallAgentSortShim } from "./src/shared/agent-sort-shim";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtempSync } from "node:fs";

let currentTestCacheDir: string | null = null;

beforeEach(() => {
  currentTestCacheDir = mkdtempSync(join(tmpdir(), "omo-test-cache-"));
  process.env.OMO_CACHE_DIR = currentTestCacheDir;
  // ... rest of setup
});

afterEach(() => {
  // ... existing cleanup
  uninstallAgentSortShim();
  if (currentTestCacheDir) rmSync(currentTestCacheDir, { recursive: true, force: true });
});
```

**Step 3: Run tests to verify stability**

Run: `npx bun test src/shared/agent-sort-shim.test.ts`
Expected: PASS and no leakage.

### Task 2: Optimize AST-Grep with NAPI Bindings

**Files:**
- Create: `oh-my-openagent/src/tools/ast-grep/napi.ts`
- Modify: `oh-my-openagent/src/tools/ast-grep/cli.ts`

**Step 1: Implement `runSgNapi`**

Create `oh-my-openagent/src/tools/ast-grep/napi.ts` using `@ast-grep/napi`.

```typescript
import { js } from "@ast-grep/napi";
// Implement pattern matching and rewriting
```

**Step 2: Integrate NAPI into `runSg`**

Modify `oh-my-openagent/src/tools/ast-grep/cli.ts` to attempt NAPI first.

```typescript
try {
  const { runSgNapi } = await import("./napi");
  return await runSgNapi(options);
} catch {
  // fallback to CLI
}
```

**Step 3: Verify performance**

Run: `npx bun test src/tools/ast-grep/`
Expected: PASS and faster execution.

### Task 3: Decompose BackgroundManager

**Files:**
- Modify: `oh-my-openagent/src/features/background-agent/manager.ts`
- Create: `oh-my-openagent/src/features/background-agent/polling-service.ts`

**Step 1: Extract polling logic**

Move `checkAndInterruptStaleTasks` and related polling logic to `polling-service.ts`.

**Step 2: Update BackgroundManager**

Inject the polling service into `BackgroundManager`.

**Step 3: Run tests**

Run: `npx bun test src/features/background-agent/manager.test.ts`
Expected: PASS.

### Task 4: Fix Sort Shim Logic and Tie-Breaking

**Files:**
- Modify: `oh-my-openagent/src/shared/agent-sort-shim.ts`

**Step 1: Ensure canonical order in `agentComparator`**

Fix the fallback logic to avoid native alphabetical sort swapping Sisyphus and Atlas.

```typescript
function agentComparator(a: unknown, b: unknown, fallback: any): number {
  const aName = extractAgentName(a);
  const bName = extractAgentName(b);
  const aRank = agentRank.get(aName) ?? UNRANKED;
  const bRank = agentRank.get(bName) ?? UNRANKED;

  if (aRank !== bRank) return aRank - bRank;
  if (fallback) return fallback(a, b);
  // Remove name-based localeCompare if we want to strictly follow rank
  return 0;
}
```

**Step 2: Verify with tests**

Run: `npx bun test src/shared/agent-runtime-name-sort.test.ts`
Expected: PASS.

### Task 5: Language-Agnostic Archive Validator Test

**Files:**
- Modify: `oh-my-openagent/src/shared/archive-entry-validator.test.ts`

**Step 1: Relax assertion on tar output**

Change the regex to look for ".." or exit status instead of the English phrase "path traversal".

### Task 6: Implement Discovery Caching

**Files:**
- Create: `oh-my-openagent/src/shared/discovery-cache.ts`
- Modify: `oh-my-openagent/src/plugin-handlers/skill-handler.ts` (or equivalent)

**Step 1: Implement Cache Utility**

Create a simple file-based cache for discovered skills and agents.

**Step 2: Integrate into initialization**

Check the cache before performing heavy filesystem scans.
