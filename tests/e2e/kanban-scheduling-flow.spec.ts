import { test, expect } from './fixtures/test-fixtures'
import type { StoreApi, UseBoundStore } from 'zustand'
import type { AppState } from '../../src/store'
import { randomUUID } from 'node:crypto'
import type { Page } from '@playwright/test'

const MODEL = 'DD-4S'

type WindowWithStore = Window & {
  useApp?: UseBoundStore<StoreApi<AppState>>
}

const waitForStore = async (page: Page) => {
  await page.waitForFunction(
    () => Boolean((window as WindowWithStore).useApp?.getState),
    undefined,
    { timeout: 10000 }
  )
}

const seedPumps = async (
  page: Page,
  pumps: AppState['pumps']
) => {
  await page.evaluate((seededPumps) => {
    const app = (window as WindowWithStore).useApp
    if (!app?.getState) {
      throw new Error('Zustand store not ready')
    }
    app.getState().replaceDataset(seededPumps)
  }, pumps)
}

const buildPump = (
  overrides: Partial<AppState['pumps'][number]> = {}
): AppState['pumps'][number] => ({
  id: randomUUID(),
  serial: 1001,
  po: 'POE2E001-01',
  customer: 'E2E Customer',
  model: MODEL,
  stage: 'QUEUE',
  priority: 'Normal',
  powder_color: '#ff4d4d',
  last_update: new Date().toISOString(),
  value: 20000,
  forecastStart: new Date().toISOString(),
  ...overrides,
})

test.describe('Kanban to Scheduling Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear()
      window.sessionStorage?.clear()
    })
  })

  test('create job, move across stages, and verify scheduling timeline', async ({ page }) => {
    await page.goto('/')
    await waitForStore(page)

    const pump = buildPump({ serial: 1234 })
    await seedPumps(page, [pump])

    await page.getByRole('button', { name: /kanban/i }).click()
    await expect(page.getByTestId('kanban-view')).toBeVisible()

    const queueColumn = page.getByTestId('kanban-column-QUEUE')
    const fabricationColumn = page.getByTestId('kanban-column-FABRICATION')
    const assemblyColumn = page.getByTestId('kanban-column-ASSEMBLY')

    const queueCard = queueColumn.locator(`[data-pump-id="${pump.id}"]`)
    await expect(queueCard).toBeVisible()

    await queueCard.dragTo(fabricationColumn)
    const fabricationCard = fabricationColumn.locator(
      `[data-pump-id="${pump.id}"]`
    )
    await expect(fabricationCard).toBeVisible()
    await expect(fabricationCard).toHaveAttribute(
      'data-pump-stage',
      'FABRICATION'
    )

    await fabricationCard.dragTo(assemblyColumn)
    const assemblyCard = assemblyColumn.locator(
      `[data-pump-id="${pump.id}"]`
    )
    await expect(assemblyCard).toBeVisible()
    await expect(assemblyCard).toHaveAttribute('data-pump-stage', 'ASSEMBLY')

    await page.getByRole('button', { name: /scheduling/i }).click()
    await expect(page.getByTestId('scheduling-view')).toBeVisible()

    const calendarEvent = page.locator(
      `[data-testid="calendar-event"][data-pump-id="${pump.id}"]`
    )
    await expect(calendarEvent).toBeVisible()
    await expect(calendarEvent).toHaveAttribute('data-stage', 'ASSEMBLY')
  })
})
