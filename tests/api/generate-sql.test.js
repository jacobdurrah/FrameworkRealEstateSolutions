/**
 * Test for generate-sql API endpoint
 * This test helps debug why the API might be returning HTML instead of JSON
 */

async function testGenerateSQLAPI() {
    console.log('Testing generate-sql API endpoint...\n');
    
    // Determine API URL based on environment
    const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api/market/generate-sql'
        : '/api/market/generate-sql';
    
    console.log('API URL:', apiUrl);
    
    // Test cases
    const testCases = [
        {
            name: 'Valid query',
            payload: { prompt: 'Show me all properties sold by John Smith' },
            expectedStatus: 200
        },
        {
            name: 'Empty prompt',
            payload: { prompt: '' },
            expectedStatus: 400
        },
        {
            name: 'Short prompt',
            payload: { prompt: 'hi' },
            expectedStatus: 400
        },
        {
            name: 'Missing prompt',
            payload: {},
            expectedStatus: 400
        },
        {
            name: 'Invalid payload',
            payload: null,
            expectedStatus: 400
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`\nTest: ${testCase.name}`);
        console.log('Payload:', JSON.stringify(testCase.payload));
        
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: testCase.payload !== null ? JSON.stringify(testCase.payload) : null
            });
            
            // Log response details
            console.log('Status:', response.status, response.statusText);
            console.log('Headers:', Object.fromEntries(response.headers.entries()));
            
            // Check content type
            const contentType = response.headers.get('content-type');
            const isJson = contentType && contentType.includes('application/json');
            console.log('Content-Type:', contentType);
            console.log('Is JSON:', isJson);
            
            // Get response body
            let responseBody;
            if (isJson) {
                responseBody = await response.json();
                console.log('Response:', JSON.stringify(responseBody, null, 2));
            } else {
                responseBody = await response.text();
                console.log('Response (first 500 chars):', responseBody.substring(0, 500));
                
                // Check if it's an HTML error page
                if (responseBody.includes('<!DOCTYPE') || responseBody.includes('<html')) {
                    console.error('ERROR: API returned HTML instead of JSON!');
                    console.log('This likely means:');
                    console.log('1. The API endpoint URL is incorrect');
                    console.log('2. The serverless function is not deployed');
                    console.log('3. There is a server-side error returning an error page');
                }
            }
            
            // Verify expected status
            if (response.status === testCase.expectedStatus) {
                console.log('✅ Status matches expected:', testCase.expectedStatus);
            } else {
                console.log('❌ Status mismatch. Expected:', testCase.expectedStatus, 'Got:', response.status);
            }
            
        } catch (error) {
            console.error('❌ Test failed with error:', error.message);
            console.error('Full error:', error);
        }
    }
    
    console.log('\n--- Test complete ---');
}

// Run test when page loads
if (typeof window !== 'undefined') {
    window.testGenerateSQLAPI = testGenerateSQLAPI;
    console.log('Test function available. Run testGenerateSQLAPI() in console to test the API.');
}