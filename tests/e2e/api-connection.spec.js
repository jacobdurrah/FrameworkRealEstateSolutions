const { test, expect } = require('@playwright/test');

test.describe('API Connection and Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/portfolio-simulator.html');
  });

  test('Connection status indicator appears and shows status', async ({ page }) => {
    // Wait for connection status element
    const statusElement = page.locator('#connection-status');
    await expect(statusElement).toBeVisible({ timeout: 5000 });
    
    // Check that it has appropriate class
    const classes = await statusElement.getAttribute('class');
    expect(classes).toMatch(/connection-status\s+(connected|error|connecting)/);
    
    // Check for status text
    const statusText = await statusElement.locator('.status-text').textContent();
    expect(statusText).toBeTruthy();
  });

  test('Handles connection errors gracefully', async ({ page, context }) => {
    // Block Supabase requests to simulate connection error
    await context.route('**/supabase.co/**', route => route.abort());
    
    // Try to start a simulation
    await page.fill('#simulationName', 'Error Test');
    await page.click('button:has-text("START SIMULATION")');
    
    // Should show error message
    await page.waitForTimeout(2000);
    
    // Check for retry button in connection status
    const retryBtn = page.locator('.connection-status .retry-btn');
    await expect(retryBtn).toBeVisible({ timeout: 5000 });
    
    // Check status shows error
    const statusElement = page.locator('#connection-status');
    const classes = await statusElement.getAttribute('class');
    expect(classes).toContain('error');
  });

  test('Retry mechanism works when connection is restored', async ({ page, context }) => {
    // First block requests
    let requestBlocked = true;
    await context.route('**/supabase.co/**', route => {
      if (requestBlocked) {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    // Try to load simulations (will fail)
    await page.goto('/portfolio-simulator.html');
    await page.waitForTimeout(2000);
    
    // Verify error state
    const statusElement = page.locator('#connection-status');
    await expect(statusElement).toHaveClass(/error/);
    
    // Unblock requests
    requestBlocked = false;
    
    // Click retry
    await page.click('.retry-btn');
    
    // Wait for reconnection
    await page.waitForTimeout(3000);
    
    // Should show connected status
    await expect(statusElement).toHaveClass(/connected|connecting/);
  });

  test('Persists user email in localStorage', async ({ page }) => {
    // Clear localStorage
    await page.evaluate(() => localStorage.clear());
    
    // Mock prompt for email
    await page.evaluateHandle(() => {
      window.prompt = () => 'test@example.com';
    });
    
    // Start a simulation which will trigger email prompt
    await page.fill('#simulationName', 'Email Test');
    await page.click('button:has-text("START SIMULATION")');
    
    // Check localStorage
    const email = await page.evaluate(() => localStorage.getItem('simulationUserEmail'));
    expect(email).toBe('test@example.com');
  });

  test('Shows appropriate error messages for different failure types', async ({ page, context }) => {
    // Test network error
    await context.route('**/supabase.co/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    await page.fill('#simulationName', 'Server Error Test');
    await page.click('button:has-text("START SIMULATION")');
    
    // Wait for error handling
    await page.waitForTimeout(2000);
    
    // Check console for error messages
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));
    
    // Trigger another action to see retry messages
    await page.click('button:has-text("START SIMULATION")');
    await page.waitForTimeout(5000);
    
    // Should see retry attempts in console
    const retryMessages = consoleMessages.filter(msg => msg.includes('Retrying in'));
    expect(retryMessages.length).toBeGreaterThan(0);
  });
});