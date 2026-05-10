import fs from "node:fs/promises"
import path from "node:path"

import type { TeamModeConfig } from "./manager"
import { spawn as bunSpawn } from "../../../shared/bun-spawn-shim"

async function runGit(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  const process = bunSpawn({ cmd: ["git", ...args], stdout: "pipe", stderr: "pipe" })
  const [exitCode, stdoutText, stderrText] = await Promise.all([
    process.exited,
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
  ])
  return { code: exitCode, stdout: stdoutText, stderr: stderrText }
}

export async function removeWorktree(worktreePath: string): Promise<void> {
  const absoluteWorktreePath = path.resolve(worktreePath)

  // 1. Try to find if this worktree belongs to a superproject (submodule)
  // We do this before deleting the directory, as we might need to run git commands from within it
  const rootLookup = bunSpawn({
    cmd: ["git", "-C", worktreePath, "rev-parse", "--show-superproject-working-tree"],
    stdout: "pipe",
    stderr: "pipe",
  })
  const [rootExitCode, rootStdout] = await Promise.all([
    rootLookup.exited,
    new Response(rootLookup.stdout).text(),
    new Response(rootLookup.stderr).text(),
  ]).catch(() => [1, ""]) // Ignore errors if directory doesn't exist

  const superprojectRoot = rootExitCode === 0 && typeof rootStdout === "string" ? rootStdout.trim() : ""

  // 2. Try to remove the worktree via git
  const removeArgs = ["worktree", "remove", "--force", absoluteWorktreePath]
  const result = superprojectRoot
    ? await runGit(["-C", superprojectRoot, ...removeArgs])
    : await runGit(removeArgs)

  // 3. If it failed, check if it's actually still a worktree
  if (result.code !== 0) {
    const listArgs = superprojectRoot
      ? ["-C", superprojectRoot, "worktree", "list", "--porcelain"]
      : ["worktree", "list", "--porcelain"]
    const listResult = await runGit(listArgs)
    const isStillWorktree = listResult.stdout
      .split("\n")
      .some((line) => line.startsWith("worktree ") && path.resolve(line.slice(9).trim()) === absoluteWorktreePath)

    if (isStillWorktree) {
      throw new Error(result.stderr.trim() || "git worktree remove failed")
    }
  }

  // 4. Ensure directory is gone
  await fs.rm(absoluteWorktreePath, { recursive: true, force: true })

  // 5. Cleanup superproject if needed
  if (superprojectRoot) {
    await runGit(["-C", superprojectRoot, "worktree", "prune"])
  }
}

export async function findOrphanWorktrees(baseDir: string, _config: TeamModeConfig): Promise<string[]> {
  const orphanWorktrees: string[] = []
  const worktreesDir = path.join(baseDir, "worktrees")

  let teamRunDirectories: string[]
  try {
    teamRunDirectories = await fs.readdir(worktreesDir)
  } catch {
    return orphanWorktrees
  }

  for (const teamRunId of teamRunDirectories) {
    const teamRunPath = path.join(worktreesDir, teamRunId)
    const memberNames = await fs.readdir(teamRunPath).catch(() => [])

    for (const memberName of memberNames) {
      const worktreePath = path.join(teamRunPath, memberName)
      const statePath = path.join(baseDir, "runtime", teamRunId, "state.json")

      try {
        const stateContents = await fs.readFile(statePath, "utf8")
        const state = JSON.parse(stateContents) as { status?: string }

        if (state.status !== "active" && state.status !== "shutdown_requested") {
          orphanWorktrees.push(worktreePath)
        }
      } catch {
        orphanWorktrees.push(worktreePath)
      }
    }
  }

  return orphanWorktrees
}
