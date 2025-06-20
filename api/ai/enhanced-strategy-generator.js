import ClaudeClient from './claude-client.js';

export const config = {
    runtime: 'nodejs',
    maxDuration: 20, // Reduced timeout to avoid Vercel limits
};

// Simplified system prompt for faster processing
const SIMPLIFIED_SYSTEM_PROMPT = `You are an expert real estate investment advisor. Analyze the investment goal and provide a concise strategy.

Return ONLY a JSON object with this structure:
{
  "targetMonthlyIncome": number or null,
  "timeHorizon": number (in months) or null,
  "startingCapital": number or null,
  "strategies": ["rental", "flip", "wholesale", "brrrr"],
  "constraints": {
    "maxPricePerProperty": number or null,
    "locations": ["city names"],
    "propertyTypes": ["single-family", "multi-family"]
  },
  "phases": [
    {
      "phaseNumber": 1,
      "duration": number (months),
      "focus": "acquisition|renovation|refinance|sale",
      "description": "string"
    }
  ],
  "riskAssessment": {
    "level": "low|medium|high",
    "factors": ["string"]
  }
}

Keep the response concise and focused.`;

class EnhancedStrategyGenerator {
    constructor(apiKey) {
        this.client = new ClaudeClient();
        if (apiKey) {
            this.client.initialize(apiKey);
        }
    }

    async generateStrategy(goal, mode = 'comprehensive', context = {}) {
        try {
            console.log('[EnhancedStrategyGenerator] Processing goal:', goal);

            // Use simplified prompt for faster processing
            const messages = [{
                role: 'user',
                content: `Analyze this real estate investment goal: "${goal}"`
            }];
            
            // Get strategy from Claude with timeout
            const response = await this.client.sendMessage(messages, SIMPLIFIED_SYSTEM_PROMPT);
            console.log('[EnhancedStrategyGenerator] Response received');

            // Extract text content from Claude response
            const responseText = response.content[0].text;
            
            // Parse and validate the response
            const strategy = this.parseAndValidateResponse(responseText);
            
            // Add basic confidence score
            strategy.confidenceScore = 0.8;

            return {
                success: true,
                data: strategy,
                mode: mode,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('[EnhancedStrategyGenerator] Error:', error);
            
            // Return fallback response
            return {
                success: false,
                error: error.message,
                fallback: this.getFallbackStrategy(goal),
                timestamp: new Date().toISOString()
            };
        }
    }

    parseAndValidateResponse(responseText) {
        try {
            console.log('[EnhancedStrategyGenerator] Parsing response');
            
            // Extract JSON from the response text
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error('[EnhancedStrategyGenerator] No JSON found in response');
                throw new Error('No JSON found in AI response');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            console.log('[EnhancedStrategyGenerator] Successfully parsed JSON');
            
            // Validate required fields
            this.validateStrategy(parsed);

            return parsed;
        } catch (error) {
            console.error('[EnhancedStrategyGenerator] Parse error:', error);
            throw new Error('Failed to parse AI response: ' + error.message);
        }
    }

    validateStrategy(strategy) {
        const requiredFields = ['strategies', 'constraints'];
        for (const field of requiredFields) {
            if (!strategy[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Ensure strategies is an array
        if (!Array.isArray(strategy.strategies)) {
            strategy.strategies = ['rental'];
        }

        // Ensure constraints exists
        if (!strategy.constraints) {
            strategy.constraints = {
                locations: [],
                propertyTypes: ['single-family']
            };
        }
    }

    getFallbackStrategy(goal) {
        // Simple fallback strategy
        return {
            strategies: ['rental'],
            constraints: {
                locations: [],
                propertyTypes: ['single-family'],
                maxPricePerProperty: null
            },
            phases: [
                {
                    phaseNumber: 1,
                    focus: 'acquisition',
                    duration: 12,
                    description: 'Purchase first rental property'
                }
            ],
            riskAssessment: {
                level: 'medium',
                factors: ['Market conditions', 'Financing availability']
            },
            confidenceScore: 0.6
        };
    }
}

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
        const { goal, mode = 'comprehensive', context = {} } = req.body;

        if (!goal) {
            return res.status(400).json({ error: 'Goal is required' });
        }

        // Get API key from environment
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            console.error('[API] No Anthropic API key found in environment');
            return res.status(500).json({
                error: 'Service configuration error',
                message: 'AI service is not properly configured'
            });
        }

        console.log('[API] Starting enhanced strategy generation');
        const startTime = Date.now();

        const generator = new EnhancedStrategyGenerator(apiKey);
        const result = await generator.generateStrategy(goal, mode, context);

        const duration = Date.now() - startTime;
        console.log(`[API] Strategy generation completed in ${duration}ms`);

        return res.status(200).json(result);

    } catch (error) {
        console.error('[API] Enhanced strategy generation error:', error);
        return res.status(500).json({
            error: 'Enhanced strategy generation failed',
            message: error.message
        });
    }
}