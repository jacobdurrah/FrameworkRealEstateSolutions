/**
 * Cash Flow Calculator
 * Handles income, expenses, and net cash flow calculations
 */
class CashFlowCalculator extends BaseCalculator {
    constructor() {
        super('Cash Flow Calculator');
        
        // Standard expense ratios (can be overridden)
        this.defaultExpenseRatios = {
            propertyTax: 0.01, // 1% of property value annually
            insurance: 0.0035, // 0.35% of property value annually
            maintenance: 0.01, // 1% of property value annually
            propertyManagement: 0.08, // 8% of rent
            vacancy: 0.05, // 5% vacancy rate
            capitalReserves: 0.05, // 5% for CapEx
            utilities: 0, // Tenant pays unless specified
            hoa: 0, // No HOA unless specified
            other: 0 // No other expenses unless specified
        };
    }

    /**
     * Calculate detailed cash flow analysis
     * @param {Object} inputs
     * @param {number} inputs.monthlyRent - Gross monthly rental income
     * @param {number} inputs.propertyValue - Current property value (for % based expenses)
     * @param {number} inputs.monthlyDebtService - Monthly mortgage payment
     * @param {Object} inputs.expenses - Detailed expense breakdown (optional)
     * @param {boolean} inputs.useDefaultRatios - Use default expense ratios (default: true)
     * @returns {Object} Detailed cash flow breakdown
     */
    calculate(inputs) {
        const validation = this.validate(inputs);
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        const {
            monthlyRent,
            propertyValue,
            monthlyDebtService = 0,
            expenses = {},
            useDefaultRatios = true
        } = inputs;

        // Calculate expenses
        const monthlyExpenses = this.calculateMonthlyExpenses(
            monthlyRent,
            propertyValue,
            expenses,
            useDefaultRatios
        );

        // Calculate income adjustments
        const vacancyLoss = monthlyRent * (expenses.vacancyRate || this.defaultExpenseRatios.vacancy);
        const effectiveRent = monthlyRent - vacancyLoss;
        
        // Calculate totals
        const totalMonthlyExpenses = Object.values(monthlyExpenses).reduce((sum, expense) => sum + expense, 0);
        const operatingIncome = effectiveRent;
        const noi = operatingIncome - totalMonthlyExpenses;
        const cashFlowBeforeDebt = noi;
        const netCashFlow = noi - monthlyDebtService;
        
        // Annual calculations
        const annualRent = monthlyRent * 12;
        const annualEffectiveRent = effectiveRent * 12;
        const annualExpenses = totalMonthlyExpenses * 12;
        const annualNOI = noi * 12;
        const annualDebtService = monthlyDebtService * 12;
        const annualCashFlow = netCashFlow * 12;
        
        // Ratios and metrics
        const expenseRatio = totalMonthlyExpenses / monthlyRent;
        const operatingExpenseRatio = totalMonthlyExpenses / effectiveRent;
        const debtServiceCoverageRatio = monthlyDebtService > 0 ? noi / monthlyDebtService : null;
        const cashFlowPerUnit = netCashFlow; // For single property
        
        this.lastCalculation = {
            inputs,
            results: {
                // Monthly figures
                monthlyRent: Math.round(monthlyRent),
                vacancyLoss: Math.round(vacancyLoss),
                effectiveRent: Math.round(effectiveRent),
                expenses: monthlyExpenses,
                totalMonthlyExpenses: Math.round(totalMonthlyExpenses),
                noi: Math.round(noi),
                monthlyDebtService: Math.round(monthlyDebtService),
                netCashFlow: Math.round(netCashFlow),
                
                // Annual figures
                annualRent: Math.round(annualRent),
                annualEffectiveRent: Math.round(annualEffectiveRent),
                annualExpenses: Math.round(annualExpenses),
                annualNOI: Math.round(annualNOI),
                annualDebtService: Math.round(annualDebtService),
                annualCashFlow: Math.round(annualCashFlow),
                
                // Ratios
                expenseRatio: Math.round(expenseRatio * 10000) / 100,
                operatingExpenseRatio: Math.round(operatingExpenseRatio * 10000) / 100,
                debtServiceCoverageRatio: debtServiceCoverageRatio ? 
                    Math.round(debtServiceCoverageRatio * 100) / 100 : null,
                cashFlowPerUnit: Math.round(cashFlowPerUnit)
            }
        };
        
        return this.lastCalculation.results;
    }

