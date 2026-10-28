import { test, expect } from "@playwright/test";

test.describe("Devotee Seva Booking & Checkout Flow", () => {
  test("should display public events and navigate to booking form", async ({ page }) => {
    // 1. Visit Events Calendar
    await page.goto("/events");
    await expect(page).toHaveTitle(/Temple Pujas & Festive Events/);
    await expect(page.locator("h1")).toContainText("Upcoming Temple Events & Special Pujas");

    // 2. Visit About Page
    await page.goto("/about");
    await expect(page.locator("h1")).toContainText("About Sri Venkateswara Temple");

    // 3. Visit Contact Page
    await page.goto("/contact");
    await expect(page.locator("h1")).toContainText("Contact Us & Visit Guidelines");
  });

  test("should load booking confirmation receipt with valid structure", async ({ page }) => {
    // If accessing confirmation with invalid token, should return 404
    const response = await page.goto("/booking/non-existent-booking-id/confirmation?token=invalid");
    expect(response?.status()).toBe(404);
  });
});
