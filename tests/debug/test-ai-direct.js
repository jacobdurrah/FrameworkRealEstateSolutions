// Test AI API directly
const https = require('https');

const testGoal = "I want to buy 3 houses in Detroit for under $50k each";

const payload = JSON.stringify({
    mode: 'parse',
    goal: testGoal
});

const options = {
    hostname: 'framework-hgn314s0p-jacob-durrahs-projects.vercel.app',
    path: '/api/ai/strategy-generator',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length,
        'Origin': 'https://frameworkrealestatesolutions.com'
    }
};

console.log('Testing AI API directly...\n');
console.log('Goal:', testGoal);
console.log('API URL:', `https://${options.hostname}${options.path}`);
console.log('\nSending request...');

const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('\nResponse Status:', res.statusCode);
        console.log('Response Headers:', res.headers);
        console.log('\nResponse Body:');
        
        try {
            const parsed = JSON.parse(data);
            console.log(JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.log(data);
        }
    });
});

req.on('error', (error) => {
    console.error('Request error:', error);
});

req.write(payload);
req.end();