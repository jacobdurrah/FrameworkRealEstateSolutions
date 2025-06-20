// Test Enhanced AI Features
const https = require('https');

// Test scenarios
const testScenarios = [
    {
        name: 'Simple Goal',
        goal: 'I want to make $5000 per month from rental properties',
        mode: 'comprehensive'
    },
    {
        name: 'Complex Multi-Phase Goal',
        goal: 'I have $100k to invest. I want to buy 3 properties in Detroit under $50k each, renovate them for $20k each, then refinance to pull out 70% of value. Use that money to buy 2 more properties and reach $5000/month rental income within 2 years.',
        mode: 'comprehensive'
    },
    {
        name: 'BRRRR Strategy',
        goal: 'Execute a BRRRR strategy starting with $50k, targeting distressed properties in Detroit that need $30k in repairs, aiming to build a portfolio of 5 properties in 18 months',
        mode: 'comprehensive'
    }
];

// API configuration
const API_URL = 'https://framework-hgn314s0p-jacob-durrahs-projects.vercel.app';

async function testScenario(scenario) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Testing: ${scenario.name}`);
    console.log(`Goal: ${scenario.goal}`);
    console.log(`Mode: ${scenario.mode}`);
    console.log('='.repeat(80));

    const payload = JSON.stringify({
        goal: scenario.goal,
        mode: scenario.mode,
        context: {
            userProfile: {
                experience: 'intermediate',
                riskTolerance: 'moderate'
            }
        }
    });

    const options = {
        hostname: 'framework-hgn314s0p-jacob-durrahs-projects.vercel.app',
        path: '/api/ai/enhanced-strategy-generator',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': payload.length
        },
        timeout: 60000 // 60 second timeout for complex strategies
    };

    return new Promise((resolve) => {
        const startTime = Date.now();
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const duration = Date.now() - startTime;
                console.log(`\nResponse Time: ${duration}ms`);
                console.log(`Status: ${res.statusCode}`);
                
                try {
                    const response = JSON.parse(data);
                    
                    if (response.success) {
                        console.log('\n✅ Strategy Generated Successfully!\n');
                        
                        const strategy = response.data;
                        
                        // Display key information
                        console.log('📊 Key Metrics:');
                        if (strategy.targetMonthlyIncome) {
                            console.log(`   - Target Monthly Income: $${strategy.targetMonthlyIncome.toLocaleString()}`);
                        }
                        if (strategy.timeHorizon) {
                            console.log(`   - Time Horizon: ${strategy.timeHorizon} months`);
                        }
                        if (strategy.startingCapital) {
                            console.log(`   - Starting Capital: $${strategy.startingCapital.toLocaleString()}`);
                        }
                        
                        // Display strategies
                        console.log('\n📈 Investment Strategies:');
                        strategy.strategies.forEach(s => console.log(`   - ${s}`));
                        
                        // Display phases
                        if (strategy.phases && strategy.phases.length > 0) {
                            console.log('\n📅 Investment Phases:');
                            strategy.phases.forEach((phase, i) => {
                                console.log(`   Phase ${phase.phaseNumber || i + 1}: ${phase.focus}`);
                                if (phase.duration) console.log(`     Duration: ${phase.duration} months`);
                                if (phase.description) console.log(`     Description: ${phase.description}`);
                                if (phase.expectedCost) console.log(`     Cost: $${phase.expectedCost.toLocaleString()}`);
                                if (phase.expectedRevenue) console.log(`     Revenue: $${phase.expectedRevenue.toLocaleString()}`);
                            });
                        }
                        
                        // Display risk assessment
                        if (strategy.riskAssessment) {
                            console.log('\n⚠️  Risk Assessment:');
                            console.log(`   - Level: ${strategy.riskAssessment.level}`);
                            if (strategy.riskAssessment.factors) {
                                console.log('   - Risk Factors:');
                                strategy.riskAssessment.factors.forEach(f => console.log(`     • ${f}`));
                            }
                        }
                        
                        // Display market analysis
                        if (strategy.marketAnalysis) {
                            console.log('\n🏠 Market Analysis:');
                            console.log(`   - Target Market: ${strategy.marketAnalysis.targetMarket}`);
                            console.log(`   - Market Conditions: ${strategy.marketAnalysis.currentConditions}`);
                            console.log(`   - Rental Demand: ${strategy.marketAnalysis.rentalDemand}`);
                        }
                        
                        // Display confidence score
                        if (strategy.confidenceScore) {
                            console.log(`\n🎯 Confidence Score: ${Math.round(strategy.confidenceScore * 100)}%`);
                        }
                        
                    } else {
                        console.log('\n❌ Strategy Generation Failed');
                        console.log('Error:', response.error);
                        if (response.fallback) {
                            console.log('\n📋 Fallback Strategy Provided:');
                            console.log(JSON.stringify(response.fallback, null, 2));
                        }
                    }
                    
                } catch (e) {
                    console.log('\n❌ Error parsing response:', e.message);
                    console.log('Raw response:', data);
                }
                
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.error('\n❌ Request error:', error.message);
            resolve();
        });
        
        req.on('timeout', () => {
            console.error('\n❌ Request timeout after 60 seconds');
            req.destroy();
            resolve();
        });
        
        req.write(payload);
        req.end();
    });
}

// Run all tests
async function runTests() {
    console.log('🚀 Testing Enhanced AI Strategy Generator\n');
    console.log(`API Endpoint: ${API_URL}/api/ai/enhanced-strategy-generator`);
    console.log(`Time: ${new Date().toISOString()}`);
    
    for (const scenario of testScenarios) {
        await testScenario(scenario);
        // Add delay between tests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n\n✅ All tests completed!');
}

// Execute tests
runTests().catch(console.error);