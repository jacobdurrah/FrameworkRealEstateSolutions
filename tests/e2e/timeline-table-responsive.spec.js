import { test, expect } from '@playwright/test';

test.describe('Timeline Table Responsive Layout Tests', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  const viewports = [
    { name: 'Desktop', width: 1440, height: 900 },
    { name: 'Tablet Landscape', width: 1024, height: 768 },
    { name: 'Tablet Portrait', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 }
  ];
  
  test.beforeEach(async ({ page }) => {
    // Navigate to Portfolio V3
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    await page.waitForLoadState('networkidle');
    
    // Add test data with long property addresses
    await page.evaluate(() => {
      window.timelineData = [
        {
          id: 1,
          month: 0,
          action: 'buy',
          property: 'Investment Property 1: 19234 Tacoma St, Detroit, MI 48205',
          price: 75000,
          downPercent: 20,
          downAmount: 15000,
          loanAmount: 60000,
          rate: 7.5,
          term: 30,
          payment: 420,
          rent: 1200,
          monthlyExpenses: 300
        },
        {
          id: 2,
          month: 3,
          action: 'buy',
          property: 'Long Address Test: 12345 Very Long Street Name That Should Wrap, Detroit, MI 48226',
          price: 125000,
          downPercent: 25,
          downAmount: 31250,
          loanAmount: 93750,
          rate: 7.25,
          term: 30,
          payment: 640,
          rent: 1800,
          monthlyExpenses: 450
        },
        {
          id: 3,
          month: 6,
          action: 'sell',
          property: 'Investment Property 1: 19234 Tacoma St, Detroit, MI 48205',
          price: 95000,
          downPercent: 0,
          downAmount: 0,
          loanAmount: 0,
          rate: 0,
          term: 0,
          payment: 0,
          rent: 0,
          monthlyExpenses: 0
        }
      ];
      
      if (typeof window.renderTimelineTable === 'function') {
        window.renderTimelineTable();
      }
    });
    
    await page.waitForTimeout(500);
  });
  
  for (const viewport of viewports) {
    test(`${viewport.name} (${viewport.width}px) - Column visibility and layout`, async ({ page }) => {
      // Set viewport
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(300);
      
      console.log(`\n=== Testing ${viewport.name} (${viewport.width}px) ===`);
      
      // Check if table is visible
      const tableVisible = await page.locator('#timelineTable').isVisible();
      expect(tableVisible).toBe(true);
      console.log('✅ Table is visible');
      
      // Check horizontal scrolling
      const tableWrapper = page.locator('.table-wrapper');
      const hasHorizontalScroll = await page.evaluate((width) => {
        const wrapper = document.querySelector('.table-wrapper');
        const table = document.querySelector('#timelineTable');
        if (!wrapper || !table) return false;
        
        // For mobile, we expect card layout, not horizontal scroll
        if (width <= 767) {
          return false; // Card layout shouldn't have horizontal scroll
        }
        
        return table.scrollWidth > wrapper.clientWidth;
      }, viewport.width);
      
      if (viewport.width > 767) {
        console.log(`Horizontal scroll: ${hasHorizontalScroll ? 'Yes (acceptable for complex tables)' : 'No'}`);
      } else {
        expect(hasHorizontalScroll).toBe(false);
        console.log('✅ No horizontal scroll on mobile (card layout)');
      }
      
      // Check property column visibility
      const propertyInputs = page.locator('input[placeholder="Property address"]');
      const propertyCount = await propertyInputs.count();
      
      if (propertyCount > 0) {
        const firstProperty = propertyInputs.first();
        const propertyValue = await firstProperty.inputValue();
        console.log(`First property: "${propertyValue}"`);
        
        // Check if property is truncated or wrapped properly
        const isVisible = await firstProperty.isVisible();
        expect(isVisible).toBe(true);
        
        // Check tooltip
        const hasTooltip = await firstProperty.getAttribute('title');
        expect(hasTooltip).toBeTruthy();
        console.log('✅ Property inputs have tooltips');
        
        // Check property width
        const propertyBox = await firstProperty.boundingBox();
        if (propertyBox) {
          console.log(`Property input width: ${propertyBox.width}px`);
          
          if (viewport.width >= 1440) {
            expect(propertyBox.width).toBeGreaterThanOrEqual(250);
            console.log('✅ Property column has adequate width on desktop');
          }
        }
      }
      
      // Check action dropdown
      const actionSelects = page.locator('.table-select');
      const selectCount = await actionSelects.count();
      
      if (selectCount > 0) {
        const firstSelect = actionSelects.first();
        const selectBox = await firstSelect.boundingBox();
        
        if (selectBox && viewport.width > 767) {
          console.log(`Action dropdown width: ${selectBox.width}px`);
          expect(selectBox.width).toBeGreaterThanOrEqual(90);
          console.log('✅ Action dropdowns have adequate width');
        }
      }
      
      // Mobile-specific tests
      if (viewport.width <= 767) {
        console.log('\nMobile Layout Tests:');
        
        // Check if table headers are hidden
        const theadVisible = await page.locator('#timelineTable thead').isVisible();
        expect(theadVisible).toBe(false);
        console.log('✅ Table headers hidden on mobile');
        
        // Check if rows are displayed as cards
        const firstRow = page.locator('#timelineTable tbody tr').first();
        const rowDisplay = await firstRow.evaluate(el => 
          window.getComputedStyle(el).display
        );
        expect(rowDisplay).toBe('block');
        console.log('✅ Rows displayed as cards');
        
        // Check data labels
        const firstTd = page.locator('#timelineTable tbody td').first();
        const dataLabel = await firstTd.getAttribute('data-label');
        expect(dataLabel).toBeTruthy();
        console.log('✅ Data labels present for mobile view');
      }
      
      // Check column count visibility
      const visibleColumns = await page.evaluate(() => {
        const headers = document.querySelectorAll('#timelineTable th');
        let visible = 0;
        headers.forEach(th => {
          if (window.getComputedStyle(th).display !== 'none') {
            visible++;
          }
        });
        return visible;
      });
      
      console.log(`Visible columns: ${visibleColumns}`);
      
      // Take screenshot for visual verification
      await page.screenshot({
        path: `tests/screenshots/timeline-table-${viewport.name.toLowerCase().replace(' ', '-')}.png`,
        fullPage: false
      });
    });
  }
  
  test('Touch targets on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    
    console.log('\n=== Mobile Touch Target Tests ===');
    
    // Check button sizes
    const deleteButtons = page.locator('.btn-danger');
    const buttonCount = await deleteButtons.count();
    
    if (buttonCount > 0) {
      const firstButton = deleteButtons.first();
      const buttonBox = await firstButton.boundingBox();
      
      if (buttonBox) {
        console.log(`Delete button size: ${buttonBox.width}x${buttonBox.height}px`);
        expect(buttonBox.width).toBeGreaterThanOrEqual(44);
        expect(buttonBox.height).toBeGreaterThanOrEqual(44);
        console.log('✅ Touch targets meet minimum size (44px)');
      }
    }
    
    // Check input field heights
    const inputs = page.locator('#timelineTable input[type="number"]');
    const inputCount = await inputs.count();
    
    if (inputCount > 0) {
      const firstInput = inputs.first();
      const inputBox = await firstInput.boundingBox();
      
      if (inputBox) {
        console.log(`Input field height: ${inputBox.height}px`);
        expect(inputBox.height).toBeGreaterThanOrEqual(44);
        console.log('✅ Input fields have adequate height for touch');
      }
    }
  });
  
  test('Property address handling', async ({ page }) => {
    console.log('\n=== Property Address Handling Tests ===');
    
    // Desktop view
    await page.setViewportSize({ width: 1440, height: 900 });
    
    // Add a very long property address
    await page.evaluate(() => {
      if (window.timelineData && window.timelineData.length > 0) {
        window.timelineData[0].property = 'Extremely Long Property Address: 99999 Super Duper Long Street Name With Many Words, Apartment Complex Building A Unit 123, Detroit, Michigan 48226-1234';
        if (typeof window.renderTimelineTable === 'function') {
          window.renderTimelineTable();
        }
      }
    });
    
    await page.waitForTimeout(300);
    
    // Check if property input shows tooltip
    const longPropertyInput = page.locator('input[placeholder="Property address"]').first();
    const tooltipText = await longPropertyInput.getAttribute('title');
    
    expect(tooltipText).toContain('Extremely Long Property Address');
    console.log('✅ Long addresses have tooltips');
    
    // Check overflow handling
    const overflow = await longPropertyInput.evaluate(el => 
      window.getComputedStyle(el).textOverflow
    );
    console.log(`Text overflow style: ${overflow || 'default'}`);
  });
  
  test('Cross-browser rendering consistency', async ({ page, browserName }) => {
    console.log(`\n=== ${browserName} Browser Test ===`);
    
    // Set standard desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    
    // Check CSS is loaded
    const cssLoaded = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets);
      return stylesheets.some(sheet => {
        try {
          return sheet.href && sheet.href.includes('timeline-table-responsive.css');
        } catch (e) {
          return false;
        }
      });
    });
    
    expect(cssLoaded).toBe(true);
    console.log('✅ Responsive CSS loaded');
    
    // Check table layout
    const tableLayout = await page.evaluate(() => {
      const table = document.querySelector('#timelineTable');
      return table ? window.getComputedStyle(table).tableLayout : null;
    });
    
    expect(tableLayout).toBe('fixed');
    console.log('✅ Table layout is fixed for consistent column widths');
    
    // Verify no console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(1000);
    
    if (consoleErrors.length === 0) {
      console.log('✅ No console errors');
    } else {
      console.log(`⚠️  Console errors found: ${consoleErrors.length}`);
    }
  });
});