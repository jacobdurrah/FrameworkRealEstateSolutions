/**
 * AI Strategy Generator API Endpoint
 * Handles strategy generation requests using Claude
 */

const ClaudeClient = require('./claude-client');

// Initialize Claude client
const claudeClient = new ClaudeClient();

// Vercel serverless function handler
module.exports = async (req, res) => {
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
        claudeClient.initialize(apiKey);

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
                result = await explainStrategy(goal, context);
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

/**
 * Explain an existing strategy
 */
async function explainStrategy(strategy, context) {
    const systemPrompt = `You are an expert real estate investment advisor. Explain the given strategy in detail, including:
1. Why each decision was made
2. How the timeline was determined
3. Risk factors and mitigation
4. Expected outcomes and variations
5. Key assumptions and dependencies

Be thorough but clear, using simple language that a beginner investor can understand.`;

    const messages = [
        {
            role: 'user',
            content: `Please explain this real estate investment strategy:\n\n${JSON.stringify(strategy, null, 2)}\n\nContext: ${JSON.stringify(context, null, 2)}`
        }
    ];

    const response = await claudeClient.sendMessage(messages, systemPrompt);
    return {
        explanation: response.content[0].text,
        keyPoints: extractKeyPoints(response.content[0].text)
    };
}

/**
 * Extract key points from explanation
 */
function extractKeyPoints(explanation) {
    // Simple extraction - in production, this could use AI
    const points = [];
    const lines = explanation.split('\n');
    
    lines.forEach(line => {
        if (line.match(/^\d+\.|^-|^•/) && line.length > 20) {
            points.push(line.replace(/^\d+\.|^-|^•/, '').trim());
        }
    });
    
    return points.slice(0, 5); // Top 5 points
}

// For local testing
if (require.main === module) {
    const testGoal = "I want to build a $10,000/month rental portfolio in 3 years with $50,000";
    
    // Mock request/response for testing
    const mockReq = {
        method: 'POST',
        body: {
            goal: testGoal,
            mode: 'parse'
        },
        headers: {
            'x-anthropic-api-key': process.env.ANTHROPIC_API_KEY
        }
    };
    
    const mockRes = {
        status: (code) => ({
            json: (data) => {
                console.log(`Status ${code}:`, JSON.stringify(data, null, 2));
            },
            end: () => {}
        }),
        setHeader: () => {}
    };
    
    // Run test
    module.exports(mockReq, mockRes);
}