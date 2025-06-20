/**
 * Goal Parser for Portfolio Simulator V3
 * Extracts investment parameters from natural language input
 */

class GoalParser {
    constructor() {
        // Define regex patterns for different parameter types
        this.patterns = {
            // Monthly income patterns
            monthlyIncome: [
                /\$?([\d,]+)\s*(?:k|K)?\s*(?:\/month|\/mo|monthly|per month|a month)/i,
                /(?:generate|earn|make|produce|need|want|target|is)\s+\$?([\d,]+)\s*(?:k|K)?\s*(?:monthly|per month|\/mo|\/month|a month)?/i,
                /(?:monthly|passive)\s+income\s+(?:of\s+|is\s+)?\$?([\d,]+)\s*(?:k|K)?/i,
                /(?:target\s+income|income\s+target)\s*(?:is\s+|:\s*)?\$?([\d,]+)\s*(?:k|K)?\s*(?:\/month|\/mo)?/i
            ],
            
            // Time horizon patterns
            timeHorizon: [
                /(?:within|in|over)\s+(\d+)\s+(?:months?)/i,
                /(?:within|in|over)\s+(\d+)\s+(?:years?)/i,
                /(\d+)\s+(?:months?|years?)\s+(?:timeline|timeframe|horizon)/i,
                /(?:by|before)\s+(\d+)\s+(?:months?|years?)/i,
                /(?:timeline|timeframe)\s*(?:is\s+|:\s*)?(\d+)\s+(?:months?)/i
            ],
            
            // Starting capital patterns
            startingCapital: [
                /(?:have|start with|starting with|begin with)\s+\$?([\d,]+)\s*(?:k|K)?/i,
                /\$?([\d,]+)\s*(?:k|K)?\s+(?:to start|starting capital|initial capital|cash|capital|in cash)/i,
                /(?:initial|starting)\s+(?:capital|cash|funds?)\s+(?:of\s+|is\s+|:\s*)?\$?([\d,]+)\s*(?:k|K)?/i,
                /(?:starting\s+capital|capital)\s*(?:is\s+|:\s*)?\$?([\d,]+)\s*(?:k|K)?/i
            ],
            
            // Monthly contribution patterns
            monthlyContribution: [
                /(?:save|add|contribute|invest)\s+\$?([\d,]+)\s*(?:k|K)?\s*(?:\/month|\/mo|monthly|per month|a month)/i,
                /(?:monthly|additional)\s+(?:savings?|contributions?|investments?)\s+(?:of\s+|is\s+|:\s*)?\$?([\d,]+)\s*(?:k|K)?/i,
                /can\s+(?:save|add|contribute)\s+\$?([\d,]+)\s*(?:k|K)?\s*(?:monthly|\/mo|\/month|per month|a month)?/i,
                /(?:monthly\s+savings|savings)\s*(?:is\s+|:\s*)?\$?([\d,]+)\s*(?:k|K)?\s*(?:\/month|\/mo)?/i
            ],
            
            // Strategy preference patterns
            strategy: [
                /(aggressive|conservative|balanced|moderate)\s*(?:approach|strategy)?/i,
                /prefer\s+(flips?|rentals?|brr+|buy.?and.?hold|brrr+)/i,
                /(flip.?heavy|rental.?heavy|mixed|combination)/i,
                /focus\s+on\s+(flips?|rentals?|brr+)/i
            ],
            
            // Target cash from sales patterns
            targetCashFromSales: [
                /\$?([\d,]+)\s*(?:k|K)?\s+(?:cash\s+)?from\s+(?:sales?|flips?|property\s+sales?)/i,
                /(?:target|aim\s+for|want|need|generate)\s+\$?([\d,]+)\s*(?:k|K)?\s+(?:in\s+)?cash(?:\s+from\s+sales?)?/i,
                /\$?([\d,]+)\s*(?:k|K)?\s+(?:target\s+)?cash\s+(?:from\s+sales?|goal)/i,
                /(?:cash\s+goal|cash\s+target)\s*(?:is\s+|:\s*)?\$?([\d,]+)\s*(?:k|K)?/i,
                /(?:make|earn|generate)\s+\$?([\d,]+)\s*(?:k|K)?\s+(?:from\s+)?(?:selling|sales?|flips?)/i
            ],
            
            // Rent patterns
            rent: [
                /rent\s+(?:is|are|of)\s*\$?([\d,]+)\s*(?:\/month|\/mo|per\s+month|monthly)?\s*(?:per\s+unit)?/i,
                /rents?\s+(?:are|is)\s*\$?([\d,]+)\s*(?:\/month|\/mo|per\s+month|monthly)?/i,
                /\$?([\d,]+)\s*(?:\/month|\/mo|per\s+month|monthly)?\s+(?:in\s+)?rent/i,
                /monthly\s+rent\s+(?:is|of)\s*\$?([\d,]+)/i,
                /rental\s+income\s+(?:is|of)\s*\$?([\d,]+)\s*(?:\/month|\/mo|per\s+month)?/i
            ],
            
            // Expense patterns
            expenses: [
                /expenses?\s+(?:are|is)\s*\$?([\d,]+)\s*(?:\/month|\/mo|per\s+month|monthly)?\s*(?:per\s+unit)?/i,
                /\$?([\d,]+)\s*(?:\/month|\/mo|per\s+month|monthly)?\s+(?:in\s+)?expenses?/i,
                /monthly\s+expenses?\s+(?:are|is|of)\s*\$?([\d,]+)/i,
                /(?:property|unit)\s+has\s+\$?([\d,]+)\s+in\s+expenses?/i,
                /operating\s+expenses?\s+(?:are|is|of)\s*\$?([\d,]+)\s*(?:\/month|\/mo)?/i
            ]
        };
        
        // Default values
        this.defaults = {
            targetMonthlyIncome: 10000,
            timeHorizon: 36,
            startingCapital: 50000,
            monthlyContributions: 0,
            preferredStrategies: [],
            riskTolerance: 'balanced',
            rentPerUnit: 1200,  // Default rent
            monthlyExpensesPerUnit: 350,  // Default expenses
            targetCashFromSales: 0  // Default to no cash target
        };
    }

