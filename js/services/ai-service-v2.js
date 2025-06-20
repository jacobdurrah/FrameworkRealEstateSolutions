/**
 * Enhanced AI Service v2
 * Provides comprehensive AI-powered real estate investment strategies
 */

class AIServiceV2 {
    constructor() {
        this.apiUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api/ai'
            : 'https://framework-hgn314s0p-jacob-durrahs-projects.vercel.app/api/ai';
        
        this.cache = new Map();
        this.pendingRequests = new Map();
        this.retryAttempts = 3;
        this.retryDelay = 1000;
        
        // Enhanced configuration
        this.config = {
            enableAI: window.AIConfig?.features?.enableAI ?? true,
            enableCache: true,
            cacheExpiry: 30 * 60 * 1000, // 30 minutes
            timeout: 30000, // 30 seconds for complex strategies
            modes: {
                basic: { timeout: 10000, cache: true },
                comprehensive: { timeout: 30000, cache: true },
                explain: { timeout: 20000, cache: false }
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
            const endpoint = '/enhanced-strategy-generator';
            const timeout = this.config.modes[mode]?.timeout || this.config.timeout;

            const response = await this.fetchWithTimeout(
                `${this.apiUrl}${endpoint}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ goal, mode, context })
                },
                timeout
            );

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            
            // Process and enhance the response
            return this.processStrategyResponse(data, goal);

        } catch (error) {
            console.error('[AIServiceV2] Request error:', error);

            // Retry logic
            if (attempt < this.retryAttempts) {
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
     * Process and enhance strategy response
     */
    processStrategyResponse(response, goal) {
        if (!response.success) {
            return response;
        }

        const strategy = response.data;

        // Add UI-friendly formatting
        if (strategy.phases) {
            strategy.phases = strategy.phases.map((phase, index) => ({
                ...phase,
                phaseNumber: phase.phaseNumber || index + 1,
                displayName: this.getPhaseDisplayName(phase),
                timeline: this.formatPhaseTimeline(phase, index)
            }));
        }

        // Format financial numbers
        if (strategy.targetMonthlyIncome) {
            strategy.formattedIncome = `$${strategy.targetMonthlyIncome.toLocaleString()}/month`;
        }

        // Add strategy badges
        strategy.badges = this.generateStrategyBadges(strategy);

        // Store for debugging
        window.lastAIStrategy = strategy;

        return response;
    }

    /**
     * Generate strategy badges for UI display
     */
    generateStrategyBadges(strategy) {
        const badges = [];

        // Risk level badge
        if (strategy.riskAssessment) {
            badges.push({
                type: 'risk',
                label: `${strategy.riskAssessment.level} Risk`,
                color: this.getRiskColor(strategy.riskAssessment.level)
            });
        }

        // Strategy type badges
        if (strategy.strategies) {
            strategy.strategies.forEach(strat => {
                badges.push({
                    type: 'strategy',
                    label: this.formatStrategyName(strat),
                    color: 'blue'
                });
            });
        }

        // Market condition badge
        if (strategy.marketAnalysis?.currentConditions) {
            badges.push({
                type: 'market',
                label: `${strategy.marketAnalysis.currentConditions} Market`,
                color: 'purple'
            });
        }

        // Confidence score badge
        if (strategy.confidenceScore) {
            badges.push({
                type: 'confidence',
                label: `${Math.round(strategy.confidenceScore * 100)}% Confidence`,
                color: strategy.confidenceScore > 0.8 ? 'green' : 'yellow'
            });
        }

        return badges;
    }

    /**
     * Get risk color for badges
     */
    getRiskColor(level) {
        const colors = {
            low: 'green',
            medium: 'yellow',
            high: 'red'
        };
        return colors[level] || 'gray';
    }

    /**
     * Format strategy name for display
     */
    formatStrategyName(strategy) {
        const names = {
            rental: 'Buy & Hold',
            flip: 'Fix & Flip',
            brrrr: 'BRRRR',
            wholesale: 'Wholesale'
        };
        return names[strategy] || strategy.charAt(0).toUpperCase() + strategy.slice(1);
    }

    /**
     * Get phase display name
     */
    getPhaseDisplayName(phase) {
        const names = {
            acquisition: 'Property Acquisition',
            renovation: 'Renovation & Repairs',
            refinance: 'Refinancing',
            sale: 'Property Sale',
            hold: 'Hold & Rent'
        };
        return names[phase.focus] || phase.focus;
    }

    /**
     * Format phase timeline
     */
    formatPhaseTimeline(phase, index) {
        const startMonth = index === 0 ? 0 : phase.startMonth || index * 3;
        const endMonth = startMonth + (phase.duration || 3);
        return `Months ${startMonth}-${endMonth}`;
    }

    /**
     * Parse goal using AI
     */
    async parseGoal(goal) {
        return this.generateStrategy(goal, { mode: 'basic' });
    }

    /**
     * Explain strategy using AI
     */
    async explainStrategy(goal, strategy) {
        return this.generateStrategy(goal, { 
            mode: 'explain',
            context: { strategy }
        });
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
     * Get market analysis
     */
    async getMarketAnalysis(location, timeframe = '6months') {
        try {
            const response = await this.fetchWithTimeout(
                `${this.apiUrl}/market-analysis?location=${encodeURIComponent(location)}&timeframe=${timeframe}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                },
                10000
            );

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('[AIServiceV2] Market analysis error:', error);
            return {
                success: false,
                error: error.message,
                analysis: null
            };
        }
    }

