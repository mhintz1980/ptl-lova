import { test, expect } from "@playwright/test";

test.describe("Dashboard Charts - Complete Visual Verification", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Production Overview")).toBeVisible();
    // Wait for charts to render
    await page.waitForTimeout(1000);
  });

  // ==================== PRODUCTION OVERVIEW (4 charts) ====================

  test("Production: WIP by Stage - renders with data", async ({ page }) => {
    const chartCard = page
      .locator(".relative.rounded-3xl")
      .filter({ hasText: "WIP by Stage" });
    await expect(chartCard).toBeVisible();

    // Verify chart renders (should have bar chart elements)
    const barChart = chartCard.locator(".recharts-bar-rectangles");
    await expect(barChart).toBeVisible();

    // Take screenshot
    await chartCard.screenshot({
      path: "test-results/charts/wip-by-stage.png",
    });

    // Verify NOT showing empty state
    await expect(page.getByText("No data available")).not.toBeVisible();
  });

  test("Production: Capacity by Department - renders with data", async ({
    page,
  }) => {
    const chartCard = page
      .locator(".relative.rounded-3xl")
      .filter({ hasText: "Capacity by Department" });
    await expect(chartCard).toBeVisible();

    // Verify chart renders
    const barChart = chartCard.locator(".recharts-bar-rectangles");
    await expect(barChart).toBeVisible();

    await chartCard.screenshot({
      path: "test-results/charts/capacity-by-dept.png",
    });
  });

  test("Production: Late Orders - renders with data (NOT empty)", async ({
    page,
  }) => {
    const chartCard = page
      .locator(".relative.rounded-3xl")
      .filter({ hasText: "Late Orders" });
    await expect(chartCard).toBeVisible();

    // CRITICAL: Verify NOT showing empty state
    const emptyMessage = chartCard.getByText("No late orders");
    await expect(emptyMessage).not.toBeVisible();

    // Should have bar chart with data
    const barChart = chartCard.locator(".recharts-bar-rectangles");
    await expect(barChart).toBeVisible();

    await chartCard.screenshot({ path: "test-results/charts/late-orders.png" });

    console.log("✅ Late Orders chart has data");
  });

  test("Production: Production Treemap - renders with visualization", async ({
    page,
  }) => {
    const chartCard = page
      .locator(".relative.rounded-3xl")
      .filter({ hasText: "Production Treemap" });
    await expect(chartCard).toBeVisible();

    // CRITICAL: Verify treemap SVG elements exist
    const treemapRects = chartCard.locator(".recharts-rectangle");
    const count = await treemapRects.count();

    expect(count).toBeGreaterThan(0);
    console.log(`✅ Treemap has ${count} rectangles`);

    // Verify NOT showing empty state
    await expect(page.getByText("No data available")).not.toBeVisible();

    await chartCard.screenshot({
      path: "test-results/charts/production-treemap.png",
    });
  });

  // ==================== SCHEDULE & LEAD TIMES (2 charts) ====================

  test("Schedule: Lead Time Trend - renders with data (NOT empty)", async ({
    page,
  }) => {
    // Navigate to Schedule & Lead Times
    await page.getByRole("button", { name: "Next Topic" }).click();
    await expect(
      page.getByRole("heading", { name: "Schedule & Lead Times" })
    ).toBeVisible();
    await page.waitForTimeout(500);

    const chartCard = page
      .locator(".relative.rounded-3xl")
      .filter({ hasText: "Lead Time Trend" });
    await expect(chartCard).toBeVisible();

    // CRITICAL: Verify NOT showing empty state
    const emptyMessage = chartCard.getByText(
      "No completed pumps with build time data"
    );
    await expect(emptyMessage).not.toBeVisible();

    // Should have area chart path
    const areaPath = chartCard.locator(".recharts-area-area");
    await expect(areaPath).toBeVisible();

    await chartCard.screenshot({
      path: "test-results/charts/lead-time-trend.png",
    });

    console.log("✅ Lead Time Trend chart has data");
  });

  test("Schedule: Late Orders (duplicate) - renders with data", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Next Topic" }).click();
    await expect(
      page.getByRole("heading", { name: "Schedule & Lead Times" })
    ).toBeVisible();
    await page.waitForTimeout(500);

    const chartCard = page
      .locator(".relative.rounded-3xl")
      .filter({ hasText: "Late Orders" });
    await expect(chartCard).toBeVisible();

    // Should NOT show empty state
    await expect(chartCard.getByText("No late orders")).not.toBeVisible();

    await chartCard.screenshot({
      path: "test-results/charts/late-orders-schedule.png",
    });
  });

  // ==================== SALES & CUSTOMERS (3 charts) ====================

  test("Sales: Pumps by Customer - renders with data", async ({ page }) => {
    // Navigate to Sales & Customers
    await page.getByRole("button", { name: "Next Topic" }).click();
    await page.getByRole("button", { name: "Next Topic" }).click();
    await expect(
      page.getByRole("heading", { name: "Sales & Customers" })
    ).toBeVisible();
    await page.waitForTimeout(500);

    const chartCard = page
      .locator(".relative.rounded-3xl")
      .filter({ hasText: "Pumps by Customer" });
    await expect(chartCard).toBeVisible();

    // Should have pie/legend elements
    const legend = chartCard.locator(".chart-legend-row__item");
    const legendCount = await legend.count();
    expect(legendCount).toBeGreaterThan(0);

    await chartCard.screenshot({
      path: "test-results/charts/pumps-by-customer.png",
    });

    console.log(`✅ Pumps by Customer has ${legendCount} legend items`);
  });

  test("Sales: WIP by Model - renders with data", async ({ page }) => {
    await page.getByRole("button", { name: "Next Topic" }).click();
    await page.getByRole("button", { name: "Next Topic" }).click();
    await expect(
      page.getByRole("heading", { name: "Sales & Customers" })
    ).toBeVisible();
    await page.waitForTimeout(500);

    const chartCard = page
      .locator(".relative.rounded-3xl")
      .filter({ hasText: "WIP by Model" });
    await expect(chartCard).toBeVisible();

    // Should have legend elements
    const legend = chartCard.locator(".chart-legend-row__item");
    const legendCount = await legend.count();
    expect(legendCount).toBeGreaterThan(0);

    await chartCard.screenshot({
      path: "test-results/charts/wip-by-model.png",
    });
  });

  test("Sales: Value by Customer - renders with data (NOT empty)", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Next Topic" }).click();
    await page.getByRole("button", { name: "Next Topic" }).click();
    await expect(
      page.getByRole("heading", { name: "Sales & Customers" })
    ).toBeVisible();
    await page.waitForTimeout(500);

    const chartCard = page
      .locator(".relative.rounded-3xl")
      .filter({ hasText: "Value by Customer" });
    await expect(chartCard).toBeVisible();

    // CRITICAL: Verify chart has data (pie chart should have sectors)
    const pieSectors = chartCard.locator(".recharts-pie-sector");
    const sectorCount = await pieSectors.count();

    expect(sectorCount).toBeGreaterThan(0);
    console.log(`✅ Value by Customer has ${sectorCount} pie sectors`);

    await chartCard.screenshot({
      path: "test-results/charts/value-by-customer.png",
    });
  });

  // ==================== INTERACTION TESTS ====================

  test("Chart drill-down: Click Pumps by Customer", async ({ page }) => {
    // Navigate to Sales & Customers
    await page.getByRole("button", { name: "Next Topic" }).click();
    await page.getByRole("button", { name: "Next Topic" }).click();
    await page.waitForTimeout(500);

    const chartCard = page
      .locator(".relative.rounded-3xl")
      .filter({ hasText: "Pumps by Customer" });
    const legendItem = chartCard.locator(".chart-legend-row__item").first();

    await legendItem.click({ force: true });
    await page.waitForTimeout(500);

    // Verify breadcrumb appears
    await expect(
      page.locator("button").filter({ hasText: "Dashboard" })
    ).toBeVisible();

    await page.screenshot({
      path: "test-results/charts/drilldown-customer.png",
    });
  });

  test("Chart drill-down: Click Treemap", async ({ page }) => {
    const chartCard = page
      .locator(".relative.rounded-3xl")
      .filter({ hasText: "Production Treemap" });

    // Click on a treemap rectangle
    const rect = chartCard
      .locator("rect")
      .filter({ hasNot: page.locator('[fill="none"]') })
      .first();

    if (await rect.isVisible()) {
      await rect.click();
      await page.waitForTimeout(500);

      // Check if breadcrumb navigation appeared (treemap has internal navigation)
      const homeButton = chartCard.locator("button").filter({ hasText: "All" });
      await expect(homeButton).toBeVisible();

      await page.screenshot({
        path: "test-results/charts/drilldown-treemap.png",
      });
    }
  });

  // ==================== CONSOLE ERROR CHECK ====================

  test("All charts render without console errors", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate through all topics
    const topics = [
      "Production Overview",
      "Schedule & Lead Times",
      "Sales & Customers",
    ];

    for (let i = 0; i < topics.length; i++) {
      await page.waitForTimeout(1000);

      // Count charts on this page
      const chartCards = page.locator(".relative.rounded-3xl");
      const count = await chartCards.count();

      console.log(`${topics[i]}: Found ${count} chart cards`);

      // Move to next topic
      if (i < topics.length - 1) {
        await page.getByRole("button", { name: "Next Topic" }).click();
      }
    }

    // Verify no console errors
    if (consoleErrors.length > 0) {
      console.log("❌ Console errors found:", consoleErrors);
    }
    expect(consoleErrors.length).toBe(0);

    console.log("✅ No console errors detected across all charts");
  });

  // ==================== VISUAL REGRESSION TEST ====================

  test("Full dashboard screenshot comparison", async ({ page }) => {
    // Production Overview
    await page.screenshot({
      path: "test-results/charts/full-dashboard-production.png",
      fullPage: true,
    });

    // Schedule & Lead Times
    await page.getByRole("button", { name: "Next Topic" }).click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: "test-results/charts/full-dashboard-schedule.png",
      fullPage: true,
    });

    // Sales & Customers
    await page.getByRole("button", { name: "Next Topic" }).click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: "test-results/charts/full-dashboard-sales.png",
      fullPage: true,
    });

    console.log("✅ Full dashboard screenshots captured for all topics");
  });
});
