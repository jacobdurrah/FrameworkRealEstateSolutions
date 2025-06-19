import { test, expect } from '@playwright/test';

test.describe('Deployment Status Check', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  
  test('Check current deployment status', async ({ page }) => {
    console.log('====================================');
    console.log('DEPLOYMENT STATUS CHECK');
    console.log('====================================');
    console.log(`Time: ${new Date().toISOString()}`);
    console.log('====================================\n');
    
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    await page.waitForLoadState('networkidle');
    
    // Check JavaScript file updates
    console.log('1. JavaScript Functions Status:');
    
    const jsFunctions = await page.evaluate(() => {
      return {
        updateSummaryMonth: typeof window.updateSummaryMonth === 'function',
        stepMonth: typeof window.stepMonth === 'function',
        debouncedUpdateMonth: typeof window.debouncedUpdateMonth === 'function',
        recalculateAll: typeof window.recalculateAll === 'function'
      };
    });
    
    for (const [func, exists] of Object.entries(jsFunctions)) {
      console.log(`   ${exists ? '✅' : '❌'} ${func}()`);
    }
    
    // Check HTML elements
    console.log('\n2. HTML Elements Status:');
    
    // Add test data first
    await page.evaluate(() => {
      window.timelineData = [{
        id: 1,
        month: 0,
        action: 'buy',
        property: 'Deployment Test Property',
        price: 100000,
        downPercent: 20,
        downAmount: 20000,
        loanAmount: 80000,
        rate: 7,
        term: 30,
        payment: 532,
        rent: 1000,
        monthlyExpenses: 200
      }];
      if (window.recalculateAll) window.recalculateAll();
    });
    
    await page.waitForTimeout(1000);
    
    const elements = {
      'Month input (#summaryMonth)': await page.locator('#summaryMonth').count(),
      'Month input with new class': await page.locator('.month-input').count(),
      'Stepper down button': await page.locator('.month-stepper-down').count(),
      'Stepper up button': await page.locator('.month-stepper-up').count(),
      'Month input group': await page.locator('.month-input-group').count(),
      'Year display (#summaryYears)': await page.locator('#summaryYears').count()
    };
    
    for (const [element, count] of Object.entries(elements)) {
      console.log(`   ${count > 0 ? '✅' : '❌'} ${element}: ${count} found`);
    }
    
    // Check attributes
    console.log('\n3. HTML Attributes Status:');
    
    const monthInput = page.locator('#summaryMonth');
    if (await monthInput.count() > 0) {
      const attributes = {
        'aria-label': await monthInput.getAttribute('aria-label'),
        'class': await monthInput.getAttribute('class'),
        'onchange': await monthInput.getAttribute('onchange'),
        'oninput': await monthInput.getAttribute('oninput')
      };
      
      for (const [attr, value] of Object.entries(attributes)) {
        if (value) {
          console.log(`   ✅ ${attr}: "${value}"`);
        } else {
          console.log(`   ❌ ${attr}: not found`);
        }
      }
    }
    
    // Test functionality
    console.log('\n4. Functionality Tests:');
    
    // Test debouncing
    const debounceWorks = await page.evaluate(() => {
      return new Promise(resolve => {
        if (typeof window.debouncedUpdateMonth !== 'function') {
          resolve(false);
          return;
        }
        
        let callCount = 0;
        const original = window.updateSummaryMonth;
        window.updateSummaryMonth = function() {
          callCount++;
          return original.apply(this, arguments);
        };
        
        // Simulate rapid input
        for (let i = 0; i < 5; i++) {
          window.debouncedUpdateMonth();
        }
        
        setTimeout(() => {
          window.updateSummaryMonth = original;
          resolve(callCount <= 1); // Should only call once due to debouncing
        }, 600);
      });
    });
    
    console.log(`   ${debounceWorks ? '✅' : '❌'} Debouncing: ${debounceWorks ? 'Working' : 'Not working'}`);
    
    // Test stepMonth if available
    if (jsFunctions.stepMonth) {
      const stepWorks = await page.evaluate(() => {
        const input = document.getElementById('summaryMonth');
        if (!input) return false;
        
        const initial = parseInt(input.value) || 0;
        window.stepMonth(1);
        const after = parseInt(input.value);
        
        // Reset
        input.value = initial;
        window.updateSummaryMonth();
        
        return after === initial + 1;
      });
      
      console.log(`   ${stepWorks ? '✅' : '❌'} Step function: ${stepWorks ? 'Working' : 'Not working'}`);
    }
    
    // Summary
    console.log('\n====================================');
    console.log('DEPLOYMENT SUMMARY');
    console.log('====================================');
    
    const hasNewUI = elements['Stepper down button'] > 0 && elements['Stepper up button'] > 0;
    const hasNewJS = jsFunctions.stepMonth && jsFunctions.debouncedUpdateMonth;
    const hasAttributes = await monthInput.getAttribute('aria-label') !== null;
    
    if (hasNewUI && hasNewJS && hasAttributes) {
      console.log('✅ FULL DEPLOYMENT COMPLETE!');
      console.log('   All month selector improvements are live');
    } else if (hasNewJS && !hasNewUI) {
      console.log('⚠️  PARTIAL DEPLOYMENT');
      console.log('   ✅ JavaScript functions deployed');
      console.log('   ⏳ Waiting for HTML/CSS updates');
      console.log('   Expected: GitHub Pages cache refresh needed');
    } else if (!hasNewJS && !hasNewUI) {
      console.log('❌ DEPLOYMENT PENDING');
      console.log('   Changes not yet visible on live site');
      console.log('   This is normal - GitHub Pages can take 5-10 minutes');
    }
    
    console.log('\nRecommendation:');
    if (!hasNewUI) {
      console.log('   Wait 5-10 minutes and run this test again');
      console.log('   GitHub Pages deployment is automatic but not instant');
    }
    
    console.log('====================================');
  });
});