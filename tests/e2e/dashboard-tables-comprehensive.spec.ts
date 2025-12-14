import { test, expect } from "@playwright/test";

test.describe("Dashboard Tables and Drill-Down Comprehensive Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Production Overview")).toBeVisible();
  });

  test("Test WIP by Model chart and drill-down", async ({ page }) => {
    // Navigate to the appropriate view
    await expect(
      page.getByRole("heading", { name: "Production Overview" })
    ).toBeVisible();

    // Find WIP by Model chart
    const chartCard = page
      .locator(".relative.rounded-3xl")
      .filter({ hasText: "WIP by Model" });
    await expect(chartCard).toBeVisible();

    // Wait for chart to render
    await page.waitForTimeout(1000);

    // Click on a legend item to drill down
    const legendItem = chartCard.locator(".chart-legend-row__item").first();
    await expect(legendItem).toBeVisible();

    const modelName = await legendItem
      .locator(".chart-legend-row__label")
      .textContent();
    console.log("Clicking model:", modelName);

    await legendItem.click({ force: true });

    // Wait for drill-down
    await page.waitForTimeout(500);

    // Verify breadcrumb appears
    await expect(
      page.locator("button").filter({ hasText: "Dashboard" })
    ).toBeVisible();

    // Verify drill-down shows customer distribution
    await expect(
      page.getByRole("heading", { name: "Pumps by Customer" })
    ).toBeVisible();
  });

  test("Test Pumps by Customer chart", async ({ page }) => {
    // Navigate to Sales & Customers
    await page.getByRole("button", { name: "Next Topic" }).click();
    await page.getByRole("button", { name: "Next Topic" }).click();
    await expect(
      page.getByRole("heading", { name: "Sales & Customers" })
    ).toBeVisible();

    // Find Pumps by Customer chart
    const chartCard = page
      .locator(".relative.rounded-3xl")
      .filter({ hasText: "Pumps by Customer" });
    await expect(chartCard).toBeVisible();

    await page.waitForTimeout(1000);

    // Get first customer from legend
    const legendItem = chartCard.locator(".chart-legend-row__item").first();
    const customerName = await legendItem
      .locator(".chart-legend-row__label")
      .textContent();
    console.log("Testing customer:", customerName);

    // Click customer legend item
    await legendItem.click({ force: true });

    await page.waitForTimeout(500);

    // Verify drill-down occurred
    await expect(
      page.locator("button").filter({ hasText: "Dashboard" })
    ).toBeVisible();
  });

  test("Test Pumps by Stage chart", async ({ page }) => {
    // Should be visible on Production Overview
    await expect(
      page.getByRole("heading", { name: "Production Overview" })
    ).toBeVisible();

    // Find WIP by Stage chart (note: might be "WIP by Stage" not "Pumps by Stage")
    const chartCard = page
      .locator(".relative.rounded-3xl")
      .filter({ hasText: "WIP by Stage" });
    await expect(chartCard).toBeVisible();

    await page.waitForTimeout(1000);

    // Click on a stage segment
    const legendItem = chartCard.locator(".chart-legend-row__item").first();
    const stageName = await legendItem
      .locator(".chart-legend-row__label")
      .textContent();
    console.log("Testing stage:", stageName);

    await legendItem.click({ force: true });

    await page.waitForTimeout(500);

    // Verify drill-down
    await expect(
      page.locator("button").filter({ hasText: "Dashboard" })
    ).toBeVisible();
  });

  test("Test Treemap chart if present", async ({ page }) => {
    // Look for treemap across different topics
    const topics = [
      "Production Overview",
      "Schedule & Lead Times",
      "Sales & Customers",
    ];

    for (const topic of topics) {
      // Navigate to topic
      const heading = page.getByRole("heading", { name: topic });

      if (await heading.isVisible()) {
        // Check for treemap
        const treemap = page
          .locator(".recharts-wrapper")
          .filter({ has: page.locator(".recharts-treemap") });

        if ((await treemap.count()) > 0) {
          console.log("Found treemap in:", topic);

          // Try clicking a treemap cell
          const treemapCell = treemap.locator(".recharts-rectangle").first();
          if (await treemapCell.isVisible()) {
            await treemapCell.click();
            await page.waitForTimeout(500);

            // Check if drill-down occurred
            const breadcrumb = page
              .locator("button")
              .filter({ hasText: "Dashboard" });
            if (await breadcrumb.isVisible()) {
              console.log("Treemap drill-down successful");
              return;
            }
          }
        }
      }

      // Move to next topic
      const nextButton = page.getByRole("button", { name: "Next Topic" });
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }
    }

    console.log("No interactive treemap found");
  });

  test("Test Master Orders table rows", async ({ page }) => {
    // The master orders table should be below the charts
    await expect(
      page.getByRole("heading", { name: "Production Overview" })
    ).toBeVisible();

    // Scroll to find the table
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Look for a table
    const table = page.locator("table").first();

    if (await table.isVisible()) {
      console.log("Found master table");

      // Click on first table row
      const firstRow = table.locator("tbody tr").first();

      if (await firstRow.isVisible()) {
        await firstRow.click();
        await page.waitForTimeout(500);

        // Check if a modal or detail view appeared
        const modal = page
          .locator('[role="dialog"]')
          .or(page.locator(".modal"));

        if (await modal.isVisible()) {
          console.log("Table row click opened a modal");

          // Try to close modal
          const closeButton = modal
            .locator("button")
            .filter({ hasText: /close|×/i })
            .first();
          if (await closeButton.isVisible()) {
            await closeButton.click();
          }
        } else {
          console.log(
            "Table row click did not open a modal (might not be interactive)"
          );
        }
      }
    } else {
      console.log("Master orders table not found");
    }
  });

  test("Test all chart interactions without errors", async ({ page }) => {
    // Monitor console for errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate through all topics and click charts
    const topics = [
      "Production Overview",
      "Schedule & Lead Times",
      "Sales & Customers",
    ];

    for (let i = 0; i < topics.length; i++) {
      await page.waitForTimeout(500);

      // Find all chart cards
      const chartCards = page.locator(".relative.rounded-3xl");
      const count = await chartCards.count();

      console.log(`Topic ${topics[i]}: Found ${count} chart cards`);

      // Try clicking first legend item in each chart
      for (let j = 0; j < Math.min(count, 3); j++) {
        const card = chartCards.nth(j);
        const legendItem = card.locator(".chart-legend-row__item").first();

        if (await legendItem.isVisible()) {
          await legendItem.click({ force: true });
          await page.waitForTimeout(300);

          // Go back if breadcrumb appears
          const backButton = page
            .locator("button")
            .filter({ hasText: "Dashboard" });
          if (await backButton.isVisible()) {
            await backButton.click();
            await page.waitForTimeout(300);
          }
        }
      }

      // Move to next topic
      if (i < topics.length - 1) {
        const nextButton = page.getByRole("button", { name: "Next Topic" });
        if (await nextButton.isVisible()) {
          await nextButton.click();
        }
      }
    }

    // Verify no console errors
    console.log("Console errors:", consoleErrors);
    expect(consoleErrors.length).toBe(0);
  });
});
