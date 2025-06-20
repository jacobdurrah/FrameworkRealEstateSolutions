/**
 * AI Service
 * Frontend service for AI-powered features
 */

class AIService {
    constructor() {
        // API configuration
        this.apiBaseUrl = this.getApiUrl();
        this.timeout = 60000; // 60 seconds for AI responses
        
        // Cache for responses
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        // Feature flags
        this.features = {
            aiStrategyGeneration: true,
            aiGoalParsing: true,
            aiExplanations: true,
            caching: true,
            fallbackToRuleBased: true
        };
        
        // Initialize
        this.initialize();
    }

    /**
     * Initialize the service
     */
    initialize() {
        // Check if AI features are enabled
        const aiEnabled = localStorage.getItem('aiEnabled');
        if (aiEnabled === 'false') {
            console.log('AI features disabled by user preference');
            this.features.aiStrategyGeneration = false;
            this.features.aiGoalParsing = false;
        }
        
        // Load API key if stored locally (for development)
        this.apiKey = localStorage.getItem('anthropicApiKey') || null;
    }

    /**
     * Get appropriate API URL based on environment
     */
    getApiUrl() {
        if (window.location.hostname === 'localhost') {
            return 'http://localhost:3000/api/ai';
        } else if (window.location.hostname === 'frameworkrealestatesolutions.com') {
            return 'https://framework-api-eta.vercel.app/api/ai';
        } else {
            return '/api/ai';
        }
    }

    /**
     * Generate strategy using AI
     */
    async generateStrategy(goal, context = {}) {
        // Check if AI is enabled
        if (!this.features.aiStrategyGeneration) {
            console.log('AI strategy generation disabled, using rule-based system');
            return this.fallbackToRuleBased(goal, context);
        }

        // Check cache first
        const cacheKey = this.getCacheKey('strategy', goal, context);
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            console.log('Using cached AI strategy');
            return cached;
        }

