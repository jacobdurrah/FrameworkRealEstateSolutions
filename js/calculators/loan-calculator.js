/**
 * Loan Calculator
 * Handles mortgage calculations including PMT, principal, interest
 */

// Get BaseCalculator from appropriate source
const BaseCalc = (typeof window !== 'undefined' && window.BaseCalculator) || 
                (typeof BaseCalculator !== 'undefined' && BaseCalculator) ||
                require('./base-calculator.js');

class LoanCalculator extends BaseCalc {
    constructor() {
        super('Loan Calculator');
    }

    /**
     * Calculate loan metrics
     * @param {Object} inputs
     * @param {number} inputs.principal - Loan amount
     * @param {number} inputs.interestRate - Annual interest rate (percentage)
     * @param {number} inputs.termYears - Loan term in years
     * @param {number} inputs.downPaymentPercent - Down payment percentage (optional)
     * @param {number} inputs.purchasePrice - Purchase price (optional, for down payment calc)
     * @returns {Object} Calculation results
     */
    calculate(inputs) {
        const validation = this.validate(inputs);
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        const { principal, interestRate, termYears, downPaymentPercent, purchasePrice } = inputs;
        
        // Convert annual rate to monthly
        const monthlyRate = (interestRate / 100) / 12;
        const totalPayments = termYears * 12;
        
        // Calculate monthly payment using PMT formula
        let monthlyPayment = 0;
        if (monthlyRate > 0) {
            monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                           (Math.pow(1 + monthlyRate, totalPayments) - 1);
        } else {
            // If interest rate is 0, simple division
            monthlyPayment = principal / totalPayments;
        }
        
        // Calculate total interest
        const totalPaid = monthlyPayment * totalPayments;
        const totalInterest = totalPaid - principal;
        
        // Calculate down payment if purchase price provided
        let downPaymentAmount = 0;
        let loanToValue = 100;
        if (purchasePrice && downPaymentPercent !== undefined) {
            downPaymentAmount = purchasePrice * (downPaymentPercent / 100);
            loanToValue = (principal / purchasePrice) * 100;
        }
        
        // Calculate amortization for first year
        const firstYearBreakdown = this.calculateFirstYearAmortization(principal, monthlyRate, monthlyPayment);
        
        this.lastCalculation = {
            inputs,
            results: {
                monthlyPayment: Math.round(monthlyPayment * 100) / 100,
                totalPaid: Math.round(totalPaid * 100) / 100,
                totalInterest: Math.round(totalInterest * 100) / 100,
                downPaymentAmount: Math.round(downPaymentAmount * 100) / 100,
                loanToValue: Math.round(loanToValue * 100) / 100,
                principalFirstYear: firstYearBreakdown.principal,
                interestFirstYear: firstYearBreakdown.interest,
                balanceAfterFirstYear: firstYearBreakdown.remainingBalance
            }
        };
        
        return this.lastCalculation.results;
    }

    /**
     * Calculate first year amortization breakdown
     */
    calculateFirstYearAmortization(principal, monthlyRate, monthlyPayment) {
        let balance = principal;
        let totalPrincipal = 0;
        let totalInterest = 0;
        
        for (let month = 1; month <= 12; month++) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            
            totalInterest += interestPayment;
            totalPrincipal += principalPayment;
            balance -= principalPayment;
        }
        
        return {
            principal: Math.round(totalPrincipal * 100) / 100,
            interest: Math.round(totalInterest * 100) / 100,
            remainingBalance: Math.round(balance * 100) / 100
        };
    }

    /**
     * Calculate loan amount from monthly payment
     * @param {Object} inputs
     * @param {number} inputs.monthlyPayment - Desired monthly payment
     * @param {number} inputs.interestRate - Annual interest rate
     * @param {number} inputs.termYears - Loan term in years
     * @returns {number} Maximum loan amount
     */
    calculateLoanFromPayment(inputs) {
        const { monthlyPayment, interestRate, termYears } = inputs;
        const monthlyRate = (interestRate / 100) / 12;
        const totalPayments = termYears * 12;
        
        if (monthlyRate > 0) {
            return monthlyPayment * (Math.pow(1 + monthlyRate, totalPayments) - 1) / 
                   (monthlyRate * Math.pow(1 + monthlyRate, totalPayments));
        } else {
            return monthlyPayment * totalPayments;
        }
    }

    validate(inputs) {
        const errors = [];
        
        // Required fields
        const principalError = this.validatePositiveNumber(inputs.principal, 'Principal');
        if (principalError) errors.push(principalError);
        
        const rateError = this.validatePositiveNumber(inputs.interestRate, 'Interest rate');
        if (rateError) errors.push(rateError);
        
        const termError = this.validatePositiveNumber(inputs.termYears, 'Loan term');
        if (termError) errors.push(termError);
        
        // Optional fields
        if (inputs.downPaymentPercent !== undefined) {
            const downPaymentError = this.validatePercentage(inputs.downPaymentPercent, 'Down payment');
            if (downPaymentError) errors.push(downPaymentError);
        }
        
        if (inputs.purchasePrice !== undefined) {
            const priceError = this.validatePositiveNumber(inputs.purchasePrice, 'Purchase price');
            if (priceError) errors.push(priceError);
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    getFormula() {
        return {
            monthlyPayment: 'M = P × [r(1+r)^n] / [(1+r)^n - 1]',
            variables: {
                'M': 'Monthly payment',
                'P': 'Principal (loan amount)',
                'r': 'Monthly interest rate (annual rate / 12)',
                'n': 'Total number of payments (years × 12)'
            },
            example: 'For a $200,000 loan at 4.5% for 30 years: M = $1,013.37'
        };
    }

    getExample() {
        const inputs = {
            principal: 200000,
            interestRate: 4.5,
            termYears: 30,
            purchasePrice: 250000,
            downPaymentPercent: 20
        };
        
        const results = this.calculate(inputs);
        
        return {
            inputs,
            results,
            explanation: `For a ${this.formatCurrency(inputs.purchasePrice)} property with ` +
                        `${inputs.downPaymentPercent}% down (${this.formatCurrency(results.downPaymentAmount)}), ` +
                        `borrowing ${this.formatCurrency(inputs.principal)} at ${inputs.interestRate}% ` +
                        `for ${inputs.termYears} years results in a monthly payment of ` +
                        `${this.formatCurrency(results.monthlyPayment)}. Total interest paid over the ` +
                        `life of the loan will be ${this.formatCurrency(results.totalInterest)}.`
        };
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoanCalculator;
} else {
    window.LoanCalculator = LoanCalculator;
}