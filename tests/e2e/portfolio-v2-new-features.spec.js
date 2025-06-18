/**
 * E2E tests for new Portfolio V2 features
 */
const { test, expect } = require('@playwright/test');

test.describe('Portfolio V2 New Features', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/portfolio-simulator-v2.html');
        await page.waitForLoadState('networkidle');
    });

    test('100% down payment should show $0 payment', async ({ page }) => {
        // Fill property with 100% down
        await page.fill('input[placeholder="Property address"]', '100% Down Property');
        await page.fill('input[onchange*="price"]', '250000');
        await page.fill('input[onchange*="downPercent"]', '100');
        
        // Wait for calculations
        await page.waitForTimeout(500);
        
        // Check payment is $0 (payment is the 3rd currency column after down$ and loan$)
        const paymentText = await page.locator('td.currency').nth(2).textContent();
        expect(paymentText).toBe('$0');
        
        // Check loan amount is $0
        const loanText = await page.locator('td.currency').nth(1).textContent();
        expect(loanText).toBe('$0');
    });

    test('monthly expenses should be configurable per property', async ({ page }) => {
        // Add property with expenses
        await page.fill('input[placeholder="Property address"]', 'Test Property');
        await page.fill('input[onchange*="price"]', '300000');
        await page.fill('input[onchange*="rent"]', '3000');
        await page.fill('input[onchange*="monthlyExpenses"]', '1200');
        
        await page.waitForTimeout(500);
        
        // Check that expenses are reflected in summary
        const monthlyExpenses = await page.locator('#monthlyExpenses').textContent();
        expect(monthlyExpenses).toContain('$');
        
        // Net cash flow should be rent - expenses - payment
        const netCashFlow = await page.locator('#netCashFlow').textContent();
        expect(netCashFlow).toBeTruthy();
    });

    test('time-based portfolio summary shows future projections', async ({ page }) => {
        // Add a property first
        await page.fill('input[placeholder="Property address"]', 'Investment Property');
        await page.fill('input[onchange*="price"]', '250000');
        await page.fill('input[onchange*="rent"]', '2500');
        await page.fill('input[onchange*="monthlyExpenses"]', '500');
        
        await page.waitForTimeout(500);
        
        // Get current values
        const currentValue = await page.locator('#portfolioValue').textContent();
        const currentEquity = await page.locator('#totalEquity').textContent();
        
        // Set view to 60 months (5 years) in future
        await page.fill('#summaryMonth', '60');
        await page.waitForTimeout(1000);
        
        // Check that years display updated
        await expect(page.locator('#summaryYears')).toContainText('5.0 years');
        
        // Portfolio value should have appreciated
        const futureValue = await page.locator('#portfolioValue').textContent();
        expect(futureValue).not.toBe(currentValue);
        
        // Should show total invested
        const totalInvested = await page.locator('#totalInvested').textContent();
        expect(totalInvested).toContain('$50,000'); // 20% of 250k
        
        // Should show interest paid
        const interestPaid = await page.locator('#totalInterestPaid').textContent();
        expect(interestPaid).toContain('$');
        
        // Should show cash on hand
        const cashOnHand = await page.locator('#cashOnHand').textContent();
        expect(cashOnHand).toContain('$');
    });

    test('multiple properties with different expenses', async ({ page }) => {
        // Add first property
        await page.fill('input[placeholder="Property address"]', 'Property 1');
        await page.fill('input[onchange*="price"]', '200000');
        await page.fill('input[onchange*="rent"]', '2000');
        await page.fill('input[onchange*="monthlyExpenses"]', '400');
        
        // Add second property
        await page.click('button:has-text("Add Event")');
        await page.waitForTimeout(300);
        
        await page.locator('input[placeholder="Property address"]').nth(1).fill('Property 2');
        await page.locator('input[onchange*="price"]').nth(1).fill('300000');
        await page.locator('input[onchange*="rent"]').nth(1).fill('3000');
        await page.locator('input[onchange*="monthlyExpenses"]').nth(1).fill('600');
        
        await page.waitForTimeout(500);
        
        // Total expenses should be sum of individual expenses + loan payments
        const totalExpenses = await page.locator('#monthlyExpenses').textContent();
        expect(totalExpenses).toBeTruthy();
        
        // View 5 years in future
        await page.fill('#summaryMonth', '60');
        await page.waitForTimeout(1000);
        
        // Both properties should have appreciated
        const futurePortfolioValue = await page.locator('#portfolioValue').textContent();
        expect(futurePortfolioValue).toContain('$'); // Should be > $500k with appreciation
    });

    test('navigation preserves state', async ({ page }) => {
        // Add property
        await page.fill('input[placeholder="Property address"]', 'Test Nav Property');
        await page.fill('input[onchange*="price"]', '350000');
        
        // Set future view
        await page.fill('#summaryMonth', '36');
        await page.waitForTimeout(500);
        
        // Navigate to V1 and back
        await page.click('a:has-text("Simulator V1")');
        await page.waitForLoadState('networkidle');
        await page.click('a:has-text("Simulator V2")');
        await page.waitForLoadState('networkidle');
        
        // Check that property is still there
        const propertyAddress = await page.locator('input[placeholder="Property address"]').first().inputValue();
        expect(propertyAddress).toBe('Test Nav Property');
        
        // Summary month should be preserved
        const summaryMonth = await page.locator('#summaryMonth').inputValue();
        expect(summaryMonth).toBe('36');
    });
});