    /**
     * Calculate monthly expenses based on inputs and defaults
     */
    calculateMonthlyExpenses(monthlyRent, propertyValue, customExpenses, useDefaults) {
        const expenses = {};
        
        if (useDefaults) {
            // Property value based expenses (annual, so divide by 12)
            expenses.propertyTax = (propertyValue * this.defaultExpenseRatios.propertyTax) / 12;
            expenses.insurance = (propertyValue * this.defaultExpenseRatios.insurance) / 12;
            expenses.maintenance = (propertyValue * this.defaultExpenseRatios.maintenance) / 12;
            
            // Rent based expenses
            expenses.propertyManagement = monthlyRent * this.defaultExpenseRatios.propertyManagement;
            expenses.capitalReserves = monthlyRent * this.defaultExpenseRatios.capitalReserves;
        }
        
        // Override with custom expenses if provided
        if (customExpenses.propertyTax !== undefined) expenses.propertyTax = customExpenses.propertyTax;
        if (customExpenses.insurance !== undefined) expenses.insurance = customExpenses.insurance;
        if (customExpenses.maintenance !== undefined) expenses.maintenance = customExpenses.maintenance;
        if (customExpenses.propertyManagement !== undefined) expenses.propertyManagement = customExpenses.propertyManagement;
        if (customExpenses.capitalReserves !== undefined) expenses.capitalReserves = customExpenses.capitalReserves;
        if (customExpenses.utilities !== undefined) expenses.utilities = customExpenses.utilities;
        if (customExpenses.hoa !== undefined) expenses.hoa = customExpenses.hoa;
        if (customExpenses.other !== undefined) expenses.other = customExpenses.other;
        
        // Round all expenses
        Object.keys(expenses).forEach(key => {
            expenses[key] = Math.round(expenses[key]);
        });
        
        return expenses;
    }

    /**
     * Project cash flow over time with annual increases
     * @param {Object} baseInputs - Base calculation inputs
     * @param {number} years - Number of years to project
     * @param {Object} growthRates - Annual growth rates for rent, expenses, etc.
     * @returns {Array} Year-by-year cash flow projections
     */
    projectCashFlow(baseInputs, years, growthRates = {}) {
        const {
            rentGrowth = 0.03, // 3% annual rent increase
            expenseGrowth = 0.02, // 2% annual expense increase
            valueAppreciation = 0.03 // 3% annual appreciation
        } = growthRates;
        
        const projections = [];
        let currentInputs = { ...baseInputs };
        
        for (let year = 1; year <= years; year++) {
            // Apply growth rates
            if (year > 1) {
                currentInputs.monthlyRent *= (1 + rentGrowth);
                currentInputs.propertyValue *= (1 + valueAppreciation);
                
                // Increase custom expenses if provided
                if (currentInputs.expenses) {
                    Object.keys(currentInputs.expenses).forEach(key => {
                        if (currentInputs.expenses[key]) {
                            currentInputs.expenses[key] *= (1 + expenseGrowth);
                        }
                    });
                }
            }
            
            const yearResults = this.calculate(currentInputs);
            projections.push({
                year,
                ...yearResults
            });
        }
        
        return projections;
    }

    validate(inputs) {
        const errors = [];
        
        // Required fields
        const rentError = this.validatePositiveNumber(inputs.monthlyRent, 'Monthly rent');
        if (rentError) errors.push(rentError);
        
        const valueError = this.validatePositiveNumber(inputs.propertyValue, 'Property value');
        if (valueError) errors.push(valueError);
        
        // Optional but must be non-negative
        if (inputs.monthlyDebtService !== undefined && inputs.monthlyDebtService < 0) {
            errors.push('Monthly debt service cannot be negative');
        }
        
        // Validate expense object if provided
        if (inputs.expenses && typeof inputs.expenses === 'object') {
            Object.entries(inputs.expenses).forEach(([key, value]) => {
                if (value < 0) {
                    errors.push(`${key} expense cannot be negative`);
                }
            });
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    getFormula() {
        return {
            noi: 'NOI = Effective Rent - Operating Expenses',
            effectiveRent: 'Effective Rent = Gross Rent × (1 - Vacancy Rate)',
            cashFlow: 'Cash Flow = NOI - Debt Service',
            dscr: 'DSCR = NOI / Debt Service',
            expenseRatio: 'Expense Ratio = Total Expenses / Gross Rent',
            breakdown: {
                'Operating Expenses': 'Property Tax + Insurance + Maintenance + Management + Reserves',
                'DSCR': 'Debt Service Coverage Ratio (should be > 1.2)',
                'Expense Ratio': 'Typical range: 35-50% of gross rent'
            }
        };
    }

    getExample() {
        const inputs = {
            monthlyRent: 2500,
            propertyValue: 250000,
            monthlyDebtService: 900,
            expenses: {
                propertyTax: 208, // $2,500/year
                insurance: 73,    // $875/year
                maintenance: 150,
                propertyManagement: 200, // 8% of rent
                capitalReserves: 125,   // 5% of rent
                utilities: 0,
                hoa: 50,
                other: 0
            },
            useDefaultRatios: false
        };
        
        const results = this.calculate(inputs);
        
        return {
            inputs,
            results,
            explanation: `Property generating ${this.formatCurrency(inputs.monthlyRent)} in monthly rent. ` +
                        `After ${this.formatCurrency(results.vacancyLoss)} vacancy allowance, ` +
                        `effective rent is ${this.formatCurrency(results.effectiveRent)}. ` +
                        `Total expenses of ${this.formatCurrency(results.totalMonthlyExpenses)} ` +
                        `(${results.expenseRatio}% of gross rent) result in NOI of ` +
                        `${this.formatCurrency(results.noi)}. After debt service of ` +
                        `${this.formatCurrency(inputs.monthlyDebtService)}, net cash flow is ` +
                        `${this.formatCurrency(results.netCashFlow)} per month ` +
                        `(${this.formatCurrency(results.annualCashFlow)} annually).`
        };
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CashFlowCalculator;
} else {
    window.CashFlowCalculator = CashFlowCalculator;
}