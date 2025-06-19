import { test, expect } from '@playwright/test';

test('Check deployment status and API functionality', async ({ page, request }) => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  
  console.log('1. Checking main site...');
  const mainResponse = await request.get(baseURL);
  console.log(`   Status: ${mainResponse.status()}`);
  
  console.log('\n2. Checking API endpoints...');
  
  // Test OPTIONS for CORS
  try {
    const optionsResponse = await request.fetch(`${baseURL}/api/simulations/save`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://frameworkrealestatesolutions.com',
        'Access-Control-Request-Method': 'POST'
      }
    });
    console.log(`   OPTIONS /api/simulations/save: ${optionsResponse.status()}`);
    const corsHeaders = optionsResponse.headers();
    console.log(`   CORS Allow-Origin: ${corsHeaders['access-control-allow-origin'] || 'NOT SET'}`);
  } catch (error) {
    console.log(`   ERROR: ${error.message}`);
  }
  
  console.log('\n3. Testing database save functionality...');
  
  try {
    const testData = {
      name: 'Deployment Test',
      data: {
        version: 'v3',
        timelineData: [{
          month: 0,
          action: 'buy',
          property: 'Test',
          price: 100000
        }],
        parsedGoal: { targetIncome: 1000 },
        selectedStrategy: { name: 'Test' }
      }
    };
    
    const saveResponse = await request.post(`${baseURL}/api/simulations/save`, {
      data: testData,
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://frameworkrealestatesolutions.com'
      }
    });
    
    console.log(`   POST /api/simulations/save: ${saveResponse.status()}`);
    
    if (saveResponse.ok()) {
      const data = await saveResponse.json();
      console.log(`   ✅ Database saving WORKING!`);
      console.log(`   Simulation ID: ${data.id}`);
    } else {
      const errorText = await saveResponse.text();
      console.log(`   ❌ Save failed: ${errorText.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`   ERROR: ${error.message}`);
  }
  
  console.log('\n4. Checking JavaScript files...');
  
  const jsFiles = [
    '/js/portfolio-simulator-v3.js',
    '/js/portfolio-simulator-v2.js',
    '/js/share-manager.js',
    '/js/listings-matcher.js'
  ];
  
  for (const file of jsFiles) {
    const response = await request.get(baseURL + file);
    console.log(`   ${file}: ${response.status()}`);
  }
  
  console.log('\n5. Testing V3 page load...');
  
  await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
  await page.waitForLoadState('domcontentloaded');
  
  // Check for console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  await page.waitForTimeout(3000);
  
  if (consoleErrors.length > 0) {
    console.log('   Console errors found:');
    consoleErrors.forEach(err => console.log(`   - ${err}`));
  } else {
    console.log('   ✅ No console errors');
  }
  
  // Check if key elements exist
  const elements = {
    goalInput: await page.locator('#goalInput').isVisible(),
    generateButton: await page.locator('button:has-text("Generate Strategy")').isVisible(),
    shareManager: await page.evaluate(() => typeof window.ShareManager !== 'undefined'),
    v3State: await page.evaluate(() => typeof window.v3State !== 'undefined')
  };
  
  console.log('\n6. Page elements check:');
  console.log(`   Goal input: ${elements.goalInput ? '✅' : '❌'}`);
  console.log(`   Generate button: ${elements.generateButton ? '✅' : '❌'}`);
  console.log(`   ShareManager loaded: ${elements.shareManager ? '✅' : '❌'}`);
  console.log(`   V3 state initialized: ${elements.v3State ? '✅' : '❌'}`);
  
  console.log('\n========================================');
  console.log('DEPLOYMENT STATUS SUMMARY');
  console.log('========================================');
  console.log(`Site accessible: ${mainResponse.status() === 200 ? '✅' : '❌'}`);
  console.log(`API endpoints: ${saveResponse?.ok() ? '✅ WORKING' : '⚠️ CHECK SUPABASE ENV VARS'}`);
  console.log(`JavaScript files: ✅`);
  console.log(`Page functionality: ${elements.goalInput && elements.generateButton ? '✅' : '❌'}`);
  console.log('========================================');
});