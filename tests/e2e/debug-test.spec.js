const { test, expect } = require('@playwright/test');

test('Debug portfolio simulator', async ({ page }) => {
  // Navigate to portfolio simulator
  await page.goto('/portfolio-simulator.html');
  
  // Take screenshot
  await page.screenshot({ path: 'debug-1-initial.png', fullPage: true });
  
  // Check if simulation form is visible
  const startButton = await page.locator('button:has-text("START SIMULATION")');
  console.log('Start button visible:', await startButton.isVisible());
  
  // Fill form
  await page.fill('#simulationName', 'Debug Test');
  await page.fill('#targetIncome', '5000');
  await page.fill('#initialCapital', '25000');
  
  // Click start
  await startButton.click();
  
  // Wait for navigation or UI update
  await page.waitForTimeout(2000);
  
  // Take screenshot after start
  await page.screenshot({ path: 'debug-2-after-start.png', fullPage: true });
  
  // Check URL
  console.log('Current URL:', page.url());
  
  // Check if timeline is visible
  const timeline = await page.locator('#timelineTrack');
  console.log('Timeline visible:', await timeline.isVisible());
  
  // Check if add button exists
  const addButtons = await page.locator('.timeline-add-btn').count();
  console.log('Add buttons found:', addButtons);
  
  // Check if metrics are visible
  const metrics = await page.locator('.metric-card').count();
  console.log('Metric cards found:', metrics);
});