    /**
     * Parse natural language input
     */
    parse(input) {
        if (!input || typeof input !== 'string') {
            throw new Error('Invalid input provided');
        }

        const result = {
            targetMonthlyIncome: this.extractMonthlyIncome(input),
            timeHorizon: this.extractTimeHorizon(input),
            startingCapital: this.extractStartingCapital(input),
            monthlyContributions: this.extractMonthlyContribution(input),
            preferredStrategies: this.extractStrategies(input),
            riskTolerance: this.extractRiskTolerance(input),
            rentPerUnit: this.extractRent(input),
            monthlyExpensesPerUnit: this.extractExpenses(input),
            targetCashFromSales: this.extractTargetCashFromSales(input),
            raw: input
        };

        // Apply defaults and validate
        return this.validateAndApplyDefaults(result);
    }

    /**
     * Extract monthly income goal
     */
    extractMonthlyIncome(input) {
        for (const pattern of this.patterns.monthlyIncome) {
            const match = input.match(pattern);
            if (match) {
                let amount = this.parseAmount(match[1]);
                // Check if 'k' or 'K' is mentioned after the number
                if (match[0].toLowerCase().includes('k') && amount < 1000) {
                    amount *= 1000;
                }
                console.log('Extracted monthly income:', amount, 'from match:', match[0]);
                return amount;
            }
        }
        return null;
    }

    /**
     * Extract time horizon
     */
    extractTimeHorizon(input) {
        for (const pattern of this.patterns.timeHorizon) {
            const match = input.match(pattern);
            if (match) {
                let months = parseInt(match[1]);
                // Convert years to months if needed
                if (match[0].toLowerCase().includes('year')) {
                    months *= 12;
                }
                console.log('Extracted time horizon:', months, 'months from match:', match[0]);
                return months;
            }
        }
        return null;
    }

