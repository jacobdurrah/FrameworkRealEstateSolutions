/**
 * E2E Tests for Portfolio Simulator V2
 * Including test to build a $10k/month income portfolio
 */
const { test, expect } = require('@playwright/test');

test.describe('Portfolio Simulator V2', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/portfolio-simulator-v2.html');
        
        // Wait for page to load
        await page.waitForSelector('#timelineTable');
    });

    test('should load with initial interface', async ({ page }) => {
        // Check main elements are present
        await expect(page.locator('h1')).toContainText('Portfolio Simulator V2');
        await expect(page.locator('#timelineTable')).toBeVisible();
        await expect(page.locator('#totalProperties')).toBeVisible();
        await expect(page.locator('#portfolioValue')).toBeVisible();
        
        // Check control buttons
        await expect(page.locator('button:has-text("New Simulation")')).toBeVisible();
        await expect(page.locator('button:has-text("Save")')).toBeVisible();
        await expect(page.locator('button:has-text("Load")')).toBeVisible();
        await expect(page.locator('button:has-text("Export")')).toBeVisible();
    });

    test('should add and calculate property correctly', async ({ page }) => {
        // Add a property
        await page.fill('input[placeholder="Property address"]', '123 Test St');
        await page.fill('input[onchange*="price"]', '250000');
        await page.fill('input[onchange*="downPercent"]', '25');
        await page.fill('input[onchange*="rate"]', '4.5');
        await page.fill('input[onchange*="term"]', '30');
        await page.fill('input[onchange*="rent"]', '2500');
        
        // Wait for calculations
        await page.waitForTimeout(500);
        
        // Check calculations
        await expect(page.locator('#totalProperties')).toContainText('1');
        await expect(page.locator('#portfolioValue')).toContainText('$250,000');
        await expect(page.locator('#monthlyIncome')).toContainText('$2,500');
        
        // Check that down payment was calculated
        const downAmountCell = await page.locator('td.currency').nth(0).textContent();
        expect(downAmountCell).toBe('$62,500'); // 25% of 250k
        
        // Check that loan amount was calculated
        const loanAmountCell = await page.locator('td.currency').nth(1).textContent();
        expect(loanAmountCell).toBe('$187,500'); // 75% of 250k
    });

    test('should handle multiple timeline events', async ({ page }) => {
        // Add first property
        await page.fill('input[placeholder="Property address"]', '100 Main St');
        await page.fill('input[onchange*="price"]', '200000');
        await page.fill('input[onchange*="rent"]', '2000');
        
        // Add another row
        await page.click('button:has-text("Add Event")');
        
        // Add second property
        await page.locator('input[placeholder="Property address"]').nth(1).fill('200 Oak Ave');
        await page.locator('input[onchange*="month"]').nth(1).fill('6');
        await page.locator('input[onchange*="price"]').nth(1).fill('300000');
        await page.locator('input[onchange*="rent"]').nth(1).fill('3000');
        
        await page.waitForTimeout(500);
        
        // Check totals
        await expect(page.locator('#totalProperties')).toContainText('2');
        await expect(page.locator('#portfolioValue')).toContainText('$500,000');
        await expect(page.locator('#monthlyIncome')).toContainText('$5,000');
    });

    test('should save and load simulation', async ({ page }) => {
        // Add a property
        await page.fill('input[placeholder="Property address"]', 'Save Test Property');
        await page.fill('input[onchange*="price"]', '300000');
        await page.fill('input[onchange*="rent"]', '3000');
        
        // Save simulation
        page.on('dialog', async dialog => {
            if (dialog.type() === 'prompt') {
                await dialog.accept('Test Save Simulation');
            }
        });
        await page.click('button:has-text("Save")');
        
        // Wait for save
        await page.waitForTimeout(1000);
        
        // Check save status
        await expect(page.locator('#autoSaveStatus')).toContainText('Saved');
        
        // Clear and reload
        page.on('dialog', async dialog => {
            if (dialog.type() === 'confirm') {
                await dialog.accept();
            }
        });
        await page.click('button:has-text("New Simulation")');
        
        await page.waitForTimeout(500);
        
        // Load saved simulation
        await page.click('button:has-text("Load")');
        
        // Verify loaded data
        await expect(page.locator('input[placeholder="Property address"]').first()).toHaveValue('Save Test Property');
        await expect(page.locator('#totalProperties')).toContainText('1');
    });

    test('should toggle equation panel', async ({ page }) => {
        // Initially hidden
        await expect(page.locator('#equationContent')).not.toBeVisible();
        
        // Click to show
        await page.click('button:has-text("Formulas")');
        await expect(page.locator('#equationContent')).toBeVisible();
        
        // Check formulas are displayed
        await expect(page.locator('.equation-formula').first()).toBeVisible();
        await expect(page.locator('text=PMT = P × [r(1+r)^n]')).toBeVisible();
        
        // Click to hide
        await page.click('.equation-header');
        await expect(page.locator('#equationContent')).not.toBeVisible();
    });

    test('should build $10k/month income portfolio', async ({ page }) => {
        // This test builds a realistic portfolio generating $10k/month
        // Using actual market data patterns
        
        const properties = [
            // Property 1: Multi-family in good area
            {
                address: '123 Duplex Lane',
                price: 320000,
                downPercent: 25,
                rent: 3200, // $1600 per unit
                month: 0
            },
            // Property 2: Single family rental
            {
                address: '456 Rental Ave',
                price: 250000,
                downPercent: 20,
                rent: 2400,
                month: 6
            },
            // Property 3: Triplex
            {
                address: '789 Triplex St',
                price: 450000,
                downPercent: 25,
                rent: 4500, // $1500 per unit
                month: 12
            },
            // Property 4: Small apartment (4 units)
            {
                address: '321 Apartment Blvd',
                price: 580000,
                downPercent: 25,
                rent: 5200, // $1300 per unit
                month: 18
            },
            // Property 5: Another duplex
            {
                address: '654 Second Duplex',
                price: 340000,
                downPercent: 20,
                rent: 3400,
                month: 24
            },
            // Property 6: High-end single family
            {
                address: '987 Premium Home',
                price: 380000,
                downPercent: 20,
                rent: 3800,
                month: 30
            },
            // Property 7: Final duplex to reach goal
            {
                address: '111 Goal Duplex',
                price: 300000,
                downPercent: 20,
                rent: 3000,
                month: 36
            }
        ];

        // Clear initial row
        await page.locator('.btn-danger').first().click();
        
        // Add each property
        for (let i = 0; i < properties.length; i++) {
            const prop = properties[i];
            
            // Add new row (except for first property)
            if (i > 0) {
                await page.click('button:has-text("Add Event")');
            }
            
            // Fill in property details
            const rowIndex = i;
            await page.locator('input[onchange*="month"]').nth(rowIndex).fill(prop.month.toString());
            await page.locator('input[placeholder="Property address"]').nth(rowIndex).fill(prop.address);
            await page.locator('input[onchange*="price"]').nth(rowIndex).fill(prop.price.toString());
            await page.locator('input[onchange*="downPercent"]').nth(rowIndex).fill(prop.downPercent.toString());
            await page.locator('input[onchange*="rent"]').nth(rowIndex).fill(prop.rent.toString());
            
            // Standard loan terms
            await page.locator('input[onchange*="rate"]').nth(rowIndex).fill('4.75');
            await page.locator('input[onchange*="term"]').nth(rowIndex).fill('30');
            
            // Wait for calculations
            await page.waitForTimeout(300);
        }
        
        // Wait for all calculations to complete
        await page.waitForTimeout(1000);
        
        // Verify portfolio metrics
        await expect(page.locator('#totalProperties')).toContainText('7');
        
        // Total rent should be approximately $10k/month
        const monthlyIncome = await page.locator('#monthlyIncome').textContent();
        const incomeValue = parseInt(monthlyIncome.replace(/[$,]/g, ''));
        expect(incomeValue).toBeGreaterThanOrEqual(10000); // Should be around $25,500
        
        // Check portfolio value
        const portfolioValue = await page.locator('#portfolioValue').textContent();
        const valueNum = parseInt(portfolioValue.replace(/[$,]/g, ''));
        expect(valueNum).toBe(2620000); // Sum of all property prices
        
        // Check cash flow is positive
        const netCashFlow = await page.locator('#netCashFlow').textContent();
        const cashFlowValue = parseInt(netCashFlow.replace(/[$,]/g, ''));
        expect(cashFlowValue).toBeGreaterThan(5000); // Should have healthy positive cash flow
        
        // Check property list shows all properties
        const propertyItems = await page.locator('.property-item').count();
        expect(propertyItems).toBe(7);
        
        // Check loan list
        const loanItems = await page.locator('#loanList .property-item').count();
        expect(loanItems).toBe(7); // All properties have loans
        
        // Calculate total cash invested
        let totalCashInvested = 0;
        for (const prop of properties) {
            totalCashInvested += prop.price * (prop.downPercent / 100);
        }
        
        // Verify cash-on-cash return is reasonable (should be 10-20% for good investments)
        const cashOnCash = await page.locator('#cashOnCash').textContent();
        const cocValue = parseFloat(cashOnCash.replace('%', ''));
        expect(cocValue).toBeGreaterThan(10);
        expect(cocValue).toBeLessThan(25);
        
        // Take screenshot of final portfolio
        await page.screenshot({ 
            path: 'test-results/10k-portfolio.png',
            fullPage: true 
        });
        
        // Export the portfolio data
        await page.click('button:has-text("Export")');
        
        // Verify download started
        const download = await page.waitForEvent('download');
        expect(download.suggestedFilename()).toContain('portfolio-simulation');
        expect(download.suggestedFilename()).toContain('.json');
    });

    test('should handle property sales correctly', async ({ page }) => {
        // Add two properties
        await page.fill('input[placeholder="Property address"]', '100 First St');
        await page.fill('input[onchange*="price"]', '200000');
        await page.fill('input[onchange*="rent"]', '2000');
        
        await page.click('button:has-text("Add Event")');
        
        await page.locator('input[placeholder="Property address"]').nth(1).fill('200 Second Ave');
        await page.locator('input[onchange*="month"]').nth(1).fill('6');
        await page.locator('input[onchange*="price"]').nth(1).fill('300000');
        await page.locator('input[onchange*="rent"]').nth(1).fill('3000');
        
        // Add sell event
        await page.click('button:has-text("Add Event")');
        await page.locator('select.table-select').nth(2).selectOption('sell');
        await page.locator('input[onchange*="month"]').nth(2).fill('12');
        await page.locator('input[placeholder="Property address"]').nth(2).fill('100 First St');
        
        await page.waitForTimeout(500);
        
        // Should now have 1 property (sold the first one)
        await expect(page.locator('#totalProperties')).toContainText('1');
        await expect(page.locator('#monthlyIncome')).toContainText('$3,000');
    });

    test('should validate input fields', async ({ page }) => {
        // Try negative values
        await page.fill('input[onchange*="price"]', '-100000');
        await page.fill('input[onchange*="downPercent"]', '150'); // Over 100%
        
        await page.waitForTimeout(500);
        
        // Should handle gracefully (set to 0 or max valid value)
        const loanAmount = await page.locator('td.currency').nth(1).textContent();
        expect(loanAmount).toBe('$0'); // No negative loans
    });

    test('should update property breakdown correctly', async ({ page }) => {
        // Add property with specific metrics
        await page.fill('input[placeholder="Property address"]', 'Test Property for Breakdown');
        await page.fill('input[onchange*="price"]', '400000');
        await page.fill('input[onchange*="downPercent"]', '30'); // 30% down = 70% LTV
        await page.fill('input[onchange*="rent"]', '4000');
        
        await page.waitForTimeout(500);
        
        // Check property breakdown shows correct equity
        const propertyBreakdown = await page.locator('.property-item').first().textContent();
        expect(propertyBreakdown).toContain('Test Property for Breakdown');
        expect(propertyBreakdown).toContain('Value: $400,000');
        expect(propertyBreakdown).toContain('Rent: $4,000/mo');
        expect(propertyBreakdown).toContain('Equity: $120,000'); // 30% of 400k
        expect(propertyBreakdown).toContain('30.0%'); // Equity percentage
    });
});

