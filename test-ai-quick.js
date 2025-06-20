// Quick test to verify AI is working
const { chromium } = require('@playwright/test');

(async () => {
    console.log('Testing AI features on local file...\n');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // Load local test page
        await page.goto(`file://${__dirname}/tests/manual-test-pages/test-ai-integration.html`);
        
        // Enable AI for this session
        await page.evaluate(() => {
            localStorage.setItem('forceAIEnabled', 'true');
            window.location.reload();
        });
        
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Check configuration
        console.log('1. Checking AI configuration...');
        await page.click('button:has-text("Refresh Status")');
        await page.waitForTimeout(1000);
        
        const aiStatus = await page.textContent('#configStatus');
        console.log('   AI Status:', aiStatus);
        
        // Test goal parsing
        console.log('\n2. Testing AI goal parsing...');
        const testGoal = "I want to buy 3 houses in Detroit in the next 3 months, then flip 2 properties for profit, then use that money to buy 5 more rentals.";
        
        await page.fill('#goalInput', testGoal);
        await page.click('button:has-text("Parse with AI")');
        
        // Wait for result
        await page.waitForSelector('#parserResult pre', { timeout: 30000 });
        
        const parseResult = await page.textContent('#parserResult pre');
        console.log('   Parse result received:', parseResult ? 'Success' : 'Failed');
        
        if (parseResult) {
            const parsed = JSON.parse(parseResult);
            console.log('   Detected phases:', parsed.phases?.length || 0);
            console.log('   Confidence:', parsed.confidence || 'N/A');
            console.log('   Source:', parsed.source || 'N/A');
        }
        
        console.log('\n✅ AI test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await page.waitForTimeout(5000); // Keep open to see results
        await browser.close();
    }
})();