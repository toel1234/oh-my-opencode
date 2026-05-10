import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { getOmoOpenCodeCacheDir } from "./data-path"
import { log } from "./logger"

export interface CacheEntry<T> {
  timestamp: number
  data: T
  hash?: string
}

export class DiscoveryCache<T> {
  private cachePath: string

  constructor(private name: string) {
    this.cachePath = join(getOmoOpenCodeCacheDir(), `discovery-${name}.json`)
  }

  get(key: string, currentHash?: string): T | null {
    if (!existsSync(this.cachePath)) return null

    try {
      const content = readFileSync(this.cachePath, "utf-8")
      const cache = JSON.parse(content) as Record<string, CacheEntry<T>>
      const entry = cache[key]

      if (!entry) return null
      
      // If currentHash is provided, verify it matches
      if (currentHash && entry.hash !== currentHash) {
        return null
      }

      return entry.data
    } catch (error) {
      log(`[DiscoveryCache:${this.name}] Failed to read cache`, error)
      return null
    }
  }

  set(key: string, data: T, hash?: string): void {
    let cache: Record<string, CacheEntry<T>> = {}
    
    try {
      if (existsSync(this.cachePath)) {
        cache = JSON.parse(readFileSync(this.cachePath, "utf-8"))
      } else {
        const dir = join(getOmoOpenCodeCacheDir())
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true })
        }
      }
    } catch {
      // Start with fresh cache if corrupt
    }

    cache[key] = {
      timestamp: Date.now(),
      data,
      hash,
    }

    try {
      writeFileSync(this.cachePath, JSON.stringify(cache, null, 2))
    } catch (error) {
      log(`[DiscoveryCache:${this.name}] Failed to write cache`, error)
    }
  }
}
