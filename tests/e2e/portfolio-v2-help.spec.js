/**
 * E2E tests for Portfolio V2 Help/Instructions feature
 */
const { test, expect } = require('@playwright/test');

test.describe('Portfolio V2 Help Instructions', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/portfolio-simulator-v2.html');
        await page.waitForLoadState('networkidle');
    });

    test('should have help button in toolbar', async ({ page }) => {
        // Check help button exists
        const helpButton = page.locator('button:has-text("Help")');
        await expect(helpButton).toBeVisible();
        
        // Should have question icon
        const icon = helpButton.locator('i.fa-question-circle');
        await expect(icon).toBeVisible();
    });

    test('should toggle instructions panel', async ({ page }) => {
        // Initially hidden
        const instructionsContent = page.locator('#instructionsContent');
        await expect(instructionsContent).not.toBeVisible();
        
        // Click help button
        await page.click('button:has-text("Help")');
        
        // Should show instructions
        await expect(instructionsContent).toBeVisible();
        
        // Should show various sections
        await expect(page.locator('h4:has-text("Getting Started")')).toBeVisible();
        await expect(page.locator('h4:has-text("Fix-and-Flip Strategy")')).toBeVisible();
        await expect(page.locator('h4:has-text("BRRR Strategy")')).toBeVisible();
        await expect(page.locator('h4:has-text("Traditional Buy & Hold")')).toBeVisible();
        
        // Click again to hide
        await page.click('button:has-text("Help")');
        await expect(instructionsContent).not.toBeVisible();
    });

    test('should show Fix-and-Flip instructions', async ({ page }) => {
        // Open help
        await page.click('button:has-text("Help")');
        
        // Find Fix-and-Flip section
        const flipSection = page.locator('.instruction-section:has(h4:has-text("Fix-and-Flip"))');
        await expect(flipSection).toBeVisible();
        
        // Should have key instructions
        await expect(flipSection).toContainText('Total Project Cost');
        await expect(flipSection).toContainText('10-20% of total project cost');
        await expect(flipSection).toContainText('After Repair Value (ARV)');
        await expect(flipSection).toContainText('Cash from Sales');
    });

    test('should show BRRR strategy instructions', async ({ page }) => {
        // Open help
        await page.click('button:has-text("Help")');
        
        // Find BRRR section
        const brrrSection = page.locator('.instruction-section:has(h4:has-text("BRRR Strategy"))');
        await expect(brrrSection).toBeVisible();
        
        // Should explain the acronym
        await expect(brrrSection).toContainText('Buy, Rehab, Rent, Refinance, Repeat');
        
        // Should have refinance simulation instructions
        await expect(brrrSection).toContainText('Add "Sell" event');
        await expect(brrrSection).toContainText('Immediately add new "Buy" event');
        await expect(brrrSection).toContainText('20-25% down payment');
    });

    test('should show advanced features help', async ({ page }) => {
        // Open help
        await page.click('button:has-text("Help")');
        
        // Check advanced features section
        await expect(page.locator('h4:has-text("Advanced Features")')).toBeVisible();
        await expect(page.locator('h5:has-text("Time-Based Projections")')).toBeVisible();
        await expect(page.locator('h5:has-text("Cash Tracking")')).toBeVisible();
        await expect(page.locator('h5:has-text("Data Management")')).toBeVisible();
    });

    test('help panel can be toggled via header click', async ({ page }) => {
        // Open help first
        await page.click('button:has-text("Help")');
        await expect(page.locator('#instructionsContent')).toBeVisible();
        
        // Click the header to toggle
        await page.click('.equation-header:has-text("How to Use Portfolio Simulator V2")');
        await expect(page.locator('#instructionsContent')).not.toBeVisible();
        
        // Click header again to show
        await page.click('.equation-header:has-text("How to Use Portfolio Simulator V2")');
        await expect(page.locator('#instructionsContent')).toBeVisible();
    });
});