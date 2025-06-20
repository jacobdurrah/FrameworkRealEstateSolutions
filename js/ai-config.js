/**
 * AI Feature Configuration
 * Manages feature flags and settings for AI functionality
 */

window.AIConfig = {
    // Feature flags
    features: {
        // Core AI features
        aiStrategyGeneration: false,  // Start disabled, enable gradually
        aiGoalParsing: false,
        aiExplanations: false,
        
        // UI features
        aiLoadingAnimations: true,
        aiConfidenceScores: true,
        aiAlternativeStrategies: false,
        
        // Advanced features
        aiMarketAnalysis: false,
        aiRiskAssessment: false,
        aiTaxOptimization: false,
        
        // Safety features
        fallbackToRuleBased: true,
        caching: true,
        rateLimiting: true
    },
    
    // API settings
    api: {
        timeout: 60000,  // 60 seconds
        maxRetries: 3,
        cacheTimeout: 5 * 60 * 1000,  // 5 minutes
        rateLimitDelay: 1000  // 1 second between requests
    },
    
    // UI settings
    ui: {
        showAIBadge: true,
        showConfidenceScores: true,
        showProcessingTime: true,
        animateTransitions: true
    },
    
    // Rollout configuration
    rollout: {
        // Percentage of users who see AI features
        percentage: 0,  // Start at 0%, increase gradually
        
        // Specific user groups
        betaUsers: [],
        
        // Enable for specific domains
        enabledDomains: ['localhost'],
        
        // A/B test groups
        testGroups: {
            control: 50,  // 50% see rule-based
            treatment: 50  // 50% see AI (when enabled)
        }
    },
    
    /**
     * Check if AI should be enabled for current user
     */
    shouldEnableAI() {
        // Check if explicitly enabled
        const forceEnabled = localStorage.getItem('forceAIEnabled') === 'true';
        if (forceEnabled) return true;
        
        // Check if explicitly disabled
        const forceDisabled = localStorage.getItem('forceAIDisabled') === 'true';
        if (forceDisabled) return false;
        
        // Check domain
        const currentDomain = window.location.hostname;
        if (this.rollout.enabledDomains.includes(currentDomain)) {
            return true;
        }
        
        // Check if user is in beta
        const userId = this.getUserId();
        if (this.rollout.betaUsers.includes(userId)) {
            return true;
        }
        
        // Check rollout percentage
        const userHash = this.hashUserId(userId);
        const userPercentage = userHash % 100;
        return userPercentage < this.rollout.percentage;
    },
    
    /**
     * Get or create user ID
     */
    getUserId() {
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('userId', userId);
        }
        return userId;
    },
    
    /**
     * Simple hash function for user ID
     */
    hashUserId(userId) {
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            const char = userId.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    },
    
    /**
     * Initialize AI features based on configuration
     */
    initialize() {
        const aiEnabled = this.shouldEnableAI();
        
        if (aiEnabled) {
            console.log('AI features enabled for this user');
            
            // Enable core features
            this.features.aiStrategyGeneration = true;
            this.features.aiGoalParsing = true;
            this.features.aiExplanations = true;
            
            // Track activation
            this.trackEvent('ai_features_activated', {
                userId: this.getUserId(),
                timestamp: new Date().toISOString()
            });
        } else {
            console.log('AI features disabled - using rule-based system');
        }
        
        // Apply feature flags to services
        if (window.aiService) {
            window.aiService.features = { ...this.features };
        }
    },
    
    /**
     * Toggle AI features (for testing)
     */
    toggleAI(enabled) {
        if (enabled) {
            localStorage.setItem('forceAIEnabled', 'true');
            localStorage.removeItem('forceAIDisabled');
        } else {
            localStorage.setItem('forceAIDisabled', 'true');
            localStorage.removeItem('forceAIEnabled');
        }
        
        // Reload to apply changes
        window.location.reload();
    },
    
    /**
     * Track events for analytics
     */
    trackEvent(eventName, data = {}) {
        // In production, this would send to analytics service
        console.log('AI Event:', eventName, data);
        
        // Store locally for debugging
        const events = JSON.parse(localStorage.getItem('aiEvents') || '[]');
        events.push({
            event: eventName,
            data: data,
            timestamp: new Date().toISOString()
        });
        
        // Keep last 100 events
        if (events.length > 100) {
            events.shift();
        }
        
        localStorage.setItem('aiEvents', JSON.stringify(events));
    },
    
    /**
     * Get configuration for specific feature
     */
    getFeatureConfig(featureName) {
        return {
            enabled: this.features[featureName] || false,
            settings: this.api,
            ui: this.ui
        };
    },
    
    /**
     * Update rollout percentage (admin only)
     */
    setRolloutPercentage(percentage) {
        if (percentage >= 0 && percentage <= 100) {
            this.rollout.percentage = percentage;
            console.log(`AI rollout set to ${percentage}%`);
            
            // In production, this would be stored server-side
            localStorage.setItem('aiRolloutPercentage', percentage.toString());
        }
    },
    
    /**
     * Add beta user (admin only)
     */
    addBetaUser(userId) {
        if (!this.rollout.betaUsers.includes(userId)) {
            this.rollout.betaUsers.push(userId);
            console.log(`User ${userId} added to AI beta`);
            
            // Store beta users
            localStorage.setItem('aiBetaUsers', JSON.stringify(this.rollout.betaUsers));
        }
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    window.AIConfig.initialize();
});