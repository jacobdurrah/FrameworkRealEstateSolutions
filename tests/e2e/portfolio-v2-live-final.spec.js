/**
 * Final comprehensive tests for Portfolio Simulator V2 on live site
 */
const { test, expect } = require('@playwright/test');

test.describe('Portfolio V2 Live Site Final Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/portfolio-simulator-v2.html');
        await page.waitForLoadState('networkidle');
    });

    test('should successfully add property and show calculations', async ({ page }) => {
        // Wait for initial row
        await page.waitForSelector('input[placeholder="Property address"]');
        
        // Fill property details one by one with waits
        await page.fill('input[placeholder="Property address"]', '123 Success Test St');
        await page.waitForTimeout(300);
        
        // Fill price and trigger change event
        const priceInput = page.locator('input[onchange*="price"]').first();
        await priceInput.fill('250000');
        await priceInput.press('Tab'); // Trigger blur event
        await page.waitForTimeout(500);
        
        // Fill other fields
        const downPercentInput = page.locator('input[onchange*="downPercent"]').first();
        await downPercentInput.fill('25');
        await downPercentInput.press('Tab');
        await page.waitForTimeout(300);
        
        const rentInput = page.locator('input[onchange*="rent"]').first();
        await rentInput.fill('2500');
        await rentInput.press('Tab');
        await page.waitForTimeout(500);
        
        // Check calculations were performed
        const downAmount = await page.locator('td.currency').first().textContent();
        expect(downAmount).toBe('$62,500'); // 25% of 250k
        
        const loanAmount = await page.locator('td.currency').nth(1).textContent();
        expect(loanAmount).toBe('$187,500'); // 250k - 62.5k
        
        // Check summary updated
        await expect(page.locator('#totalProperties')).toContainText('1');
        await expect(page.locator('#portfolioValue')).toContainText('$250,000');
        await expect(page.locator('#monthlyIncome')).toContainText('$2,500');
    });

    test('should save and load simulation correctly', async ({ page }) => {
        // Add a property first
        await page.fill('input[placeholder="Property address"]', '456 Save Test Ave');
        const priceInput = page.locator('input[onchange*="price"]').first();
        await priceInput.fill('300000');
        await priceInput.press('Tab');
        await page.waitForTimeout(500);
        
        // Save simulation
        page.once('dialog', dialog => {
            dialog.accept('Live Test Simulation');
        });
        await page.click('button:has-text("Save")');
        await page.waitForTimeout(1000);
        
        // Check saved status
        await expect(page.locator('#simulationName')).toContainText('Live Test Simulation');
        
        // New simulation
        page.once('dialog', dialog => {
            dialog.accept(); // Accept confirmation
        });
        await page.click('button:has-text("New Simulation")');
        await page.waitForTimeout(500);
        
        // Should have empty simulation
        await expect(page.locator('#simulationName')).toContainText('New Simulation');
        
        // Load saved simulation
        await page.click('button:has-text("Load")');
        await page.waitForTimeout(500);
        
        // Should restore the saved data
        await expect(page.locator('#simulationName')).toContainText('Live Test Simulation');
        await expect(page.locator('input[placeholder="Property address"]').first()).toHaveValue('456 Save Test Ave');
    });

    test('should build simple portfolio with multiple properties', async ({ page }) => {
        // Add first property
        await page.fill('input[placeholder="Property address"]', 'Property 1');
        let priceInput = page.locator('input[onchange*="price"]').first();
        await priceInput.fill('200000');
        await priceInput.press('Tab');
        
        let rentInput = page.locator('input[onchange*="rent"]').first();
        await rentInput.fill('2000');
        await rentInput.press('Tab');
        await page.waitForTimeout(500);
        
        // Add second property
        await page.click('button:has-text("Add Event")');
        await page.waitForTimeout(300);
        
        await page.locator('input[placeholder="Property address"]').nth(1).fill('Property 2');
        priceInput = page.locator('input[onchange*="price"]').nth(1);
        await priceInput.fill('300000');
        await priceInput.press('Tab');
        
        rentInput = page.locator('input[onchange*="rent"]').nth(1);
        await rentInput.fill('3000');
        await rentInput.press('Tab');
        await page.waitForTimeout(500);
        
        // Check totals
        await expect(page.locator('#totalProperties')).toContainText('2');
        await expect(page.locator('#portfolioValue')).toContainText('$500,000');
        await expect(page.locator('#monthlyIncome')).toContainText('$5,000');
        
        // Check property list shows both
        const propertyList = page.locator('#propertyList');
        await expect(propertyList).toContainText('Property 1');
        await expect(propertyList).toContainText('Property 2');
    });

    test('should show equations panel', async ({ page }) => {
        // Toggle equations panel
        await page.click('button:has-text("Formulas")');
        await expect(page.locator('#equationContent')).toBeVisible();
        
        // Check key formulas are shown
        await expect(page.locator('.equation-name:has-text("Monthly Payment")')).toBeVisible();
        await expect(page.locator('.equation-formula')).toContainText('PMT = P × [r(1+r)^n]');
        
        // Toggle closed
        await page.click('.equation-header');
        await expect(page.locator('#equationContent')).not.toBeVisible();
    });

    test('navigation links work correctly', async ({ page }) => {
        // Check header shows V2 with Excel-like subtitle
        await expect(page.locator('h1')).toContainText('Portfolio Simulator V2');
        await expect(page.locator('h1')).toContainText('(Excel-like)');
        
        // Navigate to V1
        await page.click('a:has-text("Simulator V1 (Original)")');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/portfolio-simulator\.html/);
        
        // V1 should have link to V2 in navbar
        await expect(page.locator('.nav-menu a:has-text("Simulator V2")')).toBeVisible();
        
        // Navigate back to V2 via navbar
        await page.click('.nav-menu a:has-text("Simulator V2")');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/portfolio-simulator-v2\.html/);
    });
});