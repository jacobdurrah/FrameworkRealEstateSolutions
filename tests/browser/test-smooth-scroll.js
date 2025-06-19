/**
 * Browser test for smooth scroll functionality
 * Run this in the browser console on the live site
 */

async function testSmoothScroll() {
    console.log('=== Testing Smooth Scroll Enhancement ===\n');
    
    // Test 1: Check if functions exist
    console.log('1. Checking function availability:');
    const functions = {
        toggleEquations: typeof window.toggleEquations,
        toggleInstructions: typeof window.toggleInstructions,
        enhancedToggleEquations: typeof window.enhancedToggleEquations,
        enhancedToggleInstructions: typeof window.enhancedToggleInstructions,
        scrollToElement: typeof window.scrollToElement
    };
    
    for (const [name, type] of Object.entries(functions)) {
        console.log(`   ${name}: ${type === 'function' ? '✅' : '❌'} ${type}`);
    }
    
    // Test 2: Check if enhancement is active
    console.log('\n2. Checking if toggle functions are enhanced:');
    const isEquationsEnhanced = window.toggleEquations === window.enhancedToggleEquations;
    const isInstructionsEnhanced = window.toggleInstructions === window.enhancedToggleInstructions;
    console.log(`   Equations enhanced: ${isEquationsEnhanced ? '✅' : '❌'}`);
    console.log(`   Instructions enhanced: ${isInstructionsEnhanced ? '✅' : '❌'}`);
    
    // Test 3: Test Formulas toggle with scroll
    console.log('\n3. Testing Formulas toggle:');
    const equationContent = document.getElementById('equationContent');
    const equationPanel = document.getElementById('equationPanel');
    
    if (equationContent && equationPanel) {
        // Close if open
        if (equationContent.classList.contains('active')) {
            window.toggleEquations();
            await new Promise(r => setTimeout(r, 300));
        }
        
        const scrollBefore = window.pageYOffset;
        console.log(`   Initial scroll position: ${scrollBefore}px`);
        
        // Click to expand
        window.toggleEquations();
        await new Promise(r => setTimeout(r, 800));
        
        const scrollAfter = window.pageYOffset;
        const isExpanded = equationContent.classList.contains('active');
        const panelRect = equationPanel.getBoundingClientRect();
        const isInView = panelRect.top >= 0 && panelRect.top < window.innerHeight;
        
        console.log(`   Content expanded: ${isExpanded ? '✅' : '❌'}`);
        console.log(`   Scroll position after: ${scrollAfter}px`);
        console.log(`   Page scrolled: ${scrollAfter > scrollBefore ? '✅' : '❌'} (${scrollAfter - scrollBefore}px)`);
        console.log(`   Panel in viewport: ${isInView ? '✅' : '❌'}`);
        
        // Close it
        window.toggleEquations();
        await new Promise(r => setTimeout(r, 300));
    } else {
        console.log('   ❌ Equation elements not found');
    }
    
    // Test 4: Test Help toggle with scroll
    console.log('\n4. Testing Help toggle:');
    const instructionsContent = document.getElementById('instructionsContent');
    const instructionsPanel = document.getElementById('instructionsPanel');
    
    if (instructionsContent && instructionsPanel) {
        // Close if open
        if (instructionsContent.classList.contains('active')) {
            window.toggleInstructions();
            await new Promise(r => setTimeout(r, 300));
        }
        
        const scrollBefore = window.pageYOffset;
        console.log(`   Initial scroll position: ${scrollBefore}px`);
        
        // Click to expand
        window.toggleInstructions();
        await new Promise(r => setTimeout(r, 800));
        
        const scrollAfter = window.pageYOffset;
        const isExpanded = instructionsContent.classList.contains('active');
        const panelRect = instructionsPanel.getBoundingClientRect();
        const isInView = panelRect.top >= 0 && panelRect.top < window.innerHeight;
        
        console.log(`   Content expanded: ${isExpanded ? '✅' : '❌'}`);
        console.log(`   Scroll position after: ${scrollAfter}px`);
        console.log(`   Page scrolled: ${scrollAfter > scrollBefore ? '✅' : '❌'} (${scrollAfter - scrollBefore}px)`);
        console.log(`   Panel in viewport: ${isInView ? '✅' : '❌'}`);
        
        // Close it
        window.toggleInstructions();
        await new Promise(r => setTimeout(r, 300));
    } else {
        console.log('   ❌ Instructions elements not found');
    }
    
    // Test 5: Check smooth scroll CSS
    console.log('\n5. Checking smooth scroll support:');
    const htmlStyle = window.getComputedStyle(document.documentElement);
    const hasNativeSmooth = 'scrollBehavior' in document.documentElement.style;
    const cssSmooth = htmlStyle.scrollBehavior;
    
    console.log(`   Native smooth scroll: ${hasNativeSmooth ? '✅' : '❌ (using polyfill)'}`);
    console.log(`   CSS scroll-behavior: ${cssSmooth || 'not set'}`);
    
    // Test 6: Performance check
    console.log('\n6. Performance check:');
    if (window.performance && window.performance.getEntriesByType) {
        const resources = performance.getEntriesByType('resource');
        const smoothScrollScript = resources.find(r => r.name.includes('smooth-scroll-toggles.js'));
        
        if (smoothScrollScript) {
            console.log(`   Script loaded: ✅`);
            console.log(`   Load time: ${smoothScrollScript.duration.toFixed(2)}ms`);
        } else {
            console.log(`   Script loaded: ❓ (timing data not available)`);
        }
    }
    
    console.log('\n=== Test Complete ===');
    return true;
}

// Run the test
testSmoothScroll().catch(console.error);