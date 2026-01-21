import { Page, Locator, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import type { StoreApi, UseBoundStore } from 'zustand'
import type { AppState } from '../../../src/store'

// Zustand store type for window access
export type WindowWithStore = Window & {
  useApp?: UseBoundStore<StoreApi<AppState>>
}

// Wait for Zustand store to be available
export const waitForStore = async (page: Page) => {
  await page.waitForFunction(
    () => Boolean((window as WindowWithStore).useApp?.getState),
    undefined,
    { timeout: 10000 }
  )
}

// Seed pumps into the store
export const seedPumps = async (page: Page, pumps: AppState['pumps']) => {
  await page.evaluate((seededPumps) => {
    const app = (window as WindowWithStore).useApp
    if (!app?.getState) {
      throw new Error('Zustand store not ready')
    }
    app.getState().replaceDataset(seededPumps)
  }, pumps)
}

// Build a pump with defaults and overrides
export const buildPump = (
  overrides: Partial<AppState['pumps'][number]> = {}
): AppState['pumps'][number] => ({
  id: randomUUID(),
  serial: 1001,
  po: 'POE2E001-01',
  customer: 'E2E Customer',
  model: 'DD-4S',
  stage: 'QUEUE',
  priority: 'Normal',
  last_update: new Date().toISOString(),
  value: 20000,
  ...overrides,
})

export class SchedulingPageHelper {
  constructor(private page: Page) {}

  // Navigation helpers
  async navigateToScheduling() {
    await this.page.getByRole('button', { name: /scheduling/i }).click()
    await this.page.waitForSelector(
      '[data-testid="scheduling-view"], .scheduling-view',
      { timeout: 10000 }
    )
  }

  async navigateToDashboard() {
    await this.page.getByRole('button', { name: /dashboard/i }).click()
    await this.page.waitForSelector(
      '[data-testid="dashboard-view"], .dashboard-components',
      { timeout: 5000 }
    )
  }

  async navigateToKanban() {
    await this.page.getByRole('button', { name: /kanban/i }).click()
    await this.page.waitForSelector(
      '[data-testid="kanban-board"], .kanban-board',
      { timeout: 5000 }
    )
  }

  // Component getters
  getUnscheduledJobs(): Locator {
    return this.page.locator('[data-testid="backlog-dock"] [data-pump-id]')
  }

  getCalendarCells(): Locator {
    return this.page.locator('[data-testid="calendar-cell"], .calendar-cell')
  }

  getCalendarEvents(): Locator {
    return this.page.locator('[data-testid="calendar-event"]')
  }

  getEventDetailPanel(): Locator {
    return this.page.locator('[data-testid="event-detail-panel"]')
  }

  getSchedulingSidebar(): Locator {
    return this.page.locator('[data-testid="backlog-dock"]')
  }

  getMainCalendarGrid(): Locator {
    return this.page.locator('[data-testid="calendar-grid"]')
  }

  // New lifecycle helpers
  getCalendarEventByPumpId(pumpId: string): Locator {
    return this.page.locator(
      `[data-pump-id="${pumpId}"][data-testid="calendar-event"]`
    )
  }

  getCalendarEventByStage(stage: string): Locator {
    return this.page.locator(
      `[data-stage="${stage}"][data-testid="calendar-event"]`
    )
  }

  // Wait helpers
  async waitForJobsToLoad() {
    await this.page.waitForSelector('[data-pump-id]', { timeout: 10000 })
  }

  async waitForCalendarToLoad() {
    await this.page.waitForSelector(
      '[data-testid="calendar-grid"], .calendar-grid',
      { timeout: 10000 }
    )
  }

  // Drag and drop helper
  async dragJobToCalendar(jobIndex: number = 0, cellIndex: number = 0) {
    const jobCard = this.getUnscheduledJobs().nth(jobIndex)
    const calendarCell = this.getCalendarCells().nth(cellIndex)

    await jobCard.dragTo(calendarCell)
    await this.page.waitForTimeout(500)
  }

  // Data extraction helpers
  async getJobCount(): Promise<number> {
    return await this.getUnscheduledJobs().count()
  }

  async getEventCount(): Promise<number> {
    return await this.getCalendarEvents().count()
  }

  async getJobPumpId(index: number): Promise<string | null> {
    return await this.getUnscheduledJobs()
      .nth(index)
      .getAttribute('data-pump-id')
  }

  async getJobModel(index: number): Promise<string | null> {
    return await this.getUnscheduledJobs()
      .nth(index)
      .locator('.text-sm.font-semibold')
      .textContent()
  }

  // Interaction helpers
  async clickCalendarEvent(index: number = 0) {
    const event = this.getCalendarEvents().nth(index)
    await event.click()
  }

  async closeEventDetailPanel() {
    const closeButton = this.page
      .locator(
        '[data-testid="close-detail-panel"], .close-detail-panel, button'
      )
      .filter({ hasText: /close/i })
      .first()
    if (await closeButton.isVisible()) {
      await closeButton.click()
    }
  }

  // Validation helpers
  async isJobInSidebar(pumpId: string): Promise<boolean> {
    const jobInSidebar = this.getUnscheduledJobs().locator(
      `[data-pump-id="${pumpId}"]`
    )
    return await jobInSidebar.isVisible()
  }

  async isEventDetailPanelOpen(): Promise<boolean> {
    return await this.getEventDetailPanel().isVisible()
  }

  // Search/filter helpers
  async searchJobs(searchTerm: string) {
    const searchInput = this.page.locator(
      'input[placeholder*="search"], input[placeholder*="filter"], [data-testid="search-input"]'
    )
    if (await searchInput.isVisible()) {
      await searchInput.fill(searchTerm)
      await this.page.waitForTimeout(1000)
    }
  }

  async clearSearch() {
    const searchInput = this.page.locator(
      'input[placeholder*="search"], input[placeholder*="filter"], [data-testid="search-input"]'
    )
    if (await searchInput.isVisible()) {
      await searchInput.fill('')
      await this.page.waitForTimeout(1000)
    }
  }
}

// Test data helpers
export const TestData = {
  samplePumpModels: ['Model A', 'Model B', 'Model C', 'Model D'],
  samplePriorities: ['Urgent', 'High', 'Normal', 'Low'],
  sampleCustomers: ['Customer A', 'Customer B', 'Customer C'],

  getRandomPumpModel(): string {
    return this.samplePumpModels[
      Math.floor(Math.random() * this.samplePumpModels.length)
    ]
  },

  getRandomPriority(): string {
    return this.samplePriorities[
      Math.floor(Math.random() * this.samplePriorities.length)
    ]
  },

  getRandomCustomer(): string {
    return this.sampleCustomers[
      Math.floor(Math.random() * this.sampleCustomers.length)
    ]
  },
}

// Assertion helpers
export const Assertions = {
  async expectJobToBeMoved(
    page: Page,
    pumpId: string,
    shouldBeInSidebar: boolean
  ) {
    const helper = new SchedulingPageHelper(page)
    const isInSidebar = await helper.isJobInSidebar(pumpId)

    if (shouldBeInSidebar) {
      expect(isInSidebar).toBeTruthy()
    } else {
      expect(isInSidebar).toBeFalsy()
    }
  },

  async expectJobStage(page: Page, pumpId: string, expectedStage: string) {
    const helper = new SchedulingPageHelper(page)

    if (expectedStage === 'UNSCHEDULED') {
      // Check if job is in sidebar (only UNSCHEDULED jobs appear there)
      const isInSidebar = await helper.isJobInSidebar(pumpId)
      expect(isInSidebar).toBeTruthy()
    } else {
      // Check if job appears on calendar with correct stage
      const calendarEvent = helper.getCalendarEventByPumpId(pumpId)
      await expect(calendarEvent).toBeVisible()
      await expect(calendarEvent).toHaveAttribute('data-stage', expectedStage)

      // Verify job is NOT in sidebar
      const isInSidebar = await helper.isJobInSidebar(pumpId)
      expect(isInSidebar).toBeFalsy()
    }
  },

  async expectJobToBeUnscheduled(page: Page, pumpId: string) {
    await this.expectJobStage(page, pumpId, 'UNSCHEDULED')
  },

  async expectJobToBeScheduled(page: Page, pumpId: string) {
    await this.expectJobStage(page, pumpId, 'NOT STARTED')
  },

  async expectComponentToBeVisible(locator: Locator, timeout: number = 5000) {
    await expect(locator).toBeVisible({ timeout })
  },

  async expectComponentToBeHidden(locator: Locator) {
    await expect(locator).not.toBeVisible()
  },
}
