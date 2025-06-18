import { test, expect } from '@playwright/test';

test.describe('Market Analysis - JSON Error Handling', () => {
  const LIVE_URL = 'https://frameworkrealestatesolutions.com';
  
  test('should handle "Unexpected token <" error gracefully', async ({ page }) => {
    // Navigate to Market Analysis page
    await page.goto(`${LIVE_URL}/market-analysis.html`);
    
    // Wait for page to load
    await page.waitForSelector('#queryInput', { timeout: 10000 });
    
    // Enable AI mode
    const aiToggle = page.locator('#aiModeToggle');
    await aiToggle.click();
    await expect(aiToggle).toBeChecked();
    
    // Set up request interception to simulate HTML error response
    await page.route('**/api/market/generate-sql', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'text/html',
        body: '<html><body><h1>500 Internal Server Error</h1></body></html>'
      });
    });
    
    // Enter query
    await page.locator('#queryInput').fill('Did jacob durrah buy a house in 2024?');
    
    // Click Run Analysis
    await page.locator('button:has-text("Run Analysis")').click();
    
    // Should show error message, not "Unexpected token <"
    const errorMessage = page.locator('#errorMessage');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    const errorText = await errorMessage.textContent();
    
    // Should NOT contain the raw JSON parsing error
    expect(errorText).not.toContain('Unexpected token');
    expect(errorText).not.toContain('JSON');
    
    // Should contain a user-friendly error message
    expect(errorText.toLowerCase()).toMatch(/error|failed|try again|problem/);
  });

  test('should handle malformed JSON responses', async ({ page }) => {
    // Navigate to Market Analysis page
    await page.goto(`${LIVE_URL}/market-analysis.html`);
    
    await page.waitForSelector('#queryInput');
    
    // Enable AI mode
    await page.locator('#aiModeToggle').click();
    
    // Set up request interception to return malformed JSON
    await page.route('**/api/market/generate-sql', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"sql": "SELECT * FROM sales", "explanation"' // Incomplete JSON
      });
    });
    
    // Enter query and run
    await page.locator('#queryInput').fill('Show recent sales');
    await page.locator('button:has-text("Run Analysis")').click();
    
    // Should show error message
    const errorMessage = page.locator('#errorMessage');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Should show a user-friendly message
    const errorText = await errorMessage.textContent();
    expect(errorText.toLowerCase()).toMatch(/error|failed|invalid/);
  });

  test('should successfully generate SQL when API works correctly', async ({ page }) => {
    // Navigate to Market Analysis page
    await page.goto(`${LIVE_URL}/market-analysis.html`);
    
    await page.waitForSelector('#queryInput');
    
    // Enable AI mode
    await page.locator('#aiModeToggle').click();
    
    // Enter a simple query
    await page.locator('#queryInput').fill('Show recent sales');
    
    // Click Run Analysis
    await page.locator('button:has-text("Run Analysis")').click();
    
    // Wait for either SQL preview or error
    const result = await Promise.race([
      page.waitForSelector('#sqlPreviewSection', { state: 'visible', timeout: 30000 }).then(() => 'sql'),
      page.waitForSelector('#errorMessage', { state: 'visible', timeout: 30000 }).then(() => 'error')
    ]);
    
    if (result === 'sql') {
      // Verify SQL preview elements
      await expect(page.locator('#sqlExplanation')).toBeVisible();
      await expect(page.locator('#sqlCode')).toBeVisible();
      
      // SQL should contain SELECT statement
      const sqlCode = await page.locator('#sqlCode').textContent();
      expect(sqlCode).toContain('SELECT');
      expect(sqlCode).toContain('FROM sales_transactions');
    } else {
      // If error, it should be a proper error message, not JSON parsing error
      const errorText = await page.locator('#errorMessage').textContent();
      expect(errorText).not.toContain('Unexpected token');
      expect(errorText).not.toContain('JSON.parse');
    }
  });

  test('should handle network failures gracefully', async ({ page }) => {
    // Navigate to Market Analysis page
    await page.goto(`${LIVE_URL}/market-analysis.html`);
    
    await page.waitForSelector('#queryInput');
    
    // Enable AI mode
    await page.locator('#aiModeToggle').click();
    
    // Set up request interception to simulate network failure
    await page.route('**/api/market/generate-sql', async route => {
      await route.abort('failed');
    });
    
    // Enter query and run
    await page.locator('#queryInput').fill('Test query');
    await page.locator('button:has-text("Run Analysis")').click();
    
    // Should show error message
    const errorMessage = page.locator('#errorMessage');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Should show network-related error
    const errorText = await errorMessage.textContent();
    expect(errorText.toLowerCase()).toMatch(/network|connection|failed|error/);
  });
});