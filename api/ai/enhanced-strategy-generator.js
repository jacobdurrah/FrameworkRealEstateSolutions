import ClaudeClient from './claude-client.js';

export const config = {
    runtime: 'nodejs',
};

// Enhanced system prompt with market awareness and multi-phase strategy support
const ENHANCED_SYSTEM_PROMPT = `You are an expert real estate investment advisor with deep knowledge of:
- Detroit real estate market conditions and trends
- Current interest rates and financing options
- Investment strategies (BRRRR, buy-and-hold, fix-and-flip, wholesale)
- Risk assessment and mitigation strategies
- Tax implications and legal considerations

When analyzing investment goals, you must:
1. Extract ALL quantifiable information (amounts, timelines, locations, property counts)
2. Identify multiple phases if the goal involves sequential steps
3. Consider market conditions and provide realistic assessments
4. Include risk analysis and mitigation strategies
5. Suggest alternative approaches when appropriate

Format your response as a JSON object with this structure:
{
  "targetMonthlyIncome": number or null,
  "timeHorizon": number (in months) or null,
  "startingCapital": number or null,
  "monthlyContributions": number or null,
  "strategies": ["rental", "flip", "wholesale", "brrrr"],
  "constraints": {
    "maxPricePerProperty": number or null,
    "totalProperties": number or null,
    "locations": ["city names"],
    "propertyTypes": ["single-family", "multi-family", "condo", "commercial"],
    "noReinvestment": boolean,
    "specificTimeline": boolean,
    "cashGoal": number or null
  },
  "phases": [
    {
      "phaseNumber": 1,
      "duration": number (months),
      "focus": "acquisition|renovation|refinance|sale|hold",
      "targetProperties": number,
      "expectedCost": number,
      "expectedRevenue": number,
      "description": "string"
    }
  ],
  "riskAssessment": {
    "level": "low|medium|high",
    "factors": ["string"],
    "mitigation": ["string"]
  },
  "marketAnalysis": {
    "targetMarket": "string",
    "currentConditions": "buyer|seller|balanced",
    "priceRange": { "min": number, "max": number },
    "expectedAppreciation": number (percentage),
    "rentalDemand": "low|medium|high"
  },
  "financingRecommendations": {
    "primaryMethod": "cash|conventional|hard-money|private|seller-financing",
    "alternativeMethods": ["string"],
    "estimatedRates": { "min": number, "max": number }
  },
  "alternativeStrategies": [
    {
      "name": "string",
      "description": "string",
      "pros": ["string"],
      "cons": ["string"]
    }
  ],
  "additionalRequirements": ["string"]
}`;

class EnhancedStrategyGenerator {
    constructor() {
        this.client = new ClaudeClient();
    }

