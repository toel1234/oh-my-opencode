import { describe, expect, it, mock, beforeEach, afterEach } from "bun:test"
import { PollingService, type PollingTarget } from "./polling-service"

describe("PollingService", () => {
  let target: PollingTarget
  let service: PollingService
  const TEST_INTERVAL = 100

  beforeEach(() => {
    target = {
      pollRunningTasks: mock(() => {}),
    }
    service = new PollingService(target, TEST_INTERVAL)
  })

  afterEach(() => {
    service.stop()
  })

  it("should not be active initially", () => {
    expect(service.isActive()).toBe(false)
  })

  it("should become active when started", () => {
    service.start()
    expect(service.isActive()).toBe(true)
  })

  it("should become inactive when stopped", () => {
    service.start()
    service.stop()
    expect(service.isActive()).toBe(false)
  })

  it("should call target.pollRunningTasks periodically", async () => {
    service.start()
    
    // Wait for at least one interval
    await new Promise(resolve => setTimeout(resolve, TEST_INTERVAL + 50))
    
    expect(target.pollRunningTasks).toHaveBeenCalled()
  })

  it("should not allow concurrent polls if target is slow", async () => {
    let callCount = 0
    target.pollRunningTasks = mock(async () => {
      callCount++
      await new Promise(resolve => setTimeout(resolve, TEST_INTERVAL * 2))
    })

    service.start()
    
    // Wait for 3 intervals. Only 1 call should happen because it's still running.
    await new Promise(resolve => setTimeout(resolve, TEST_INTERVAL * 3))
    
    expect(callCount).toBe(1)
  })
})
