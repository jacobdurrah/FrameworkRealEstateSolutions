/**
 * Debug script for AI API endpoint
 * Tests the API locally and remotely to identify issues
 */

const https = require('https');
const http = require('http');

// Test configurations
const tests = [
    {
        name: 'Local Health Check',
        protocol: 'http',
        hostname: 'localhost',
        port: 3000,
        path: '/api/ai/health',
        method: 'GET'
    },
    {
        name: 'Remote Health Check',
        protocol: 'https',
        hostname: 'framework-hgn314s0p-jacob-durrahs-projects.vercel.app',
        path: '/api/ai/health',
        method: 'GET'
    },
    {
        name: 'Local Strategy Generator',
        protocol: 'http',
        hostname: 'localhost',
        port: 3000,
        path: '/api/ai/strategy-generator',
        method: 'POST',
        payload: {
            mode: 'parse',
            goal: 'I want to make $10,000/month from rentals'
        }
    },
    {
        name: 'Remote Strategy Generator',
        protocol: 'https',
        hostname: 'framework-hgn314s0p-jacob-durrahs-projects.vercel.app',
        path: '/api/ai/strategy-generator',
        method: 'POST',
        payload: {
            mode: 'parse',
            goal: 'I want to make $10,000/month from rentals'
        }
    }
];

async function runTest(test) {
    console.log(`\n🧪 Running: ${test.name}`);
    console.log(`   URL: ${test.protocol}://${test.hostname}${test.port ? ':' + test.port : ''}${test.path}`);
    
    return new Promise((resolve) => {
        const options = {
            hostname: test.hostname,
            port: test.port,
            path: test.path,
            method: test.method,
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://frameworkrealestatesolutions.com'
            }
        };

        // Add payload if POST
        let payload = '';
        if (test.payload) {
            payload = JSON.stringify(test.payload);
            options.headers['Content-Length'] = payload.length;
        }

        // Add API key if available
        if (process.env.ANTHROPIC_API_KEY) {
            options.headers['x-anthropic-api-key'] = process.env.ANTHROPIC_API_KEY;
            console.log('   ✅ API key provided');
        } else {
            console.log('   ⚠️  No API key in environment');
        }

        const protocol = test.protocol === 'https' ? https : http;
        
        const req = protocol.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`   Status: ${res.statusCode}`);
                
                try {
                    const parsed = JSON.parse(data);
                    console.log('   Response:', JSON.stringify(parsed, null, 2));
                    
                    // Check for specific errors
                    if (res.statusCode === 500) {
                        console.log('   ❌ 500 Error detected!');
                        if (parsed.message) {
                            console.log('   Error message:', parsed.message);
                        }
                    } else if (res.statusCode === 200) {
                        console.log('   ✅ Success!');
                    }
                } catch (e) {
                    console.log('   Raw response:', data);
                }
                
                resolve();
            });
        });

        req.on('error', (error) => {
            console.log(`   ❌ Request error:`, error.message);
            resolve();
        });

        if (payload) {
            req.write(payload);
        }
        req.end();
    });
}

async function runAllTests() {
    console.log('🚀 Starting AI API Debug Tests\n');
    console.log('Environment:');
    console.log(`- Node version: ${process.version}`);
    console.log(`- API key configured: ${!!process.env.ANTHROPIC_API_KEY}`);
    
    for (const test of tests) {
        await runTest(test);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay between tests
    }
    
    console.log('\n✅ All tests completed!');
    console.log('\n📋 Troubleshooting tips:');
    console.log('1. If local tests fail, ensure you have Vercel dev server running: vercel dev');
    console.log('2. If remote tests fail with 401, ensure ANTHROPIC_API_KEY is set in Vercel environment');
    console.log('3. If remote tests fail with 500, check Vercel function logs for detailed errors');
    console.log('4. Check that the API endpoint URL matches your latest deployment');
}

// Run tests
runAllTests();