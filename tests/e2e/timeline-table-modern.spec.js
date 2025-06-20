import { test, expect } from '@playwright/test';

test.describe('Modern Timeline Table Tests', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  const pages = [
    { name: 'Portfolio V2', path: '/portfolio-simulator-v2.html' },
    { name: 'Portfolio V3', path: '/portfolio-simulator-v3.html' }
  ];
  
  const viewports = [
    { name: 'Desktop', width: 1440, height: 900, device: 'desktop' },
    { name: 'Tablet', width: 1024, height: 768, device: 'tablet' },
    { name: 'Mobile', width: 375, height: 667, device: 'mobile' }
  ];
  
  test.beforeEach(async ({ page }) => {
    // Add test data
    await page.addInitScript(() => {
      window.testTimelineData = [
        {
          id: 1,
          month: 0,
          action: 'buy',
          property: 'Investment Property 1: 20264 Waltham St, Detroit, MI 48205',
          price: 56850,
          downPercent: 20,
          downAmount: 11370,
          loanAmount: 45480,
          rate: 7.0,
          term: 30,
          payment: 303,
          rent: 1150,
          monthlyExpenses: 300
        },
        {
          id: 2,
          month: 2,
          action: 'buy',
          property: 'Investment Property 2: 4226 18th St, Detroit, MI 48208',
          price: 42937,
          downPercent: 20,
          downAmount: 8587,
          loanAmount: 34350,
          rate: 7.0,
          term: 30,
          payment: 229,
          rent: 1350,
          monthlyExpenses: 280
        },
        {
          id: 3,
          month: 7,
          action: 'buy',
          property: 'Investment Property 3: 11116 Rosemary St, Detroit, MI 48213',
          price: 38777,
          downPercent: 25,
          downAmount: 9694,
          loanAmount: 29083,
          rate: 7.0,
          term: 30,
          payment: 194,
          rent: 1200,
          monthlyExpenses: 250
        }
      ];
    });
  });
  
  for (const pageInfo of pages) {
    test.describe(pageInfo.name, () => {
      test('Modern table structure and styling', async ({ page }) => {
        await page.goto(`${baseURL}${pageInfo.path}`);
        await page.waitForLoadState('networkidle');
        
        // Apply test data
        await page.evaluate(() => {
          window.timelineData = window.testTimelineData;
          if (typeof window.renderTimelineTable === 'function') {
            window.renderTimelineTable();
          }
        });
        
        await page.waitForTimeout(500);
        
        // Check container structure
        const container = page.locator('.timeline-table-container');
        await expect(container).toBeVisible();
        console.log('✅ Modern table container exists');
        
        // Check scroll wrapper
        const scrollWrapper = page.locator('.timeline-table-scroll-wrapper');
        await expect(scrollWrapper).toBeVisible();
        console.log('✅ Scroll wrapper exists');
        
        // Check table has modern class
        const table = page.locator('#timelineTable.timeline-table');
        await expect(table).toBeVisible();
        console.log('✅ Table has modern class');
        
        // Check scroll indicators
        const leftIndicator = page.locator('.scroll-indicator-left');
        const rightIndicator = page.locator('.scroll-indicator-right');
        await expect(leftIndicator).toBeAttached();
        await expect(rightIndicator).toBeAttached();
        console.log('✅ Scroll indicators present');
        
        // Check modern styling
        const tableStyles = await table.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            borderCollapse: styles.borderCollapse,
            fontFamily: styles.fontFamily.includes('-apple-system'),
            fontSize: styles.fontSize
          };
        });
        
        expect(tableStyles.borderCollapse).toBe('separate');
        expect(tableStyles.fontFamily).toBe(true);
        console.log('✅ Modern table styling applied');
      });
      
      for (const viewport of viewports) {
        test(`${viewport.name} responsive behavior`, async ({ page }) => {
          console.log(`\n=== Testing ${pageInfo.name} on ${viewport.name} ===`);
          
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.goto(`${baseURL}${pageInfo.path}`);
          await page.waitForLoadState('networkidle');
          
          // Apply test data
          await page.evaluate(() => {
            window.timelineData = window.testTimelineData;
            if (typeof window.renderTimelineTable === 'function') {
              window.renderTimelineTable();
            }
          });
          
          await page.waitForTimeout(500);
          
          // Test frozen columns
          const firstCell = page.locator('#timelineTable td:first-child').first();
          const firstCellStyles = await firstCell.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return {
              position: styles.position,
              left: styles.left,
              zIndex: styles.zIndex
            };
          });
          
          expect(firstCellStyles.position).toBe('sticky');
          expect(firstCellStyles.left).toBe('0px');
          console.log('✅ First column (Month) is frozen');
          
          if (viewport.device === 'tablet') {
            // Check if action column is also frozen on tablet
            const secondCell = page.locator('#timelineTable td:nth-child(2)').first();
            const secondCellStyles = await secondCell.evaluate(el => {
              const styles = window.getComputedStyle(el);
              return {
                position: styles.position,
                left: styles.left
              };
            });
            
            expect(secondCellStyles.position).toBe('sticky');
            expect(secondCellStyles.left).toBe('80px');
            console.log('✅ Second column (Action) is frozen on tablet');
          }
          
          // Test horizontal scrolling
          const scrollWrapper = page.locator('.timeline-table-scroll-wrapper');
          const canScroll = await scrollWrapper.evaluate(el => {
            return el.scrollWidth > el.clientWidth;
          });
          
          if (viewport.device !== 'desktop' || viewport.width < 1200) {
            expect(canScroll).toBe(true);
            console.log('✅ Table is horizontally scrollable');
            
            // Test scroll indicators
            await scrollWrapper.evaluate(el => el.scrollLeft = 100);
            await page.waitForTimeout(100);
            
            const hasLeftIndicator = await page.locator('.timeline-table-container.can-scroll-left').count();
            expect(hasLeftIndicator).toBeGreaterThan(0);
            console.log('✅ Left scroll indicator appears when scrolled');
          }
        });
      }
      
      test('Sticky header behavior', async ({ page }) => {
        await page.goto(`${baseURL}${pageInfo.path}`);
        await page.waitForLoadState('networkidle');
        
        // Add more rows to make table scrollable vertically
        await page.evaluate(() => {
          window.timelineData = [];
          for (let i = 0; i < 20; i++) {
            window.timelineData.push({
              id: i + 1,
              month: i,
              action: 'buy',
              property: `Test Property ${i + 1}`,
              price: 50000 + (i * 1000),
              downPercent: 20,
              downAmount: 10000 + (i * 200),
              loanAmount: 40000 + (i * 800),
              rate: 7.0,
              term: 30,
              payment: 300 + (i * 10),
              rent: 1000 + (i * 50),
              monthlyExpenses: 250 + (i * 10)
            });
          }
          if (typeof window.renderTimelineTable === 'function') {
            window.renderTimelineTable();
          }
        });
        
        await page.waitForTimeout(500);
        
        // Check sticky header
        const thead = page.locator('#timelineTable thead');
        const theadStyles = await thead.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            position: styles.position,
            top: styles.top,
            zIndex: styles.zIndex
          };
        });
        
        expect(theadStyles.position).toBe('sticky');
        expect(theadStyles.top).toBe('0px');
        console.log('✅ Table header is sticky');
      });
      
      test('Input and interaction styling', async ({ page }) => {
        await page.goto(`${baseURL}${pageInfo.path}`);
        await page.waitForLoadState('networkidle');
        
        // Apply test data
        await page.evaluate(() => {
          window.timelineData = window.testTimelineData;
          if (typeof window.renderTimelineTable === 'function') {
            window.renderTimelineTable();
          }
        });
        
        await page.waitForTimeout(500);
        
        // Test input focus
        const firstInput = page.locator('#timelineTable input[type="number"]').first();
        await firstInput.focus();
        
        const focusStyles = await firstInput.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            borderColor: styles.borderColor,
            boxShadow: styles.boxShadow
          };
        });
        
        expect(focusStyles.boxShadow).toContain('rgba');
        console.log('✅ Input has proper focus styles');
        
        // Test hover state on row
        const firstRow = page.locator('#timelineTable tbody tr').first();
        await firstRow.hover();
        
        const hoverStyles = await firstRow.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return styles.backgroundColor;
        });
        
        expect(hoverStyles).not.toBe('rgb(255, 255, 255)');
        console.log('✅ Row has hover state');
        
        // Test delete button styling
        const deleteBtn = page.locator('.btn-danger').first();
        const btnStyles = await deleteBtn.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            borderRadius: styles.borderRadius,
            transition: styles.transition
          };
        });
        
        expect(btnStyles.borderRadius).not.toBe('0px');
        expect(btnStyles.transition).toContain('0.15s');
        console.log('✅ Buttons have modern styling');
      });
      
      test('Accessibility features', async ({ page }) => {
        await page.goto(`${baseURL}${pageInfo.path}`);
        await page.waitForLoadState('networkidle');
        
        // Apply test data
        await page.evaluate(() => {
          window.timelineData = window.testTimelineData;
          if (typeof window.renderTimelineTable === 'function') {
            window.renderTimelineTable();
          }
        });
        
        await page.waitForTimeout(500);
        
        // Check color contrast
        const header = page.locator('#timelineTable thead th').first();
        const headerColors = await header.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            color: styles.color,
            background: styles.backgroundColor
          };
        });
        
        console.log(`Header colors - Text: ${headerColors.color}, BG: ${headerColors.background}`);
        
        // Test keyboard navigation
        const firstInput = page.locator('#timelineTable input').first();
        await firstInput.focus();
        await page.keyboard.press('Tab');
        
        const secondInput = page.locator('#timelineTable input').nth(1);
        const isFocused = await secondInput.evaluate(el => el === document.activeElement);
        expect(isFocused).toBe(true);
        console.log('✅ Keyboard navigation works');
        
        // Check ARIA attributes
        const table = page.locator('#timelineTable');
        const role = await table.getAttribute('role');
        console.log(`Table role: ${role || 'table (default)'}`);
      });
    });
  }
});