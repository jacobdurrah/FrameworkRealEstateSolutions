/**
 * Basic tests for Portfolio Simulator V2 on live site
 */
const { test, expect } = require('@playwright/test');

test.describe('Portfolio V2 Live Site Basic Tests', () => {
    test('should load page and calculators', async ({ page }) => {
        // Navigate to the page
        await page.goto('/portfolio-simulator-v2.html');
        
        // Wait for page to load
        await page.waitForLoadState('networkidle');
        
        // Check page title
        await expect(page).toHaveTitle(/Portfolio Simulator V2/);
        
        // Check main elements exist
        await expect(page.locator('h1')).toContainText('Portfolio Simulator V2');
        await expect(page.locator('#timelineTable')).toBeVisible();
        
        // Check if calculators are loaded by testing window objects
        const calculatorsLoaded = await page.evaluate(() => {
            return {
                baseCalculator: typeof window.BaseCalculator !== 'undefined',
                loanCalculator: typeof window.LoanCalculator !== 'undefined',
                roiCalculator: typeof window.ROICalculator !== 'undefined',
                cashFlowCalculator: typeof window.CashFlowCalculator !== 'undefined',
                equityCalculator: typeof window.EquityCalculator !== 'undefined'
            };
        });
        
        expect(calculatorsLoaded.baseCalculator).toBe(true);
        expect(calculatorsLoaded.loanCalculator).toBe(true);
        expect(calculatorsLoaded.roiCalculator).toBe(true);
        expect(calculatorsLoaded.cashFlowCalculator).toBe(true);
        expect(calculatorsLoaded.equityCalculator).toBe(true);
        
        // Check if main functions exist
        const functionsExist = await page.evaluate(() => {
            return {
                updateTimeline: typeof window.updateTimeline === 'function',
                addTimelineRow: typeof window.addTimelineRow === 'function',
                recalculateAll: typeof window.recalculateAll === 'function'
            };
        });
        
        expect(functionsExist.updateTimeline).toBe(true);
        expect(functionsExist.addTimelineRow).toBe(true);
        expect(functionsExist.recalculateAll).toBe(true);
    });

    test('should perform basic calculation', async ({ page }) => {
        await page.goto('/portfolio-simulator-v2.html');
        await page.waitForLoadState('networkidle');
        
        // Wait for initial row to be present
        await page.waitForSelector('input[placeholder="Property address"]');
        
        // Fill in basic property data
        await page.fill('input[placeholder="Property address"]', 'Test Property');
        await page.fill('input[onchange*="price"]', '100000');
        
        // Wait a bit for calculations
        await page.waitForTimeout(1000);
        
        // Check if down payment was calculated (20% of 100000 = 20000)
        const downAmountText = await page.locator('td.currency').first().textContent();
        expect(downAmountText).toBe('$20,000');
        
        // Check if loan amount was calculated (100000 - 20000 = 80000)
        const loanAmountText = await page.locator('td.currency').nth(1).textContent();
        expect(loanAmountText).toBe('$80,000');
    });

    test('should navigate between V1 and V2', async ({ page }) => {
        // Start at V2
        await page.goto('/portfolio-simulator-v2.html');
        
        // Check V1 link exists and navigate
        await page.click('a:has-text("Simulator V1")');
        await page.waitForLoadState('networkidle');
        
        // Should be on V1 page
        await expect(page).toHaveURL(/portfolio-simulator\.html/);
        await expect(page.locator('h1')).toContainText('Portfolio Simulator');
        
        // Check V2 links exist
        await expect(page.locator('a:has-text("Simulator V2")')).toBeVisible();
        await expect(page.locator('a:has-text("Try V2")')).toBeVisible();
        
        // Navigate back to V2
        await page.click('a:has-text("Try V2")');
        await page.waitForLoadState('networkidle');
        
        // Should be back on V2
        await expect(page).toHaveURL(/portfolio-simulator-v2\.html/);
        await expect(page.locator('h1')).toContainText('Portfolio Simulator V2');
    });
});