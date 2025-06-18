/**
 * Test Suite for Portfolio Simulator V3 Rent/Expense Parsing and Goal Failure Handling
 */

// Test utilities
function runTest(name, testFn) {
    try {
        const result = testFn();
        console.log(`✅ ${name}`);
        return { name, passed: true, result };
    } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        return { name, passed: false, error: error.message };
    }
}

// Main test runner
async function runRentExpenseTests() {
    console.log('🧪 Portfolio Simulator V3 - Rent/Expense Tests\n');
    
    const results = [];
    
    // Test 1: Rent and Expense Parsing
    console.log('📝 Testing Rent and Expense Parsing...\n');
    
    const parser = new GoalParser();
    
    // Test cases for rent/expense parsing
    const rentExpenseTests = [
        {
            name: 'Basic rent specification',
            input: 'I want $2,000/month income. Rent is $1,300/month per unit.',
            expected: { rentPerUnit: 1300 }
        },
        {
            name: 'Basic expense specification',
            input: 'Generate $3,000/month. Each property has $400 in expenses.',
            expected: { monthlyExpensesPerUnit: 400 }
        },
        {
            name: 'Combined rent and expenses',
            input: 'I need $5,000/month. Rents are $1,500 and expenses are $250 per unit.',
            expected: { rentPerUnit: 1500, monthlyExpensesPerUnit: 250 }
        },
        {
            name: 'Alternative rent phrasing',
            input: 'Target $2,000/month. Monthly rent is $1,250.',
            expected: { rentPerUnit: 1250 }
        },
        {
            name: 'Alternative expense phrasing',
            input: 'Need $3,000/month. Operating expenses are $300/month.',
            expected: { monthlyExpensesPerUnit: 300 }
        },
        {
            name: 'Full example with all values',
            input: 'I want $3,000/month income in 12 months. Rent is $1,250 per unit. Expenses are $300/month per unit. Starting with $50K.',
            expected: {
                targetMonthlyIncome: 3000,
                timeHorizon: 12,
                rentPerUnit: 1250,
                monthlyExpensesPerUnit: 300,
                startingCapital: 50000,
                cashFlowPerUnit: 950
            }
        }
    ];
    
    rentExpenseTests.forEach(test => {
        results.push(runTest(test.name, () => {
            const parsed = parser.parse(test.input);
            
            // Check each expected value
            for (const [key, expectedValue] of Object.entries(test.expected)) {
                if (parsed[key] !== expectedValue) {
                    throw new Error(`Expected ${key}=${expectedValue}, got ${parsed[key]}`);
                }
            }
            
            return parsed;
        }));
    });
    
    console.log('\n📊 Testing Cash Flow Calculations...\n');
    
    // Test cash flow calculations
    const cashFlowTests = [
        {
            name: 'Standard cash flow calculation',
            rent: 1200,
            expenses: 350,
            expectedCashFlow: 850
        },
        {
            name: 'High rent scenario',
            rent: 1500,
            expenses: 300,
            expectedCashFlow: 1200
        },
        {
            name: 'Low margin scenario',
            rent: 1000,
            expenses: 600,
            expectedCashFlow: 400
        }
    ];
    
    cashFlowTests.forEach(test => {
        results.push(runTest(test.name, () => {
            const parsed = parser.parse(`Rent is $${test.rent}/month. Expenses are $${test.expenses}/month.`);
            
            if (parsed.cashFlowPerUnit !== test.expectedCashFlow) {
                throw new Error(`Expected cash flow ${test.expectedCashFlow}, got ${parsed.cashFlowPerUnit}`);
            }
            
            // Calculate required properties for $5000/month income
            const requiredProperties = Math.ceil(5000 / test.expectedCashFlow);
            const expectedProperties = Math.ceil(5000 / test.expectedCashFlow);
            
            if (parsed.requiredProperties !== expectedProperties) {
                throw new Error(`Expected ${expectedProperties} properties needed, got ${parsed.requiredProperties}`);
            }
            
            return { cashFlow: parsed.cashFlowPerUnit, properties: parsed.requiredProperties };
        }));
    });
    
    console.log('\n⚠️ Testing Goal Failure Scenarios...\n');
    
    // Test goal failure handling
    const failureTests = [
        {
            name: 'Unreachable goal - low capital',
            goal: {
                targetMonthlyIncome: 10000,
                timeHorizon: 12,
                startingCapital: 20000,
                monthlyContributions: 0,
                rentPerUnit: 1200,
                monthlyExpensesPerUnit: 400
            },
            expectFailure: true
        },
        {
            name: 'Unreachable goal - short timeline',
            goal: {
                targetMonthlyIncome: 5000,
                timeHorizon: 6,
                startingCapital: 50000,
                monthlyContributions: 0,
                rentPerUnit: 1000,
                monthlyExpensesPerUnit: 400
            },
            expectFailure: true
        },
        {
            name: 'Achievable goal',
            goal: {
                targetMonthlyIncome: 2000,
                timeHorizon: 24,
                startingCapital: 100000,
                monthlyContributions: 2000,
                rentPerUnit: 1300,
                monthlyExpensesPerUnit: 350
            },
            expectFailure: false
        }
    ];
    
    // Mock strategy generator for testing
    const generator = new StrategyGenerator();
    
    for (const test of failureTests) {
        results.push(runTest(test.name, () => {
            // Generate strategy
            const strategy = generator.generateStrategy(test.goal, 'balanced');
            
            if (test.expectFailure) {
                // Should not achieve goal
                if (strategy.feasibility) {
                    throw new Error('Expected goal to fail but it succeeded');
                }
                
                // Should have warning message
                if (!strategy.description.includes('⚠️')) {
                    throw new Error('Missing warning message for failed goal');
                }
                
                // Should still return best effort
                if (!strategy.timeline || strategy.timeline.length === 0) {
                    throw new Error('No timeline generated for failed goal');
                }
            } else {
                // Should achieve goal
                if (!strategy.feasibility) {
                    throw new Error('Expected goal to succeed but it failed');
                }
            }
            
            return {
                feasible: strategy.feasibility,
                income: strategy.finalMonthlyIncome,
                properties: strategy.propertyCount
            };
        }));
    }
    
    console.log('\n🔧 Testing Defaults...\n');
    
    // Test default values when not specified
    results.push(runTest('Uses default rent when not specified', () => {
        const parsed = parser.parse('I want $5,000/month income in 24 months.');
        
        if (parsed.rentPerUnit !== 1200) {
            throw new Error(`Expected default rent 1200, got ${parsed.rentPerUnit}`);
        }
        
        return parsed.rentPerUnit;
    }));
    
    results.push(runTest('Uses default expenses when not specified', () => {
        const parsed = parser.parse('Generate $3,000/month passive income.');
        
        if (parsed.monthlyExpensesPerUnit !== 350) {
            throw new Error(`Expected default expenses 350, got ${parsed.monthlyExpensesPerUnit}`);
        }
        
        return parsed.monthlyExpensesPerUnit;
    }));
    
    // Summary
    console.log('\n📊 Test Summary');
    console.log('═══════════════');
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    console.log(`Total: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Pass Rate: ${Math.round(passed / results.length * 100)}%`);
    
    if (failed > 0) {
        console.log('\n❌ Failed Tests:');
        results.filter(r => !r.passed).forEach(r => {
            console.log(`  - ${r.name}: ${r.error}`);
        });
    }
    
    return results;
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined' && window.location.search.includes('test=true')) {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(runRentExpenseTests, 1000);
    });
}

// Export for use in other test suites
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runRentExpenseTests };
}

console.log('💡 Rent/Expense Test Suite Loaded');
console.log('Run tests with: runRentExpenseTests()');