import { test, expect } from '@playwright/test';

test.describe('Smooth Scroll Toggle Tests', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  const pages = [
    { name: 'Portfolio V2', path: '/portfolio-simulator-v2.html' },
    { name: 'Portfolio V3', path: '/portfolio-simulator-v3.html' }
  ];
  
  for (const page of pages) {
    test.describe(`${page.name} - Smooth Scroll`, () => {
      test.beforeEach(async ({ page: browserPage }) => {
        await browserPage.goto(`${baseURL}${page.path}`);
        await browserPage.waitForLoadState('networkidle');
        
        // Wait for scripts to load
        await browserPage.waitForTimeout(1000);
      });
      
      test('Formulas section smooth scroll', async ({ page: browserPage }) => {
        console.log(`\n=== Testing ${page.name} - Formulas Smooth Scroll ===`);
        
        // Check initial state - content should be hidden
        const equationContent = browserPage.locator('#equationContent');
        const isInitiallyVisible = await equationContent.isVisible();
        console.log(`Initial state - content visible: ${isInitiallyVisible}`);
        
        // Get initial scroll position
        const initialScrollY = await browserPage.evaluate(() => window.pageYOffset);
        console.log(`Initial scroll position: ${initialScrollY}px`);
        
        // Click the Formulas header
        const formulasHeader = browserPage.locator('.equation-header').first();
        await formulasHeader.click();
        
        // Wait for animation
        await browserPage.waitForTimeout(700);
        
        // Check if content is now visible
        const isVisibleAfterClick = await equationContent.isVisible();
        expect(isVisibleAfterClick).toBe(true);
        console.log('✅ Formulas content expanded');
        
        // Check if page scrolled
        const scrollYAfter = await browserPage.evaluate(() => window.pageYOffset);
        console.log(`Scroll position after click: ${scrollYAfter}px`);
        
        // Should have scrolled down
        expect(scrollYAfter).toBeGreaterThan(initialScrollY);
        console.log('✅ Page scrolled to formulas section');
        
        // Check if formulas panel is in view
        const equationPanel = browserPage.locator('#equationPanel');
        const isInViewport = await equationPanel.isIntersectingViewport();
        expect(isInViewport).toBe(true);
        console.log('✅ Formulas panel is in viewport');
        
        // Check for smooth scroll behavior
        const hasSmooth = await browserPage.evaluate(() => {
          const html = document.documentElement;
          return window.getComputedStyle(html).scrollBehavior === 'smooth' ||
                 'scrollBehavior' in html.style;
        });
        console.log(`Smooth scroll support: ${hasSmooth ? 'Yes' : 'Polyfill used'}`);
      });
      
      test('Help section smooth scroll', async ({ page: browserPage }) => {
        console.log(`\n=== Testing ${page.name} - Help Smooth Scroll ===`);
        
        // Get initial scroll position
        const initialScrollY = await browserPage.evaluate(() => window.pageYOffset);
        
        // Click the Help/Instructions header
        const instructionsHeader = browserPage.locator('.instructions-header').first();
        await instructionsHeader.click();
        
        // Wait for animation
        await browserPage.waitForTimeout(700);
        
        // Check if content is now visible
        const instructionsContent = browserPage.locator('#instructionsContent');
        const isVisible = await instructionsContent.isVisible();
        expect(isVisible).toBe(true);
        console.log('✅ Help content expanded');
        
        // Check if page scrolled
        const scrollYAfter = await browserPage.evaluate(() => window.pageYOffset);
        expect(scrollYAfter).toBeGreaterThan(initialScrollY);
        console.log('✅ Page scrolled to help section');
        
        // Check if instructions panel is in view
        const instructionsPanel = browserPage.locator('#instructionsPanel');
        const isInViewport = await instructionsPanel.isIntersectingViewport();
        expect(isInViewport).toBe(true);
        console.log('✅ Help panel is in viewport');
      });
      
      test('Toggle collapse behavior', async ({ page: browserPage }) => {
        console.log(`\n=== Testing ${page.name} - Toggle Collapse ===`);
        
        // First expand the formulas
        const formulasHeader = browserPage.locator('.equation-header').first();
        await formulasHeader.click();
        await browserPage.waitForTimeout(700);
        
        // Get scroll position when expanded
        const expandedScrollY = await browserPage.evaluate(() => window.pageYOffset);
        
        // Click again to collapse
        await formulasHeader.click();
        await browserPage.waitForTimeout(300);
        
        // Check if content is hidden
        const equationContent = browserPage.locator('#equationContent');
        const isHidden = await equationContent.isHidden();
        expect(isHidden).toBe(true);
        console.log('✅ Content collapsed correctly');
        
        // Scroll position should remain the same when collapsing
        const collapsedScrollY = await browserPage.evaluate(() => window.pageYOffset);
        expect(Math.abs(collapsedScrollY - expandedScrollY)).toBeLessThanOrEqual(50);
        console.log('✅ No scrolling on collapse');
      });
      
      test('Mobile view smooth scroll', async ({ page: browserPage }) => {
        console.log(`\n=== Testing ${page.name} - Mobile Smooth Scroll ===`);
        
        // Set mobile viewport
        await browserPage.setViewportSize({ width: 375, height: 667 });
        await browserPage.waitForTimeout(300);
        
        // Click the Help header
        const instructionsHeader = browserPage.locator('.instructions-header').first();
        await instructionsHeader.click();
        
        // Wait for animation
        await browserPage.waitForTimeout(700);
        
        // Check if instructions panel is in view
        const instructionsPanel = browserPage.locator('#instructionsPanel');
        const boundingBox = await instructionsPanel.boundingBox();
        
        if (boundingBox) {
          const viewportHeight = 667;
          const isTopInView = boundingBox.y >= 0 && boundingBox.y < viewportHeight;
          expect(isTopInView).toBe(true);
          console.log('✅ Help panel properly positioned on mobile');
        }
      });
      
      test('Keyboard navigation', async ({ page: browserPage }) => {
        console.log(`\n=== Testing ${page.name} - Keyboard Navigation ===`);
        
        // Tab to the formulas header
        const formulasHeader = browserPage.locator('.equation-header').first();
        await formulasHeader.focus();
        
        // Press Enter
        await browserPage.keyboard.press('Enter');
        await browserPage.waitForTimeout(700);
        
        // Check if content expanded and scrolled
        const equationContent = browserPage.locator('#equationContent');
        const isVisible = await equationContent.isVisible();
        expect(isVisible).toBe(true);
        console.log('✅ Enter key works for expansion');
        
        // Press Space to collapse
        await browserPage.keyboard.press('Space');
        await browserPage.waitForTimeout(300);
        
        const isHidden = await equationContent.isHidden();
        expect(isHidden).toBe(true);
        console.log('✅ Space key works for collapse');
      });
      
      test('No layout shift or flicker', async ({ page: browserPage }) => {
        console.log(`\n=== Testing ${page.name} - Layout Stability ===`);
        
        // Record any layout shifts
        const layoutShifts = [];
        await browserPage.evaluateOnNewDocument(() => {
          window.layoutShifts = [];
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                window.layoutShifts.push({
                  value: entry.value,
                  time: entry.startTime
                });
              }
            }
          }).observe({ entryTypes: ['layout-shift'] });
        });
        
        // Reload page to capture shifts
        await browserPage.reload();
        await browserPage.waitForLoadState('networkidle');
        await browserPage.waitForTimeout(1000);
        
        // Perform toggle actions
        const formulasHeader = browserPage.locator('.equation-header').first();
        await formulasHeader.click();
        await browserPage.waitForTimeout(1000);
        
        // Get layout shift data
        const shifts = await browserPage.evaluate(() => window.layoutShifts || []);
        const totalShift = shifts.reduce((sum, shift) => sum + shift.value, 0);
        
        console.log(`Total layout shift score: ${totalShift.toFixed(4)}`);
        console.log(`Number of shifts: ${shifts.length}`);
        
        // Check for good CLS score (less than 0.1 is good)
        expect(totalShift).toBeLessThan(0.25); // Allowing some shift for expansion
        console.log('✅ Layout shift within acceptable range');
      });
    });
  }
  
  test('Enhanced functions properly initialized', async ({ page }) => {
    console.log('\n=== Testing Enhanced Function Initialization ===');
    
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Check if enhanced functions are properly set
    const functionsExist = await page.evaluate(() => {
      return {
        toggleEquations: typeof window.toggleEquations === 'function',
        toggleInstructions: typeof window.toggleInstructions === 'function',
        enhancedToggleEquations: typeof window.enhancedToggleEquations === 'function',
        enhancedToggleInstructions: typeof window.enhancedToggleInstructions === 'function',
        scrollToElement: typeof window.scrollToElement === 'function'
      };
    });
    
    expect(functionsExist.toggleEquations).toBe(true);
    expect(functionsExist.toggleInstructions).toBe(true);
    expect(functionsExist.enhancedToggleEquations).toBe(true);
    expect(functionsExist.enhancedToggleInstructions).toBe(true);
    expect(functionsExist.scrollToElement).toBe(true);
    
    console.log('✅ All functions properly initialized');
    
    // Check if functions were enhanced
    const isEnhanced = await page.evaluate(() => {
      return window.toggleEquations === window.enhancedToggleEquations;
    });
    
    expect(isEnhanced).toBe(true);
    console.log('✅ Toggle functions successfully enhanced');
  });
});