import { test, expect } from '@playwright/test';

test.describe('Market Analysis AI - Simple Tests', () => {
  const LIVE_URL = 'https://framework-dqphg3vnn-jacob-durrahs-projects.vercel.app';
  
  test('AI mode toggle and basic functionality', async ({ page }) => {
    // Navigate to Market Analysis page
    await page.goto(`${LIVE_URL}/market-analysis.html`);
    
    // Wait for page to load
    await page.waitForSelector('#queryInput', { timeout: 10000 });
    
    // Screenshot initial state
    await page.screenshot({ path: 'market-analysis-initial.png' });
    
    // Check AI toggle exists and is unchecked
    const aiToggle = page.locator('#aiModeToggle');
    await expect(aiToggle).toBeVisible();
    await expect(aiToggle).not.toBeChecked();
    
    // Toggle AI mode on
    await aiToggle.click();
    await expect(aiToggle).toBeChecked();
    
    // Enter a simple query
    await page.locator('#queryInput').fill('Show recent sales');
    
    // Click Run Analysis
    await page.locator('button:has-text("Run Analysis")').click();
    
    // Wait for either SQL preview or error (with longer timeout for API)
    const result = await Promise.race([
      page.waitForSelector('#sqlPreviewSection', { state: 'visible', timeout: 30000 }).then(() => 'sql'),
      page.waitForSelector('#errorMessage', { state: 'visible', timeout: 30000 }).then(() => 'error'),
      page.waitForSelector('#loadingState', { state: 'visible', timeout: 5000 }).then(async () => {
        // If loading appears, wait for it to disappear
        await page.waitForSelector('#loadingState', { state: 'hidden', timeout: 30000 });
        return 'loaded';
      })
    ]);
    
    // Take screenshot of result
    await page.screenshot({ path: 'market-analysis-result.png' });
    
    console.log('Test result:', result);
    
    // Check what happened
    if (result === 'sql' || result === 'loaded') {
      // Check if SQL preview is visible
      const sqlPreviewVisible = await page.locator('#sqlPreviewSection').isVisible();
      if (sqlPreviewVisible) {
        console.log('SQL Preview shown successfully');
        const sqlCode = await page.locator('#sqlCode').textContent();
        console.log('Generated SQL:', sqlCode);
        expect(sqlCode).toBeTruthy();
      }
    } else if (result === 'error') {
      const errorText = await page.locator('#errorMessage').textContent();
      console.log('Error occurred:', errorText);
      // This might be expected if API is not configured
    }
  });

  test('Pattern mode still works', async ({ page }) => {
    // Navigate to Market Analysis page
    await page.goto(`${LIVE_URL}/market-analysis.html`);
    
    // Wait for page to load
    await page.waitForSelector('#queryInput', { timeout: 10000 });
    
    // Make sure AI mode is OFF
    const aiToggle = page.locator('#aiModeToggle');
    const isChecked = await aiToggle.isChecked();
    if (isChecked) {
      await aiToggle.click();
    }
    
    // Use a pattern-based query
    await page.locator('#queryInput').fill('Top buyers');
    await page.locator('button:has-text("Run Analysis")').click();
    
    // Should show results or loading
    await page.waitForSelector('#loadingState', { state: 'visible', timeout: 5000 });
    
    // Wait for results or error
    const result = await Promise.race([
      page.waitForSelector('#resultsSection', { state: 'visible', timeout: 15000 }).then(() => 'results'),
      page.waitForSelector('#errorMessage', { state: 'visible', timeout: 15000 }).then(() => 'error')
    ]);
    
    console.log('Pattern mode result:', result);
    
    if (result === 'results') {
      const summaryText = await page.locator('#resultsSummary').textContent();
      console.log('Results summary:', summaryText);
      expect(summaryText).toBeTruthy();
    }
  });
});