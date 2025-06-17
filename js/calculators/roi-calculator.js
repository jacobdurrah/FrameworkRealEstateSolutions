/**
 * ROI Calculator
 * Calculates various return on investment metrics for real estate
 */
class ROICalculator extends BaseCalculator {
    constructor() {
        super('ROI Calculator');
    }

    /**
     * Calculate comprehensive ROI metrics
     * @param {Object} inputs
     * @param {number} inputs.purchasePrice - Property purchase price
     * @param {number} inputs.currentValue - Current property value
     * @param {number} inputs.totalCashInvested - Total cash invested (down payment + closing costs + repairs)
     * @param {number} inputs.monthlyRent - Monthly rental income
     * @param {number} inputs.monthlyExpenses - Monthly operating expenses
     * @param {number} inputs.monthlyDebtService - Monthly mortgage payment
     * @param {number} inputs.yearsHeld - Number of years property held (optional)
     * @returns {Object} ROI metrics
     */
    calculate(inputs) {
        const validation = this.validate(inputs);
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        const {
            purchasePrice,
            currentValue,
            totalCashInvested,
            monthlyRent,
            monthlyExpenses,
            monthlyDebtService,
            yearsHeld = 1
        } = inputs;

        // Basic metrics
        const appreciation = currentValue - purchasePrice;
        const appreciationRate = (appreciation / purchasePrice) * 100;
        
        // Income metrics
        const annualRent = monthlyRent * 12;
        const annualExpenses = monthlyExpenses * 12;
        const annualDebtService = monthlyDebtService * 12;
        const noi = annualRent - annualExpenses; // Net Operating Income
        const cashFlow = noi - annualDebtService;
        const monthlyCashFlow = cashFlow / 12;
        
        // Return metrics
        const capRate = (noi / purchasePrice) * 100;
        const cashOnCashReturn = (cashFlow / totalCashInvested) * 100;
        const grossRentMultiplier = purchasePrice / annualRent;
        
        // Total return (appreciation + cash flow)
        const totalReturn = appreciation + (cashFlow * yearsHeld);
        const totalROI = (totalReturn / totalCashInvested) * 100;
        
        // Annualized ROI
        const annualizedROI = yearsHeld > 0 ? 
            (Math.pow((currentValue + (cashFlow * yearsHeld)) / totalCashInvested, 1 / yearsHeld) - 1) * 100 : 
            totalROI;
        
        // 1% Rule check (monthly rent should be >= 1% of purchase price)
        const onePercentRule = monthlyRent / purchasePrice;
        const meetsOnePercentRule = onePercentRule >= 0.01;
        
        // 50% Rule estimate (expenses typically 50% of rent)
        const fiftyPercentRuleExpenses = monthlyRent * 0.5;
        const actualExpenseRatio = (monthlyExpenses / monthlyRent) * 100;

        this.lastCalculation = {
            inputs,
            results: {
                // Value metrics
                appreciation: Math.round(appreciation),
                appreciationRate: Math.round(appreciationRate * 100) / 100,
                
                // Income metrics
                monthlyRent: Math.round(monthlyRent),
                annualRent: Math.round(annualRent),
                noi: Math.round(noi),
                monthlyCashFlow: Math.round(monthlyCashFlow),
                annualCashFlow: Math.round(cashFlow),
                
                // Return metrics
                capRate: Math.round(capRate * 100) / 100,
                cashOnCashReturn: Math.round(cashOnCashReturn * 100) / 100,
                grossRentMultiplier: Math.round(grossRentMultiplier * 100) / 100,
                totalROI: Math.round(totalROI * 100) / 100,
                annualizedROI: Math.round(annualizedROI * 100) / 100,
                
                // Rule checks
                onePercentRule: Math.round(onePercentRule * 10000) / 10000,
                meetsOnePercentRule,
                actualExpenseRatio: Math.round(actualExpenseRatio * 100) / 100,
                fiftyPercentRuleExpenses: Math.round(fiftyPercentRuleExpenses)
            }
        };
        
        return this.lastCalculation.results;
    }

