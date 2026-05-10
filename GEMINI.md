# Oh My OpenCode - AI Agent Instructions

This project is a high-performance AI agent harness and plugin for OpenCode.

## Core Architecture

- **Bun-powered**: We use Bun for everything. Use `bun run`, `bun build`, and `bun test`.
- **Plugin System**: The entry point is `src/index.ts`. It exports a `PluginModule`.
- **Agent Orchestration**: Sisyphus is the main orchestrator. He delegates tasks to specialists in `src/agents/`.
- **Hashline Edits**: We use a custom edit tool that uses line hashes to prevent stale-line errors.
- **Multi-model**: Categories (e.g., `visual`, `deep`) map to the best model for the job.

## Development Workflows

- **Testing**: Run `bun test` to execute the full suite.
- **Building**: Run `bun run build` to generate the `dist/` directory and JSON schema.
- **Local Testing**: Link the `dist/index.js` in your `opencode.jsonc` as a file plugin.

## Coding Standards

- **Strict Types**: Always use strict TypeScript. Avoid `any`.
- **Kebab-case**: Use kebab-case for files and directories.
- **Dynamic Imports**: Used in some hooks to keep startup time fast.
- **Dependencies**: Prefer Bun's built-in APIs over external packages where possible.

## Maintenance Notes

- **GitHub Repository**: [toel1234/oh-my-opencode](https://github.com/toel1234/oh-my-opencode)
- **Maintainer**: toel1234
- **Original Author**: YeonGyu-Kim