        try {
            // Show loading state
            this.showLoadingState('Generating AI-powered strategy...');
            
            const response = await this.makeRequest('/strategy-generator', {
                goal: goal,
                context: context,
                mode: 'strategy'
            });

            if (response.success) {
                // Cache the response
                this.storeInCache(cacheKey, response.data);
                
                // Convert AI response to timeline format
                const timeline = this.convertAIStrategyToTimeline(response.data);
                
                return {
                    ...response.data,
                    timeline: timeline,
                    source: 'ai'
                };
            } else {
                throw new Error(response.message || 'Strategy generation failed');
            }
        } catch (error) {
            console.error('AI strategy generation failed:', error);
            
            // Fallback to rule-based if enabled
            if (this.features.fallbackToRuleBased) {
                console.log('Falling back to rule-based strategy generation');
                return this.fallbackToRuleBased(goal, context);
            }
            
            throw error;
        } finally {
            this.hideLoadingState();
        }
    }

    /**
     * Parse goal using AI
     */
    async parseGoal(naturalLanguageGoal) {
        // Check if AI parsing is enabled
        if (!this.features.aiGoalParsing) {
            console.log('AI goal parsing disabled, using rule-based parser');
            return this.parseGoalRuleBased(naturalLanguageGoal);
        }

        // Check cache
        const cacheKey = this.getCacheKey('parse', naturalLanguageGoal);
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            console.log('Using cached goal parse result');
            return cached;
        }

        try {
            const response = await this.makeRequest('/strategy-generator', {
                goal: naturalLanguageGoal,
                mode: 'parse'
            });

            if (response.success) {
                // Cache the response
                this.storeInCache(cacheKey, response.data);
                
                // Merge with defaults
                const parsedGoal = this.mergeWithDefaults(response.data);
                
                return {
                    ...parsedGoal,
                    source: 'ai',
                    confidence: 'high'
                };
            } else {
                throw new Error(response.message || 'Goal parsing failed');
            }
        } catch (error) {
            console.error('AI goal parsing failed:', error);
            
            // Fallback to rule-based parser
            return this.parseGoalRuleBased(naturalLanguageGoal);
        }
    }

    /**
     * Get explanation for a strategy
     */
    async explainStrategy(strategy, context = {}) {
        if (!this.features.aiExplanations) {
            return {
                explanation: 'AI explanations are currently disabled.',
                keyPoints: []
            };
        }

        try {
            const response = await this.makeRequest('/strategy-generator', {
                goal: strategy,
                context: context,
                mode: 'explain'
            });

            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.message || 'Explanation generation failed');
            }
        } catch (error) {
            console.error('AI explanation failed:', error);
            return {
                explanation: 'Unable to generate explanation at this time.',
                keyPoints: [],
                error: error.message
            };
        }
    }

    /**
     * Make API request
     */
    async makeRequest(endpoint, data) {
        const url = `${this.apiBaseUrl}${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Add API key if available
        if (this.apiKey) {
            headers['x-anthropic-api-key'] = this.apiKey;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const responseData = await response.json();
            
            if (!response.ok) {
                throw new Error(responseData.message || `HTTP ${response.status}`);
            }

            return responseData;
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - AI service is taking too long');
            }
            
            throw error;
        }
    }

    /**
     * Convert AI strategy to timeline format
     */
    convertAIStrategyToTimeline(aiStrategy) {
        const timeline = [];
        let eventId = 1;

        // Process each phase
        if (aiStrategy.strategy && aiStrategy.strategy.phases) {
            aiStrategy.strategy.phases.forEach(phase => {
                if (phase.actions) {
                    phase.actions.forEach(action => {
                        timeline.push({
                            id: eventId++,
                            month: action.month,
                            action: action.action,
                            property: action.property,
                            price: action.details?.price || 0,
                            downPercent: action.details?.downPercent || 20,
                            rent: action.details?.rent || 0,
                            monthlyExpenses: action.details?.expenses || 350,
                            rate: action.details?.rate || 7,
                            term: action.details?.term || 30,
                            ...action.details
                        });
                    });
                }
            });
        }

        return timeline;
    }

    /**
     * Fallback to rule-based strategy generation
     */
    fallbackToRuleBased(goal, context) {
        // Use existing GoalParser and StrategyGenerator
        if (typeof GoalParser !== 'undefined' && typeof StrategyGenerator !== 'undefined') {
            const parser = new GoalParser();
            const generator = new StrategyGenerator();
            
            const parsedGoal = parser.parse(goal);
            const strategy = generator.generateStrategy(parsedGoal, context.approach || 'balanced');
            
            return {
                ...strategy,
                source: 'rule-based',
                fallback: true
            };
        }
        
        throw new Error('No strategy generation method available');
    }

    /**
     * Parse goal using rule-based system
     */
    parseGoalRuleBased(naturalLanguageGoal) {
        if (typeof GoalParser !== 'undefined') {
            const parser = new GoalParser();
            const parsed = parser.parse(naturalLanguageGoal);
            
            return {
                ...parsed,
                source: 'rule-based',
                confidence: 'medium'
            };
        }
        
        // Minimal fallback
        return {
            targetMonthlyIncome: 10000,
            timeHorizon: 36,
            startingCapital: 50000,
            monthlyContributions: 0,
            source: 'default',
            confidence: 'low'
        };
    }

    /**
     * Merge parsed goal with defaults
     */
    mergeWithDefaults(parsedGoal) {
        const defaults = {
            targetMonthlyIncome: 10000,
            timeHorizon: 36,
            startingCapital: 50000,
            monthlyContributions: 0,
            strategies: ['rental'],
            riskTolerance: 'moderate',
            constraints: {}
        };

        return {
            ...defaults,
            ...parsedGoal,
            constraints: {
                ...defaults.constraints,
                ...parsedGoal.constraints
            }
        };
    }

    /**
     * Cache management
     */
    getCacheKey(type, ...params) {
        return `${type}:${JSON.stringify(params)}`;
    }

    getFromCache(key) {
        if (!this.features.caching) return null;
        
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        
        // Remove expired entry
        this.cache.delete(key);
        return null;
    }

    storeInCache(key, data) {
        if (!this.features.caching) return;
        
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    /**
     * UI helpers
     */
    showLoadingState(message = 'Processing...') {
        // Update UI to show loading
        const loadingEl = document.getElementById('aiLoadingMessage');
        if (loadingEl) {
            loadingEl.textContent = message;
            loadingEl.style.display = 'block';
        }
    }

    hideLoadingState() {
        const loadingEl = document.getElementById('aiLoadingMessage');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }

    /**
     * Enable/disable AI features
     */
    setAIEnabled(enabled) {
        this.features.aiStrategyGeneration = enabled;
        this.features.aiGoalParsing = enabled;
        this.features.aiExplanations = enabled;
        
        // Persist preference
        localStorage.setItem('aiEnabled', enabled.toString());
    }

    /**
     * Check if AI is available
     */
    async checkAvailability() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/health`, {
                method: 'GET',
                headers: {
                    'x-anthropic-api-key': this.apiKey
                }
            });
            
            return response.ok;
        } catch (error) {
            console.error('AI service health check failed:', error);
            return false;
        }
    }
}

// Create singleton instance
const aiService = new AIService();

// Export for use in other files
window.aiService = aiService;