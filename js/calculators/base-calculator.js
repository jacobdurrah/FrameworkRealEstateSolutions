/**
 * Base Calculator Class
 * Provides common interface for all financial calculators
 */
class BaseCalculator {
    constructor(name) {
        this.name = name;
        this.lastCalculation = null;
    }

    /**
     * Perform calculation with given inputs
     * @param {Object} inputs - Input parameters for calculation
     * @returns {Object} Calculation results
     */
    calculate(inputs) {
        throw new Error('calculate() must be implemented by subclass');
    }

    /**
     * Validate inputs before calculation
     * @param {Object} inputs - Input parameters to validate
     * @returns {Object} { valid: boolean, errors: string[] }
     */
    validate(inputs) {
        throw new Error('validate() must be implemented by subclass');
    }

    /**
     * Get the mathematical formula used
     * @returns {string} LaTeX or plain text formula
     */
    getFormula() {
        throw new Error('getFormula() must be implemented by subclass');
    }

    /**
     * Get example calculation with sample data
     * @returns {Object} { inputs: {}, result: {}, explanation: string }
     */
    getExample() {
        throw new Error('getExample() must be implemented by subclass');
    }

    /**
     * Format currency values
     * @param {number} value - Value to format
     * @returns {string} Formatted currency string
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    /**
     * Format percentage values
     * @param {number} value - Value to format (as decimal)
     * @returns {string} Formatted percentage string
     */
    formatPercentage(value) {
        return `${(value * 100).toFixed(2)}%`;
    }

    /**
     * Common validation helpers
     */
    validatePositiveNumber(value, fieldName) {
        if (value === null || value === undefined || isNaN(value)) {
            return `${fieldName} must be a number`;
        }
        if (value < 0) {
            return `${fieldName} must be positive`;
        }
        return null;
    }

    validatePercentage(value, fieldName) {
        const error = this.validatePositiveNumber(value, fieldName);
        if (error) return error;
        if (value > 100) {
            return `${fieldName} must be between 0 and 100`;
        }
        return null;
    }

    validateRequired(value, fieldName) {
        if (value === null || value === undefined || value === '') {
            return `${fieldName} is required`;
        }
        return null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaseCalculator;
} else {
    window.BaseCalculator = BaseCalculator;
}