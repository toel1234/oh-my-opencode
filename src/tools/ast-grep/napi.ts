import { js, ts, tsx, css, html } from "@ast-grep/napi"
import { readFileSync } from "node:fs"
import { glob } from "glob"
import type { RunOptions } from "./cli"
import type { CliMatch, SgResult } from "./types"
import { DEFAULT_MAX_MATCHES } from "./constants"

const LANG_MAP: Record<string, any> = {
  javascript: js,
  typescript: ts,
  tsx: tsx,
  css: css,
  html: html,
}

export async function runSgNapi(options: RunOptions): Promise<SgResult> {
  const lang = LANG_MAP[options.lang]
  if (!lang) {
    throw new Error(`Language ${options.lang} not supported by NAPI`)
  }

  const paths = options.paths && options.paths.length > 0 ? options.paths : ["."]
  const matches: CliMatch[] = []
  let totalMatches = 0

  const globPatterns = options.globs && options.globs.length > 0 ? options.globs : ["**/*"]

  for (const path of paths) {
    const files = await glob(globPatterns, { cwd: path, nodir: true, absolute: true })
    
    for (const file of files) {
      try {
        const content = readFileSync(file, "utf8")
        const ast = lang.parse(content)
        const root = ast.root()
        const fileMatches = root.findAll(options.pattern)

        for (const match of fileMatches) {
          totalMatches++
          if (matches.length >= DEFAULT_MAX_MATCHES) continue

          const range = match.range()
          
          const cliMatch: CliMatch = {
            text: match.text(),
            file: file,
            lines: getLinesAtRange(content, range),
            range: {
              byteOffset: { start: range.start.byte, end: range.end.byte },
              start: { line: range.start.line + 1, column: range.start.column + 1 },
              end: { line: range.end.line + 1, column: range.end.column + 1 },
            },
            charCount: { leading: 0, trailing: 0 },
            language: options.lang,
          }
          matches.push(cliMatch)
        }
      } catch (e) {
        // Skip files that can't be read or parsed
      }
    }
  }

  return {
    matches,
    totalMatches,
    truncated: totalMatches > DEFAULT_MAX_MATCHES,
    truncatedReason: totalMatches > DEFAULT_MAX_MATCHES ? "max_matches" : undefined,
  }
}

function getLinesAtRange(content: string, range: any): string {
  const lines = content.split("\n")
  return lines.slice(range.start.line, range.end.line + 1).join("\n")
}
