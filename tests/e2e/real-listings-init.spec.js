import { test, expect } from '@playwright/test';

test.describe('ListingsMatcher Initialization', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  
  test('should initialize ListingsMatcher on page load', async ({ page }) => {
    // Enable console logging
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('[DIAG]') || text.includes('ListingsMatcher')) {
        console.log(`Browser: ${text}`);
      }
    });
    
    // Navigate to page
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give scripts time to initialize
    
    // Check console logs for successful initialization
    const hasInitSuccess = consoleLogs.some(log => 
      log.includes('ListingsMatcher initialized successfully') ||
      log.includes('[DIAG] Successfully created ListingsMatcher instance')
    );
    
    // Check if window.v3State exists
    const v3StateExists = await page.evaluate(() => {
      return typeof window.v3State !== 'undefined';
    });
    expect(v3StateExists).toBe(true);
    
    // Check if ListingsMatcher is initialized
    const listingsMatcherInitialized = await page.evaluate(() => {
      return window.v3State && window.v3State.listingsMatcher !== null;
    });
    
    // Log diagnostic info if initialization failed
    if (!listingsMatcherInitialized) {
      console.log('Initialization failed. Console logs:', consoleLogs.filter(log => 
        log.includes('[DIAG]') || log.includes('ListingsMatcher') || log.includes('error')
      ));
    }
    
    expect(listingsMatcherInitialized).toBe(true);
  });

  test('should successfully use Find Actual Listings feature', async ({ page }) => {
    // Navigate to page
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    
    // Wait for initialization
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Generate a simple strategy
    await page.fill('#goalInput', 'Generate $3K/month in 24 months with $50K');
    await page.click('button:has-text("Generate Strategy")');
    
    // Wait for strategy generation
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    
    // Click first strategy
    await page.click('.strategy-card >> nth=0');
    await page.waitForSelector('#timelineTable', { timeout: 10000 });
    
    // Enable real listings checkbox
    await page.check('#useRealListings');
    
    // Click Find Actual Listings
    await page.click('button:has-text("Find Actual Listings")');
    
    // Wait for loading state to appear and disappear
    await page.waitForSelector('#v3LoadingState:visible', { timeout: 5000 }).catch(() => {
      console.log('Loading state did not appear - checking for immediate completion');
    });
    
    // Wait for completion
    await page.waitForSelector('#v3LoadingState', { 
      state: 'hidden',
      timeout: 30000 
    }).catch(() => {
      console.log('Loading state did not hide - checking for error messages');
    });
    
    // Check for error messages
    const errorMessages = await page.locator('.alert-danger').all();
    const errorTexts = await Promise.all(errorMessages.map(el => el.textContent()));
    
    // Should not have "feature not available" error
    const hasFeatureError = errorTexts.some(text => 
      text.includes('Real listings feature not available')
    );
    expect(hasFeatureError).toBe(false);
    
    // Check for success or acceptable warning
    const alerts = await page.locator('.alert').all();
    const alertTexts = await Promise.all(alerts.map(el => el.textContent()));
    
    const hasAcceptableMessage = alertTexts.some(text => 
      text.includes('Found') && text.includes('real listings') ||
      text.includes('No exact matches found') ||
      text.includes('API may be temporarily unavailable')
    );
    
    expect(hasAcceptableMessage).toBe(true);
  });

  test('should auto-initialize ListingsMatcher on demand', async ({ page }) => {
    // Navigate to page
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    
    // Immediately clear ListingsMatcher to simulate initialization failure
    await page.evaluate(() => {
      if (window.v3State) {
        window.v3State.listingsMatcher = null;
      }
    });
    
    // Generate strategy
    await page.fill('#goalInput', 'Build $2K/month portfolio in 18 months with $40K');
    await page.click('button:has-text("Generate Strategy")');
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    await page.click('.strategy-card >> nth=0');
    await page.waitForSelector('#timelineTable');
    
    // Try to use real listings
    await page.check('#useRealListings');
    await page.click('button:has-text("Find Actual Listings")');
    
    // Should not show "feature not available" error
    await page.waitForTimeout(2000);
    
    const errorExists = await page.locator('text=Real listings feature not available').count();
    expect(errorExists).toBe(0);
    
    // Check that ListingsMatcher was initialized on demand
    const wasInitialized = await page.evaluate(() => {
      return window.v3State && window.v3State.listingsMatcher !== null;
    });
    expect(wasInitialized).toBe(true);
  });
});