import { test, expect } from '@playwright/test';

test.describe('Mobile Table Layout Fix Tests', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  const pages = [
    { name: 'Portfolio V2', path: '/portfolio-simulator-v2.html' },
    { name: 'Portfolio V3', path: '/portfolio-simulator-v3.html' }
  ];
  
  const mobileViewports = [
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'Galaxy S21', width: 360, height: 800 }
  ];
  
  for (const page of pages) {
    for (const viewport of mobileViewports) {
      test(`${page.name} - ${viewport.name} mobile layout`, async ({ page: browserPage }) => {
        console.log(`\n=== Testing ${page.name} on ${viewport.name} ===`);
        
        // Set viewport
        await browserPage.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // Navigate to page
        await browserPage.goto(`${baseURL}${page.path}`);
        await browserPage.waitForLoadState('networkidle');
        
        // Add test data
        await browserPage.evaluate(() => {
          window.timelineData = [
            {
              id: 1,
              month: 0,
              action: 'buy',
              property: 'Rental 1: 13750 Mecca St, Detroit, MI 48227',
              price: 60455,
              downPercent: 20,
              downAmount: 12091,
              loanAmount: 48364,
              rate: 7.0,
              term: 30,
              payment: 322,
              rent: 1150,
              monthlyExpenses: 280
            },
            {
              id: 2,
              month: 3,
              action: 'buy',
              property: 'Rental 2: 20264 Waltham St, Detroit, MI 48205',
              price: 56850,
              downPercent: 20,
              downAmount: 11370,
              loanAmount: 45480,
              rate: 7.0,
              term: 30,
              payment: 303,
              rent: 1150,
              monthlyExpenses: 300
            }
          ];
          
          if (typeof window.renderTimelineTable === 'function') {
            window.renderTimelineTable();
          }
        });
        
        await browserPage.waitForTimeout(500);
        
        // Test 1: Check thead is hidden
        const theadVisible = await browserPage.locator('#timelineTable thead').isVisible();
        expect(theadVisible).toBe(false);
        console.log('✅ Table headers hidden on mobile');
        
        // Test 2: Check rows are displayed as cards
        const firstRow = browserPage.locator('#timelineTable tbody tr').first();
        const rowDisplay = await firstRow.evaluate(el => 
          window.getComputedStyle(el).display
        );
        expect(rowDisplay).toBe('block');
        console.log('✅ Rows displayed as block (cards)');
        
        // Test 3: Check no duplicate labels
        const cells = await browserPage.locator('#timelineTable tbody td').all();
        for (let i = 0; i < Math.min(cells.length, 5); i++) {
          const cell = cells[i];
          const text = await cell.textContent();
          const hasDataLabel = await cell.getAttribute('data-label');
          
          // Check that data-label attributes are removed
          expect(hasDataLabel).toBeNull();
          
          // Check text doesn't contain duplicate headers
          expect(text).not.toContain('Month\nMonth');
          expect(text).not.toContain('Action\nAction');
          expect(text).not.toContain('Property\nProperty');
        }
        console.log('✅ No duplicate labels in cells');
        
        // Test 4: Check property field styling
        const propertyCell = browserPage.locator('#timelineTable tbody td:nth-child(3)').first();
        const propertyBox = await propertyCell.boundingBox();
        if (propertyBox) {
          expect(propertyBox.width).toBeGreaterThan(viewport.width * 0.8);
          console.log('✅ Property field uses full width');
        }
        
        // Test 5: Check financial fields are in grid
        const priceCell = browserPage.locator('#timelineTable tbody td:nth-child(4)').first();
        const downPercentCell = browserPage.locator('#timelineTable tbody td:nth-child(5)').first();
        
        const priceDisplay = await priceCell.evaluate(el => 
          window.getComputedStyle(el).display
        );
        const downDisplay = await downPercentCell.evaluate(el => 
          window.getComputedStyle(el).display
        );
        
        expect(priceDisplay).toBe('inline-block');
        expect(downDisplay).toBe('inline-block');
        console.log('✅ Financial fields in grid layout');
        
        // Test 6: Check hidden fields
        const rateCell = browserPage.locator('#timelineTable tbody td:nth-child(8)').first();
        const termCell = browserPage.locator('#timelineTable tbody td:nth-child(9)').first();
        const expensesCell = browserPage.locator('#timelineTable tbody td:nth-child(12)').first();
        
        const rateVisible = await rateCell.isVisible();
        const termVisible = await termCell.isVisible();
        const expensesVisible = await expensesCell.isVisible();
        
        expect(rateVisible).toBe(false);
        expect(termVisible).toBe(false);
        expect(expensesVisible).toBe(false);
        console.log('✅ Rate, Term, and Expenses hidden on mobile');
        
        // Test 7: Check card styling
        const rowStyles = await firstRow.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            marginBottom: styles.marginBottom,
            border: styles.border,
            borderRadius: styles.borderRadius,
            padding: styles.padding
          };
        });
        
        expect(parseFloat(rowStyles.marginBottom)).toBeGreaterThan(0);
        expect(rowStyles.borderRadius).not.toBe('0px');
        console.log('✅ Cards have proper styling and spacing');
        
        // Test 8: Check inputs are appropriately sized
        const monthInput = browserPage.locator('#timelineTable input[type="number"]').first();
        const inputBox = await monthInput.boundingBox();
        if (inputBox) {
          expect(inputBox.height).toBeGreaterThanOrEqual(44); // Touch target size
          console.log('✅ Input fields have adequate touch target size');
        }
        
        // Test 9: Check delete button
        const deleteBtn = browserPage.locator('.btn-danger').first();
        const btnBox = await deleteBtn.boundingBox();
        if (btnBox) {
          expect(btnBox.width).toBeGreaterThan(viewport.width * 0.7);
          console.log('✅ Delete button is full width');
        }
      });
    }
  }
});