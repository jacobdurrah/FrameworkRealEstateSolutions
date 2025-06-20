import ClaudeClient from './claude-client.js';

export const config = {
    runtime: 'nodejs',
    maxDuration: 10,
};

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only accept GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const healthCheck = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        services: {}
    };

    try {
        // Check environment variables
        const apiKey = process.env.ANTHROPIC_API_KEY;
        healthCheck.services.environment = {
            anthropicApiKey: apiKey ? 'configured' : 'missing',
            nodeEnv: process.env.NODE_ENV || 'not set'
        };

        // Test Claude API if key is available
        if (apiKey) {
            try {
                const client = new ClaudeClient();
                client.initialize(apiKey);
                
                const startTime = Date.now();
                const response = await client.sendMessage([
                    { role: 'user', content: 'Hello' }
                ], 'You are a helpful assistant.');
                const duration = Date.now() - startTime;

                healthCheck.services.claude = {
                    status: 'healthy',
                    responseTime: `${duration}ms`,
                    responseLength: response.content[0].text.length
                };
            } catch (error) {
                healthCheck.services.claude = {
                    status: 'error',
                    error: error.message
                };
                healthCheck.status = 'degraded';
            }
        } else {
            healthCheck.services.claude = {
                status: 'not_configured',
                message: 'ANTHROPIC_API_KEY not set'
            };
            healthCheck.status = 'degraded';
        }

        // Check memory usage
        const memUsage = process.memoryUsage();
        healthCheck.services.memory = {
            rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
        };

        // Check uptime
        healthCheck.services.uptime = {
            process: `${Math.round(process.uptime())}s`,
            timestamp: Date.now()
        };

        return res.status(200).json(healthCheck);

    } catch (error) {
        console.error('[Health Check] Error:', error);
        
        healthCheck.status = 'unhealthy';
        healthCheck.error = error.message;
        
        return res.status(500).json(healthCheck);
    }
}