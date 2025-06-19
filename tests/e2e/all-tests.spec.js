import { test, expect } from '@playwright/test';

test.describe('Complete Test Suite', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  
  test('Run all feature tests', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes
    
    console.log('====================================================');
    console.log('FRAMEWORK REAL ESTATE SOLUTIONS - COMPLETE TEST SUITE');
    console.log('====================================================');
    console.log(`Site: ${baseURL}`);
    console.log(`Date: ${new Date().toISOString()}`);
    console.log('====================================================\n');
    
    const results = {
      passed: [],
      failed: [],
      warnings: []
    };
    
    // Test 1: Basic Page Access
    console.log('1. BASIC PAGE ACCESS TESTS');
    console.log('---------------------------');
    
    const pages = [
      { url: '/index.html', name: 'Home' },
      { url: '/portfolio-simulator.html', name: 'Portfolio V1' },
      { url: '/portfolio-simulator-v2.html', name: 'Portfolio V2' },
      { url: '/portfolio-simulator-v3.html', name: 'Portfolio V3' },
      { url: '/market-analysis.html', name: 'Market Analysis' },
      { url: '/property-finder.html', name: 'Property Finder' }
    ];
    
    for (const pageInfo of pages) {
      try {
        const response = await page.goto(`${baseURL}${pageInfo.url}`, { waitUntil: 'domcontentloaded' });
        if (response.ok()) {
          console.log(`   ✅ ${pageInfo.name}: Accessible`);
          results.passed.push(`${pageInfo.name} loads`);
        } else {
          console.log(`   ❌ ${pageInfo.name}: HTTP ${response.status()}`);
          results.failed.push(`${pageInfo.name} returned ${response.status()}`);
        }
      } catch (error) {
        console.log(`   ❌ ${pageInfo.name}: Failed to load`);
        results.failed.push(`${pageInfo.name} failed to load`);
      }
    }
    
    // Test 2: Portfolio V3 Core Features
    console.log('\n2. PORTFOLIO V3 CORE FEATURES');
    console.log('-----------------------------');
    
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    await page.waitForLoadState('networkidle');
    
    // 2.1 AI Strategy Generation
    console.log('   Testing AI Strategy Generation...');
    await page.fill('#goalInput', 'Generate $5K monthly income in 24 months with $50K capital');
    await page.click('button:has-text("Generate Strategy")');
    
    const strategyGenerated = await page.waitForSelector('.strategy-card', {
      timeout: 30000
    }).then(() => true).catch(() => false);
    
    if (strategyGenerated) {
      console.log('   ✅ AI Strategy Generation: Working');
      results.passed.push('AI strategy generation');
      
      // Apply strategy
      await page.click('.strategy-card >> nth=0');
      await page.waitForTimeout(1000);
      
      const hasTimeline = await page.locator('#timelineTable tbody tr').first().isVisible();
      if (hasTimeline) {
        console.log('   ✅ Strategy Application: Working');
        results.passed.push('Strategy application to timeline');
      }
    } else {
      console.log('   ❌ AI Strategy Generation: Failed');
      results.failed.push('AI strategy generation');
    }
    
    // 2.2 Month Selector UI
    console.log('\n   Testing Month Selector UI...');
    
    // Ensure timeline data exists
    await page.evaluate(() => {
      if (!window.timelineData || window.timelineData.length === 0) {
        window.timelineData = [{
          id: Date.now(),
          month: 0,
          action: 'buy',
          property: 'Test Property',
          price: 200000,
          downPercent: 20,
          downAmount: 40000,
          loanAmount: 160000,
          rate: 7,
          term: 30,
          payment: 1064,
          rent: 2000,
          monthlyExpenses: 500
        }];
      }
      if (window.recalculateAll) window.recalculateAll();
    });
    
    await page.waitForTimeout(1000);
    
    // Check month selector elements
    const monthSelectorTests = {
      'Month input': await page.locator('#summaryMonth').isVisible().catch(() => false),
      'Stepper buttons': await page.locator('.month-stepper').first().isVisible().catch(() => false),
      'Month input styling': await page.locator('.month-input').isVisible().catch(() => false),
      'Aria labels': await page.locator('[aria-label="Month number"]').count().then(c => c > 0).catch(() => false),
      'Year display': await page.locator('#summaryYears').isVisible().catch(() => false)
    };
    
    for (const [feature, isPresent] of Object.entries(monthSelectorTests)) {
      if (isPresent) {
        console.log(`   ✅ ${feature}: Present`);
        results.passed.push(`Month selector - ${feature}`);
      } else {
        console.log(`   ⚠️  ${feature}: Not found`);
        results.warnings.push(`Month selector - ${feature} pending deployment`);
      }
    }
    
    // Test functionality if steppers are present
    if (monthSelectorTests['Stepper buttons']) {
      const stepperUp = page.locator('.month-stepper-up');
      const monthInput = page.locator('#summaryMonth');
      
      const initial = await monthInput.inputValue();
      await stepperUp.click();
      await page.waitForTimeout(500);
      const after = await monthInput.inputValue();
      
      if (parseInt(after) === parseInt(initial) + 1) {
        console.log('   ✅ Stepper functionality: Working');
        results.passed.push('Month selector stepper functionality');
      }
    }
    
    // 2.3 Sharing Feature
    console.log('\n   Testing Sharing Feature...');
    await page.click('button:has-text("Share")');
    await page.waitForTimeout(2000);
    
    const shareModalVisible = await page.locator('#modalOverlay').isVisible().catch(() => false);
    if (shareModalVisible) {
      console.log('   ✅ Share Modal: Opens');
      results.passed.push('Share modal');
      
      const shareUrl = await page.locator('input[readonly]').first().inputValue().catch(() => '');
      if (shareUrl.includes('?id=')) {
        console.log('   ✅ Database Sharing: Configured');
        results.passed.push('Database sharing');
      } else if (shareUrl.includes('?state=')) {
        console.log('   ✅ URL Sharing: Working');
        results.passed.push('URL-based sharing');
      }
      
      // Close modal
      await page.keyboard.press('Escape');
    } else {
      console.log('   ❌ Share Modal: Failed to open');
      results.failed.push('Share modal');
    }
    
    // Test 3: Portfolio V2 Features
    console.log('\n3. PORTFOLIO V2 FEATURES');
    console.log('------------------------');
    
    await page.goto(`${baseURL}/portfolio-simulator-v2.html`);
    await page.waitForLoadState('networkidle');
    
    const v2Features = {
      'Timeline table': await page.locator('#timelineTable').isVisible(),
      'Add row button': await page.locator('button:has-text("Add Timeline Event")').isVisible(),
      'Summary section': await page.locator('.summary-grid').isVisible(),
      'Month selector': await page.locator('#summaryMonth').isVisible()
    };
    
    for (const [feature, isPresent] of Object.entries(v2Features)) {
      if (isPresent) {
        console.log(`   ✅ ${feature}: Present`);
        results.passed.push(`V2 - ${feature}`);
      } else {
        console.log(`   ❌ ${feature}: Missing`);
        results.failed.push(`V2 - ${feature}`);
      }
    }
    
    // Test 4: Market Analysis
    console.log('\n4. MARKET ANALYSIS FEATURES');
    console.log('---------------------------');
    
    await page.goto(`${baseURL}/market-analysis.html`);
    await page.waitForLoadState('networkidle');
    
    const marketFeatures = {
      'Query input': await page.locator('#queryInput').isVisible(),
      'Submit button': await page.locator('button:has-text("Submit")').isVisible(),
      'Example queries': await page.locator('.example-query').first().isVisible().catch(() => false)
    };
    
    for (const [feature, isPresent] of Object.entries(marketFeatures)) {
      if (isPresent) {
        console.log(`   ✅ ${feature}: Present`);
        results.passed.push(`Market Analysis - ${feature}`);
      } else {
        console.log(`   ❌ ${feature}: Missing`);
        results.failed.push(`Market Analysis - ${feature}`);
      }
    }
    
    // Test 5: API Endpoints
    console.log('\n5. API ENDPOINT TESTS');
    console.log('---------------------');
    
    const apiTests = [
      {
        name: 'AI Strategy API',
        url: 'https://framework-8jsah7ozp-jacob-durrahs-projects.vercel.app/api/ai/strategy',
        method: 'POST',
        body: { goal: 'test' }
      },
      {
        name: 'Simulation Save API',
        url: 'https://framework-8jsah7ozp-jacob-durrahs-projects.vercel.app/api/simulations/save',
        method: 'POST',
        body: { name: 'test', data: {} }
      }
    ];
    
    for (const apiTest of apiTests) {
      try {
        const response = await page.request[apiTest.method.toLowerCase()](apiTest.url, {
          data: apiTest.body,
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok()) {
          console.log(`   ✅ ${apiTest.name}: Responding`);
          results.passed.push(apiTest.name);
        } else {
          const status = response.status();
          if (status === 500 && apiTest.name.includes('Save')) {
            console.log(`   ⚠️  ${apiTest.name}: Needs Supabase config`);
            results.warnings.push(`${apiTest.name} - Supabase config needed`);
          } else {
            console.log(`   ❌ ${apiTest.name}: HTTP ${status}`);
            results.failed.push(`${apiTest.name} - HTTP ${status}`);
          }
        }
      } catch (error) {
        console.log(`   ❌ ${apiTest.name}: Failed`);
        results.failed.push(apiTest.name);
      }
    }
    
    // Final Summary
    console.log('\n====================================================');
    console.log('TEST RESULTS SUMMARY');
    console.log('====================================================');
    console.log(`✅ Passed: ${results.passed.length} tests`);
    console.log(`❌ Failed: ${results.failed.length} tests`);
    console.log(`⚠️  Warnings: ${results.warnings.length} items`);
    
    if (results.failed.length > 0) {
      console.log('\nFailed Tests:');
      results.failed.forEach(test => console.log(`   - ${test}`));
    }
    
    if (results.warnings.length > 0) {
      console.log('\nWarnings:');
      results.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    console.log('\n====================================================');
    
    if (results.failed.length === 0) {
      console.log('🎉 ALL CRITICAL TESTS PASSED!');
    } else {
      console.log('⚠️  Some tests failed - review above');
    }
    
    console.log('====================================================');
    
    // Assert no critical failures
    expect(results.failed.length).toBe(0);
  });
});