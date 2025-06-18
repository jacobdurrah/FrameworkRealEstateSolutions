/**
 * E2E tests for Portfolio V2 cash tracking features
 */
const { test, expect } = require('@playwright/test');

test.describe('Portfolio V2 Cash Tracking', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/portfolio-simulator-v2.html');
        await page.waitForLoadState('networkidle');
    });

    test('should show Rental Income instead of Cash on Hand', async ({ page }) => {
        // Check that the label has been renamed
        await expect(page.locator('.summary-label:has-text("Rental Income")')).toBeVisible();
        await expect(page.locator('.summary-label:has-text("Cash from Sales")')).toBeVisible();
        await expect(page.locator('.summary-label:has-text("Total Cash on Hand")')).toBeVisible();
        
        // Should not have old "Cash on Hand" label (exact match)
        const labels = await page.locator('.summary-label').allTextContents();
        const hasOldLabel = labels.some(label => label === 'Cash on Hand');
        expect(hasOldLabel).toBe(false);
    });

    test('should calculate rental income over time', async ({ page }) => {
        // Add a property
        await page.fill('input[placeholder="Property address"]', 'Rental Property');
        await page.fill('input[onchange*="price"]', '200000');
        await page.fill('input[onchange*="rent"]', '2000');
        await page.fill('input[onchange*="monthlyExpenses"]', '500');
        
        await page.waitForTimeout(500);
        
        // Set view to 12 months in future
        await page.fill('#summaryMonth', '12');
        await page.waitForTimeout(1000);
        
        // Net rental income should be (2000 - 500) * 12 = 18000
        // Minus loan payments (roughly 810 * 12 = 9720)
        // So rental income should be around 8280
        const rentalIncome = await page.locator('#rentalIncome').textContent();
        expect(rentalIncome).toContain('$');
        
        // Total cash on hand should equal rental income (no sales yet)
        const totalCash = await page.locator('#totalCashOnHand').textContent();
        expect(totalCash).toBe(rentalIncome);
    });

    test('should allow price editing for sell action', async ({ page }) => {
        // Add a property first
        await page.fill('input[placeholder="Property address"]', 'Property to Sell');
        await page.fill('input[onchange*="price"]', '300000');
        await page.waitForTimeout(500);
        
        // Add a sell event
        await page.click('button:has-text("Add Event")');
        await page.waitForTimeout(300);
        
        // Change action to sell
        await page.locator('select.table-select').nth(1).selectOption('sell');
        await page.locator('input[placeholder="Property address"]').nth(1).fill('Property to Sell');
        
        // Price field should be editable for sell
        const priceInput = page.locator('input[onchange*="price"]').nth(1);
        await expect(priceInput).not.toBeDisabled();
        
        // Set sale price
        await priceInput.fill('350000');
        await priceInput.blur();
        await page.waitForTimeout(1000);
        
        // Cash from sales should show the profit
        const cashFromSales = await page.locator('#cashFromSales').textContent();
        expect(cashFromSales).toContain('$');
    });

    test('should calculate total cash on hand correctly', async ({ page }) => {
        // Add property at month 0
        await page.fill('input[placeholder="Property address"]', 'Rental 1');
        await page.fill('input[onchange*="price"]', '250000');
        await page.fill('input[onchange*="rent"]', '2500');
        await page.fill('input[onchange*="monthlyExpenses"]', '700');
        
        // Add second property at month 4
        await page.click('button:has-text("Add Event")');
        await page.waitForTimeout(300);
        await page.locator('input[onchange*="month"]').nth(1).fill('4');
        await page.locator('input[placeholder="Property address"]').nth(1).fill('Rental 2');
        await page.locator('input[onchange*="price"]').nth(1).fill('300000');
        await page.locator('input[onchange*="rent"]').nth(1).fill('3000');
        await page.locator('input[onchange*="monthlyExpenses"]').nth(1).fill('800');
        
        // Add sell event at month 12
        await page.click('button:has-text("Add Event")');
        await page.waitForTimeout(300);
        await page.locator('input[onchange*="month"]').nth(2).fill('12');
        await page.locator('select.table-select').nth(2).selectOption('sell');
        await page.locator('input[placeholder="Property address"]').nth(2).fill('Rental 1');
        await page.locator('input[onchange*="price"]').nth(2).fill('280000');
        
        await page.waitForTimeout(500);
        
        // View at 24 months
        await page.fill('#summaryMonth', '24');
        await page.waitForTimeout(1000);
        
        // Should have rental income and cash from sales
        const rentalIncome = await page.locator('#rentalIncome').textContent();
        const cashFromSales = await page.locator('#cashFromSales').textContent();
        const totalCash = await page.locator('#totalCashOnHand').textContent();
        
        // All should have values
        expect(rentalIncome).toContain('$');
        expect(cashFromSales).toContain('$');
        expect(totalCash).toContain('$');
        
        // Total should not be $0
        expect(totalCash).not.toBe('$0');
    });

    test('input updates only on blur, not keystroke', async ({ page }) => {
        // Add property and monitor for updates
        await page.fill('input[placeholder="Property address"]', 'Test Property');
        
        const priceInput = page.locator('input[onchange*="price"]').first();
        
        // Clear any existing value first
        await priceInput.clear();
        
        // Type slowly to detect if updates happen per keystroke
        await priceInput.click();
        await priceInput.type('2', { delay: 100 });
        
        // Check that calculation hasn't happened yet
        let loanAmount = await page.locator('td.currency').nth(1).textContent();
        expect(loanAmount).toBe('$0');
        
        await priceInput.type('50000', { delay: 100 });
        
        // Still shouldn't update
        loanAmount = await page.locator('td.currency').nth(1).textContent();
        expect(loanAmount).toBe('$0');
        
        // Now blur the field
        await priceInput.blur();
        await page.waitForTimeout(500);
        
        // Now it should update
        loanAmount = await page.locator('td.currency').nth(1).textContent();
        // The input was "250000" so loan should be 80% = 200000
        expect(loanAmount).toContain('200,000');
    });
});