    /**
     * Calculate metrics for a portfolio of properties
     * @param {Array} properties - Array of property inputs
     * @returns {Object} Portfolio-wide metrics
     */
    calculatePortfolio(properties) {
        if (!Array.isArray(properties) || properties.length === 0) {
            throw new Error('Properties array is required');
        }

        let totalValue = 0;
        let totalPurchasePrice = 0;
        let totalCashInvested = 0;
        let totalMonthlyRent = 0;
        let totalMonthlyExpenses = 0;
        let totalDebtService = 0;
        let totalAppreciation = 0;

        // Calculate individual properties and sum totals
        const propertyMetrics = properties.map(property => {
            const metrics = this.calculate(property);
            
            totalValue += property.currentValue;
            totalPurchasePrice += property.purchasePrice;
            totalCashInvested += property.totalCashInvested;
            totalMonthlyRent += property.monthlyRent;
            totalMonthlyExpenses += property.monthlyExpenses;
            totalDebtService += property.monthlyDebtService;
            totalAppreciation += metrics.appreciation;
            
            return metrics;
        });

        // Calculate portfolio metrics
        const portfolioInputs = {
            purchasePrice: totalPurchasePrice,
            currentValue: totalValue,
            totalCashInvested: totalCashInvested,
            monthlyRent: totalMonthlyRent,
            monthlyExpenses: totalMonthlyExpenses,
            monthlyDebtService: totalDebtService
        };

        const portfolioMetrics = this.calculate(portfolioInputs);

        return {
            propertyCount: properties.length,
            totalMetrics: portfolioMetrics,
            propertyMetrics,
            averageCapRate: portfolioMetrics.capRate,
            averageCashOnCash: portfolioMetrics.cashOnCashReturn,
            totalMonthlyCashFlow: portfolioMetrics.monthlyCashFlow,
            totalAnnualCashFlow: portfolioMetrics.annualCashFlow
        };
    }

    validate(inputs) {
        const errors = [];
        
        // Required fields
        const priceError = this.validatePositiveNumber(inputs.purchasePrice, 'Purchase price');
        if (priceError) errors.push(priceError);
        
        const valueError = this.validatePositiveNumber(inputs.currentValue, 'Current value');
        if (valueError) errors.push(valueError);
        
        const cashError = this.validatePositiveNumber(inputs.totalCashInvested, 'Total cash invested');
        if (cashError) errors.push(cashError);
        
        const rentError = this.validatePositiveNumber(inputs.monthlyRent, 'Monthly rent');
        if (rentError) errors.push(rentError);
        
        const expenseError = this.validatePositiveNumber(inputs.monthlyExpenses, 'Monthly expenses');
        if (expenseError) errors.push(expenseError);
        
        // Debt service can be 0 (property owned free and clear)
        if (inputs.monthlyDebtService !== undefined && inputs.monthlyDebtService < 0) {
            errors.push('Monthly debt service cannot be negative');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    getFormula() {
        return {
            capRate: 'Cap Rate = (NOI / Purchase Price) × 100',
            cashOnCash: 'Cash-on-Cash = (Annual Cash Flow / Total Cash Invested) × 100',
            roi: 'ROI = ((Current Value - Purchase Price + Total Cash Flow) / Total Cash Invested) × 100',
            noi: 'NOI = Annual Rent - Operating Expenses',
            cashFlow: 'Cash Flow = NOI - Debt Service',
            grm: 'GRM = Purchase Price / Annual Rent',
            variables: {
                'NOI': 'Net Operating Income',
                'GRM': 'Gross Rent Multiplier',
                'Cash Flow': 'Income after all expenses and debt service'
            }
        };
    }

    getExample() {
        const inputs = {
            purchasePrice: 250000,
            currentValue: 265000,
            totalCashInvested: 62500, // 25% down + closing costs
            monthlyRent: 2500,
            monthlyExpenses: 875, // 35% of rent
            monthlyDebtService: 900,
            yearsHeld: 2
        };
        
        const results = this.calculate(inputs);
        
        return {
            inputs,
            results,
            explanation: `Property purchased for ${this.formatCurrency(inputs.purchasePrice)} ` +
                        `with ${this.formatCurrency(inputs.totalCashInvested)} cash invested. ` +
                        `Monthly rent of ${this.formatCurrency(inputs.monthlyRent)} generates ` +
                        `${this.formatCurrency(results.monthlyCashFlow)} in monthly cash flow. ` +
                        `Cap Rate: ${results.capRate}%, Cash-on-Cash Return: ${results.cashOnCashReturn}%, ` +
                        `Total ROI after ${inputs.yearsHeld} years: ${results.totalROI}%`
        };
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ROICalculator;
} else {
    window.ROICalculator = ROICalculator;
}