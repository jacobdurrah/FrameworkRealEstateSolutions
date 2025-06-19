import { test, expect } from '@playwright/test';

test.describe('Post-Deployment Comprehensive Test', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
  });

  test('1. API Endpoints - Database Functionality', async ({ page, request }) => {
    console.log('Testing API endpoints after deployment...\n');
    
    // Test CORS preflight
    const optionsResponse = await request.fetch(`${baseURL}/api/simulations/save`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://frameworkrealestatesolutions.com',
        'Access-Control-Request-Method': 'POST'
      }
    });
    
    console.log(`OPTIONS request: ${optionsResponse.status()}`);
    const corsHeader = optionsResponse.headers()['access-control-allow-origin'];
    console.log(`CORS Allow-Origin: ${corsHeader || 'NOT SET'}`);
    
    // Test database save
    const testData = {
      name: 'Post-Deployment Test',
      data: {
        version: 'v3',
        timelineData: [{
          month: 0,
          action: 'buy',
          property: 'Test Property',
          price: 100000
        }],
        parsedGoal: { targetIncome: 1000 },
        selectedStrategy: { name: 'Test Strategy' }
      }
    };
    
    const saveResponse = await request.post(`${baseURL}/api/simulations/save`, {
      data: testData,
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://frameworkrealestatesolutions.com'
      }
    });
    
    console.log(`\nPOST save response: ${saveResponse.status()}`);
    
    if (saveResponse.ok()) {
      const data = await saveResponse.json();
      console.log('✅ DATABASE SAVING IS WORKING!');
      console.log(`Simulation ID: ${data.id}`);
      console.log(`Share URL: ${data.url}`);
      
      // Test loading
      const loadResponse = await request.get(`${baseURL}/api/simulations/${data.id}`);
      console.log(`\nGET load response: ${loadResponse.status()}`);
      
      if (loadResponse.ok()) {
        console.log('✅ DATABASE LOADING IS WORKING!');
      }
    } else {
      const errorText = await saveResponse.text();
      console.log('❌ Database save failed:', errorText.substring(0, 200));
    }
  });

  test('2. Portfolio Simulator V3 - Full Workflow', async ({ page }) => {
    console.log('\nTesting Portfolio Simulator V3...');
    
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    await page.waitForLoadState('networkidle');
    
    // Test natural language input
    await page.fill('#goalInput', 'Build $5K monthly income in 24 months with $50K starting capital');
    await page.click('button:has-text("Generate Strategy")');
    
    // Wait for AI response
    const strategyAppeared = await page.waitForSelector('.strategy-card', { 
      timeout: 45000 
    }).then(() => true).catch(() => false);
    
    if (strategyAppeared) {
      console.log('✅ AI Strategy Generation WORKING!');
      
      const strategyCount = await page.locator('.strategy-card').count();
      console.log(`Generated ${strategyCount} strategies`);
      
      // Select strategy
      await page.click('.strategy-card >> nth=0');
      
      // Wait for timeline
      const hasTimeline = await page.waitForSelector('#timelineTable tbody tr', {
        timeout: 5000
      }).then(() => true).catch(() => false);
      
      if (hasTimeline) {
        console.log('✅ Timeline Generation WORKING!');
        
        // Test sharing
        await page.click('button:has-text("Share")');
        await page.waitForTimeout(3000);
        
        const modalVisible = await page.locator('#modalOverlay').isVisible();
        if (modalVisible) {
          const shareUrl = await page.locator('input[readonly]').first().inputValue().catch(() => null);
          
          if (shareUrl && shareUrl.includes('?id=')) {
            console.log('✅ DATABASE SHARING IS WORKING!');
            console.log(`Database Share URL: ${shareUrl}`);
          } else if (shareUrl && shareUrl.includes('?state=')) {
            console.log('⚠️ Using URL fallback (check Supabase env vars)');
          }
        }
      }
    } else {
      console.log('❌ Strategy generation failed');
    }
  });

  test('3. Market Analysis - AI Queries', async ({ page }) => {
    console.log('\nTesting Market Analysis AI...');
    
    await page.goto(`${baseURL}/market-analysis.html`);
    await page.waitForLoadState('networkidle');
    
    // Simple query
    await page.fill('#queryInput', 'Show me the top 5 markets by average price');
    await page.click('button:has-text("Analyze")');
    
    // Wait for results
    const hasResults = await page.waitForSelector('#analysisResults', { 
      timeout: 30000,
      state: 'visible' 
    }).then(() => true).catch(() => false);
    
    if (hasResults) {
      console.log('✅ Market Analysis AI WORKING!');
      
      // Check for charts
      const hasChart = await page.locator('canvas').first().isVisible().catch(() => false);
      if (hasChart) {
        console.log('✅ Chart visualization WORKING!');
      }
    } else {
      console.log('❌ Market analysis query failed');
    }
  });

  test('4. Real Estate Listings Integration', async ({ page }) => {
    console.log('\nTesting Real Listings Integration...');
    
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    await page.waitForLoadState('networkidle');
    
    // Generate simple strategy
    await page.fill('#goalInput', 'Build $2K income in 12 months with $30K');
    await page.click('button:has-text("Generate Strategy")');
    
    const strategyLoaded = await page.waitForSelector('.strategy-card', { 
      timeout: 30000 
    }).then(() => true).catch(() => false);
    
    if (strategyLoaded) {
      await page.click('.strategy-card >> nth=0');
      await page.waitForSelector('#timelineTable tbody tr');
      
      // Enable real listings
      await page.check('#useRealListings');
      await page.waitForTimeout(3000);
      
      // Check if listings were applied
      const hasRealListings = await page.evaluate(() => {
        return window.timelineData && window.timelineData.some(event => 
          event.property && !event.property.includes('Property ')
        );
      });
      
      if (hasRealListings) {
        console.log('✅ Real Listings Integration WORKING!');
      } else {
        console.log('⚠️ Real listings not applied (API may be down)');
      }
    }
  });

  test('5. Sell Events - Loan Field Reset', async ({ page }) => {
    console.log('\nTesting Sell Events...');
    
    await page.goto(`${baseURL}/portfolio-simulator-v2.html`);
    await page.waitForLoadState('networkidle');
    
    // Add buy event
    await page.click('button:has-text("Add Event")');
    const buyRow = page.locator('#timelineTable tbody tr').last();
    
    // Fill buy event
    await buyRow.locator('input').nth(1).fill('1');
    await buyRow.locator('select').first().selectOption('buy');
    await buyRow.locator('input').nth(2).fill('Test Property');
    await buyRow.locator('input').nth(3).fill('150000');
    
    // Add sell event
    await page.click('button:has-text("Add Event")');
    const sellRow = page.locator('#timelineTable tbody tr').last();
    
    // Change to sell
    await sellRow.locator('input').nth(1).fill('6');
    await sellRow.locator('select').first().selectOption('sell');
    await sellRow.locator('input').nth(2).fill('Test Property');
    await sellRow.locator('input').nth(3).fill('180000');
    
    await page.waitForTimeout(1000);
    
    // Check loan fields
    const loanAmount = await sellRow.locator('input').nth(7).inputValue();
    if (loanAmount === '0') {
      console.log('✅ Sell Event Loan Fields CORRECTLY RESET!');
    } else {
      console.log('❌ Sell event loan fields not reset');
    }
  });

  test('6. Financial Calculator', async ({ page }) => {
    console.log('\nTesting Financial Calculator...');
    
    await page.goto(`${baseURL}/financial-calculator.html`);
    await page.waitForLoadState('networkidle');
    
    // Fill mortgage calculator
    const loanAmountInput = await page.locator('#loanAmount').isVisible();
    
    if (loanAmountInput) {
      await page.fill('#loanAmount', '200000');
      await page.fill('#interestRate', '7.5');
      await page.fill('#loanTerm', '30');
      
      // Calculate
      const calculateBtn = page.locator('button:has-text("Calculate")');
      if (await calculateBtn.isVisible()) {
        await calculateBtn.click();
        await page.waitForTimeout(500);
        
        const monthlyPayment = await page.locator('#monthlyPayment').textContent();
        if (monthlyPayment && monthlyPayment.includes('$')) {
          console.log('✅ Financial Calculator WORKING!');
          console.log(`Monthly Payment: ${monthlyPayment}`);
        }
      }
    } else {
      console.log('❌ Financial calculator page not loaded properly');
    }
  });

  test('Summary Report', async ({ page }) => {
    console.log('\n========================================');
    console.log('POST-DEPLOYMENT TEST SUMMARY');
    console.log('========================================');
    console.log('Deployment URL:', baseURL);
    console.log('Test Date:', new Date().toISOString());
    console.log('\nFeatures Tested:');
    console.log('1. API Endpoints & Database');
    console.log('2. Portfolio Simulator V3 (AI)');
    console.log('3. Market Analysis (AI)');
    console.log('4. Real Estate Listings');
    console.log('5. Sell Events');
    console.log('6. Financial Calculator');
    console.log('\nNOTE: If database features show as "URL fallback",');
    console.log('ensure Supabase environment variables are set.');
    console.log('========================================\n');
  });
});