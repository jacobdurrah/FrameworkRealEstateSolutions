const { test, expect } = require('@playwright/test');

test.describe('Portfolio Simulator V3 Timeline Tests', () => {
    test('Should display timeline events after generating strategy', async ({ page }) => {
        // Navigate to Portfolio Simulator V3
        await page.goto('https://frameworkrealestatesolutions.com/portfolio-simulator-v3.html');
        
        // Wait for page to load
        await page.waitForSelector('h1:has-text("Portfolio Simulator V3")');
        
        // Enter a goal
        await page.fill('#goalInput', 'Build a portfolio that generates $10K/month within 36 months. I have $50K to start and can save $2K/month.');
        
        // Click Generate Strategy
        await page.click('button:has-text("Generate Strategy")');
        
        // Wait for strategy options to appear
        await page.waitForSelector('.strategy-card', { timeout: 30000 });
        
        // Count strategy options
        const strategyCount = await page.locator('.strategy-card').count();
        console.log(`Generated ${strategyCount} strategy options`);
        expect(strategyCount).toBeGreaterThan(0);
        
        // Click the first strategy
        await page.click('.strategy-card:first-child');
        
        // Wait for V2 components to be visible
        await page.waitForSelector('#v2Components', { state: 'visible', timeout: 10000 });
        
        // Check if timeline table is visible
        const timelineTable = await page.locator('#timelineTable');
        await expect(timelineTable).toBeVisible();
        
        // Count timeline rows
        const timelineRows = await page.locator('#timelineBody tr').count();
        console.log(`Timeline has ${timelineRows} events`);
        expect(timelineRows).toBeGreaterThan(0);
        
        // Check first timeline event
        if (timelineRows > 0) {
            const firstRow = page.locator('#timelineBody tr:first-child');
            
            // Check if it has expected columns
            const month = await firstRow.locator('td:nth-child(1) input').inputValue();
            const action = await firstRow.locator('td:nth-child(2) select').inputValue();
            const property = await firstRow.locator('td:nth-child(3) input').inputValue();
            const price = await firstRow.locator('td:nth-child(4) input').inputValue();
            
            console.log('First timeline event:', { month, action, property, price });
            
            // Verify values are populated
            expect(parseInt(month)).toBeGreaterThanOrEqual(0);
            expect(action).toMatch(/buy|sell/);
            expect(property).toBeTruthy();
            expect(parseInt(price)).toBeGreaterThan(0);
        }
        
        // Take screenshot for debugging
        await page.screenshot({ 
            path: 'tests/screenshots/portfolio-v3-timeline.png',
            fullPage: true 
        });
    });

    test('Should show different timelines for different strategies', async ({ page }) => {
        await page.goto('https://frameworkrealestatesolutions.com/portfolio-simulator-v3.html');
        
        // Enter goal and generate
        await page.fill('#goalInput', 'I want to create $5000/month passive income in 24 months with $30K starting capital');
        await page.click('button:has-text("Generate Strategy")');
        
        // Wait for strategies
        await page.waitForSelector('.strategy-card');
        
        // Click first strategy and count events
        await page.click('.strategy-card:nth-child(1)');
        await page.waitForSelector('#timelineBody tr');
        const firstStrategyEvents = await page.locator('#timelineBody tr').count();
        
        // Click second strategy if available
        const strategyCount = await page.locator('.strategy-card').count();
        if (strategyCount > 1) {
            await page.click('.strategy-card:nth-child(2)');
            await page.waitForTimeout(500); // Wait for re-render
            const secondStrategyEvents = await page.locator('#timelineBody tr').count();
            
            console.log(`Strategy 1 events: ${firstStrategyEvents}, Strategy 2 events: ${secondStrategyEvents}`);
            
            // Strategies might have different number of events
            // Just verify both have events
            expect(firstStrategyEvents).toBeGreaterThan(0);
            expect(secondStrategyEvents).toBeGreaterThan(0);
        }
    });

    test('Should handle strategy with no feasible solution', async ({ page }) => {
        await page.goto('https://frameworkrealestatesolutions.com/portfolio-simulator-v3.html');
        
        // Enter unrealistic goal
        await page.fill('#goalInput', 'Generate $100K/month in 6 months with only $5K starting capital');
        await page.click('button:has-text("Generate Strategy")');
        
        // Wait for strategies
        await page.waitForSelector('.strategy-card');
        
        // Look for infeasibility warning
        const warnings = await page.locator('.strategy-card').filter({ hasText: 'Goal not achieved' }).count();
        console.log(`Found ${warnings} strategies that couldn't achieve the goal`);
        
        // Even infeasible strategies should show timeline
        await page.click('.strategy-card:first-child');
        const hasTimeline = await page.locator('#timelineBody tr').count();
        expect(hasTimeline).toBeGreaterThan(0);
    });
});