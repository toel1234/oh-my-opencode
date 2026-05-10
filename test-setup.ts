import { afterEach, beforeEach, mock } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { _resetForTesting as resetClaudeSessionState } from "./src/features/claude-code-session-state/state"
import { _resetTaskToastManagerForTesting as resetTaskToastManager } from "./src/features/task-toast-manager/manager"
import { _resetForTesting as resetModelFallbackState } from "./src/hooks/model-fallback/hook"
import { _resetMemCacheForTesting as resetConnectedProvidersCache } from "./src/shared/connected-providers-cache"
import { installModuleMockLifecycle } from "./src/testing/module-mock-lifecycle"

const { restoreModuleMocks } = installModuleMockLifecycle(mock)
let environmentSnapshot: NodeJS.ProcessEnv = { ...process.env }
let workingDirectorySnapshot = process.cwd()

let omoCacheDir: string | undefined
let claudeConfigDir: string | undefined
let opencodeConfigDir: string | undefined

function cleanupDir(dir: string | undefined): void {
  if (dir) {
    rmSync(dir, { recursive: true, force: true })
  }
}

beforeEach(() => {
  environmentSnapshot = { ...process.env }
  workingDirectorySnapshot = process.cwd()

  // Create unique temporary directories for OMO cache, Claude config, and OpenCode config
  omoCacheDir = mkdtempSync(join(tmpdir(), "omo-test-cache-"))
  claudeConfigDir = mkdtempSync(join(tmpdir(), "omo-test-claude-config-"))
  opencodeConfigDir = mkdtempSync(join(tmpdir(), "omo-test-opencode-config-"))

  process.env.OMO_CACHE_DIR = omoCacheDir
  process.env.CLAUDE_CONFIG_DIR = claudeConfigDir
  process.env.OPENCODE_CONFIG_DIR = opencodeConfigDir
  process.env.OMO_DISABLE_POSTHOG = "true"

  resetClaudeSessionState()
  resetTaskToastManager()
  resetModelFallbackState()
  resetConnectedProvidersCache()
})

afterEach(async () => {
  try {
    const { uninstallAgentSortShim } = await import("./src/shared/agent-sort-shim")
    uninstallAgentSortShim()
  } catch {
    // Ignore if it fails to import or uninstall (e.g. file doesn't exist yet)
  }

  for (const key of Object.keys(process.env)) {
    if (!(key in environmentSnapshot)) {
      delete process.env[key]
    }
  }

  for (const [key, value] of Object.entries(environmentSnapshot)) {
    if (value === undefined) {
      delete process.env[key]
      continue
    }

    process.env[key] = value
  }

  if (process.cwd() !== workingDirectorySnapshot) {
    process.chdir(workingDirectorySnapshot)
  }

  cleanupDir(omoCacheDir)
  cleanupDir(claudeConfigDir)
  cleanupDir(opencodeConfigDir)

  omoCacheDir = undefined
  claudeConfigDir = undefined
  opencodeConfigDir = undefined

  resetTaskToastManager()
  resetConnectedProvidersCache()
  mock.restore()
  restoreModuleMocks()
})
