/**
 * AI-Enhanced Goal Parser
 * Uses Claude to understand complex natural language investment goals
 */

class AIGoalParser {
    constructor() {
        // Reference to AI service
        this.aiService = window.aiService;
        
        // Fallback to rule-based parser
        this.ruleBasedParser = typeof GoalParser !== 'undefined' ? new GoalParser() : null;
        
        // Complex goal patterns that need AI
        this.complexPatterns = [
            /then|after that|followed by|next/i,  // Multi-phase
            /without reinvesting|no reinvestment/i,  // Constraints
            /bonus|windfall|inheritance/i,  // Special events
            /specific|exactly|must be/i,  // Strict requirements
            /or|alternatively|either/i,  // Multiple options
            /if|when|assuming/i,  // Conditional logic
            /while|during|simultaneously/i  // Parallel actions
        ];
    }

    /**
     * Parse a goal using AI or rule-based system
     */
    async parse(naturalLanguageGoal) {
        if (!naturalLanguageGoal || naturalLanguageGoal.trim().length < 3) {
            throw new Error('Please provide a valid investment goal');
        }

        // Determine if AI parsing is needed
        const needsAI = this.requiresAIParsing(naturalLanguageGoal);
        
        if (needsAI && this.aiService) {
            try {
                console.log('Using AI to parse complex goal');
                const aiResult = await this.aiService.parseGoal(naturalLanguageGoal);
                
                // Enhance with additional analysis
                return this.enhanceAIParsedGoal(aiResult, naturalLanguageGoal);
            } catch (error) {
                console.error('AI parsing failed, falling back to rule-based:', error);
                // Fall through to rule-based parsing
            }
        }

        // Use rule-based parser
        if (this.ruleBasedParser) {
            console.log('Using rule-based goal parser');
            const parsed = this.ruleBasedParser.parse(naturalLanguageGoal);
            
            // Enhance with basic phase detection
            const phases = this.detectBasicPhases(naturalLanguageGoal);
            if (phases.length > 0) {
                parsed.phases = phases;
            }
            
            return {
                ...parsed,
                source: 'rule-based',
                complexity: needsAI ? 'high' : 'low'
            };
        }

        // Fallback to basic extraction
        return this.basicParse(naturalLanguageGoal);
    }

    /**
     * Determine if goal requires AI parsing
     */
    requiresAIParsing(goal) {
        // Check for complex patterns
        for (const pattern of this.complexPatterns) {
            if (pattern.test(goal)) {
                return true;
            }
        }

        // Check for multiple sentences (usually indicates complexity)
        const sentences = goal.split(/[.!?]+/).filter(s => s.trim().length > 0);
        if (sentences.length > 2) {
            return true;
        }

        // Check for multiple numbers (might indicate phases)
        const numbers = goal.match(/\d+/g);
        if (numbers && numbers.length > 4) {
            return true;
        }

        return false;
    }

    /**
     * Enhance AI-parsed goal with additional analysis
     */
    enhanceAIParsedGoal(aiResult, originalGoal) {
        // Add confidence score based on how well the parsing captured the intent
        const confidence = this.calculateConfidence(aiResult, originalGoal);
        
        // Detect any market-specific mentions
        const marketPreferences = this.detectMarketPreferences(originalGoal);
        
        // Identify key milestones
        const milestones = this.extractMilestones(aiResult);
        
        return {
            ...aiResult,
            confidence: confidence,
            marketPreferences: marketPreferences,
            milestones: milestones,
            originalGoal: originalGoal,
            complexity: 'high',
            source: 'ai-enhanced'
        };
    }

    /**
     * Detect basic phases from text
     */
    detectBasicPhases(goal) {
        const phases = [];
        const phaseIndicators = [
            { pattern: /first (\d+) months?/i, type: 'initial' },
            { pattern: /then .*? (\d+) months?/i, type: 'middle' },
            { pattern: /finally|lastly|end with/i, type: 'final' },
            { pattern: /months? (\d+)-(\d+)/i, type: 'range' }
        ];

        phaseIndicators.forEach(indicator => {
            const match = goal.match(indicator.pattern);
            if (match) {
                phases.push({
                    type: indicator.type,
                    duration: match[1] ? parseInt(match[1]) : null,
                    description: match[0]
                });
            }
        });

        // Also check for sequential actions
        const sequentialWords = ['first', 'second', 'then', 'next', 'after', 'finally'];
        const sentences = goal.split(/[.!?]+/);
        
        sentences.forEach((sentence, index) => {
            for (const word of sequentialWords) {
                if (sentence.toLowerCase().includes(word)) {
                    phases.push({
                        order: index + 1,
                        trigger: word,
                        description: sentence.trim()
                    });
                    break;
                }
            }
        });

        return phases;
    }

