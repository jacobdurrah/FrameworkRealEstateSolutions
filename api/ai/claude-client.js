/**
 * Claude API Client
 * Handles communication with Anthropic's Claude API
 */

class ClaudeClient {
    constructor() {
        // API configuration
        this.apiUrl = 'https://api.anthropic.com/v1/messages';
        this.model = 'claude-3-opus-20240229'; // Using Claude 3 Opus for best quality
        this.maxTokens = 4096;
        
        // Rate limiting
        this.requestQueue = [];
        this.isProcessing = false;
        this.lastRequestTime = 0;
        this.minRequestInterval = 1000; // 1 second between requests
        
        // Error handling
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    /**
     * Initialize the client with API key
     */
    initialize(apiKey) {
        if (!apiKey) {
            throw new Error('Claude API key is required');
        }
        this.apiKey = apiKey;
        this.headers = {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        };
    }

    /**
     * Send a message to Claude
     */
    async sendMessage(messages, systemPrompt = null) {
        return this.queueRequest(async () => {
            const payload = {
                model: this.model,
                max_tokens: this.maxTokens,
                messages: messages
            };

            if (systemPrompt) {
                payload.system = systemPrompt;
            }

            return this.makeRequest(payload);
        });
    }

    /**
     * Generate a real estate strategy
     */
    async generateStrategy(userGoal, context = {}) {
        const systemPrompt = `You are an expert real estate investment advisor specializing in creating detailed, actionable investment strategies. You have deep knowledge of real estate markets, financing options, and investment strategies including rentals, flips, BRRR, and creative financing.

Your task is to create a comprehensive investment strategy based on the user's goals and constraints. Always provide:
1. A detailed timeline with specific actions
2. Financial projections and calculations
3. Risk assessment and mitigation strategies
4. Alternative approaches if the primary strategy has challenges
5. Clear explanations for each recommendation

Format your response as a structured JSON object with the following schema:
{
    "strategy": {
        "name": "Strategy name",
        "description": "Brief overview",
        "phases": [
            {
                "name": "Phase name",
                "duration": "Time period",
                "description": "What happens in this phase",
                "actions": [
                    {
                        "month": 1,
                        "action": "buy|sell|refinance",
                        "property": "Property description",
                        "details": {}
                    }
                ]
            }
        ],
        "summary": {
            "totalMonths": 0,
            "totalProperties": 0,
            "totalInvestment": 0,
            "monthlyIncome": 0,
            "totalProfit": 0
        },
        "risks": ["risk1", "risk2"],
        "alternatives": ["alternative1", "alternative2"]
    },
    "explanation": {
        "reasoning": "Why this strategy makes sense",
        "assumptions": ["assumption1", "assumption2"],
        "keySuccessFactors": ["factor1", "factor2"]
    }
}`;

        const messages = [
            {
                role: 'user',
                content: `Please create a real estate investment strategy for the following goal:\n\n${userGoal}\n\nContext:\n${JSON.stringify(context, null, 2)}`
            }
        ];

        try {
            const response = await this.sendMessage(messages, systemPrompt);
            return this.parseStrategyResponse(response);
        } catch (error) {
            console.error('Error generating strategy:', error);
            throw error;
        }
    }

    /**
     * Parse complex goals using AI
     */
    async parseGoal(naturalLanguageGoal) {
        const systemPrompt = `You are an expert at understanding real estate investment goals. Parse the user's natural language input and extract all relevant parameters.

Return a JSON object with these fields:
{
    "targetMonthlyIncome": number (in dollars),
    "timeHorizon": number (in months),
    "startingCapital": number (in dollars),
    "monthlyContributions": number (in dollars),
    "strategies": ["rental", "flip", "brrr"],
    "constraints": {
        "noReinvestment": boolean,
        "specificTimeline": boolean,
        "cashGoal": number (if specified),
        "propertyTypes": ["single-family", "multi-family"],
        "locations": ["city names"]
    },
    "phases": [
        {
            "duration": number (months),
            "focus": "acquisition|flipping|holding",
            "targetProperties": number
        }
    ],
    "riskTolerance": "conservative|moderate|aggressive",
    "additionalRequirements": ["requirement1", "requirement2"]
}

Be thorough in extracting all mentioned constraints and preferences.`;

        const messages = [
            {
                role: 'user',
                content: `Parse this real estate investment goal: "${naturalLanguageGoal}"`
            }
        ];

        try {
            const response = await this.sendMessage(messages, systemPrompt);
            return JSON.parse(response.content[0].text);
        } catch (error) {
            console.error('Error parsing goal:', error);
            throw error;
        }
    }

    /**
     * Queue requests to respect rate limits
     */
    async queueRequest(requestFn) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({ requestFn, resolve, reject });
            this.processQueue();
        });
    }

    /**
     * Process queued requests
     */
    async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.requestQueue.length > 0) {
            const { requestFn, resolve, reject } = this.requestQueue.shift();
            
            // Enforce rate limiting
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequestTime;
            if (timeSinceLastRequest < this.minRequestInterval) {
                await this.sleep(this.minRequestInterval - timeSinceLastRequest);
            }

            try {
                const result = await requestFn();
                this.lastRequestTime = Date.now();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }

        this.isProcessing = false;
    }

    /**
     * Make HTTP request to Claude API
     */
    async makeRequest(payload, retryCount = 0) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            if (retryCount < this.maxRetries) {
                console.warn(`Request failed, retrying (${retryCount + 1}/${this.maxRetries})...`);
                await this.sleep(this.retryDelay * Math.pow(2, retryCount));
                return this.makeRequest(payload, retryCount + 1);
            }
            throw error;
        }
    }

    /**
     * Parse strategy response from Claude
     */
    parseStrategyResponse(response) {
        try {
            // Claude returns content in a specific format
            const content = response.content[0].text;
            
            // Try to parse as JSON
            try {
                return JSON.parse(content);
            } catch (e) {
                // If not pure JSON, extract JSON from the response
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
                
                // Fallback: return structured response
                return {
                    strategy: {
                        name: 'Custom Strategy',
                        description: content,
                        phases: [],
                        summary: {}
                    },
                    explanation: {
                        reasoning: content
                    }
                };
            }
        } catch (error) {
            console.error('Error parsing strategy response:', error);
            throw new Error('Failed to parse strategy response');
        }
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const response = await this.sendMessage([
                { role: 'user', content: 'Hello' }
            ]);
            return response.content[0].text.length > 0;
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }
}

// Export as ES module
export default ClaudeClient;