    /**
     * Extract starting capital
     */
    extractStartingCapital(input) {
        for (const pattern of this.patterns.startingCapital) {
            const match = input.match(pattern);
            if (match) {
                let amount = this.parseAmount(match[1]);
                // Check if 'k' or 'K' is mentioned after the number
                if (match[0].toLowerCase().includes('k') && amount < 1000) {
                    amount *= 1000;
                }
                console.log('Extracted starting capital:', amount, 'from match:', match[0]);
                return amount;
            }
        }
        return null;
    }

    /**
     * Extract monthly contribution
     */
    extractMonthlyContribution(input) {
        for (const pattern of this.patterns.monthlyContribution) {
            const match = input.match(pattern);
            if (match) {
                let amount = this.parseAmount(match[1]);
                // Check if 'k' or 'K' is mentioned after the number
                if (match[0].toLowerCase().includes('k') && amount < 1000) {
                    amount *= 1000;
                }
                console.log('Extracted monthly contribution:', amount, 'from match:', match[0]);
                return amount;
            }
        }
        return 0; // Default to 0 if not specified
    }

    /**
     * Extract strategy preferences
     */
    extractStrategies(input) {
        const strategies = [];
        const lowerInput = input.toLowerCase();
        
        // Check for specific strategy mentions
        if (lowerInput.match(/flip/)) strategies.push('flip');
        if (lowerInput.match(/brr+|brrr+/)) strategies.push('brrr');
        if (lowerInput.match(/rental|rent|buy.?and.?hold/)) strategies.push('rental');
        
        // Check for approach preferences
        for (const pattern of this.patterns.strategy) {
            const match = input.match(pattern);
            if (match) {
                const strategy = match[1].toLowerCase();
                if (!strategies.includes(strategy)) {
                    strategies.push(strategy);
                }
            }
        }
        
        return strategies;
    }

    /**
     * Extract risk tolerance
     */
    extractRiskTolerance(input) {
        const lowerInput = input.toLowerCase();
        
        if (lowerInput.includes('aggressive') || lowerInput.includes('fast')) {
            return 'aggressive';
        }
        if (lowerInput.includes('conservative') || lowerInput.includes('safe') || lowerInput.includes('low risk')) {
            return 'conservative';
        }
        if (lowerInput.includes('balanced') || lowerInput.includes('moderate')) {
            return 'balanced';
        }
        
        // Infer from strategy preferences
        const strategies = this.extractStrategies(input);
        if (strategies.includes('flip')) return 'aggressive';
        if (strategies.includes('rental') && !strategies.includes('flip')) return 'conservative';
        
        return 'balanced';
    }

    /**
     * Extract rent per unit
     */
    extractRent(input) {
        for (const pattern of this.patterns.rent) {
            const match = input.match(pattern);
            if (match) {
                const amount = this.parseAmount(match[1]);
                console.log('Extracted rent per unit:', amount, 'from match:', match[0]);
                return amount;
            }
        }
        return null; // Will use default
    }

    /**
     * Extract expenses per unit
     */
    extractExpenses(input) {
        for (const pattern of this.patterns.expenses) {
            const match = input.match(pattern);
            if (match) {
                const amount = this.parseAmount(match[1]);
                console.log('Extracted expenses per unit:', amount, 'from match:', match[0]);
                return amount;
            }
        }
        return null; // Will use default
    }

    /**
     * Extract target cash from sales
     */
    extractTargetCashFromSales(input) {
        for (const pattern of this.patterns.targetCashFromSales) {
            const match = input.match(pattern);
            if (match) {
                let amount = this.parseAmount(match[1]);
                // Check if 'k' or 'K' is mentioned after the number
                if (match[0].toLowerCase().includes('k') && amount < 1000) {
                    amount *= 1000;
                }
                console.log('Extracted target cash from sales:', amount, 'from match:', match[0]);
                return amount;
            }
        }
        return 0; // Default to 0 if not specified
    }

