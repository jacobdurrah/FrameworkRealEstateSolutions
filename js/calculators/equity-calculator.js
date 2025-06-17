/**
 * Equity Calculator
 * Calculates property and portfolio equity positions
 */
class EquityCalculator extends BaseCalculator {
    constructor() {
        super('Equity Calculator');
    }

    /**
     * Calculate equity for a single property
     * @param {Object} inputs
     * @param {number} inputs.currentValue - Current market value of property
     * @param {number} inputs.mortgageBalance - Outstanding mortgage balance
     * @param {number} inputs.purchasePrice - Original purchase price
     * @param {number} inputs.initialDownPayment - Initial down payment made
     * @param {number} inputs.principalPaid - Total principal paid to date (optional)
     * @param {number} inputs.appreciation - Total appreciation amount (optional)
     * @returns {Object} Equity calculation results
     */
    calculate(inputs) {
        const validation = this.validate(inputs);
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        const {
            currentValue,
            mortgageBalance,
            purchasePrice,
            initialDownPayment,
            principalPaid = null,
            appreciation = null
        } = inputs;

        // Basic equity calculation
        const currentEquity = currentValue - mortgageBalance;
        const equityPercentage = (currentEquity / currentValue) * 100;
        
        // Calculate appreciation if not provided
        const actualAppreciation = appreciation !== null ? appreciation : currentValue - purchasePrice;
        const appreciationRate = (actualAppreciation / purchasePrice) * 100;
        
        // Calculate principal paid if not provided
        const actualPrincipalPaid = principalPaid !== null ? 
            principalPaid : 
            (purchasePrice - initialDownPayment - mortgageBalance);
        
        // Equity sources breakdown
        const equitySources = {
            downPayment: initialDownPayment,
            principalPaydown: actualPrincipalPaid,
            appreciation: actualAppreciation,
            total: currentEquity
        };
        
        // Verify equity sources add up
        const calculatedTotal = equitySources.downPayment + 
                              equitySources.principalPaydown + 
                              equitySources.appreciation;
        
        // Return on equity calculations
        const totalCashInvested = initialDownPayment; // Could include closing costs, repairs
        const equityMultiple = currentEquity / totalCashInvested;
        const equityGrowth = currentEquity - initialDownPayment;
        const equityGrowthRate = (equityGrowth / initialDownPayment) * 100;
        
        // Loan-to-value ratio
        const ltv = (mortgageBalance / currentValue) * 100;
        
        this.lastCalculation = {
            inputs,
            results: {
                currentEquity: Math.round(currentEquity),
                equityPercentage: Math.round(equityPercentage * 100) / 100,
                mortgageBalance: Math.round(mortgageBalance),
                ltv: Math.round(ltv * 100) / 100,
                
                // Appreciation metrics
                appreciation: Math.round(actualAppreciation),
                appreciationRate: Math.round(appreciationRate * 100) / 100,
                
                // Equity sources
                equitySources: {
                    downPayment: Math.round(equitySources.downPayment),
                    principalPaydown: Math.round(equitySources.principalPaydown),
                    appreciation: Math.round(equitySources.appreciation),
                    total: Math.round(equitySources.total)
                },
                
                // Return metrics
                equityMultiple: Math.round(equityMultiple * 100) / 100,
                equityGrowth: Math.round(equityGrowth),
                equityGrowthRate: Math.round(equityGrowthRate * 100) / 100,
                
                // Additional info
                currentValue: Math.round(currentValue),
                purchasePrice: Math.round(purchasePrice)
            }
        };
        
        return this.lastCalculation.results;
    }

    /**
     * Calculate portfolio-wide equity
     * @param {Array} properties - Array of property equity inputs
     * @returns {Object} Portfolio equity summary
     */
    calculatePortfolioEquity(properties) {
        if (!Array.isArray(properties) || properties.length === 0) {
            throw new Error('Properties array is required');
        }

        let totalValue = 0;
        let totalDebt = 0;
        let totalEquity = 0;
        let totalDownPayments = 0;
        let totalPrincipalPaid = 0;
        let totalAppreciation = 0;
        let totalPurchasePrice = 0;

        const propertyEquities = properties.map((property, index) => {
            try {
                const equity = this.calculate(property);
                
                totalValue += equity.currentValue;
                totalDebt += equity.mortgageBalance;
                totalEquity += equity.currentEquity;
                totalDownPayments += equity.equitySources.downPayment;
                totalPrincipalPaid += equity.equitySources.principalPaydown;
                totalAppreciation += equity.equitySources.appreciation;
                totalPurchasePrice += property.purchasePrice;
                
                return {
                    propertyId: property.id || index,
                    address: property.address || `Property ${index + 1}`,
                    equity
                };
            } catch (error) {
                console.error(`Error calculating equity for property ${index}:`, error);
                return null;
            }
        }).filter(Boolean);

        // Calculate portfolio metrics
        const portfolioLTV = totalValue > 0 ? (totalDebt / totalValue) * 100 : 0;
        const portfolioEquityPercentage = totalValue > 0 ? (totalEquity / totalValue) * 100 : 0;
        const portfolioAppreciationRate = totalPurchasePrice > 0 ? 
            (totalAppreciation / totalPurchasePrice) * 100 : 0;
        
        // Average metrics
        const averageLTV = propertyEquities.reduce((sum, p) => sum + p.equity.ltv, 0) / propertyEquities.length;
        const averageEquityPerProperty = totalEquity / propertyEquities.length;

        return {
            propertyCount: propertyEquities.length,
            
            // Totals
            totalValue: Math.round(totalValue),
            totalDebt: Math.round(totalDebt),
            totalEquity: Math.round(totalEquity),
            
            // Equity sources
            equitySources: {
                downPayments: Math.round(totalDownPayments),
                principalPaydown: Math.round(totalPrincipalPaid),
                appreciation: Math.round(totalAppreciation),
                total: Math.round(totalEquity)
            },
            
            // Portfolio metrics
            portfolioLTV: Math.round(portfolioLTV * 100) / 100,
            portfolioEquityPercentage: Math.round(portfolioEquityPercentage * 100) / 100,
            portfolioAppreciationRate: Math.round(portfolioAppreciationRate * 100) / 100,
            
            // Averages
            averageLTV: Math.round(averageLTV * 100) / 100,
            averageEquityPerProperty: Math.round(averageEquityPerProperty),
            
            // Property details
            properties: propertyEquities
        };
    }

