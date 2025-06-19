import { test, expect } from '@playwright/test';

test('Test Vercel API Deployment', async ({ request }) => {
  const vercelAPI = 'https://framework-4x7nskemt-jacob-durrahs-projects.vercel.app';
  
  console.log('========================================');
  console.log('TESTING NEW VERCEL API DEPLOYMENT');
  console.log('========================================');
  console.log(`API URL: ${vercelAPI}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('========================================\n');
  
  // Test 1: Basic API health check
  console.log('1. Testing API health...');
  try {
    const healthResponse = await request.get(`${vercelAPI}/api`);
    console.log(`   GET /api status: ${healthResponse.status()}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 2: Test CORS preflight
  console.log('\n2. Testing CORS configuration...');
  try {
    const corsResponse = await request.fetch(`${vercelAPI}/api/simulations/save`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://frameworkrealestatesolutions.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type'
      }
    });
    
    console.log(`   OPTIONS request status: ${corsResponse.status()}`);
    const corsHeaders = corsResponse.headers();
    console.log(`   Access-Control-Allow-Origin: ${corsHeaders['access-control-allow-origin'] || 'NOT SET'}`);
    console.log(`   Access-Control-Allow-Methods: ${corsHeaders['access-control-allow-methods'] || 'NOT SET'}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 3: Test save endpoint
  console.log('\n3. Testing save endpoint...');
  const testData = {
    name: 'Vercel API Test',
    data: {
      version: 'v3',
      timelineData: [{
        month: 0,
        action: 'buy',
        property: 'API Test Property',
        price: 150000,
        value: 150000,
        downPercent: 20,
        downAmount: 30000,
        loanAmount: 120000,
        rate: 7.0,
        term: 30,
        payment: 798.36,
        rent: 1500,
        monthlyExpenses: 400,
        cashFlow: 301.64
      }],
      parsedGoal: { 
        targetIncome: 1500, 
        timeframe: 24, 
        startingCapital: 30000 
      },
      selectedStrategy: { 
        name: 'API Test Strategy',
        approach: 'balanced'
      }
    }
  };
  
  try {
    const saveResponse = await request.post(`${vercelAPI}/api/simulations/save`, {
      data: testData,
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://frameworkrealestatesolutions.com'
      }
    });
    
    console.log(`   POST /api/simulations/save status: ${saveResponse.status()}`);
    
    if (saveResponse.ok()) {
      const result = await saveResponse.json();
      console.log('   ✅ SAVE SUCCESSFUL!');
      console.log(`   Simulation ID: ${result.id}`);
      console.log(`   Share URL: ${result.url}`);
      
      // Test 4: Test load endpoint
      console.log('\n4. Testing load endpoint...');
      const loadResponse = await request.get(`${vercelAPI}/api/simulations/${result.id}`, {
        headers: {
          'Origin': 'https://frameworkrealestatesolutions.com'
        }
      });
      
      console.log(`   GET /api/simulations/${result.id} status: ${loadResponse.status()}`);
      
      if (loadResponse.ok()) {
        const loadedData = await loadResponse.json();
        console.log('   ✅ LOAD SUCCESSFUL!');
        console.log(`   Loaded simulation name: ${loadedData.name}`);
        console.log(`   Created at: ${loadedData.created_at}`);
        console.log(`   View count: ${loadedData.view_count}`);
        console.log(`   Expires at: ${loadedData.expires_at}`);
      } else {
        const errorText = await loadResponse.text();
        console.log(`   ❌ Load failed: ${errorText}`);
      }
      
      return result.id;
    } else {
      const errorText = await saveResponse.text();
      console.log(`   ❌ Save failed: ${errorText}`);
      
      if (saveResponse.status() === 500) {
        console.log('\n   Checking error details...');
        if (errorText.includes('Missing Supabase configuration')) {
          console.log('   ⚠️ SUPABASE ENVIRONMENT VARIABLES NOT SET');
          console.log('   Need to configure in Vercel:');
          console.log('   - SUPABASE_URL');
          console.log('   - SUPABASE_SERVICE_KEY');
        }
      }
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 5: Test Market Analysis endpoints
  console.log('\n5. Testing Market Analysis API...');
  try {
    const marketQuery = {
      query: 'Show top 5 markets by average price'
    };
    
    const sqlResponse = await request.post(`${vercelAPI}/api/market/generate-sql`, {
      data: marketQuery,
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://frameworkrealestatesolutions.com'
      }
    });
    
    console.log(`   POST /api/market/generate-sql status: ${sqlResponse.status()}`);
    
    if (sqlResponse.ok()) {
      const sqlResult = await sqlResponse.json();
      console.log('   ✅ SQL Generation working');
      console.log(`   Generated SQL: ${sqlResult.sql.substring(0, 100)}...`);
    } else {
      console.log(`   ❌ Market Analysis API failed: ${sqlResponse.status()}`);
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('\n========================================');
  console.log('API TEST SUMMARY');
  console.log('========================================');
  console.log('Vercel deployment is active');
  console.log('Check Supabase environment variables if database features fail');
  console.log('========================================');
});