    /**
     * Basic parsing when other methods fail
     */
    basicParse(goal) {
        const parsed = {
            targetMonthlyIncome: 10000,
            timeHorizon: 36,
            startingCapital: 50000,
            monthlyContributions: 0,
            strategies: [],
            riskTolerance: 'moderate',
            source: 'basic',
            confidence: 'low'
        };

        // Try to extract numbers
        const numbers = goal.match(/\$?([\d,]+)k?/gi);
        if (numbers && numbers.length > 0) {
            // First large number is likely starting capital
            const amounts = numbers.map(n => {
                const num = parseFloat(n.replace(/[$,]/g, ''));
                return n.toLowerCase().includes('k') ? num * 1000 : num;
            });
            
            // Heuristics for common patterns
            if (amounts[0] > 5000) {
                parsed.startingCapital = amounts[0];
            }
            if (amounts[1] > 1000 && amounts[1] < 50000) {
                parsed.targetMonthlyIncome = amounts[1];
            }
        }

        // Extract time
        const timeMatch = goal.match(/(\d+)\s*(years?|months?)/i);
        if (timeMatch) {
            const time = parseInt(timeMatch[1]);
            parsed.timeHorizon = timeMatch[2].toLowerCase().includes('year') ? time * 12 : time;
        }

        // Detect strategies
        if (/flip/i.test(goal)) parsed.strategies.push('flip');
        if (/rent/i.test(goal)) parsed.strategies.push('rental');
        if (/brr+/i.test(goal)) parsed.strategies.push('brrr');

        return parsed;
    }

    /**
     * Calculate confidence score
     */
    calculateConfidence(parsed, original) {
        let score = 0;
        let factors = 0;

        // Check if key numbers were extracted
        if (parsed.targetMonthlyIncome > 0) { score += 20; factors++; }
        if (parsed.timeHorizon > 0) { score += 20; factors++; }
        if (parsed.startingCapital > 0) { score += 20; factors++; }
        
        // Check if strategies were identified
        if (parsed.strategies && parsed.strategies.length > 0) { score += 15; factors++; }
        
        // Check if constraints were captured
        if (parsed.constraints && Object.keys(parsed.constraints).length > 0) { score += 15; factors++; }
        
        // Check if phases were identified
        if (parsed.phases && parsed.phases.length > 0) { score += 10; factors++; }

        // Calculate percentage
        const percentage = factors > 0 ? (score / (factors * 20)) * 100 : 0;
        
        if (percentage >= 80) return 'high';
        if (percentage >= 60) return 'medium';
        return 'low';
    }

    /**
     * Detect market preferences
     */
    detectMarketPreferences(goal) {
        const preferences = {
            locations: [],
            propertyTypes: [],
            priceRange: null
        };

        // Common cities
        const cities = ['Detroit', 'Cleveland', 'Memphis', 'Birmingham', 'Kansas City'];
        cities.forEach(city => {
            if (goal.includes(city)) {
                preferences.locations.push(city);
            }
        });

        // Property types
        const types = [
            { pattern: /single[- ]family/i, type: 'single-family' },
            { pattern: /multi[- ]family/i, type: 'multi-family' },
            { pattern: /duplex/i, type: 'duplex' },
            { pattern: /condo/i, type: 'condo' },
            { pattern: /apartment/i, type: 'apartment' }
        ];

        types.forEach(({ pattern, type }) => {
            if (pattern.test(goal)) {
                preferences.propertyTypes.push(type);
            }
        });

        return preferences;
    }

    /**
     * Extract milestones from parsed goal
     */
    extractMilestones(parsed) {
        const milestones = [];

        // Financial milestones
        if (parsed.targetMonthlyIncome) {
            milestones.push({
                type: 'income',
                target: parsed.targetMonthlyIncome,
                description: `Reach $${parsed.targetMonthlyIncome}/month in rental income`
            });
        }

        // Property milestones
        if (parsed.phases) {
            parsed.phases.forEach((phase, index) => {
                if (phase.targetProperties) {
                    milestones.push({
                        type: 'properties',
                        target: phase.targetProperties,
                        deadline: phase.duration,
                        description: `Acquire ${phase.targetProperties} properties in phase ${index + 1}`
                    });
                }
            });
        }

        // Cash milestones
        if (parsed.constraints?.cashGoal) {
            milestones.push({
                type: 'cash',
                target: parsed.constraints.cashGoal,
                description: `Generate $${parsed.constraints.cashGoal} in cash`
            });
        }

        return milestones;
    }

    /**
     * Format parsed goal for display
     */
    formatForDisplay(parsed) {
        const sections = [];

        // Main goal
        sections.push(`📊 Target: $${parsed.targetMonthlyIncome}/month in ${parsed.timeHorizon} months`);
        
        // Capital
        sections.push(`💰 Starting Capital: $${parsed.startingCapital.toLocaleString()}`);
        
        if (parsed.monthlyContributions > 0) {
            sections.push(`💵 Monthly Savings: $${parsed.monthlyContributions}`);
        }

        // Strategies
        if (parsed.strategies?.length > 0) {
            sections.push(`🏠 Strategies: ${parsed.strategies.join(', ')}`);
        }

        // Phases
        if (parsed.phases?.length > 0) {
            sections.push(`📅 ${parsed.phases.length} phases identified`);
        }

        // Constraints
        if (parsed.constraints && Object.keys(parsed.constraints).length > 0) {
            const constraintCount = Object.keys(parsed.constraints).length;
            sections.push(`⚙️ ${constraintCount} special constraints`);
        }

        return sections.join('\n');
    }
}

// Export for use
window.AIGoalParser = AIGoalParser;