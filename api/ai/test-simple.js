import ClaudeClient from './claude-client.js';

export const config = {
    runtime: 'nodejs',
    maxDuration: 15,
};

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { goal } = req.body;

        if (!goal) {
            return res.status(400).json({ error: 'Goal is required' });
        }

        // Get API key from environment
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                error: 'Service configuration error',
                message: 'AI service is not properly configured'
            });
        }

        console.log('[Test Simple] Starting simple test');
        const startTime = Date.now();

        // Simple test with Claude
        const client = new ClaudeClient();
        client.initialize(apiKey);
        
        const response = await client.sendMessage([
            { role: 'user', content: `Analyze this goal: "${goal}"` }
        ], 'You are a real estate advisor. Respond briefly.');

        const duration = Date.now() - startTime;
        console.log(`[Test Simple] Completed in ${duration}ms`);

        return res.status(200).json({
            success: true,
            response: response.content[0].text,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[Test Simple] Error:', error);
        return res.status(500).json({
            error: 'Test failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
} 