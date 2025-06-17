const { test, expect } = require('@playwright/test');

test('Simple timeline test', async ({ page }) => {
  // Navigate directly to a test page
  await page.goto('/portfolio-simulator-test.html');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  console.log('Testing timeline persistence...');
  
  // Add a property
  await page.click('button:has-text("Add Property")');
  await page.waitForTimeout(500);
  
  // Check if property was added
  const timelineCards = await page.locator('.timeline-card').count();
  console.log('Timeline cards after adding property:', timelineCards);
  expect(timelineCards).toBe(2); // Initial + property
  
  // Check metrics updated
  const income = await page.textContent('#monthlyIncome');
  console.log('Monthly income after property:', income);
  expect(income).not.toBe('$0');
  
  // Simulate refresh
  await page.click('button:has-text("Simulate Page Refresh")');
  await page.waitForTimeout(1500);
  
  // Check if timeline persisted
  const cardsAfterRefresh = await page.locator('.timeline-card').count();
  console.log('Timeline cards after refresh:', cardsAfterRefresh);
  expect(cardsAfterRefresh).toBe(2);
  
  // Check console for confirmation
  const consoleText = await page.textContent('#console');
  console.log('Console messages:', consoleText.split('\n').slice(-3).join('\n'));
  expect(consoleText).toContain('State loaded from localStorage');
  expect(consoleText).toContain('Timeline rebuilt with 2 events');
  
  console.log('✅ Timeline persistence test passed!');
});