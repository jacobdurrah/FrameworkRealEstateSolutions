// E2E Tests for Excel Export Functionality
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Excel Export', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/portfolio-simulator.html');
        
        // Start a new simulation
        await page.fill('#simulationName', 'Test Excel Export');
        await page.fill('#targetIncome', '5000');
        await page.fill('#initialCapital', '100000');
        await page.click('button:has-text("Start Simulation")');
        
        // Wait for simulation to load
        await page.waitForTimeout(1000);
    });

    test('should show export options modal', async ({ page }) => {
        // Click export button
        await page.click('button:has-text("Export")');
        
        // Check modal appears
        await expect(page.locator('.modal')).toBeVisible();
        await expect(page.locator('text=Choose your export format')).toBeVisible();
        
        // Check all export options are present
        await expect(page.locator('button:has-text("Excel with Formulas")')).toBeVisible();
        await expect(page.locator('button:has-text("Full Report")')).toBeVisible();
        await expect(page.locator('button:has-text("Data Only")')).toBeVisible();
    });

    test('should export Excel file with formulas', async ({ page }) => {
        // Add a property to the timeline
        await page.click('button:has-text("Add to Timeline")');
        await page.click('button:has-text("Property Acquisition")');
        
        // Fill in property details
        await page.fill('#propertyAddress', '123 Test St');
        await page.fill('#purchasePrice', '200000');
        await page.fill('#monthlyRent', '2000');
        await page.fill('#downPaymentPercent', '25');
        
        // Add property
        await page.click('button:has-text("Add Property to Timeline")');
        await page.waitForTimeout(1000);
        
        // Setup download promise before clicking
        const downloadPromise = page.waitForEvent('download');
        
        // Export to Excel
        await page.click('button:has-text("Export")');
        await page.click('button:has-text("Excel with Formulas")');
        
        // Wait for download
        const download = await downloadPromise;
        
        // Verify download
        expect(download.suggestedFilename()).toContain('portfolio_');
        expect(download.suggestedFilename()).toContain('.csv');
        
        // Check success notification
        await expect(page.locator('.notification.success')).toBeVisible();
        await expect(page.locator('text=Excel file exported successfully')).toBeVisible();
    });

    test('should include formulas in exported data', async ({ page }) => {
        // Add multiple properties
        for (let i = 0; i < 2; i++) {
            await page.click('button:has-text("Add to Timeline")');
            await page.click('button:has-text("Property Acquisition")');
            
            await page.fill('#propertyAddress', `${100 + i} Test St`);
            await page.fill('#purchasePrice', `${200000 + i * 50000}`);
            await page.fill('#monthlyRent', `${2000 + i * 500}`);
            await page.fill('#downPaymentPercent', '20');
            await page.fill('#timelineMonth', `${i * 6}`);
            
            await page.click('button:has-text("Add Property to Timeline")');
            await page.waitForTimeout(500);
        }
        
        // Export and download
        const downloadPromise = page.waitForEvent('download');
        await page.click('button:has-text("Export")');
        await page.click('button:has-text("Excel with Formulas")');
        
        const download = await downloadPromise;
        const filePath = await download.path();
        
        // Read file content
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Verify formulas are present
        expect(content).toContain('=E'); // Purchase price reference
        expect(content).toContain('PMT('); // Payment calculation
        expect(content).toContain('SUM('); // Sum formulas
        expect(content).toContain('/100'); // Percentage calculations
        
        // Verify headers
        expect(content).toContain('Month,Date,Action Type');
        expect(content).toContain('Purchase Price');
        expect(content).toContain('Monthly Payment');
        expect(content).toContain('ROI %');
    });

    test('should handle empty simulation export', async ({ page }) => {
        // Setup download promise
        const downloadPromise = page.waitForEvent('download');
        
        // Try to export without any data
        await page.click('button:has-text("Export")');
        await page.click('button:has-text("Excel with Formulas")');
        
        // Wait for download
        const download = await downloadPromise;
        
        expect(download).toBeTruthy();
        expect(download.suggestedFilename()).toContain('.csv');
        
        // Read content
        const filePath = await download.path();
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Should have headers and initial row
        expect(content).toContain('Month,Date,Action Type');
        expect(content).toContain('Initial');
    });

    test('should export with time tracking columns', async ({ page }) => {
        // Add a property
        await page.click('button:has-text("Add to Timeline")');
        await page.click('button:has-text("Property Acquisition")');
        
        await page.fill('#propertyAddress', '456 Test Ave');
        await page.fill('#purchasePrice', '250000');
        await page.fill('#monthlyRent', '2500');
        await page.fill('#timelineMonth', '3');
        
        await page.click('button:has-text("Add Property to Timeline")');
        await page.waitForTimeout(500);
        
        // Export
        const downloadPromise = page.waitForEvent('download');
        await page.click('button:has-text("Export")');
        await page.click('button:has-text("Excel with Formulas")');
        
        const download = await downloadPromise;
        const filePath = await download.path();
        
        // Read and verify content
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for date formulas
        expect(content).toContain('DATE(');
        expect(content).toContain('Month,Date');
        
        // Verify cumulative tracking
        expect(content).toContain('Cumulative Cash Flow');
        expect(content).toContain('=N'); // Net cash flow references
        expect(content).toContain('+O'); // Cumulative addition
    });

    test('should export different action types correctly', async ({ page }) => {
        // Add property acquisition
        await page.click('button:has-text("Add to Timeline")');
        await page.click('button:has-text("Property Acquisition")');
        await page.fill('#propertyAddress', '100 Main St');
        await page.fill('#purchasePrice', '300000');
        await page.fill('#monthlyRent', '3000');
        await page.click('button:has-text("Add Property to Timeline")');
        await page.waitForTimeout(500);
        
        // Add refinance
        await page.click('button:has-text("Add to Timeline")');
        await page.click('button:has-text("Refinance")');
        // Handle refinance form if it appears
        await page.waitForTimeout(500);
        
        // Export
        const downloadPromise = page.waitForEvent('download');
        await page.click('button:has-text("Export")');
        await page.click('button:has-text("Excel with Formulas")');
        
        const download = await downloadPromise;
        const filePath = await download.path();
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Verify different action types are included
        expect(content).toContain('buy');
        expect(content).toContain('Property Acquisition');
    });

    test('should calculate ROI formula correctly', async ({ page }) => {
        // Add properties at different times
        await page.click('button:has-text("Add to Timeline")');
        await page.click('button:has-text("Property Acquisition")');
        await page.fill('#propertyAddress', '200 Oak Ave');
        await page.fill('#purchasePrice', '150000');
        await page.fill('#monthlyRent', '1500');
        await page.fill('#timelineMonth', '0');
        await page.click('button:has-text("Add Property to Timeline")');
        await page.waitForTimeout(500);
        
        // Export
        const downloadPromise = page.waitForEvent('download');
        await page.click('button:has-text("Export")');
        await page.click('button:has-text("Excel with Formulas")');
        
        const download = await downloadPromise;
        const filePath = await download.path();
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check ROI formula references initial capital
        expect(content).toContain('=IF(E2>0,(R');
        expect(content).toContain('-E2)/E2*100,0)');
    });

    test('should include loan calculations in formulas', async ({ page }) => {
        // Add property with loan details
        await page.click('button:has-text("Add to Timeline")');
        await page.click('button:has-text("Property Acquisition")');
        await page.fill('#propertyAddress', '300 Pine St');
        await page.fill('#purchasePrice', '400000');
        await page.fill('#monthlyRent', '4000');
        await page.fill('#downPaymentPercent', '20');
        await page.click('button:has-text("Add Property to Timeline")');
        await page.waitForTimeout(500);
        
        // Export
        const downloadPromise = page.waitForEvent('download');
        await page.click('button:has-text("Export")');
        await page.click('button:has-text("Excel with Formulas")');
        
        const download = await downloadPromise;
        const filePath = await download.path();
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for loan-related formulas
        expect(content).toContain('PMT('); // Payment calculation
        expect(content).toContain('/100/12'); // Monthly interest rate
        expect(content).toContain('*12'); // Loan term in months
    });

    test('should handle special characters in property addresses', async ({ page }) => {
        // Add property with special characters
        await page.click('button:has-text("Add to Timeline")');
        await page.click('button:has-text("Property Acquisition")');
        await page.fill('#propertyAddress', '123 "Oak & Elm", Suite #5');
        await page.fill('#purchasePrice', '250000');
        await page.fill('#monthlyRent', '2500');
        await page.click('button:has-text("Add Property to Timeline")');
        await page.waitForTimeout(500);
        
        // Export
        const downloadPromise = page.waitForEvent('download');
        await page.click('button:has-text("Export")');
        await page.click('button:has-text("Excel with Formulas")');
        
        const download = await downloadPromise;
        const filePath = await download.path();
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Verify special characters are properly escaped
        expect(content).toContain('"123 ""Oak & Elm"", Suite #5"');
    });

    test('should export with proper date formatting', async ({ page }) => {
        // Add property
        await page.click('button:has-text("Add to Timeline")');
        await page.click('button:has-text("Property Acquisition")');
        await page.fill('#propertyAddress', '500 Date Test St');
        await page.fill('#purchasePrice', '180000');
        await page.fill('#monthlyRent', '1800');
        await page.fill('#timelineMonth', '12');
        await page.click('button:has-text("Add Property to Timeline")');
        await page.waitForTimeout(500);
        
        // Export
        const downloadPromise = page.waitForEvent('download');
        await page.click('button:has-text("Export")');
        await page.click('button:has-text("Excel with Formulas")');
        
        const download = await downloadPromise;
        const filePath = await download.path();
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check DATE formula
        const currentYear = new Date().getFullYear();
        expect(content).toContain(`DATE(${currentYear}`);
    });

    test('should include summary totals row', async ({ page }) => {
        // Add multiple properties
        for (let i = 0; i < 3; i++) {
            await page.click('button:has-text("Add to Timeline")');
            await page.click('button:has-text("Property Acquisition")');
            await page.fill('#propertyAddress', `${600 + i} Summary St`);
            await page.fill('#purchasePrice', `${100000 + i * 25000}`);
            await page.fill('#monthlyRent', `${1000 + i * 250}`);
            await page.click('button:has-text("Add Property to Timeline")');
            await page.waitForTimeout(300);
        }
        
        // Export
        const downloadPromise = page.waitForEvent('download');
        await page.click('button:has-text("Export")');
        await page.click('button:has-text("Excel with Formulas")');
        
        const download = await downloadPromise;
        const filePath = await download.path();
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for TOTALS row with SUM formulas
        expect(content).toContain('TOTALS');
        expect(content).toContain('=SUM(E2:E');
        expect(content).toContain('=SUM(G2:G');
        expect(content).toContain('=SUM(L2:L');
    });

    test('should handle export with no network connection gracefully', async ({ page, context }) => {
        // Simulate offline mode
        await context.setOffline(true);
        
        // Try to export
        await page.click('button:has-text("Export")');
        await page.click('button:has-text("Excel with Formulas")');
        
        // Should still work as export is client-side
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 });
        const download = await downloadPromise;
        
        expect(download).toBeTruthy();
        
        // Restore online mode
        await context.setOffline(false);
    });

    test('should preserve simulation name in filename', async ({ page }) => {
        // Add a property
        await page.click('button:has-text("Add to Timeline")');
        await page.click('button:has-text("Property Acquisition")');
        await page.fill('#propertyAddress', '700 Filename Test');
        await page.fill('#purchasePrice', '200000');
        await page.fill('#monthlyRent', '2000');
        await page.click('button:has-text("Add Property to Timeline")');
        await page.waitForTimeout(500);
        
        // Export
        const downloadPromise = page.waitForEvent('download');
        await page.click('button:has-text("Export")');
        await page.click('button:has-text("Excel with Formulas")');
        
        const download = await downloadPromise;
        const filename = download.suggestedFilename();
        
        // Check filename format
        expect(filename).toContain('portfolio_Test Excel Export_');
        expect(filename).toMatch(/portfolio_.*_\d{4}-\d{2}-\d{2}\.csv/);
    });

    test('should export operating expense formulas', async ({ page }) => {
        // Add property
        await page.click('button:has-text("Add to Timeline")');
        await page.click('button:has-text("Property Acquisition")');
        await page.fill('#propertyAddress', '800 Expense Test');
        await page.fill('#purchasePrice', '220000');
        await page.fill('#monthlyRent', '2200');
        await page.click('button:has-text("Add Property to Timeline")');
        await page.waitForTimeout(500);
        
        // Export
        const downloadPromise = page.waitForEvent('download');
        await page.click('button:has-text("Export")');
        await page.click('button:has-text("Excel with Formulas")');
        
        const download = await downloadPromise;
        const filePath = await download.path();
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check operating expense formula (35% default)
        expect(content).toContain('=L');
        expect(content).toContain('*0.35');
    });

    test('should handle concurrent exports', async ({ page }) => {
        // Add property
        await page.click('button:has-text("Add to Timeline")');
        await page.click('button:has-text("Property Acquisition")');
        await page.fill('#propertyAddress', '900 Concurrent Test');
        await page.fill('#purchasePrice', '175000');
        await page.fill('#monthlyRent', '1750');
        await page.click('button:has-text("Add Property to Timeline")');
        await page.waitForTimeout(500);
        
        // Setup multiple download promises
        const downloads = [];
        
        // Click export multiple times quickly
        for (let i = 0; i < 3; i++) {
            const downloadPromise = page.waitForEvent('download');
            downloads.push(downloadPromise);
            
            await page.click('button:has-text("Export")');
            await page.click('button:has-text("Excel with Formulas")');
            await page.waitForTimeout(100);
        }
        
        // All downloads should complete
        const results = await Promise.all(downloads);
        expect(results).toHaveLength(3);
        results.forEach(download => {
            expect(download.suggestedFilename()).toContain('.csv');
        });
    });

    test('should validate formula syntax in export', async ({ page }) => {
        // Add complex scenario
        await page.click('button:has-text("Add to Timeline")');
        await page.click('button:has-text("Property Acquisition")');
        await page.fill('#propertyAddress', '1000 Formula Test');
        await page.fill('#purchasePrice', '500000');
        await page.fill('#monthlyRent', '5000');
        await page.fill('#downPaymentPercent', '30');
        await page.click('button:has-text("Add Property to Timeline")');
        await page.waitForTimeout(500);
        
        // Export
        const downloadPromise = page.waitForEvent('download');
        await page.click('button:has-text("Export")');
        await page.click('button:has-text("Excel with Formulas")');
        
        const download = await downloadPromise;
        const filePath = await download.path();
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Validate formula patterns
        const formulaRegex = /=[\w\(\)\+\-\*\/\$\:,]+/g;
        const formulas = content.match(formulaRegex) || [];
        
        formulas.forEach(formula => {
            // Check balanced parentheses
            const openParens = (formula.match(/\(/g) || []).length;
            const closeParens = (formula.match(/\)/g) || []).length;
            expect(openParens).toBe(closeParens);
            
            // Check no double operators
            expect(formula).not.toMatch(/[\+\-\*\/]{2,}/);
        });
    });
});