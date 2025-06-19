import { test, expect } from '@playwright/test';

test('Final API Test', async ({ request }) => {
  const vercelAPI = 'https://framework-8jsah7ozp-jacob-durrahs-projects.vercel.app';
  
  console.log('========================================');
  console.log('FINAL API TEST');
  console.log('========================================');
  console.log(`API: ${vercelAPI}`);
  console.log('========================================\n');
  
  // Test save endpoint
  console.log('Testing database save...');
  const testData = {
    name: 'Final API Test',
    data: {
      version: 'v3',
      timelineData: [{
        month: 0,
        action: 'buy',
        property: 'Test Property',
        price: 100000
      }],
      parsedGoal: { targetIncome: 1000 },
      selectedStrategy: { name: 'Test' }
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
    
    console.log(`Save response: ${saveResponse.status()}`);
    
    if (saveResponse.ok()) {
      const result = await saveResponse.json();
      console.log('✅ SAVE SUCCESSFUL!');
      console.log(`ID: ${result.id}`);
      console.log(`URL: ${result.url}`);
      
      // Test load
      const loadResponse = await request.get(`${vercelAPI}/api/simulations/${result.id}`);
      console.log(`Load response: ${loadResponse.status()}`);
      
      if (loadResponse.ok()) {
        console.log('✅ LOAD SUCCESSFUL!');
      }
    } else {
      const error = await saveResponse.text();
      console.log('❌ Save failed:', error);
      
      if (error.includes('Server configuration error')) {
        console.log('\n⚠️ SUPABASE ENVIRONMENT VARIABLES NOT SET IN VERCEL');
      }
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
});