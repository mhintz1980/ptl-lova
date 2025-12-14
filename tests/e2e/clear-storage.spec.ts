import { test, expect } from "@playwright/test";

// This test clears localStorage before running visual tests
// to ensure fresh seed data is loaded with promiseDate and proper distribution

test("Clear localStorage and verify fresh data loads", async ({ page }) => {
  await page.goto("/");

  // Clear all localStorage
  await page.evaluate(() => {
    localStorage.clear();
  });

  console.log("✅ Cleared localStorage");

  // Reload the page to trigger fresh data load
  await page.reload();
  await page.waitForTimeout(2000); // Wait for data to load

  // Verify data loaded
  await expect(page.getByText("Production Overview")).toBeVisible();

  // Check that pumps were loaded
  const pumpElements = page.locator("[data-pump-id]");
  const count = await pumpElements.count();

  console.log(`✅ Loaded ${count} pump elements`);

  // Take screenshot of fresh state
  await page.screenshot({
    path: "test-results/fresh-data-load.png",
    fullPage: true,
  });
});
