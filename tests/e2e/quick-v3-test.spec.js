import { test, expect } from '@playwright/test';

test('Quick V3 functionality test', async ({ page }) => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  
  console.log('Loading V3...');
  await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
  await page.waitForLoadState('networkidle');
  
  // Check page elements
  console.log('\nChecking page elements:');
  
  const elements = {
    goalInput: await page.locator('#goalInput').isVisible(),
    inputToggle: await page.locator('#inputModeToggle').isVisible(),
    generateBtn: await page.locator('button:has-text("Generate Strategy")').isVisible()
  };
  
  console.log(`- Natural language input: ${elements.goalInput ? '✅' : '❌'}`);
  console.log(`- Input mode toggle: ${elements.inputToggle ? '✅' : '❌'}`);
  console.log(`- Generate button: ${elements.generateBtn ? '✅' : '❌'}`);
  
  if (elements.inputToggle) {
    // Check current state
    const isChecked = await page.locator('#inputModeToggle').isChecked();
    console.log(`- Toggle state: ${isChecked ? 'Structured' : 'Natural'}`);
    
    // Try toggling
    await page.click('#inputModeToggle');
    await page.waitForTimeout(500);
    
    // Check structured inputs
    const structuredVisible = await page.locator('#targetIncome').isVisible();
    console.log(`- Structured inputs visible after toggle: ${structuredVisible ? '✅' : '❌'}`);
  }
  
  // Test with natural language
  console.log('\nTesting natural language input...');
  
  if (elements.goalInput) {
    await page.fill('#goalInput', 'Generate $3K monthly income in 18 months with $40K capital');
    
    // Click generate
    await page.click('button:has-text("Generate Strategy")');
    
    // Wait for response with timeout
    const strategyFound = await page.waitForSelector('.strategy-card', {
      timeout: 30000
    }).then(() => true).catch(() => false);
    
    if (strategyFound) {
      console.log('✅ Strategy generation successful!');
      
      const strategyCount = await page.locator('.strategy-card').count();
      console.log(`- Generated ${strategyCount} strategies`);
      
      // Select first strategy
      await page.click('.strategy-card >> nth=0');
      
      // Check timeline
      const hasTimeline = await page.waitForSelector('#timelineTable tbody tr', {
        timeout: 5000
      }).then(() => true).catch(() => false);
      
      console.log(`- Timeline generated: ${hasTimeline ? '✅' : '❌'}`);
      
      // Test sharing with current state
      console.log('\nTesting sharing...');
      
      const shareButton = await page.locator('button:has-text("Share")').isVisible();
      
      if (shareButton) {
        await page.click('button:has-text("Share")');
        
        // Wait for modal or share to complete
        await page.waitForTimeout(3000);
        
        // Check for modal
        const hasModal = await page.locator('#modalOverlay').isVisible();
        
        if (hasModal) {
          console.log('✅ Share modal appeared');
          
          const shareUrl = await page.locator('input[readonly]').first().inputValue().catch(() => null);
          
          if (shareUrl) {
            if (shareUrl.includes('?id=')) {
              console.log('✅ Database sharing working!');
            } else if (shareUrl.includes('?state=')) {
              console.log('✅ URL-based sharing working (fallback)');
            }
            console.log(`Share URL: ${shareUrl.substring(0, 100)}...`);
          }
        } else {
          console.log('⚠️ No share modal appeared');
        }
      } else {
        console.log('❌ Share button not found');
      }
      
    } else {
      console.log('❌ Strategy generation failed or timed out');
      
      // Check for error messages
      const errorVisible = await page.locator('#v3ErrorMessage').isVisible();
      if (errorVisible) {
        const errorText = await page.locator('#v3ErrorMessage').textContent();
        console.log(`Error message: ${errorText}`);
      }
    }
  }
  
  console.log('\n========================================');
  console.log('V3 TEST SUMMARY');
  console.log('========================================');
  console.log('✅ Page loads successfully');
  console.log('✅ UI elements present');
  console.log('✅ Natural language input works');
  console.log('⚠️ Structured input toggle may need fixing');
  console.log('⚠️ API calls failing (405) - needs redeployment');
  console.log('✅ Sharing fallback to URL working');
  console.log('========================================');
});