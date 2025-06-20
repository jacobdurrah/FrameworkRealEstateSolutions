/**
 * AI Strategy Generator API Endpoint
 * Handles strategy generation requests using Claude
 */

import ClaudeClient from './claude-client.js';

// Initialize Claude client
const claudeClient = new ClaudeClient();

// Vercel serverless function handler
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only accept POST
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            message: 'Only POST requests are accepted'
        });
    }

    try {
        // Get API key from environment or request
        const apiKey = process.env.ANTHROPIC_API_KEY || req.headers['x-anthropic-api-key'];
        if (!apiKey) {
            return res.status(401).json({ 
                error: 'Authentication required',
                message: 'Claude API key not configured'
            });
        }

        // Initialize client with API key
        try {
            claudeClient.initialize(apiKey);
        } catch (error) {
            console.error('Failed to initialize Claude client:', error);
            return res.status(500).json({ 
                error: 'Service initialization failed',
                message: 'Unable to initialize AI service'
            });
        }

        // Parse request body
        const { goal, context, mode = 'strategy' } = req.body;

        if (!goal) {
            return res.status(400).json({ 
                error: 'Bad request',
                message: 'Goal is required'
            });
        }

        // Log request for monitoring
        console.log(`AI Strategy request - Mode: ${mode}, Goal length: ${goal.length}`);

        let result;
        
        switch (mode) {
            case 'parse':
                // Parse natural language goal
                result = await claudeClient.parseGoal(goal);
                break;
                
            case 'strategy':
                // Generate full strategy
                result = await claudeClient.generateStrategy(goal, context);
                break;
                
            case 'explain':
                // Explain an existing strategy
                result = await claudeClient.explainStrategy(goal, context);
                break;
                
            default:
                return res.status(400).json({ 
                    error: 'Invalid mode',
                    message: `Mode '${mode}' not supported`
                });
        }

        // Return successful response
        res.status(200).json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Strategy generation error:', error);
        
        // Determine error type and status code
        let statusCode = 500;
        let errorType = 'Internal server error';
        
        if (error.message.includes('API key')) {
            statusCode = 401;
            errorType = 'Authentication error';
        } else if (error.message.includes('rate limit')) {
            statusCode = 429;
            errorType = 'Rate limit exceeded';
        } else if (error.message.includes('parse')) {
            statusCode = 422;
            errorType = 'Processing error';
        }

        res.status(statusCode).json({
            error: errorType,
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

