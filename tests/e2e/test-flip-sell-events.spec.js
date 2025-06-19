import { test, expect } from '@playwright/test';

test('✅ Verify flip sell events have zero loan fields', async ({ page }) => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  
  await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
  await page.waitForLoadState('networkidle');
  
  // Use structured input to force flips
  await page.click('#inputModeToggle');
  
  // Set aggressive strategy to get flips
  await page.fill('#targetIncome', '1000');
  await page.fill('#targetCashFromSales', '50000'); // High cash goal forces flips
  await page.fill('#timeline', '12');
  await page.fill('#startingCapital', '30000');
  await page.selectOption('#strategyPreference', 'aggressive');
  
  await page.click('button:has-text("Generate Strategy")');
  await page.waitForSelector('.strategy-card', { timeout: 15000 });
  
  // Select aggressive strategy
  const cards = await page.locator('.strategy-card').all();
  for (const card of cards) {
    const text = await card.textContent();
    if (text.toLowerCase().includes('aggressive')) {
      await card.click();
      break;
    }
  }
  
  await page.waitForSelector('#timelineTable tbody tr');
  
  // Check all events
  const rows = await page.locator('#timelineTable tbody tr').all();
  let foundFlipSell = false;
  
  console.log(`\nChecking ${rows.length} timeline events for flips...`);
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const action = await row.locator('select').inputValue();
    const property = await row.locator('input[placeholder="Property address"]').inputValue();
    
    if (action === 'sell' && property.includes('Flip')) {
      foundFlipSell = true;
      console.log(`\n✅ Found Flip Sell Event: ${property}`);
      
      // Check all loan fields
      const downPercent = await row.locator('input').nth(3).inputValue();
      const rate = await row.locator('input').nth(5).inputValue();
      const term = await row.locator('input').nth(6).inputValue();
      const downAmount = await row.locator('td').nth(5).textContent();
      const loan = await row.locator('td').nth(6).textContent();
      const payment = await row.locator('td').nth(9).textContent();
      
      console.log('Field values:');
      console.log(`  Down %: ${downPercent} ${downPercent === '0' ? '✅' : '❌'}`);
      console.log(`  Rate %: ${rate} ${rate === '0' ? '✅' : '❌'}`);
      console.log(`  Term: ${term} ${term === '0' ? '✅' : '❌'}`);
      console.log(`  Down $: ${downAmount} ${downAmount === '$0' ? '✅' : '❌'}`);
      console.log(`  Loan: ${loan} ${loan === '$0' ? '✅' : '❌'}`);
      console.log(`  Payment: ${payment} ${payment === '$0' ? '✅' : '❌'}`);
      
      // Verify all are zero
      expect(downPercent).toBe('0');
      expect(rate).toBe('0');
      expect(term).toBe('0');
      expect(downAmount).toBe('$0');
      expect(loan).toBe('$0');
      expect(payment).toBe('$0');
      
      // Check disabled state
      const isDisabled = await row.locator('input').nth(3).isDisabled();
      console.log(`  Fields disabled: ${isDisabled ? '✅' : '❌'}`);
      expect(isDisabled).toBe(true);
    }
  }
  
  if (!foundFlipSell) {
    console.log('\n⚠️ No flip sell events found in this strategy');
    console.log('Events generated:');
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const action = await row.locator('select').inputValue();
      const property = await row.locator('input[placeholder="Property address"]').inputValue();
      console.log(`  ${i + 1}. ${action} - ${property}`);
    }
  } else {
    console.log('\n✅ Flip sell events correctly have all loan fields zeroed!');
  }
});