test.describe('Portfolio Simulator V2 - Calculations', () => {
    test('should calculate loan payments accurately', async ({ page }) => {
        await page.goto('/portfolio-simulator-v2.html');
        
        // Test standard 30-year mortgage
        await page.fill('input[onchange*="price"]', '200000');
        await page.fill('input[onchange*="downPercent"]', '20');
        await page.fill('input[onchange*="rate"]', '4.5');
        await page.fill('input[onchange*="term"]', '30');
        
        await page.waitForTimeout(500);
        
        // Payment should be around $811 for $160k loan at 4.5% for 30 years
        const paymentCell = await page.locator('td.currency').nth(3).textContent();
        const paymentValue = parseInt(paymentCell.replace(/[$,]/g, ''));
        expect(paymentValue).toBeGreaterThan(800);
        expect(paymentValue).toBeLessThan(820);
    });

    test('should show formulas with examples', async ({ page }) => {
        await page.goto('/portfolio-simulator-v2.html');
        
        // Open formula panel
        await page.click('button:has-text("Formulas")');
        
        // Check all formula sections are present
        await expect(page.locator('.equation-name:has-text("Monthly Payment (PMT)")')).toBeVisible();
        await expect(page.locator('.equation-name:has-text("Cap Rate")')).toBeVisible();
        await expect(page.locator('.equation-name:has-text("Cash Flow")')).toBeVisible();
        await expect(page.locator('.equation-name:has-text("Cash-on-Cash Return")')).toBeVisible();
        await expect(page.locator('.equation-name:has-text("Equity")')).toBeVisible();
        await expect(page.locator('.equation-name:has-text("Loan-to-Value")')).toBeVisible();
        
        // Check examples are shown
        await expect(page.locator('text=$200,000 @ 4.5% for 30 years')).toBeVisible();
        await expect(page.locator('text=Good: >8%, Excellent: >12%')).toBeVisible();
    });
});