    /**
     * Parse amount from string
     */
    parseAmount(amountStr) {
        if (!amountStr) return 0;
        
        // Remove commas and parse
        const cleaned = amountStr.replace(/,/g, '');
        const amount = parseFloat(cleaned);
        
        return isNaN(amount) ? 0 : amount;
    }

    /**
     * Validate and apply defaults
     */
    validateAndApplyDefaults(parsed) {
        // Apply defaults for missing values
        const result = {
            ...this.defaults,
            ...parsed
        };
        
        // Ensure non-null values
        Object.keys(result).forEach(key => {
            if (result[key] === null || result[key] === undefined) {
                result[key] = this.defaults[key];
            }
        });
        
        // Validate ranges
        result.targetMonthlyIncome = Math.max(1000, Math.min(100000, result.targetMonthlyIncome));
        result.timeHorizon = Math.max(6, Math.min(120, result.timeHorizon));
        result.startingCapital = Math.max(10000, Math.min(1000000, result.startingCapital));
        result.monthlyContributions = Math.max(0, Math.min(50000, result.monthlyContributions));
        result.targetCashFromSales = Math.max(0, Math.min(10000000, result.targetCashFromSales));
        
        // Add computed fields
        result.totalCapitalAvailable = result.startingCapital + (result.monthlyContributions * result.timeHorizon);
        
        // Calculate required properties based on actual cash flow per unit
        const cashFlowPerUnit = result.rentPerUnit - result.monthlyExpensesPerUnit;
        result.requiredProperties = Math.ceil(result.targetMonthlyIncome / cashFlowPerUnit);
        result.cashFlowPerUnit = cashFlowPerUnit;
        
        return result;
    }

    /**
     * Get parsing confidence score
     */
    getConfidence(parsed) {
        let confidence = 0;
        let fields = 0;
        
        // Check which fields were successfully parsed
        if (parsed.targetMonthlyIncome !== this.defaults.targetMonthlyIncome) {
            confidence += 20;
            fields++;
        }
        if (parsed.timeHorizon !== this.defaults.timeHorizon) {
            confidence += 20;
            fields++;
        }
        if (parsed.startingCapital !== this.defaults.startingCapital) {
            confidence += 20;
            fields++;
        }
        if (parsed.monthlyContributions > 0) {
            confidence += 10;
            fields++;
        }
        if (parsed.preferredStrategies.length > 0) {
            confidence += 10;
            fields++;
        }
        if (parsed.rentPerUnit !== this.defaults.rentPerUnit) {
            confidence += 10;
            fields++;
        }
        if (parsed.monthlyExpensesPerUnit !== this.defaults.monthlyExpensesPerUnit) {
            confidence += 10;
            fields++;
        }
        if (parsed.targetCashFromSales > 0) {
            confidence += 10;
            fields++;
        }
        
        return {
            score: confidence,
            fieldsFound: fields,
            isHighConfidence: confidence >= 75
        };
    }

    /**
     * Generate example inputs
     */
    static getExamples() {
        return [
            "I want to generate $10K/month within 36 months. I have $50K to start and can save $2K/month.",
            "Build a portfolio that produces $5,000 monthly passive income in 2 years with $30K starting capital.",
            "Need $15K per month rental income within 5 years. Starting with $100K, aggressive approach is fine.",
            "Generate $8K/mo in 24 months using BRRR strategy. Have $75K cash.",
            "Create $12,000 monthly income with buy-and-hold rentals. $60K to invest, conservative approach preferred.",
            "I want $2,000/month in 12 months. Rent is $1,300/month per unit. Expenses are $400/month.",
            "Build portfolio for $5K/month. Properties rent for $1,500 with $250 in expenses."
        ];
    }
}

// Make available globally
window.GoalParser = GoalParser;