    async generateStrategy(goal, mode = 'comprehensive', context = {}) {
        try {
            console.log('[EnhancedStrategyGenerator] Processing goal:', goal);
            console.log('[EnhancedStrategyGenerator] Mode:', mode);
            console.log('[EnhancedStrategyGenerator] Context:', context);

            // Prepare messages based on mode
            const messages = this.prepareMessages(goal, mode, context);
            
            // Get enhanced strategy from Claude
            const response = await this.client.sendMessage(messages, ENHANCED_SYSTEM_PROMPT);
            console.log('[EnhancedStrategyGenerator] Raw response:', response);

            // Parse and validate the response
            const strategy = this.parseAndValidateResponse(response, mode);
            
            // Add explanations if requested
            if (mode === 'comprehensive' || mode === 'explain') {
                strategy.explanation = await this.generateExplanation(goal, strategy);
                strategy.keyPoints = this.extractKeyPoints(strategy);
            }

            // Calculate confidence score
            strategy.confidenceScore = this.calculateConfidenceScore(strategy);

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

    prepareMessages(goal, mode, context) {
        const messages = [{
            role: 'user',
            content: `Analyze this real estate investment goal and provide a ${mode} strategy: "${goal}"`
        }];

        // Add context if provided
        if (context.marketData) {
            messages.push({
                role: 'user',
                content: `Current market data: ${JSON.stringify(context.marketData)}`
            });
        }

        if (context.userProfile) {
            messages.push({
                role: 'user',
                content: `User profile: ${JSON.stringify(context.userProfile)}`
            });
        }

        return messages;
    }

    parseAndValidateResponse(response, mode) {
        try {
            // Extract JSON from the response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            
            // Validate required fields based on mode
            if (mode === 'comprehensive') {
                this.validateComprehensiveStrategy(parsed);
            } else {
                this.validateBasicStrategy(parsed);
            }

            return parsed;
        } catch (error) {
            console.error('[EnhancedStrategyGenerator] Parse error:', error);
            throw new Error('Failed to parse AI response: ' + error.message);
        }
    }

    validateComprehensiveStrategy(strategy) {
        const requiredFields = ['strategies', 'constraints', 'phases', 'riskAssessment'];
        for (const field of requiredFields) {
            if (!strategy[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Validate phases
        if (!Array.isArray(strategy.phases) || strategy.phases.length === 0) {
            throw new Error('Strategy must include at least one phase');
        }
    }

    validateBasicStrategy(strategy) {
        const requiredFields = ['strategies', 'constraints'];
        for (const field of requiredFields) {
            if (!strategy[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
    }

    async generateExplanation(goal, strategy) {
        const explanationPrompt = `Based on the investment goal "${goal}" and the generated strategy, provide a clear, concise explanation of:
1. Why this strategy was recommended
2. Key assumptions made
3. Main risks to consider
4. Expected outcomes

Keep the explanation under 200 words and make it accessible to someone new to real estate investing.`;

        const messages = [{
            role: 'user',
            content: explanationPrompt + '\n\nStrategy: ' + JSON.stringify(strategy)
        }];

        try {
            return await this.client.sendMessage(messages, 'You are a helpful real estate investment advisor explaining strategies in simple terms.');
        } catch (error) {
            console.error('[EnhancedStrategyGenerator] Explanation error:', error);
            return 'This strategy is designed to help you achieve your real estate investment goals through a systematic approach.';
        }
    }

    extractKeyPoints(strategy) {
        const keyPoints = [];

        // Extract key financial metrics
        if (strategy.targetMonthlyIncome) {
            keyPoints.push(`Target monthly income: $${strategy.targetMonthlyIncome.toLocaleString()}`);
        }

        // Extract phase information
        if (strategy.phases && strategy.phases.length > 0) {
            keyPoints.push(`${strategy.phases.length} phase${strategy.phases.length > 1 ? 's' : ''} over ${this.calculateTotalDuration(strategy.phases)} months`);
        }

        // Extract risk level
        if (strategy.riskAssessment) {
            keyPoints.push(`Risk level: ${strategy.riskAssessment.level}`);
        }

        // Extract primary strategy
        if (strategy.strategies && strategy.strategies.length > 0) {
            keyPoints.push(`Primary strategy: ${strategy.strategies[0]}`);
        }

        return keyPoints;
    }

    calculateTotalDuration(phases) {
        return phases.reduce((total, phase) => total + (phase.duration || 0), 0);
    }

    calculateConfidenceScore(strategy) {
        let score = 0.5; // Base score

        // Increase score for completeness
        if (strategy.phases && strategy.phases.length > 0) score += 0.1;
        if (strategy.riskAssessment) score += 0.1;
        if (strategy.marketAnalysis) score += 0.1;
        if (strategy.financingRecommendations) score += 0.1;
        if (strategy.alternativeStrategies && strategy.alternativeStrategies.length > 0) score += 0.1;

        // Cap at 0.95
        return Math.min(score, 0.95);
    }

    getFallbackStrategy(goal) {
        // Basic rule-based parsing as fallback
        const numbers = goal.match(/\$?[\d,]+/g) || [];
        const months = goal.match(/(\d+)\s*(?:month|year)/gi) || [];
        
        return {
            strategies: ['rental'],
            constraints: {
                locations: this.extractLocations(goal),
                propertyTypes: ['single-family'],
                maxPricePerProperty: numbers.length > 0 ? parseInt(numbers[0].replace(/[$,]/g, '')) : null
            },
            phases: [{
                phaseNumber: 1,
                focus: 'acquisition',
                duration: months.length > 0 ? parseInt(months[0]) : 12
            }]
        };
    }

    extractLocations(text) {
        const detroitKeywords = ['detroit', 'michigan', 'mi', '313'];
        const hasDetroit = detroitKeywords.some(keyword => 
            text.toLowerCase().includes(keyword)
        );
        return hasDetroit ? ['Detroit'] : [];
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

        const generator = new EnhancedStrategyGenerator();
        const result = await generator.generateStrategy(goal, mode, context);

        return res.status(200).json(result);

    } catch (error) {
        console.error('[API] Enhanced strategy generation error:', error);
        return res.status(500).json({
            error: 'Enhanced strategy generation failed',
            message: error.message
        });
    }
}