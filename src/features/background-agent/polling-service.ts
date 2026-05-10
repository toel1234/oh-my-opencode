import { POLLING_INTERVAL_MS } from "./constants"
import { log } from "../../shared"

export interface PollingTarget {
  pollRunningTasks(): Promise<void> | void
}

export class PollingService {
  private pollingInterval: Timer | undefined
  private isPolling = false
  private intervalMs: number

  constructor(private target: PollingTarget, intervalMs = POLLING_INTERVAL_MS) {
    this.intervalMs = intervalMs
  }

  start(): void {
    if (this.pollingInterval) return

    log("[PollingService] Starting background polling")
    this.pollingInterval = setInterval(async () => {
      if (this.isPolling) return
      
      this.isPolling = true
      try {
        await this.target.pollRunningTasks()
      } catch (err) {
        log("[PollingService] Error during poll:", err)
      } finally {
        this.isPolling = false
      }
    }, this.intervalMs)
    this.pollingInterval.unref()
  }

  stop(): void {
    if (this.pollingInterval) {
      log("[PollingService] Stopping background polling")
      clearInterval(this.pollingInterval)
      this.pollingInterval = undefined
    }
  }

  isActive(): boolean {
    return !!this.pollingInterval
  }
}
