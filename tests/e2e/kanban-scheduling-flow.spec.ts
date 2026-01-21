import { test, expect } from './fixtures/test-fixtures'
import { waitForStore, seedPumps, buildPump } from './helpers/test-utils'

const MODEL = 'DD-4S'

test.describe('Kanban to Scheduling Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear()
      window.sessionStorage?.clear()
    })
  })

  test('create job, move across stages, and verify scheduling timeline', async ({
    page,
  }) => {
    await page.goto('/')
    await waitForStore(page)

    const pump = buildPump({
      serial: 1234,
      model: MODEL,
      powder_color: '#ff4d4d',
      forecastStart: new Date().toISOString(),
    })
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
    const assemblyCard = assemblyColumn.locator(`[data-pump-id="${pump.id}"]`)
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
