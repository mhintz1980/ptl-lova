import { test, expect } from './fixtures/test-fixtures'
import { waitForStore, seedPumps, buildPump } from './helpers/test-utils'

test.describe('Dashboard Drilldown Pump Detail', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear()
      window.sessionStorage?.clear()
    })
  })

  test('drill down to pump list and open pump detail modal', async ({
    page,
  }) => {
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

    // Use stable data-testid selectors instead of brittle CSS classes
    const customerChart = page.getByTestId('chart-pie-chart-pumps-by-customer')
    await expect(customerChart).toBeVisible()

    // Click on a legend item to drill down to model breakdown
    const customerLegendItem = page.getByTestId(
      'chart-legend-item-e2e-customer'
    )
    await customerLegendItem.click()

    await expect(
      page.getByRole('heading', { name: 'Pumps by Model' })
    ).toBeVisible()

    const modelChart = page.getByTestId('chart-pie-chart-pumps-by-model')
    await expect(modelChart).toBeVisible()

    // Click on a model legend item to drill down to pump list
    const modelLegendItem = page.getByTestId('chart-legend-item-dd-4s')
    await modelLegendItem.click()

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
