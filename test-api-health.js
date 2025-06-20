// Test API health on live site
const https = require('https');

console.log('Testing API endpoints on live site...\n');

const testEndpoint = (path, description) => {
    return new Promise((resolve) => {
        const options = {
            hostname: 'framework-realestate-solutions.vercel.app',
            path: path,
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`${description}:`);
                console.log(`  Status: ${res.statusCode}`);
                console.log(`  Response: ${data.substring(0, 100)}...`);
                console.log('');
                resolve();
            });
        });

        req.on('error', (error) => {
            console.log(`${description}:`);
            console.log(`  Error: ${error.message}`);
            console.log('');
            resolve();
        });

        req.end();
    });
};

(async () => {
    await testEndpoint('/api/ai/health', 'Health Check');
    await testEndpoint('/api/ai/strategy-generator', 'Strategy Generator');
    
    console.log('\nNote: Strategy generator requires POST with proper payload.');
    console.log('If you see 404 errors, the API endpoints may not be deployed yet.');
})();