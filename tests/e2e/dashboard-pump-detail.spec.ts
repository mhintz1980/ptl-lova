import { test, expect } from './fixtures/test-fixtures'
import type { StoreApi, UseBoundStore } from 'zustand'
import type { AppState } from '../../src/store'
import { randomUUID } from 'node:crypto'
import type { Page } from '@playwright/test'

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

const seedPumps = async (page: Page, pumps: AppState['pumps']) => {
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
  model: 'DD-4S',
  stage: 'QUEUE',
  priority: 'Normal',
  last_update: new Date().toISOString(),
  value: 20000,
  ...overrides,
})

test.describe('Dashboard Drilldown Pump Detail', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear()
      window.sessionStorage?.clear()
    })
  })

  test('drill down to pump list and open pump detail modal', async ({ page }) => {
    await page.goto('/')
    await waitForStore(page)

    const pumps = [
      buildPump({ serial: 1001, model: 'DD-4S' }),
      buildPump({ serial: 1002, model: 'DD-4S SAFE', po: 'POE2E001-02' }),
    ]

    await seedPumps(page, pumps)

    await expect(
      page.getByRole('heading', { name: 'Production Overview' })
    ).toBeVisible()

    await page.getByRole('button', { name: 'Next Topic' }).click()
    await page.getByRole('button', { name: 'Next Topic' }).click()

    await expect(
      page.getByRole('heading', { name: 'Sales & Customers' })
    ).toBeVisible()

    const customerChart = page
      .locator('.relative.rounded-3xl')
      .filter({ hasText: 'Pumps by Customer' })

    await expect(customerChart).toBeVisible()

    const customerLegendItem = customerChart
      .locator('.chart-legend-row__item')
      .first()

    await customerLegendItem.locator('.chart-legend-row__label').click()

    await expect(
      page.getByRole('heading', { name: 'Pumps by Model' })
    ).toBeVisible()

    const modelChart = page
      .locator('.relative.rounded-3xl')
      .filter({ hasText: 'Pumps by Model' })

    await expect(modelChart).toBeVisible()

    const modelLegendItem = modelChart
      .locator('.chart-legend-row__item')
      .first()

    await modelLegendItem.locator('.chart-legend-row__label').click()

    await expect(
      page.getByRole('heading', { name: 'Detailed Pump List' })
    ).toBeVisible()

    const poRow = page.getByText('POE2E001')
    await poRow.click()

    const pumpRow = page.getByText('#1001')
    await pumpRow.click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Pump Details' })
    ).toBeVisible()
  })
})
