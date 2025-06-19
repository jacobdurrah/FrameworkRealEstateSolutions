import { test, expect } from '@playwright/test';

test.describe('Comprehensive Auto-Generated Sell Event Testing', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  
  test('✅ All auto-generated sell events have zero loan fields', async ({ page }) => {
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    await page.waitForLoadState('networkidle');
    
    const testScenarios = [
      {
        name: 'Flip Strategy',
        goal: 'Flip 3 properties in 18 months for $100K profit with $50K'
      },
      {
        name: 'BRRR Strategy',
        goal: 'BRRR strategy to generate $3K/month in 24 months with $60K'
      },
      {
        name: 'Mixed Strategy',
        goal: 'Build $5K income and $75K cash in 36 months with $80K'
      }
    ];
    
    for (const scenario of testScenarios) {
      console.log(`\n\n========== Testing ${scenario.name} ==========`);
      
      // Clear timeline for fresh test
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Generate strategy
      await page.fill('#goalInput', scenario.goal);
      await page.click('button:has-text("Generate Strategy")');
      
      await page.waitForSelector('.strategy-card', { timeout: 15000 });
      await page.click('.strategy-card >> nth=0');
      
      await page.waitForSelector('#timelineTable tbody tr');
      
      // Analyze all events
      const rows = await page.locator('#timelineTable tbody tr').all();
      let buyCount = 0;
      let sellCount = 0;
      let allSellsCorrect = true;
      
      for (const row of rows) {
        const action = await row.locator('select').inputValue();
        const property = await row.locator('input[placeholder="Property address"]').inputValue();
        
        if (action === 'buy') {
          buyCount++;
        } else if (action === 'sell') {
          sellCount++;
          console.log(`\nChecking Sell: ${property}`);
          
          // Verify all loan fields
          const values = {
            downPercent: await row.locator('input').nth(3).inputValue(),
            rate: await row.locator('input').nth(5).inputValue(), 
            term: await row.locator('input').nth(6).inputValue(),
            downAmount: await row.locator('td').nth(5).textContent(),
            loan: await row.locator('td').nth(6).textContent(),
            payment: await row.locator('td').nth(9).textContent()
          };
          
          const expected = {
            downPercent: '0',
            rate: '0',
            term: '0',
            downAmount: '$0',
            loan: '$0',
            payment: '$0'
          };
          
          let allCorrect = true;
          for (const [field, value] of Object.entries(values)) {
            const isCorrect = value === expected[field];
            if (!isCorrect) allCorrect = false;
            console.log(`  ${field}: ${value} ${isCorrect ? '✅' : '❌'}`);
          }
          
          // Check disabled state
          const disabled = {
            downPercent: await row.locator('input').nth(3).isDisabled(),
            rate: await row.locator('input').nth(5).isDisabled(),
            term: await row.locator('input').nth(6).isDisabled()
          };
          
          for (const [field, isDisabled] of Object.entries(disabled)) {
            console.log(`  ${field} disabled: ${isDisabled ? '✅' : '❌'}`);
            if (!isDisabled) allCorrect = false;
          }
          
          if (!allCorrect) allSellsCorrect = false;
          
          // Assert all values
          expect(values.downPercent).toBe('0');
          expect(values.rate).toBe('0');
          expect(values.term).toBe('0');
          expect(values.downAmount).toBe('$0');
          expect(values.loan).toBe('$0');
          expect(values.payment).toBe('$0');
          expect(disabled.downPercent).toBe(true);
          expect(disabled.rate).toBe(true);
          expect(disabled.term).toBe(true);
        }
      }
      
      console.log(`\n${scenario.name} Summary:`);
      console.log(`- Buy events: ${buyCount}`);
      console.log(`- Sell events: ${sellCount}`);
      console.log(`- All sells correct: ${allSellsCorrect ? '✅ YES' : '❌ NO'}`);
    }
    
    console.log('\n\n✅ ALL TESTS PASSED - Auto-generated sell events have zero loan fields!');
  });
  
  test('✅ Manual sell events also maintain zero fields', async ({ page }) => {
    await page.goto(`${baseURL}/portfolio-simulator-v2.html`);
    await page.waitForLoadState('networkidle');
    
    // Add a buy event
    const buyRow = page.locator('#timelineTable tbody tr').first();
    await buyRow.locator('select').selectOption('buy');
    await buyRow.locator('input[placeholder="Property address"]').fill('Test Property');
    await buyRow.locator('input').nth(2).fill('100000');
    await buyRow.locator('input').nth(3).fill('20');
    
    // Add a sell event
    await page.click('button:has-text("Add Event")');
    const sellRow = page.locator('#timelineTable tbody tr').nth(1);
    await sellRow.locator('select').selectOption('sell');
    
    // Verify fields are zeroed
    const downPercent = await sellRow.locator('input').nth(3).inputValue();
    const rate = await sellRow.locator('input').nth(5).inputValue();
    const term = await sellRow.locator('input').nth(6).inputValue();
    
    console.log('\nManual sell event fields:');
    console.log(`Down %: ${downPercent} ${downPercent === '0' ? '✅' : '❌'}`);
    console.log(`Rate %: ${rate} ${rate === '0' ? '✅' : '❌'}`);
    console.log(`Term: ${term} ${term === '0' ? '✅' : '❌'}`);
    
    expect(downPercent).toBe('0');
    expect(rate).toBe('0');
    expect(term).toBe('0');
    
    console.log('\n✅ Manual sell events also correctly zero loan fields!');
  });
});