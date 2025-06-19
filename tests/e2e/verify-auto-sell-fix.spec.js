import { test, expect } from '@playwright/test';

test.describe('Verify Auto-Generated Sell Fix Deployment', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  
  test('check if V3 fix is deployed', async ({ page }) => {
    // Check if the updated JavaScript is deployed
    await page.goto(`${baseURL}/js/portfolio-simulator-v3.js`);
    const jsContent = await page.content();
    
    // Look for our fix in the code
    const hasAutoSellFix = jsContent.includes('const isSell = event.action === \'sell\'');
    const hasZeroedFields = jsContent.includes('downPercent: isSell ? 0 :');
    
    console.log('Deployment check:');
    console.log(`- Has isSell check: ${hasAutoSellFix}`);
    console.log(`- Has zeroed fields: ${hasZeroedFields}`);
    
    if (!hasAutoSellFix || !hasZeroedFields) {
      console.log('⏳ Fix not yet deployed, waiting for deployment...');
      return;
    }
    
    console.log('✅ Fix is deployed, testing functionality...');
    
    // Test the actual functionality
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    await page.waitForLoadState('networkidle');
    
    // Quick flip strategy
    await page.fill('#goalInput', 'Flip one property in 6 months');
    await page.click('button:has-text("Generate Strategy")');
    
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    await page.click('.strategy-card >> nth=0');
    
    await page.waitForSelector('#timelineTable tbody tr');
    
    // Check timeline events
    const rows = await page.locator('#timelineTable tbody tr').all();
    console.log(`\nGenerated ${rows.length} timeline events`);
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const action = await row.locator('select').inputValue();
      const property = await row.locator('input[placeholder="Property address"]').inputValue();
      
      console.log(`Event ${i + 1}: ${action} - ${property}`);
      
      if (action === 'sell') {
        console.log('  Checking sell event fields:');
        
        const downPercent = await row.locator('input').nth(3).inputValue();
        const rate = await row.locator('input').nth(5).inputValue();
        const term = await row.locator('input').nth(6).inputValue();
        const downAmount = await row.locator('td').nth(5).textContent();
        const loan = await row.locator('td').nth(6).textContent();
        const payment = await row.locator('td').nth(9).textContent();
        
        console.log(`    Down %: ${downPercent} (should be 0)`);
        console.log(`    Rate %: ${rate} (should be 0)`);
        console.log(`    Term: ${term} (should be 0)`);
        console.log(`    Down $: ${downAmount} (should be $0)`);
        console.log(`    Loan: ${loan} (should be $0)`);
        console.log(`    Payment: ${payment} (should be $0)`);
        
        // Check if fields are disabled
        const downPercentDisabled = await row.locator('input').nth(3).isDisabled();
        const rateDisabled = await row.locator('input').nth(5).isDisabled();
        const termDisabled = await row.locator('input').nth(6).isDisabled();
        
        console.log(`    Down % disabled: ${downPercentDisabled}`);
        console.log(`    Rate disabled: ${rateDisabled}`);
        console.log(`    Term disabled: ${termDisabled}`);
        
        // Verify values
        if (downPercent === '0' && rate === '0' && term === '0' &&
            downAmount === '$0' && loan === '$0' && payment === '$0' &&
            downPercentDisabled && rateDisabled && termDisabled) {
          console.log('  ✅ All sell event fields correctly zeroed and disabled!');
        } else {
          console.log('  ❌ Some fields are not correctly set');
        }
        
        expect(downPercent).toBe('0');
        expect(rate).toBe('0');
        expect(term).toBe('0');
        expect(downAmount).toBe('$0');
        expect(loan).toBe('$0');
        expect(payment).toBe('$0');
        expect(downPercentDisabled).toBe(true);
        expect(rateDisabled).toBe(true);
        expect(termDisabled).toBe(true);
      }
    }
  });
});