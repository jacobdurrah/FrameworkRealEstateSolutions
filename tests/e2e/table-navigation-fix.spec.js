import { test, expect } from '@playwright/test';

test.describe('Table Navigation Fix Tests', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  const pages = [
    { name: 'Portfolio V2', path: '/portfolio-simulator-v2.html' },
    { name: 'Portfolio V3', path: '/portfolio-simulator-v3.html' }
  ];
  
  for (const page of pages) {
    test.describe(`${page.name} - Table Navigation`, () => {
      test.beforeEach(async ({ page: browserPage }) => {
        await browserPage.goto(`${baseURL}${page.path}`);
        await browserPage.waitForLoadState('networkidle');
        
        // Add test data
        await browserPage.evaluate(() => {
          window.timelineData = [
            {
              id: 1,
              month: 0,
              action: 'buy',
              property: 'Rental 1: 11116 Rosema St, Detroit, MI 48205',
              price: 52493,
              downPercent: 20,
              downAmount: 10499,
              loanAmount: 41973,
              rate: 7.0,
              term: 30,
              payment: 279,
              rent: 1200,
              monthlyExpenses: 300
            },
            {
              id: 2,
              month: 1,
              action: 'buy',
              property: 'Rental 2: 13750 Mecca St, Detroit, MI 48227',
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
              id: 3,
              month: 6,
              action: 'buy',
              property: 'Rental 3: 19192 Strasburg St, Detroit, MI 48205',
              price: 82773,
              downPercent: 20,
              downAmount: 16554,
              loanAmount: 66218,
              rate: 7.0,
              term: 30,
              payment: 441,
              rent: 1150,
              monthlyExpenses: 350
            }
          ];
          
          if (typeof window.renderTimelineTable === 'function') {
            window.renderTimelineTable();
          }
        });
        
        await browserPage.waitForTimeout(500);
      });
      
      test('Property tooltips removed', async ({ page: browserPage }) => {
        console.log(`\n=== Testing ${page.name} - Tooltips ===`);
        
        // Check all property inputs
        const propertyInputs = browserPage.locator('input[placeholder="Property address"]');
        const count = await propertyInputs.count();
        
        for (let i = 0; i < count; i++) {
          const input = propertyInputs.nth(i);
          const titleAttr = await input.getAttribute('title');
          
          expect(titleAttr).toBeNull();
          console.log(`✅ Property input ${i + 1}: No tooltip`);
        }
      });
      
      test('Sticky table header', async ({ page: browserPage }) => {
        console.log(`\n=== Testing ${page.name} - Sticky Header ===`);
        
        // Check if thead has sticky positioning
        const theadStyle = await browserPage.evaluate(() => {
          const thead = document.querySelector('#timelineTable thead');
          if (!thead) return null;
          
          const styles = window.getComputedStyle(thead);
          return {
            position: styles.position,
            top: styles.top,
            zIndex: styles.zIndex
          };
        });
        
        expect(theadStyle).not.toBeNull();
        expect(theadStyle.position).toBe('sticky');
        expect(theadStyle.top).toBe('0px');
        console.log('✅ Table header is sticky');
        
        // Test scrolling behavior
        const tableWrapper = browserPage.locator('.table-wrapper');
        const wrapperBox = await tableWrapper.boundingBox();
        
        if (wrapperBox) {
          // Add more rows to make table scrollable
          await browserPage.evaluate(() => {
            for (let i = 4; i <= 10; i++) {
              window.timelineData.push({
                id: i,
                month: i * 2,
                action: 'buy',
                property: `Test Property ${i}`,
                price: 50000 + (i * 5000),
                downPercent: 20,
                downAmount: 10000 + (i * 1000),
                loanAmount: 40000 + (i * 4000),
                rate: 7.0,
                term: 30,
                payment: 300 + (i * 20),
                rent: 1000 + (i * 50),
                monthlyExpenses: 250 + (i * 25)
              });
            }
            if (typeof window.renderTimelineTable === 'function') {
              window.renderTimelineTable();
            }
          });
          
          await browserPage.waitForTimeout(300);
          
          // Scroll table
          await tableWrapper.evaluate(el => el.scrollTop = 200);
          await browserPage.waitForTimeout(100);
          
          // Check if header is still visible
          const headerVisible = await browserPage.locator('#timelineTable thead').isVisible();
          expect(headerVisible).toBe(true);
          console.log('✅ Header stays visible when scrolling');
        }
      });
      
      test('Table layout and alignment', async ({ page: browserPage }) => {
        console.log(`\n=== Testing ${page.name} - Layout ===`);
        
        // Check table layout property
        const tableLayout = await browserPage.evaluate(() => {
          const table = document.querySelector('#timelineTable');
          return table ? window.getComputedStyle(table).tableLayout : null;
        });
        
        expect(tableLayout).toBe('fixed');
        console.log('✅ Table has fixed layout');
        
        // Check column alignment
        const firstRow = browserPage.locator('#timelineTable tbody tr').first();
        const cells = await firstRow.locator('td').all();
        
        if (cells.length > 0) {
          // Check if numeric columns have right alignment
          const priceInput = await cells[3].locator('input').first();
          const priceAlign = await priceInput.evaluate(el => 
            window.getComputedStyle(el).textAlign
          );
          
          expect(priceAlign).toBe('right');
          console.log('✅ Numeric inputs are right-aligned');
        }
      });
      
      test('Table wrapper scroll behavior', async ({ page: browserPage }) => {
        console.log(`\n=== Testing ${page.name} - Scroll Wrapper ===`);
        
        const tableWrapper = browserPage.locator('.table-wrapper');
        const wrapperStyle = await tableWrapper.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            overflow: styles.overflow,
            maxHeight: styles.maxHeight,
            position: styles.position
          };
        });
        
        expect(wrapperStyle.overflow).toBe('auto');
        expect(wrapperStyle.maxHeight).toBeTruthy();
        console.log('✅ Table wrapper has proper scroll settings');
        
        // Check for scroll indicators
        const hasScrollClasses = await tableWrapper.evaluate(el => {
          return {
            hasLeft: el.classList.contains('has-scroll-left'),
            hasRight: el.classList.contains('has-scroll-right')
          };
        });
        
        console.log(`Scroll indicators - Left: ${hasScrollClasses.hasLeft}, Right: ${hasScrollClasses.hasRight}`);
      });
      
      test('Mobile responsive behavior', async ({ page: browserPage }) => {
        console.log(`\n=== Testing ${page.name} - Mobile View ===`);
        
        // Set mobile viewport
        await browserPage.setViewportSize({ width: 375, height: 667 });
        await browserPage.waitForTimeout(300);
        
        // Check if table transforms to card layout on mobile
        const isMobileLayout = await browserPage.evaluate(() => {
          const tbody = document.querySelector('#timelineTable tbody');
          if (!tbody) return false;
          
          const firstRow = tbody.querySelector('tr');
          if (!firstRow) return false;
          
          const display = window.getComputedStyle(firstRow).display;
          return display === 'block'; // Mobile card layout uses block display
        });
        
        console.log(`Mobile card layout: ${isMobileLayout ? '✅' : '❌'}`);
        
        // Check if headers are hidden on mobile
        const headersHidden = await browserPage.evaluate(() => {
          const thead = document.querySelector('#timelineTable thead');
          if (!thead) return false;
          
          const display = window.getComputedStyle(thead).display;
          return display === 'none';
        });
        
        if (headersHidden) {
          console.log('✅ Headers hidden on mobile');
        }
      });
      
      test('Input focus and interaction', async ({ page: browserPage }) => {
        console.log(`\n=== Testing ${page.name} - Input Focus ===`);
        
        // Reset to desktop view
        await browserPage.setViewportSize({ width: 1440, height: 900 });
        await browserPage.waitForTimeout(300);
        
        // Focus on first property input
        const firstInput = browserPage.locator('input[placeholder="Property address"]').first();
        await firstInput.focus();
        
        // Check focus styles
        const focusStyles = await firstInput.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            borderColor: styles.borderColor,
            outline: styles.outline,
            boxShadow: styles.boxShadow
          };
        });
        
        console.log('Focus styles applied:', focusStyles);
        expect(focusStyles.outline).not.toBe('none');
        console.log('✅ Input has proper focus indication');
        
        // Test typing in input
        await firstInput.fill('Test Property Address');
        const value = await firstInput.inputValue();
        expect(value).toBe('Test Property Address');
        console.log('✅ Input accepts text properly');
      });
    });
  }
});