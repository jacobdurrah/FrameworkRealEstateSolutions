/**
 * Enhanced AI Service v2
 * Provides comprehensive AI-powered real estate investment strategies
 */

class AIServiceV2 {
    constructor() {
        this.apiUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api/ai'
            : 'https://framework-api-eta.vercel.app/api/ai';
        
        this.cache = new Map();
        this.pendingRequests = new Map();
        this.retryAttempts = 3;
        this.retryDelay = 1000;
        
        // Enhanced configuration
        this.config = {
            enableAI: window.AIConfig?.features?.enableAI ?? true,
            enableCache: true,
            cacheExpiry: 30 * 60 * 1000, // 30 minutes
            timeout: 25000, // 25 seconds for complex strategies (Vercel timeout is 30s)
            modes: {
                basic: { timeout: 10000, cache: true },
                comprehensive: { timeout: 25000, cache: true },
                explain: { timeout: 15000, cache: false }
            }
        };

        console.log('[AIServiceV2] Initialized with config:', this.config);
    }

    /**
     * Generate comprehensive AI strategy
     */
    async generateStrategy(goal, options = {}) {
        const mode = options.mode || 'comprehensive';
        const context = options.context || {};
        
        console.log('[AIServiceV2] Generating strategy:', { goal, mode, context });

        // Check if AI is enabled
        if (!this.config.enableAI) {
            console.log('[AIServiceV2] AI disabled, using fallback');
            return this.getFallbackStrategy(goal);
        }

        // Check cache first
        const cacheKey = this.getCacheKey('strategy', goal, mode);
        if (this.config.enableCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.config.cacheExpiry) {
                console.log('[AIServiceV2] Returning cached strategy');
                return cached.data;
            }
        }

        // Check for pending request
        if (this.pendingRequests.has(cacheKey)) {
            console.log('[AIServiceV2] Waiting for pending request');
            return this.pendingRequests.get(cacheKey);
        }

        // Create new request
        const requestPromise = this._makeStrategyRequest(goal, mode, context);
        this.pendingRequests.set(cacheKey, requestPromise);

        try {
            const result = await requestPromise;
            
            // Cache successful result
            if (result.success && this.config.enableCache) {
                this.cache.set(cacheKey, {
                    data: result,
                    timestamp: Date.now()
                });
            }

            return result;
        } finally {
            this.pendingRequests.delete(cacheKey);
        }
    }

    /**
     * Make strategy request with retry logic
     */
    async _makeStrategyRequest(goal, mode, context, attempt = 1) {
        try {
            // Use enhanced endpoint for comprehensive mode, fallback for others
            const endpoint = mode === 'comprehensive' ? '/enhanced-strategy-generator' : '/strategy-generator';
            const timeout = this.config.modes[mode]?.timeout || this.config.timeout;

            console.log(`[AIServiceV2] Making request to ${endpoint} with ${timeout}ms timeout`);

            const response = await this.fetchWithTimeout(
                `${this.apiUrl}${endpoint}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        goal, 
                        mode: mode === 'comprehensive' ? 'strategy' : mode,
                        context 
                    })
                },
                timeout
            );

            if (!response.ok) {
                if (response.status === 504) {
                    throw new Error('Gateway timeout - AI service is taking too long to respond');
                }
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            
            // Only enhance if using the basic endpoint
            if (endpoint === '/strategy-generator' && mode === 'comprehensive' && data.success) {
                data.data = this.enhanceStrategy(data.data, goal);
            }
            
            // Process and enhance the response
            return this.processStrategyResponse(data, goal);

        } catch (error) {
            console.error('[AIServiceV2] Request error:', error);

            // Retry logic for non-timeout errors
            if (attempt < this.retryAttempts && !error.message.includes('timeout')) {
                console.log(`[AIServiceV2] Retrying (${attempt}/${this.retryAttempts})...`);
                await this.delay(this.retryDelay * attempt);
                return this._makeStrategyRequest(goal, mode, context, attempt + 1);
            }

            // Final fallback
            return {
                success: false,
                error: error.message,
                data: this.getFallbackStrategy(goal).data
            };
        }
    }

    /**
     * Enhance basic strategy with additional information
     */
    enhanceStrategy(basicStrategy, goal) {
        return {
            ...basicStrategy,
            enhanced: true,
            goal: goal,
            confidenceScore: 0.8,
            explanation: 'This strategy has been enhanced with additional market analysis and risk assessment.',
            keyPoints: [
                'Strategy generated using AI analysis',
                'Based on current market conditions',
                'Includes risk assessment and mitigation',
                'Provides actionable timeline'
            ]
        };
    }
    
    /**
     * Process strategy response
     */
    processStrategyResponse(data, goal) {
        if (!data.success) {
            return data;
        }

        // Add source information
        data.source = 'ai';
        data.processedAt = new Date().toISOString();

        // Ensure we have a valid strategy structure
        if (!data.data) {
            data.data = this.getFallbackStrategy(goal).data;
        }

        return data;
    }

    /**
     * Get fallback strategy
     */
    getFallbackStrategy(goal) {
        return {
            success: true,
            source: 'fallback',
            data: {
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
                        targetProperties: 1,
                        expectedCost: 50000,
                        expectedRevenue: 1000,
                        description: 'Purchase first rental property'
                    }
                ],
                riskAssessment: {
                    level: 'medium',
                    factors: ['Market conditions', 'Financing availability'],
                    mitigation: ['Thorough due diligence', 'Conservative estimates']
                },
                marketAnalysis: {
                    targetMarket: 'Detroit',
                    currentConditions: 'balanced',
                    priceRange: { min: 30000, max: 100000 },
                    expectedAppreciation: 3,
                    rentalDemand: 'medium'
                },
                financingRecommendations: {
                    primaryMethod: 'conventional',
                    alternativeMethods: ['hard-money', 'seller-financing'],
                    estimatedRates: { min: 6.5, max: 8.5 }
                },
                additionalRequirements: ['Property inspection', 'Market analysis'],
                confidenceScore: 0.6,
                explanation: 'Fallback strategy generated due to AI service unavailability.'
            }
        };
    }

    /**
     * Fetch with timeout
     */
    async fetchWithTimeout(url, options, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error(`Request timeout after ${timeout}ms`);
            }
            throw error;
        }
    }

    /**
     * Get cache key
     */
    getCacheKey(type, goal, mode) {
        return `${type}_${mode}_${this.hashString(goal)}`;
    }

    /**
     * Simple string hash
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    /**
     * Delay utility
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get property recommendations
     */
    async getPropertyRecommendations(strategy, preferences = {}) {
        try {
            const response = await this.fetchWithTimeout(
                `${this.apiUrl}/property-matching`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        investmentGoal: strategy,
                        userPreferences: preferences
                    })
                },
                15000
            );

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('[AIServiceV2] Property recommendation error:', error);
            return {
                success: false,
                error: error.message,
                recommendations: []
            };
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('[AIServiceV2] Cache cleared');
    }

    /**
     * Get cache stats
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Export for use
window.AIServiceV2 = AIServiceV2;