    /**
     * Validate strategy
     */
    validateStrategy(strategy) {
        const errors = [];
        const warnings = [];

        // Check for required fields
        if (!strategy.strategies || strategy.strategies.length === 0) {
            errors.push('No investment strategies identified');
        }

        // Check phases
        if (!strategy.phases || strategy.phases.length === 0) {
            warnings.push('No investment phases defined');
        }

        // Check financial viability
        if (strategy.startingCapital && strategy.phases) {
            const totalCost = strategy.phases.reduce((sum, phase) => 
                sum + (phase.expectedCost || 0), 0
            );
            if (totalCost > strategy.startingCapital * 1.1) {
                warnings.push('Total costs may exceed available capital');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Get fallback strategy (non-AI)
     */
    getFallbackStrategy(goal) {
        console.log('[AIServiceV2] Using fallback strategy parser');
        
        // Extract numbers from goal
        const numbers = goal.match(/\$?[\d,]+/g) || [];
        const parsedNumbers = numbers.map(n => parseInt(n.replace(/[$,]/g, '')));
        
        // Extract time periods
        const timeMatches = goal.match(/(\d+)\s*(month|year)/gi) || [];
        const months = timeMatches.map(match => {
            const [, num, unit] = match.match(/(\d+)\s*(month|year)/i);
            return unit.toLowerCase().includes('year') ? parseInt(num) * 12 : parseInt(num);
        });

        // Detect strategy type
        const strategies = [];
        if (/rent|passive|income|cash\s*flow/i.test(goal)) strategies.push('rental');
        if (/flip|sell|profit/i.test(goal)) strategies.push('flip');
        if (/brrrr/i.test(goal)) strategies.push('brrrr');
        if (strategies.length === 0) strategies.push('rental'); // Default

        // Detect locations
        const locations = [];
        if (/detroit|michigan/i.test(goal)) locations.push('Detroit');

        return {
            success: true,
            data: {
                targetMonthlyIncome: parsedNumbers[0] || null,
                timeHorizon: months[0] || 12,
                strategies,
                constraints: {
                    locations,
                    propertyTypes: ['single-family'],
                    maxPricePerProperty: parsedNumbers[1] || null
                },
                phases: [{
                    phaseNumber: 1,
                    focus: 'acquisition',
                    duration: months[0] || 12,
                    displayName: 'Property Acquisition',
                    timeline: 'Months 0-12'
                }],
                confidenceScore: 0.6,
                badges: [
                    { type: 'fallback', label: 'Basic Analysis', color: 'gray' }
                ]
            },
            fallback: true
        };
    }

    /**
     * Utility: Fetch with timeout
     */
    async fetchWithTimeout(url, options, timeout) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    /**
     * Utility: Cache key generator
     */
    getCacheKey(type, ...params) {
        return `${type}:${params.join(':')}`;
    }

    /**
     * Utility: Delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('[AIServiceV2] Cache cleared');
    }

    /**
     * Get service status
     */
    getStatus() {
        return {
            enabled: this.config.enableAI,
            apiUrl: this.apiUrl,
            cacheSize: this.cache.size,
            pendingRequests: this.pendingRequests.size
        };
    }
}

// Create and export singleton instance
window.aiServiceV2 = new AIServiceV2();

// Also export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIServiceV2;
}