/**
 * Month Selector Test Suite
 * Tests the improved month selector functionality
 */

const MonthSelectorTest = {
    name: 'Month Selector Test Suite',
    
    async runTests() {
        console.log('=== Month Selector Tests ===');
        
        const results = {
            passed: 0,
            failed: 0,
            tests: []
        };
        
        // Test 1: Check UI elements exist
        const test1 = this.testUIElements();
        results.tests.push(test1);
        if (test1.passed) results.passed++; else results.failed++;
        
        // Test 2: Test stepper buttons
        const test2 = this.testStepperButtons();
        results.tests.push(test2);
        if (test2.passed) results.passed++; else results.failed++;
        
        // Test 3: Test direct input
        const test3 = this.testDirectInput();
        results.tests.push(test3);
        if (test3.passed) results.passed++; else results.failed++;
        
        // Test 4: Test debounced updates
        const test4 = await this.testDebouncedUpdates();
        results.tests.push(test4);
        if (test4.passed) results.passed++; else results.failed++;
        
        // Test 5: Test boundary values
        const test5 = this.testBoundaryValues();
        results.tests.push(test5);
        if (test5.passed) results.passed++; else results.failed++;
        
        // Display results
        this.displayResults(results);
        
        return results;
    },
    
    testUIElements() {
        const testName = 'UI Elements Exist';
        try {
            // Check for month input
            const monthInput = document.getElementById('summaryMonth');
            if (!monthInput) throw new Error('Month input not found');
            
            // Check for stepper buttons
            const stepperDown = document.querySelector('.month-stepper-down');
            const stepperUp = document.querySelector('.month-stepper-up');
            if (!stepperDown || !stepperUp) throw new Error('Stepper buttons not found');
            
            // Check for year display
            const yearDisplay = document.getElementById('summaryYears');
            if (!yearDisplay) throw new Error('Year display not found');
            
            // Check accessibility attributes
            if (!monthInput.hasAttribute('aria-label')) {
                throw new Error('Month input missing aria-label');
            }
            
            if (!stepperDown.hasAttribute('aria-label') || !stepperUp.hasAttribute('aria-label')) {
                throw new Error('Stepper buttons missing aria-labels');
            }
            
            return { name: testName, passed: true, message: 'All UI elements present with proper accessibility' };
        } catch (error) {
            return { name: testName, passed: false, message: error.message };
        }
    },
    
    testStepperButtons() {
        const testName = 'Stepper Buttons Functionality';
        try {
            const monthInput = document.getElementById('summaryMonth');
            const stepperDown = document.querySelector('.month-stepper-down');
            const stepperUp = document.querySelector('.month-stepper-up');
            const initialValue = parseInt(monthInput.value) || 0;
            
            // Test increment
            stepperUp.click();
            const afterIncrement = parseInt(monthInput.value);
            if (afterIncrement !== initialValue + 1) {
                throw new Error(`Increment failed: expected ${initialValue + 1}, got ${afterIncrement}`);
            }
            
            // Test decrement
            stepperDown.click();
            const afterDecrement = parseInt(monthInput.value);
            if (afterDecrement !== initialValue) {
                throw new Error(`Decrement failed: expected ${initialValue}, got ${afterDecrement}`);
            }
            
            // Reset to initial value
            monthInput.value = initialValue;
            updateSummaryMonth();
            
            return { name: testName, passed: true, message: 'Stepper buttons work correctly' };
        } catch (error) {
            return { name: testName, passed: false, message: error.message };
        }
    },
    
    testDirectInput() {
        const testName = 'Direct Input';
        try {
            const monthInput = document.getElementById('summaryMonth');
            const yearDisplay = document.getElementById('summaryYears');
            const initialValue = parseInt(monthInput.value) || 0;
            
            // Test setting a specific value
            monthInput.value = 24;
            monthInput.dispatchEvent(new Event('change'));
            
            // Check if year display updated
            if (!yearDisplay.textContent.includes('2.0 years')) {
                throw new Error(`Year display not updated correctly: ${yearDisplay.textContent}`);
            }
            
            // Test setting value to 0
            monthInput.value = 0;
            monthInput.dispatchEvent(new Event('change'));
            
            if (yearDisplay.textContent !== '(Today)') {
                throw new Error(`Year display should show "(Today)" for month 0, got: ${yearDisplay.textContent}`);
            }
            
            // Reset to initial value
            monthInput.value = initialValue;
            updateSummaryMonth();
            
            return { name: testName, passed: true, message: 'Direct input updates correctly' };
        } catch (error) {
            return { name: testName, passed: false, message: error.message };
        }
    },
    
    async testDebouncedUpdates() {
        const testName = 'Debounced Updates';
        try {
            const monthInput = document.getElementById('summaryMonth');
            let updateCount = 0;
            const originalUpdate = window.updateSummaryMonth;
            
            // Track update calls
            window.updateSummaryMonth = function() {
                updateCount++;
                originalUpdate.call(this);
            };
            
            // Simulate rapid input changes
            for (let i = 1; i <= 5; i++) {
                monthInput.value = i;
                monthInput.dispatchEvent(new Event('input'));
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Wait for debounce timeout
            await new Promise(resolve => setTimeout(resolve, 600));
            
            // Restore original function
            window.updateSummaryMonth = originalUpdate;
            
            // Should only have updated once due to debouncing
            if (updateCount > 2) {
                throw new Error(`Too many updates: ${updateCount}, debouncing may not be working`);
            }
            
            // Reset
            monthInput.value = 0;
            updateSummaryMonth();
            
            return { name: testName, passed: true, message: `Debouncing working (${updateCount} updates for 5 inputs)` };
        } catch (error) {
            return { name: testName, passed: false, message: error.message };
        }
    },
    
    testBoundaryValues() {
        const testName = 'Boundary Values';
        try {
            const monthInput = document.getElementById('summaryMonth');
            
            // Test negative value prevention
            monthInput.value = -5;
            stepMonth(0); // Trigger validation
            const afterNegative = parseInt(monthInput.value);
            if (afterNegative < 0) {
                throw new Error(`Negative value allowed: ${afterNegative}`);
            }
            
            // Test maximum value (360 months = 30 years)
            monthInput.value = 365;
            stepMonth(0); // Trigger validation
            const afterMax = parseInt(monthInput.value);
            if (afterMax > 360) {
                throw new Error(`Value exceeds maximum: ${afterMax}`);
            }
            
            // Test stepping at boundaries
            monthInput.value = 0;
            stepMonth(-1);
            if (parseInt(monthInput.value) !== 0) {
                throw new Error('Stepping below 0 should stay at 0');
            }
            
            monthInput.value = 360;
            stepMonth(1);
            if (parseInt(monthInput.value) !== 360) {
                throw new Error('Stepping above 360 should stay at 360');
            }
            
            // Reset
            monthInput.value = 0;
            updateSummaryMonth();
            
            return { name: testName, passed: true, message: 'Boundary values handled correctly' };
        } catch (error) {
            return { name: testName, passed: false, message: error.message };
        }
    },
    
    displayResults(results) {
        console.log('\n=== Month Selector Test Results ===');
        console.log(`Total Tests: ${results.tests.length}`);
        console.log(`Passed: ${results.passed}`);
        console.log(`Failed: ${results.failed}`);
        console.log('\nDetailed Results:');
        
        results.tests.forEach(test => {
            const status = test.passed ? '✅' : '❌';
            console.log(`${status} ${test.name}: ${test.message}`);
        });
        
        if (results.failed === 0) {
            console.log('\n🎉 All month selector tests passed!');
        }
    }
};

// Auto-run tests if loaded
if (typeof window !== 'undefined') {
    window.MonthSelectorTest = MonthSelectorTest;
    
    // Run tests after page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => MonthSelectorTest.runTests(), 1000);
        });
    } else {
        setTimeout(() => MonthSelectorTest.runTests(), 1000);
    }
}