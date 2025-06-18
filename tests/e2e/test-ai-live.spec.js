import { test, expect } from '@playwright/test';

test('Test AI Market Analysis on Live Site', async ({ page }) => {
  // Navigate to live Market Analysis page
  await page.goto('https://frameworkrealestatesolutions.com/market-analysis.html');
  
  // Wait for page to load
  await page.waitForSelector('#queryInput', { timeout: 10000 });
  
  // Take screenshot of initial state
  await page.screenshot({ path: 'live-test-initial.png' });
  
  // Enable AI mode
  const aiToggle = page.locator('#aiModeToggle');
  await aiToggle.click();
  await expect(aiToggle).toBeChecked();
  
  // Enter query
  await page.locator('#queryInput').fill('What properties did Jacob Durrah buy in Detroit?');
  
  // Click Run Analysis
  await page.locator('button:has-text("Run Analysis")').click();
  
  // Wait for response (either SQL preview or error)
  const result = await Promise.race([
    page.waitForSelector('#sqlPreviewSection', { state: 'visible', timeout: 30000 }).then(() => 'sql'),
    page.waitForSelector('#errorMessage', { state: 'visible', timeout: 30000 }).then(() => 'error'),
    page.waitForSelector('#resultsSection', { state: 'visible', timeout: 30000 }).then(() => 'results')
  ]);
  
  // Take screenshot of result
  await page.screenshot({ path: 'live-test-result.png' });
  
  console.log('Result type:', result);
  
  if (result === 'error') {
    const errorText = await page.locator('#errorMessage').textContent();
    console.log('Error:', errorText);
    
    // Check if it's the Supabase error
    if (errorText.includes('Supabase')) {
      console.log('ISSUE: Supabase credentials error still present');
    }
  } else if (result === 'sql') {
    console.log('SUCCESS: SQL preview shown');
    
    // Click Execute Query
    await page.locator('button:has-text("Execute Query")').click();
    
    // Wait for results or error
    const execResult = await Promise.race([
      page.waitForSelector('#resultsSection', { state: 'visible', timeout: 15000 }).then(() => 'results'),
      page.waitForSelector('#errorMessage', { state: 'visible', timeout: 15000 }).then(() => 'error')
    ]);
    
    if (execResult === 'error') {
      const errorText = await page.locator('#errorMessage').textContent();
      console.log('Execution Error:', errorText);
    } else {
      console.log('SUCCESS: Query executed and results shown');
    }
  }
  
  // Check console for errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });
});