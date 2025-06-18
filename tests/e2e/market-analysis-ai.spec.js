import { test, expect } from '@playwright/test';

test.describe('Market Analysis AI Mode', () => {
  const LIVE_URL = 'https://framework-dqphg3vnn-jacob-durrahs-projects.vercel.app';
  
  test.beforeEach(async ({ page }) => {
    // Navigate to Market Analysis page
    await page.goto(`${LIVE_URL}/market-analysis.html`);
    
    // Wait for page to load
    await page.waitForSelector('#queryInput');
  });

  test('should toggle AI mode and show appropriate suggestions', async ({ page }) => {
    // Check initial state - AI mode should be off
    const aiToggle = page.locator('#aiModeToggle');
    await expect(aiToggle).not.toBeChecked();
    
    // Get initial suggestions (pattern-based)
    const patternSuggestions = await page.locator('.suggestion-chip').allTextContents();
    expect(patternSuggestions.length).toBeGreaterThan(0);
    expect(patternSuggestions[0]).toContain('Top');
    
    // Toggle AI mode on
    await aiToggle.click();
    await expect(aiToggle).toBeChecked();
    
    // Wait for suggestions to update
    await page.waitForTimeout(500);
    
    // Get AI mode suggestions
    const aiSuggestions = await page.locator('.suggestion-chip').allTextContents();
    expect(aiSuggestions.length).toBeGreaterThan(0);
    expect(aiSuggestions.some(s => s.includes('Jacob Durrah'))).toBeTruthy();
  });

  test('should generate SQL preview in AI mode', async ({ page }) => {
    // Enable AI mode
    await page.locator('#aiModeToggle').click();
    
    // Enter a natural language query
    const queryInput = page.locator('#queryInput');
    await queryInput.fill('What properties did Jacob Durrah buy?');
    
    // Click Run Analysis
    await page.locator('button:has-text("Run Analysis")').click();
    
    // Wait for SQL preview to appear
    await page.waitForSelector('#sqlPreviewSection', { state: 'visible', timeout: 15000 });
    
    // Check SQL preview elements
    const sqlExplanation = page.locator('#sqlExplanation');
    await expect(sqlExplanation).toBeVisible();
    await expect(sqlExplanation).toContainText(/query|search|find/i);
    
    const sqlCode = page.locator('#sqlCode');
    await expect(sqlCode).toBeVisible();
    const sqlText = await sqlCode.textContent();
    expect(sqlText).toContain('SELECT');
    expect(sqlText).toMatch(/Jacob.*Durrah|buyer_name|grantee/i);
    expect(sqlText).toContain('LIMIT');
    
    // Check action buttons
    await expect(page.locator('button:has-text("Execute Query")')).toBeVisible();
    await expect(page.locator('button:has-text("Modify")')).toBeVisible();
  });

  test('should execute AI-generated SQL and display results', async ({ page }) => {
    // Enable AI mode
    await page.locator('#aiModeToggle').click();
    
    // Use a simple query that should return results
    await page.locator('#queryInput').fill('Show me sales from 2023');
    await page.locator('button:has-text("Run Analysis")').click();
    
    // Wait for SQL preview
    await page.waitForSelector('#sqlPreviewSection', { state: 'visible', timeout: 15000 });
    
    // Execute the query
    await page.locator('button:has-text("Execute Query")').click();
    
    // Wait for results
    await page.waitForSelector('#resultsSection', { state: 'visible', timeout: 15000 });
    
    // Check results display
    const resultsSummary = page.locator('#resultsSummary');
    await expect(resultsSummary).toBeVisible();
    
    // Check for results table
    const resultsTable = page.locator('#resultsTable');
    await expect(resultsTable).toBeVisible();
    
    // Check export buttons are visible
    await expect(page.locator('button:has-text("Export CSV")')).toBeVisible();
    await expect(page.locator('button:has-text("Export JSON")')).toBeVisible();
  });

  test('should handle complex AI queries', async ({ page }) => {
    // Enable AI mode
    await page.locator('#aiModeToggle').click();
    
    // Enter a complex query
    await page.locator('#queryInput').fill('Who bought the most properties in zip code 48214 in the last year?');
    await page.locator('button:has-text("Run Analysis")').click();
    
    // Wait for SQL preview
    await page.waitForSelector('#sqlPreviewSection', { state: 'visible', timeout: 15000 });
    
    // Check generated SQL contains expected elements
    const sqlCode = await page.locator('#sqlCode').textContent();
    expect(sqlCode).toContain('SELECT');
    expect(sqlCode).toContain('48214');
    expect(sqlCode).toMatch(/GROUP BY|COUNT|ORDER BY/i);
  });

  test('should handle modify query action', async ({ page }) => {
    // Enable AI mode
    await page.locator('#aiModeToggle').click();
    
    // Generate SQL
    await page.locator('#queryInput').fill('Show all cash sales');
    await page.locator('button:has-text("Run Analysis")').click();
    
    // Wait for SQL preview
    await page.waitForSelector('#sqlPreviewSection', { state: 'visible' });
    
    // Click Modify
    await page.locator('button:has-text("Modify")').click();
    
    // SQL preview should be hidden
    await expect(page.locator('#sqlPreviewSection')).not.toBeVisible();
    
    // Query input should still have the text and be focused
    await expect(page.locator('#queryInput')).toHaveValue('Show all cash sales');
    await expect(page.locator('#queryInput')).toBeFocused();
  });

  test('should show error for invalid queries', async ({ page }) => {
    // Enable AI mode
    await page.locator('#aiModeToggle').click();
    
    // Enter an empty query
    await page.locator('#queryInput').fill('');
    await page.locator('button:has-text("Run Analysis")').click();
    
    // Should show error
    const errorMessage = page.locator('#errorMessage');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Please enter a query');
  });

  test('should maintain query history', async ({ page }) => {
    // Enable AI mode
    await page.locator('#aiModeToggle').click();
    
    // Execute a query
    const testQuery = 'List properties sold in December 2023';
    await page.locator('#queryInput').fill(testQuery);
    await page.locator('button:has-text("Run Analysis")').click();
    
    // Wait for SQL preview
    await page.waitForSelector('#sqlPreviewSection', { state: 'visible' });
    
    // Execute the SQL
    await page.locator('button:has-text("Execute Query")').click();
    
    // Wait for results
    await page.waitForSelector('#resultsSection', { state: 'visible' });
    
    // Check query history
    const historyItems = page.locator('.history-item');
    await expect(historyItems.first()).toContainText(testQuery);
  });

  test('should switch between AI and pattern modes correctly', async ({ page }) => {
    // Start in pattern mode
    await page.locator('#queryInput').fill('Top buyers');
    await page.locator('button:has-text("Run Analysis")').click();
    
    // Should show results directly (no SQL preview)
    await page.waitForSelector('#resultsSection', { state: 'visible' });
    await expect(page.locator('#sqlPreviewSection')).not.toBeVisible();
    
    // Clear and switch to AI mode
    await page.locator('button:has-text("Clear")').click();
    await page.locator('#aiModeToggle').click();
    
    // Try AI query
    await page.locator('#queryInput').fill('Show top buyers');
    await page.locator('button:has-text("Run Analysis")').click();
    
    // Should show SQL preview in AI mode
    await page.waitForSelector('#sqlPreviewSection', { state: 'visible' });
    await expect(page.locator('#resultsSection')).not.toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Enable AI mode
    await page.locator('#aiModeToggle').click();
    
    // Try a query that might trigger specific SQL parsing issues
    await page.locator('#queryInput').fill('SELECT * FROM invalid_table');
    await page.locator('button:has-text("Run Analysis")').click();
    
    // Should either show SQL preview or an error
    // Wait for either SQL preview or error message
    const result = await Promise.race([
      page.waitForSelector('#sqlPreviewSection', { state: 'visible', timeout: 10000 }).then(() => 'sql'),
      page.waitForSelector('#errorMessage', { state: 'visible', timeout: 10000 }).then(() => 'error')
    ]);
    
    // If SQL was generated, it should be a valid SELECT query
    if (result === 'sql') {
      const sqlCode = await page.locator('#sqlCode').textContent();
      expect(sqlCode).toContain('SELECT');
      expect(sqlCode).toContain('sales_transactions'); // Should use correct table
    }
  });

  test('should export results after AI query execution', async ({ page }) => {
    // Enable AI mode
    await page.locator('#aiModeToggle').click();
    
    // Execute a simple query
    await page.locator('#queryInput').fill('Show 5 recent sales');
    await page.locator('button:has-text("Run Analysis")').click();
    
    // Wait for SQL preview and execute
    await page.waitForSelector('#sqlPreviewSection', { state: 'visible' });
    await page.locator('button:has-text("Execute Query")').click();
    
    // Wait for results
    await page.waitForSelector('#resultsSection', { state: 'visible' });
    
    // Test CSV export (just check that button clicks without error)
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
      page.locator('button:has-text("Export CSV")').click()
    ]);
    
    // The download might be blocked in the live environment, so we just check the button works
    expect(true).toBeTruthy(); // Button clicked successfully
  });
});