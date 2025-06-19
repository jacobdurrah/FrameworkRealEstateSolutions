/**
 * Zillow Links Test Suite
 * Tests the enhanced timeline renderer with Zillow link functionality
 */

const ZillowLinksTest = {
    name: 'Zillow Links Test Suite',
    
    async runTests() {
        console.log('=== Zillow Links Tests ===');
        
        const results = {
            passed: 0,
            failed: 0,
            tests: []
        };
        
        // Test 1: Renderer enhancement loaded
        const test1 = this.testRendererLoaded();
        results.tests.push(test1);
        if (test1.passed) results.passed++; else results.failed++;
        
        // Test 2: Zillow link generation for real listings
        const test2 = this.testZillowLinkGeneration();
        results.tests.push(test2);
        if (test2.passed) results.passed++; else results.failed++;
        
        // Test 3: Fallback Zillow search URL
        const test3 = this.testZillowSearchFallback();
        results.tests.push(test3);
        if (test3.passed) results.passed++; else results.failed++;
        
        // Test 4: CSS styles applied
        const test4 = this.testStylesApplied();
        results.tests.push(test4);
        if (test4.passed) results.passed++; else results.failed++;
        
        // Test 5: Mobile compatibility
        const test5 = this.testMobileCompatibility();
        results.tests.push(test5);
        if (test5.passed) results.passed++; else results.failed++;
        
        // Display results
        this.displayResults(results);
        
        return results;
    },
    
    testRendererLoaded() {
        const testName = 'Enhanced Renderer Loaded';
        try {
            // Check if enhanced renderer is available
            if (typeof window.enhancedRenderTimelineTable !== 'function') {
                throw new Error('Enhanced renderer function not found');
            }
            
            // Check if CSS styles were added
            const styles = Array.from(document.styleSheets).some(sheet => {
                try {
                    return Array.from(sheet.cssRules || []).some(rule => 
                        rule.selectorText && rule.selectorText.includes('.zillow-link')
                    );
                } catch (e) {
                    return false;
                }
            });
            
            if (!styles) {
                throw new Error('Zillow link styles not found');
            }
            
            return { name: testName, passed: true, message: 'Enhanced renderer loaded successfully' };
        } catch (error) {
            return { name: testName, passed: false, message: error.message };
        }
    },
    
    testZillowLinkGeneration() {
        const testName = 'Zillow Link Generation';
        try {
            // Create test timeline data with real listing
            window.timelineData = [{
                id: 1,
                month: 0,
                action: 'buy',
                property: 'Rental 1: 123 Main St, Detroit, MI 48201',
                price: 75000,
                downPercent: 20,
                downAmount: 15000,
                loanAmount: 60000,
                rate: 7,
                term: 30,
                payment: 399,
                rent: 1200,
                monthlyExpenses: 300,
                realListing: {
                    zpid: '12345',
                    address: '123 Main St, Detroit, MI 48201'
                },
                listingUrl: 'https://www.zillow.com/homedetails/123-Main-St-Detroit-MI-48201/12345_zpid/'
            }];
            
            // Render the table
            if (typeof window.renderTimelineTable === 'function') {
                window.renderTimelineTable();
            }
            
            // Check if Zillow link was created
            const zillowLinks = document.querySelectorAll('.zillow-link');
            if (zillowLinks.length === 0) {
                throw new Error('No Zillow links found in rendered table');
            }
            
            // Verify link attributes
            const link = zillowLinks[0];
            if (!link.href.includes('zillow.com')) {
                throw new Error('Zillow link does not point to zillow.com');
            }
            
            if (link.target !== '_blank') {
                throw new Error('Zillow link does not open in new tab');
            }
            
            if (!link.title || !link.title.includes('Zillow')) {
                throw new Error('Zillow link missing tooltip');
            }
            
            return { name: testName, passed: true, message: 'Zillow links generated correctly' };
        } catch (error) {
            return { name: testName, passed: false, message: error.message };
        }
    },
    
    testZillowSearchFallback() {
        const testName = 'Zillow Search Fallback';
        try {
            // Create test data without direct listing URL
            window.timelineData = [{
                id: 2,
                month: 0,
                action: 'buy',
                property: 'Flip 1: 456 Oak Ave, Detroit, MI 48202',
                price: 50000,
                downPercent: 25,
                downAmount: 12500,
                loanAmount: 37500,
                rate: 8,
                term: 30,
                payment: 275,
                rent: 0,
                monthlyExpenses: 0
            }];
            
            // Render the table
            if (typeof window.renderTimelineTable === 'function') {
                window.renderTimelineTable();
            }
            
            // Check if fallback search link was created
            const zillowLinks = document.querySelectorAll('.zillow-link');
            if (zillowLinks.length === 0) {
                throw new Error('No fallback Zillow search links found');
            }
            
            // Verify search URL format
            const link = zillowLinks[0];
            if (!link.href.includes('/homes/')) {
                throw new Error('Fallback link is not a Zillow search URL');
            }
            
            // Check if address is properly encoded
            if (!link.href.includes('456%20Oak%20Ave')) {
                throw new Error('Address not properly encoded in search URL');
            }
            
            return { name: testName, passed: true, message: 'Zillow search fallback works correctly' };
        } catch (error) {
            return { name: testName, passed: false, message: error.message };
        }
    },
    
    testStylesApplied() {
        const testName = 'CSS Styles Applied';
        try {
            // Create a test link element
            const testLink = document.createElement('a');
            testLink.className = 'zillow-link';
            testLink.href = '#';
            testLink.innerHTML = '<i class="fas fa-external-link-alt"></i>';
            document.body.appendChild(testLink);
            
            // Get computed styles
            const styles = window.getComputedStyle(testLink);
            
            // Check key styles
            if (!styles.display || styles.display === 'inline') {
                throw new Error('Zillow link display style not applied');
            }
            
            if (!styles.borderRadius || styles.borderRadius === '0px') {
                throw new Error('Zillow link border radius not applied');
            }
            
            // Clean up
            document.body.removeChild(testLink);
            
            return { name: testName, passed: true, message: 'CSS styles properly applied' };
        } catch (error) {
            return { name: testName, passed: false, message: error.message };
        }
    },
    
    testMobileCompatibility() {
        const testName = 'Mobile Compatibility';
        try {
            // Simulate mobile viewport
            const originalWidth = window.innerWidth;
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 375
            });
            
            // Trigger resize event
            window.dispatchEvent(new Event('resize'));
            
            // Test mobile-specific styles
            const testLink = document.createElement('a');
            testLink.className = 'zillow-link';
            document.body.appendChild(testLink);
            
            const styles = window.getComputedStyle(testLink);
            
            // On mobile, links should be larger for touch
            const width = parseInt(styles.width) || 0;
            if (width < 32) {
                throw new Error('Zillow link too small for mobile touch targets');
            }
            
            // Clean up
            document.body.removeChild(testLink);
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: originalWidth
            });
            
            return { name: testName, passed: true, message: 'Mobile compatibility verified' };
        } catch (error) {
            return { name: testName, passed: false, message: error.message };
        }
    },
    
    displayResults(results) {
        console.log('\n=== Zillow Links Test Results ===');
        console.log(`Total Tests: ${results.tests.length}`);
        console.log(`Passed: ${results.passed}`);
        console.log(`Failed: ${results.failed}`);
        console.log('\nDetailed Results:');
        
        results.tests.forEach(test => {
            const status = test.passed ? '✅' : '❌';
            console.log(`${status} ${test.name}: ${test.message}`);
        });
        
        if (results.failed === 0) {
            console.log('\n🎉 All Zillow link tests passed!');
        }
    }
};

// Auto-run tests if loaded
if (typeof window !== 'undefined') {
    window.ZillowLinksTest = ZillowLinksTest;
    
    // Run tests after page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Wait for enhanced renderer to initialize
            setTimeout(() => ZillowLinksTest.runTests(), 1500);
        });
    } else {
        setTimeout(() => ZillowLinksTest.runTests(), 1500);
    }
}