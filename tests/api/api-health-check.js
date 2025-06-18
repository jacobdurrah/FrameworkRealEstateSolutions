/**
 * API Health Check
 * Tests all API endpoints to ensure they return JSON and not HTML
 */

const API_ENDPOINTS = [
    {
        path: '/api/market/generate-sql',
        method: 'POST',
        body: { prompt: 'Show me all properties sold by John Smith' },
        description: 'Generate SQL from natural language'
    },
    {
        path: '/api/market/execute-sql',
        method: 'POST',
        body: { sql: 'SELECT * FROM sales_transactions LIMIT 1' },
        description: 'Execute SQL query'
    },
    {
        path: '/api/portfolio/calculate',
        method: 'POST',
        body: {
            purchasePrice: 100000,
            downPayment: 20000,
            loanAmount: 80000,
            interestRate: 7,
            loanTerm: 30,
            monthlyRent: 1200,
            propertyTaxes: 200,
            insurance: 100,
            hoaFees: 0,
            maintenance: 100,
            propertyManagement: 120,
            vacancy: 5,
            closingCosts: 3000,
            repairCosts: 5000
        },
        description: 'Calculate investment returns'
    }
];

async function checkEndpoint(endpoint, baseUrl) {
    const url = baseUrl + endpoint.path;
    console.log(`\n📍 Testing: ${endpoint.path}`);
    console.log(`   Description: ${endpoint.description}`);
    console.log(`   Method: ${endpoint.method}`);
    console.log(`   URL: ${url}`);
    
    try {
        const options = {
            method: endpoint.method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (endpoint.body) {
            options.body = JSON.stringify(endpoint.body);
        }
        
        const startTime = Date.now();
        const response = await fetch(url, options);
        const duration = Date.now() - startTime;
        
        console.log(`   Response Time: ${duration}ms`);
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        // Check content type
        const contentType = response.headers.get('content-type');
        console.log(`   Content-Type: ${contentType}`);
        
        const isJson = contentType && contentType.includes('application/json');
        
        if (!isJson) {
            console.error(`   ❌ ERROR: Expected JSON but got ${contentType || 'undefined'}`);
            
            // Get response text to see what was returned
            const text = await response.text();
            if (text.includes('<!DOCTYPE') || text.includes('<html')) {
                console.error('   ❌ API returned HTML error page!');
                console.log('   HTML Preview:', text.substring(0, 200) + '...');
            }
            
            return {
                endpoint: endpoint.path,
                success: false,
                error: 'Non-JSON response',
                contentType,
                status: response.status
            };
        }
        
        // Parse JSON response
        const data = await response.json();
        
        if (response.ok) {
            console.log('   ✅ Success');
            
            // Log key fields from response
            if (data.sql) console.log(`   Generated SQL: ${data.sql.substring(0, 100)}...`);
            if (data.results) console.log(`   Results count: ${data.results.length}`);
            if (data.cashFlow) console.log(`   Cash flow: $${data.cashFlow}`);
            
            return {
                endpoint: endpoint.path,
                success: true,
                status: response.status,
                hasExpectedFields: true
            };
        } else {
            console.log(`   ⚠️ API Error: ${data.error || 'Unknown error'}`);
            return {
                endpoint: endpoint.path,
                success: false,
                error: data.error,
                status: response.status
            };
        }
        
    } catch (error) {
        console.error(`   ❌ Request failed: ${error.message}`);
        return {
            endpoint: endpoint.path,
            success: false,
            error: error.message,
            status: 0
        };
    }
}

async function runHealthCheck() {
    console.log('🏥 API Health Check');
    console.log('==================');
    
    const isLocalhost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    const baseUrl = isLocalhost 
        ? 'http://localhost:3000'
        : '';
    
    console.log(`Environment: ${isLocalhost ? 'Local Development' : 'Production'}`);
    console.log(`Base URL: ${baseUrl || '(relative paths)'}`);
    
    const results = [];
    
    for (const endpoint of API_ENDPOINTS) {
        const result = await checkEndpoint(endpoint, baseUrl);
        results.push(result);
    }
    
    // Summary
    console.log('\n📊 Summary');
    console.log('==========');
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`Total endpoints: ${results.length}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed > 0) {
        console.log('\nFailed endpoints:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`  - ${r.endpoint}: ${r.error} (Status: ${r.status})`);
        });
    }
    
    return {
        total: results.length,
        successful,
        failed,
        results
    };
}

// Export for use in browser or Node.js
if (typeof window !== 'undefined') {
    window.runAPIHealthCheck = runHealthCheck;
} else if (typeof module !== 'undefined') {
    module.exports = { runHealthCheck };
}