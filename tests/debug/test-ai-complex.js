// Test AI API with complex multi-phase goal
const https = require('https');

const complexGoal = "I want to start with $100k, buy 3 rental properties in Detroit under $50k each in the next 3 months, flip 2 of them for 30% profit within 6 months, then use the profits to buy 5 more rental properties that generate at least $500/month each. My ultimate goal is to reach $5000/month passive income within 2 years.";

const payload = JSON.stringify({
    mode: 'strategy',
    goal: complexGoal
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

console.log('Testing AI API with complex multi-phase goal...\n');
console.log('Goal:', complexGoal);
console.log('\nSending request...\n');

const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Response Status:', res.statusCode);
        
        try {
            const parsed = JSON.parse(data);
            if (parsed.success) {
                console.log('\n✅ AI Successfully Generated Strategy!\n');
                console.log('Parsed Data:');
                console.log(JSON.stringify(parsed.data, null, 2));
                
                if (parsed.explanation) {
                    console.log('\n📝 AI Explanation:');
                    console.log(parsed.explanation);
                }
                
                if (parsed.keyPoints && parsed.keyPoints.length > 0) {
                    console.log('\n🔑 Key Points:');
                    parsed.keyPoints.forEach((point, i) => {
                        console.log(`${i + 1}. ${point}`);
                    });
                }
            } else {
                console.log('\n❌ Strategy generation failed:');
                console.log(parsed);
            }
        } catch (e) {
            console.log('\n❌ Error parsing response:');
            console.log(data);
        }
    });
});

req.on('error', (error) => {
    console.error('Request error:', error);
});

req.write(payload);
req.end();