    /**
     * Project equity growth over time
     * @param {Object} currentInputs - Current property inputs
     * @param {number} years - Years to project
     * @param {Object} assumptions - Growth assumptions
     * @returns {Array} Year-by-year equity projections
     */
    projectEquityGrowth(currentInputs, years, assumptions = {}) {
        const {
            appreciationRate = 0.03, // 3% annual appreciation
            monthlyPayment = 0,      // Monthly mortgage payment
            interestRate = 0.045     // Annual interest rate
        } = assumptions;

        const projections = [];
        let balance = currentInputs.mortgageBalance;
        let value = currentInputs.currentValue;
        const monthlyRate = interestRate / 12;
        
        for (let year = 0; year <= years; year++) {
            // Calculate principal paid this year
            let yearlyPrincipalPaid = 0;
            if (monthlyPayment > 0 && balance > 0) {
                for (let month = 0; month < 12 && balance > 0; month++) {
                    const interestPayment = balance * monthlyRate;
                    const principalPayment = Math.min(monthlyPayment - interestPayment, balance);
                    yearlyPrincipalPaid += principalPayment;
                    balance -= principalPayment;
                }
            }
            
            // Apply appreciation
            if (year > 0) {
                value *= (1 + appreciationRate);
            }
            
            // Calculate equity
            const equity = value - balance;
            const equityPercentage = (equity / value) * 100;
            
            projections.push({
                year,
                propertyValue: Math.round(value),
                mortgageBalance: Math.round(balance),
                equity: Math.round(equity),
                equityPercentage: Math.round(equityPercentage * 100) / 100,
                yearlyPrincipalPaid: Math.round(yearlyPrincipalPaid),
                cumulativeAppreciation: Math.round(value - currentInputs.currentValue)
            });
        }
        
        return projections;
    }

    validate(inputs) {
        const errors = [];
        
        // Required fields
        const valueError = this.validatePositiveNumber(inputs.currentValue, 'Current value');
        if (valueError) errors.push(valueError);
        
        // Mortgage balance can be 0 but not negative
        if (inputs.mortgageBalance < 0) {
            errors.push('Mortgage balance cannot be negative');
        }
        
        const priceError = this.validatePositiveNumber(inputs.purchasePrice, 'Purchase price');
        if (priceError) errors.push(priceError);
        
        // Down payment validation
        if (inputs.initialDownPayment < 0) {
            errors.push('Initial down payment cannot be negative');
        }
        
        if (inputs.initialDownPayment > inputs.purchasePrice) {
            errors.push('Down payment cannot exceed purchase price');
        }
        
        // Optional field validation
        if (inputs.principalPaid !== undefined && inputs.principalPaid !== null && inputs.principalPaid < 0) {
            errors.push('Principal paid cannot be negative');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    getFormula() {
        return {
            equity: 'Equity = Current Value - Mortgage Balance',
            equityPercentage: 'Equity % = (Equity / Current Value) × 100',
            ltv: 'LTV = (Mortgage Balance / Current Value) × 100',
            equitySources: 'Total Equity = Down Payment + Principal Paydown + Appreciation',
            equityGrowth: 'Equity Growth Rate = ((Current Equity - Initial Down Payment) / Initial Down Payment) × 100',
            concepts: {
                'Equity': 'Your ownership stake in the property',
                'LTV': 'Loan-to-Value ratio (lower is better)',
                'Equity Sources': 'Three ways equity grows: down payment, paying down loan, and appreciation'
            }
        };
    }

    getExample() {
        const inputs = {
            currentValue: 300000,
            mortgageBalance: 180000,
            purchasePrice: 250000,
            initialDownPayment: 50000,
            principalPaid: 20000
        };
        
        const results = this.calculate(inputs);
        
        return {
            inputs,
            results,
            explanation: `Property purchased for ${this.formatCurrency(inputs.purchasePrice)} ` +
                        `with ${this.formatCurrency(inputs.initialDownPayment)} down payment. ` +
                        `Current value of ${this.formatCurrency(inputs.currentValue)} with ` +
                        `${this.formatCurrency(inputs.mortgageBalance)} mortgage balance ` +
                        `results in ${this.formatCurrency(results.currentEquity)} equity ` +
                        `(${results.equityPercentage}% of property value). ` +
                        `Equity has grown ${results.equityGrowthRate}% from initial investment. ` +
                        `Sources: Down payment (${this.formatCurrency(results.equitySources.downPayment)}), ` +
                        `Principal paydown (${this.formatCurrency(results.equitySources.principalPaydown)}), ` +
                        `Appreciation (${this.formatCurrency(results.equitySources.appreciation)}).`
        };
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EquityCalculator;
} else {
    window.EquityCalculator = EquityCalculator;
}