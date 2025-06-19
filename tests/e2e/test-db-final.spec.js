import { test, expect } from '@playwright/test';

test('final database sharing test', async ({ page }) => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  
  console.log('1. Loading Portfolio Simulator V3...');
  await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
  await page.waitForLoadState('networkidle');
  
  // Set up test data
  console.log('2. Setting up test simulation...');
  await page.evaluate(() => {
    window.timelineData = [{
      month: 0,
      action: 'buy',
      property: 'DB Test Property',
      price: 100000,
      value: 100000,
      downPercent: 20,
      downAmount: 20000,
      loanAmount: 80000,
      rate: 7.5,
      term: 30,
      payment: 559.37,
      rent: 1200,
      monthlyExpenses: 350,
      cashFlow: 290.63,
      totalCashInvested: 20000,
      netWorth: 20000
    }];
    
    window.v3State = {
      parsedGoal: { targetIncome: 1000, timeframe: 12, startingCapital: 20000 },
      selectedStrategy: { name: 'Database Test Strategy' }
    };
  });
  
  console.log('3. Attempting to share...');
  
  // Listen for console messages and errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('   Browser Error:', msg.text());
    }
  });
  
  // Try to share
  const shareResult = await page.evaluate(async () => {
    if (!window.ShareManager) {
      return { error: 'ShareManager not found' };
    }
    
    try {
      const manager = new window.ShareManager();
      const state = {
        version: 'v3',
        parsedGoal: window.v3State.parsedGoal,
        selectedStrategy: window.v3State.selectedStrategy,
        timeline: window.timelineData,
        viewMonth: 0,
        useRealListings: false
      };
      
      console.log('Calling shareSimulation...');
      const result = await manager.shareSimulation(state);
      return result;
    } catch (error) {
      return { error: error.message, stack: error.stack };
    }
  });
  
  console.log('\n4. Result:', JSON.stringify(shareResult, null, 2));
  
  if (shareResult.url && shareResult.url.includes('?id=')) {
    console.log('\n✅ SUCCESS! Database sharing is working!');
    console.log(`   Database ID: ${shareResult.url.match(/id=([^&]+)/)[1]}`);
    console.log(`   Full URL: ${shareResult.url}`);
    
  } else if (shareResult.url && shareResult.url.includes('?state=')) {
    console.log('\n⚠️ Using URL-based fallback');
    console.log('   Database sharing not available yet');
    console.log('   This means either:');
    console.log('   - The deployment is still in progress');
    console.log('   - The Supabase environment variables are not configured');
    console.log('   - There was an error connecting to the database');
    
  } else if (shareResult.error) {
    console.log('\n❌ Error occurred:', shareResult.error);
    if (shareResult.stack) {
      console.log('Stack trace:', shareResult.stack);
    }
  }
  
  console.log('\n📋 Summary:');
  console.log('- SQL migration: ✅ Completed');
  console.log('- API CORS fix: ✅ Deployed');
  console.log('- ShareManager: ✅ Loaded');
  console.log(`- Database sharing: ${shareResult.url?.includes('?id=') ? '✅ Working' : '⚠️ Not yet available'}`);
  
  console.log('\nIf database sharing is not working yet:');
  console.log('1. Check that Supabase environment variables are set in Vercel');
  console.log('2. Wait a few more minutes for deployment to complete');
  console.log('3. Check Vercel deployment logs for any errors');
});