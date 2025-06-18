import { test, expect } from '@playwright/test';

test.describe('Market Analysis - Live Site Tests', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  
  test.beforeEach(async ({ page }) => {
    // Navigate to Market Analysis page
    await page.goto(`${baseURL}/market-analysis.html`);
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("Market Analysis Tool")');
  });

  test('should load Market Analysis page successfully', async ({ page }) => {
    // Check main elements exist
    await expect(page.locator('h1:has-text("Market Analysis Tool")')).toBeVisible();
    await expect(page.locator('#queryInput')).toBeVisible();
    await expect(page.locator('button:has-text("Run Analysis")')).toBeVisible();
    
    // Check AI Mode toggle
    await expect(page.locator('#aiModeToggle')).toBeVisible();
  });

  test('should execute cash sales query and display clean results', async ({ page }) => {
    // Ensure AI Mode is enabled
    const aiToggle = page.locator('#aiModeToggle');
    const isChecked = await aiToggle.isChecked();
    if (!isChecked) {
      await aiToggle.click();
    }
    
    // Enter query
    const queryInput = page.locator('#queryInput');
    await queryInput.fill('Show me all cash sales above $100k in 2023');
    
    // Click Run Analysis
    await page.click('button:has-text("Run Analysis")');
    
    // Wait for SQL preview
    await page.waitForSelector('#sqlPreviewSection', { timeout: 30000 });
    
    // Check SQL explanation is shown
    await expect(page.locator('#sqlExplanation')).toBeVisible();
    
    // Execute the SQL
    await page.click('button:has-text("Execute Query")');
    
    // Wait for results (check for visibility)
    await page.waitForSelector('#resultsSection', { state: 'visible', timeout: 30000 });
    
    // Check results summary
    const resultsSummary = page.locator('#resultsSummary');
    await expect(resultsSummary).toBeVisible();
    await expect(resultsSummary).toContainText('Found');
    
    // Check that table has data
    const resultsTable = page.locator('#resultsTable');
    await expect(resultsTable).toBeVisible();
    
    // Check table headers - should NOT contain metadata fields
    const headers = await page.locator('#resultsTable th').allTextContents();
    
    // Verify no metadata columns are present
    const unwantedHeaders = ['Data Source', 'Created At', 'Updated At', 'Id', 'Sync Status'];
    for (const unwanted of unwantedHeaders) {
      expect(headers).not.toContain(unwanted);
    }
    
    // Verify expected columns ARE present
    const expectedHeaders = ['Buyer Name', 'Seller Name', 'Sale Date', 'Sale Price', 'Property Address'];
    for (const expected of expectedHeaders) {
      const hasHeader = headers.some(h => h.includes(expected));
      expect(hasHeader).toBeTruthy();
    }
    
    // Check that results don't show "2025 Resi All Transactions"
    const tableText = await resultsTable.textContent();
    expect(tableText).not.toContain('2025 Resi All Transactions');
    
    // Verify at least one row of data
    const rows = page.locator('#resultsTable tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should handle Jacob Durrah property search correctly', async ({ page }) => {
    // Ensure AI Mode is enabled
    const aiToggle = page.locator('#aiModeToggle');
    if (!(await aiToggle.isChecked())) {
      await aiToggle.click();
    }
    
    // Enter query
    await page.fill('#queryInput', 'What properties did Jacob Durrah buy in Detroit?');
    
    // Run analysis
    await page.click('button:has-text("Run Analysis")');
    
    // Wait for SQL preview
    await page.waitForSelector('#sqlPreviewSection', { timeout: 30000 });
    
    // Check that SQL uses appropriate pattern for names
    const sqlCode = await page.locator('#sqlCode').textContent();
    // The SQL should search for the buyer name (either with OR pattern or concatenated)
    expect(sqlCode).toMatch(/buyer_name\s+ILIKE\s+'%DURRAH%.*'/i);
    
    // Execute SQL
    await page.click('button:has-text("Execute Query")');
    
    // Wait for results (check for visibility)
    await page.waitForSelector('#resultsSection', { state: 'visible', timeout: 30000 });
    
    // Results should be displayed (even if no matches)
    await expect(page.locator('#resultsSummary')).toBeVisible();
  });

  test('should display parcels data with proper prefixes', async ({ page }) => {
    // Enable AI Mode
    const aiToggle = page.locator('#aiModeToggle');
    if (!(await aiToggle.isChecked())) {
      await aiToggle.click();
    }
    
    // Query that would include parcels data
    await page.fill('#queryInput', 'Show me properties with their assessed values in 48214');
    
    // Run analysis
    await page.click('button:has-text("Run Analysis")');
    
    // Wait and execute SQL
    await page.waitForSelector('#sqlPreviewSection', { timeout: 30000 });
    await page.click('button:has-text("Execute Query")');
    
    // Wait for results (check for visibility)
    await page.waitForSelector('#resultsSection', { state: 'visible', timeout: 30000 });
    
    // Check if parcels fields are properly prefixed (if present)
    const headers = await page.locator('#resultsTable th').allTextContents();
    
    // If parcels data is included, it should have parcel_ prefix
    const parcelHeaders = headers.filter(h => h.toLowerCase().includes('parcel'));
    if (parcelHeaders.length > 0) {
      // Check that parcel fields have proper prefix
      expect(parcelHeaders.some(h => h.includes('Parcel'))).toBeTruthy();
    }
  });

  test('should export results successfully', async ({ page }) => {
    // Run a simple query first
    const aiToggle = page.locator('#aiModeToggle');
    if (!(await aiToggle.isChecked())) {
      await aiToggle.click();
    }
    
    await page.fill('#queryInput', 'Show recent sales in Detroit');
    await page.click('button:has-text("Run Analysis")');
    await page.waitForSelector('#sqlPreviewSection', { timeout: 30000 });
    await page.click('button:has-text("Execute Query")');
    await page.waitForSelector('#resultsSection', { timeout: 30000 });
    
    // Test CSV export
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export CSV")')
    ]);
    
    expect(download).toBeTruthy();
    expect(download.suggestedFilename()).toMatch(/market-analysis.*\.csv/);
  });
});

// Run a quick smoke test
test('Market Analysis page loads and accepts queries', async ({ page }) => {
  await page.goto('https://frameworkrealestatesolutions.com/market-analysis.html');
  
  // Basic checks
  await expect(page.locator('h1:has-text("Market Analysis Tool")')).toBeVisible();
  await expect(page.locator('#queryInput')).toBeVisible();
  
  // Check AI mode can be toggled
  const aiToggle = page.locator('#aiModeToggle');
  await expect(aiToggle).toBeVisible();
  
  // Toggle it
  const initialState = await aiToggle.isChecked();
  await aiToggle.click();
  const newState = await aiToggle.isChecked();
  expect(newState).toBe(!initialState);
});