import { test, expect } from '@playwright/test';

test.describe('Verify Sell Event Fix on Live Site', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  
  test('verify sell event resets all loan fields to 0', async ({ page }) => {
    // Force fresh load with cache bypass
    await page.goto(`${baseURL}/portfolio-simulator-v2.html`, { 
      waitUntil: 'networkidle',
      bypassCSP: true 
    });
    
    // Add cache-busting to force reload of JS
    await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[src*="portfolio-simulator-v2.js"]');
      scripts.forEach(script => {
        const newScript = document.createElement('script');
        newScript.src = script.src + '?t=' + Date.now();
        script.parentNode.replaceChild(newScript, script);
      });
    });
    
    // Wait for page to stabilize
    await page.waitForTimeout(2000);
    await page.waitForSelector('#timelineTable tbody tr');
    
    const row = page.locator('#timelineTable tbody tr').first();
    
    // Fill in Buy details
    await row.locator('input').nth(0).fill('0'); // Month
    await row.locator('select').selectOption('buy');
    await row.locator('input').nth(1).fill('Test Property'); // Property
    await row.locator('input').nth(2).fill('100000'); // Price
    await row.locator('input').nth(3).fill('20'); // Down %
    await row.locator('input').nth(5).fill('7'); // Rate
    await row.locator('input').nth(6).fill('30'); // Term
    
    // Trigger recalculation
    await row.locator('input').nth(2).press('Tab');
    await page.waitForTimeout(500);
    
    // Log initial values
    console.log('Before changing to Sell:');
    console.log('Down %:', await row.locator('input').nth(3).inputValue());
    console.log('Rate:', await row.locator('input').nth(5).inputValue());
    console.log('Term:', await row.locator('input').nth(6).inputValue());
    console.log('Down $:', await row.locator('td').nth(5).textContent());
    console.log('Loan:', await row.locator('td').nth(6).textContent());
    console.log('Payment:', await row.locator('td').nth(9).textContent());
    
    // Change to Sell
    await row.locator('select').selectOption('sell');
    await page.waitForTimeout(1000);
    
    // Log values after change
    console.log('\nAfter changing to Sell:');
    console.log('Down %:', await row.locator('input').nth(3).inputValue());
    console.log('Rate:', await row.locator('input').nth(5).inputValue());
    console.log('Term:', await row.locator('input').nth(6).inputValue());
    console.log('Down $:', await row.locator('td').nth(5).textContent());
    console.log('Loan:', await row.locator('td').nth(6).textContent());
    console.log('Payment:', await row.locator('td').nth(9).textContent());
    
    // Test results
    const results = {
      downPercent: await row.locator('input').nth(3).inputValue(),
      rate: await row.locator('input').nth(5).inputValue(),
      term: await row.locator('input').nth(6).inputValue(),
      downAmount: await row.locator('td').nth(5).textContent(),
      loanAmount: await row.locator('td').nth(6).textContent(),
      payment: await row.locator('td').nth(9).textContent(),
      downPercentDisabled: await row.locator('input').nth(3).isDisabled(),
      rateDisabled: await row.locator('input').nth(5).isDisabled(),
      termDisabled: await row.locator('input').nth(6).isDisabled()
    };
    
    console.log('\nTest Results:');
    console.log('✅ Down % = 0:', results.downPercent === '0');
    console.log('✅ Rate = 0:', results.rate === '0');
    console.log('✅ Term = 0:', results.term === '0');
    console.log('✅ Down $ = $0:', results.downAmount === '$0');
    console.log('✅ Loan = $0:', results.loanAmount === '$0');
    console.log('✅ Payment = $0:', results.payment === '$0');
    console.log('✅ Down % disabled:', results.downPercentDisabled);
    console.log('✅ Rate disabled:', results.rateDisabled);
    console.log('✅ Term disabled:', results.termDisabled);
    
    // Assertions
    expect(results.downPercent).toBe('0');
    expect(results.rate).toBe('0');
    expect(results.term).toBe('0');
    expect(results.downAmount).toBe('$0');
    expect(results.loanAmount).toBe('$0');
    expect(results.payment).toBe('$0');
    expect(results.downPercentDisabled).toBe(true);
    expect(results.rateDisabled).toBe(true);
    expect(results.termDisabled).toBe(true);
  });

  test('verify cash from sales still works', async ({ page }) => {
    await page.goto(`${baseURL}/portfolio-simulator-v2.html`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#timelineTable tbody tr');
    
    // Add Buy event
    const buyRow = page.locator('#timelineTable tbody tr').first();
    await buyRow.locator('input').nth(0).fill('0'); // Month 0
    await buyRow.locator('select').selectOption('buy');
    await buyRow.locator('input').nth(1).fill('Property 1');
    await buyRow.locator('input').nth(2).fill('100000'); // Price
    await buyRow.locator('input').nth(3).fill('20'); // 20% down
    
    // Add Sell event
    await page.click('button:has-text("Add Event")');
    await page.waitForTimeout(500);
    
    const sellRow = page.locator('#timelineTable tbody tr').nth(1);
    await sellRow.locator('input').nth(0).fill('12'); // Month 12
    await sellRow.locator('select').selectOption('sell');
    await sellRow.locator('input').nth(1).fill('Property 1');
    await sellRow.locator('input').nth(2).fill('120000'); // Sell price
    
    // Update view to month 13
    await page.fill('#summaryMonth', '13');
    await page.click('button:has-text("Refresh")');
    await page.waitForTimeout(1000);
    
    // Check cash from sales
    const cashFromSales = await page.locator('#cashFromSales').textContent();
    console.log('Cash from Sales:', cashFromSales);
    
    // Should show profit (sale price - remaining loan balance)
    const cashValue = parseInt(cashFromSales.replace(/[^0-9-]/g, ''));
    expect(cashValue).toBeGreaterThan(0);
    console.log('✅ Cash from Sales calculated correctly:', cashFromSales);
  });
});