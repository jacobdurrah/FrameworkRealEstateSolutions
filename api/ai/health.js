/**
 * AI Service Health Check Endpoint
 * Verifies AI service availability
 */

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
        return res.status(405).json({ 
            error: 'Method not allowed',
            message: 'Only GET requests are accepted'
        });
    }

    try {
        // Check API key configuration
        const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
        
        // Check basic health
        const health = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            features: {
                strategyGeneration: hasApiKey,
                goalParsing: hasApiKey,
                explanations: hasApiKey
            },
            dependencies: {
                anthropicApi: hasApiKey ? 'configured' : 'missing',
                nodeVersion: process.version
            }
        };

        // If API key is missing, downgrade status
        if (!hasApiKey) {
            health.status = 'degraded';
            health.message = 'AI features unavailable - API key not configured';
        }

        res.status(200).json(health);
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            message: error.message
        });
    }
};