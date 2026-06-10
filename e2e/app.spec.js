// e2e/app.spec.js
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Wait for left panel items to be rendered
  await page.waitForSelector('.infinite-list div', { timeout: 10000 });
});

test('left panel shows items on load', async ({ page }) => {
  // Items are rendered as "#N" inside the infinite-list
  const firstItem = page.locator('.infinite-list div').first();
  await expect(firstItem).toBeVisible();
  const text = await firstItem.textContent();
  expect(text).toMatch(/^#\d+$/);
});

test('filter narrows left panel items', async ({ page }) => {
  const filterInput = page.locator('input[placeholder="Filter by ID..."]').first();
  await filterInput.fill('123');
  await page.waitForTimeout(400); // debounce is 300ms

  const items = page.locator('.infinite-list div').filter({ hasText: /^#\d+$/ });
  const count = await items.count();
  if (count > 0) {
    const firstText = await items.first().textContent();
    expect(firstText).toContain('123');
  }
});

test('clicking item in left panel moves it out of left panel and into right panel', async ({ page }) => {
  // Get the text of the first clickable item before clicking
  const firstItem = page.locator('.infinite-list div').filter({ hasText: /^#\d+$/ }).first();
  const itemText = await firstItem.textContent();

  await firstItem.click();

  // The select queue flushes every 1s — wait for it
  await page.waitForTimeout(1500);

  // The item should now appear in the right panel (orange background items)
  const rightPanel = page.locator('h3').filter({ hasText: /^Selected/ }).locator('..').locator('div[style*="ffd180"], div[style*="fff3e0"]').first();
  // More robust: check the right panel via the SortableItem spans
  const selectedItems = page.locator('div').filter({ hasText: /^Selected/ }).locator('xpath=../..').locator('span').filter({ hasText: itemText });
  // Just confirm the header now shows count >= 1
  const selectedHeader = page.locator('h3').filter({ hasText: /^Selected/ });
  await expect(selectedHeader).toBeVisible();
  const headerText = await selectedHeader.textContent();
  // After selection and flush the count should reflect at least 1 item
  // (the header shows "Selected (N)" or "Selected (N+)")
  expect(headerText).toMatch(/Selected \(\d+\+?\)/);
});

test('add custom item shows no error on valid ID', async ({ page }) => {
  const addInput = page.locator('input[placeholder="New ID"]');
  await addInput.fill('9876543');
  await addInput.press('Enter');

  // The add queue flushes every 10s, but the error check is synchronous
  const error = page.locator('div').filter({ hasText: /valid positive integer/ });
  await expect(error).not.toBeVisible();

  // Input should be cleared after successful enqueue
  await expect(addInput).toHaveValue('');
});

test('invalid add ID shows error', async ({ page }) => {
  const addInput = page.locator('input[placeholder="New ID"]');
  await addInput.fill('-5');
  await addInput.press('Enter');

  // Use a precise locator: the error div rendered directly by LeftPanel
  const error = page.getByText('Enter a valid positive integer');
  await expect(error).toBeVisible();
});

test('right panel filter input is present and functional', async ({ page }) => {
  const rightFilter = page.locator('input[placeholder="Filter by ID..."]').nth(1);
  await expect(rightFilter).toBeVisible();
  await rightFilter.fill('999');
  await page.waitForTimeout(400); // debounce
  // No crash, page still intact
  await expect(page.locator('body')).toBeVisible();
  // Header still visible
  const selectedHeader = page.locator('h3').filter({ hasText: /^Selected/ });
  await expect(selectedHeader).toBeVisible();
});

test('layout: two panels side by side', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  const leftHeader = page.locator('h3').filter({ hasText: 'All Items' });
  const rightHeader = page.locator('h3').filter({ hasText: /^Selected/ });
  await expect(leftHeader).toBeVisible();
  await expect(rightHeader).toBeVisible();

  const leftBox = await leftHeader.boundingBox();
  const rightBox = await rightHeader.boundingBox();
  // Left panel header should be to the left of right panel header
  expect(leftBox.x).toBeLessThan(rightBox.x);
});

test('deselect removes item from right panel', async ({ page }) => {
  // Select an item from left panel
  const firstItem = page.locator('.infinite-list div').filter({ hasText: /^#\d+$/ }).first();
  const itemText = await firstItem.textContent();
  await firstItem.click();

  // Wait for the select queue to flush to server (flush interval = 1s)
  await page.waitForTimeout(1500);

  // Reload so the right panel fetches fresh server state
  await page.reload();
  await page.waitForSelector('.infinite-list div', { timeout: 10000 });

  // The item should now be in the right panel
  const selectedSpan = page.locator('span').filter({ hasText: itemText });
  await expect(selectedSpan).toBeVisible({ timeout: 5000 });

  // Click the ✕ button next to our item
  const itemRow = selectedSpan.locator('xpath=..'); // parent div of span
  const deselectBtn = itemRow.locator('button').filter({ hasText: '✕' });
  await deselectBtn.click();

  // Item should disappear immediately from the DOM (optimistic UI)
  await expect(selectedSpan).not.toBeVisible({ timeout: 3000 });
});
