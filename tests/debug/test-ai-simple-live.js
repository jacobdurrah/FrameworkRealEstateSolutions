// Simple test of AI features on live site
const { chromium } = require('playwright');

(async () => {
    console.log('🤖 Testing AI features with simple goal...\n');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // Navigate to live site
        console.log('1. Navigating to portfolio simulator V3...');
        await page.goto('https://frameworkrealestatesolutions.com/portfolio-simulator-v3.html');
        await page.waitForLoadState('networkidle');
        
        // Enable AI for this session
        console.log('2. Enabling AI features...');
        await page.evaluate(() => {
            localStorage.setItem('forceAIEnabled', 'true');
            window.location.reload();
        });
        
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Check AI badge
        const aiBadge = await page.locator('#aiStatusBadge').isVisible();
        console.log(`   ✅ AI badge visible: ${aiBadge}`);
        
        // Test simple goal with AI
        console.log('\n3. Testing AI-powered goal parsing...');
        const simpleGoal = "I want to make $5000 per month from rental properties";
        
        await page.fill('#goalInput', simpleGoal);
        console.log('   ✅ Goal entered:', simpleGoal);
        
        // Generate strategy
        console.log('\n4. Generating AI strategy...');
        await page.click('button:has-text("Generate Strategy")');
        
        // Wait for loading indicator
        console.log('   ⏳ Waiting for AI response...');
        
        try {
            // Wait for either success or error
            const result = await Promise.race([
                page.waitForSelector('.strategy-content', { timeout: 30000 }).then(() => 'success'),
                page.waitForSelector('.error-message', { timeout: 30000 }).then(() => 'error'),
                page.waitForSelector('[data-testid="ai-loading"]', { state: 'hidden', timeout: 30000 }).then(() => 'completed')
            ]);
            
            if (result === 'success') {
                console.log('   ✅ AI strategy generated!');
                
                // Check timeline
                const timelineRows = await page.locator('#timelineTable tbody tr').count();
                console.log(`   ✅ Timeline created with ${timelineRows} events`);
                
                // Get parsed data
                const parsedData = await page.evaluate(() => {
                    return window.lastParsedGoal || null;
                });
                
                if (parsedData) {
                    console.log('\n5. Parsed Goal Data:');
                    console.log(JSON.stringify(parsedData, null, 2));
                }
            } else if (result === 'error') {
                const errorText = await page.locator('.error-message').textContent();
                console.log(`   ❌ Error: ${errorText}`);
            }
            
        } catch (error) {
            console.log(`   ❌ Strategy generation failed: ${error.message}`);
            
            // Check console for errors
            const consoleErrors = [];
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });
            
            if (consoleErrors.length > 0) {
                console.log('\n   Console errors:');
                consoleErrors.forEach(err => console.log(`     - ${err}`));
            }
        }
        
        // Check AI service status
        console.log('\n6. Checking AI service status...');
        const aiStatus = await page.evaluate(() => {
            if (window.aiService) {
                return {
                    configured: true,
                    apiUrl: window.aiService.getApiUrl(),
                    enabled: window.AIConfig.features.enableAI
                };
            }
            return { configured: false };
        });
        
        console.log('   AI Service:', JSON.stringify(aiStatus, null, 2));
        
        console.log('\n✅ Test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await page.waitForTimeout(5000); // Keep open to see results
        await browser.close();
    }
})();