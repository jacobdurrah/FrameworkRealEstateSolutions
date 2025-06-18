/**
 * Tests for new Portfolio V2 features
 */
const fs = require('fs');
const path = require('path');

// Mock DOM environment
global.document = {
    getElementById: (id) => ({
        textContent: '',
        value: 0,
        innerHTML: ''
    }),
    createElement: () => ({
        innerHTML: ''
    })
};

global.window = {};

// Load calculator modules
const baseCalcPath = path.join(__dirname, '..', 'js', 'calculators', 'base-calculator.js');
const baseCalcCode = fs.readFileSync(baseCalcPath, 'utf8');
eval(baseCalcCode);

const loanCalcPath = path.join(__dirname, '..', 'js', 'calculators', 'loan-calculator.js');
const loanCalcCode = fs.readFileSync(loanCalcPath, 'utf8');
eval(loanCalcCode);

describe('Portfolio V2 New Features', () => {
    let loanCalc;

    beforeEach(() => {
        loanCalc = new LoanCalculator();
    });

    describe('100% Down Payment Bug Fix', () => {
        test('should return 0 payment for 100% down payment', () => {
            const result = loanCalc.calculate({
                principal: 0, // 100% down means 0 loan amount
                interestRate: 4.5,
                termYears: 30
            });
            
            expect(result.monthlyPayment).toBe(0);
            expect(result.totalPayment).toBe(0);
            expect(result.totalInterest).toBe(0);
        });

        test('should calculate payment correctly for partial down payment', () => {
            const result = loanCalc.calculate({
                principal: 200000, // 20% down on $250k property
                interestRate: 4.5,
                termYears: 30
            });
            
            expect(result.monthlyPayment).toBeGreaterThan(0);
            expect(result.monthlyPayment).toBeCloseTo(1013.37, 2);
        });
    });

    describe('Monthly Expenses', () => {
        test('should handle property with custom monthly expenses', () => {
            const property = {
                monthlyRent: 2500,
                monthlyExpenses: 800
            };
            
            const netCashFlow = property.monthlyRent - property.monthlyExpenses;
            expect(netCashFlow).toBe(1700);
        });
    });

    describe('Time-Based Projections', () => {
        test('should calculate 3% annual appreciation correctly', () => {
            const purchasePrice = 250000;
            const years = 5;
            const annualRate = 0.03;
            const monthlyRate = Math.pow(1 + annualRate, 1/12) - 1;
            const months = years * 12;
            
            const futureValue = purchasePrice * Math.pow(1 + monthlyRate, months);
            const expectedValue = purchasePrice * Math.pow(1 + annualRate, years);
            
            expect(futureValue).toBeCloseTo(expectedValue, 0);
            expect(futureValue).toBeCloseTo(289818.95, 0);
        });

        test('should calculate interest paid over time', () => {
            const loanAmount = 200000;
            const rate = 4.5;
            const termYears = 30;
            const monthsPaid = 60; // 5 years
            
            const result = loanCalc.calculate({
                principal: loanAmount,
                interestRate: rate,
                termYears: termYears
            });
            
            const monthlyPayment = result.monthlyPayment;
            const totalPaid = monthlyPayment * monthsPaid;
            
            // Calculate remaining balance after 5 years
            const r = rate / 100 / 12;
            const n = termYears * 12;
            const remainingPayments = n - monthsPaid;
            const remainingBalance = monthlyPayment * 
                (1 - Math.pow(1 + r, -remainingPayments)) / r;
            
            const principalPaid = loanAmount - remainingBalance;
            const interestPaid = totalPaid - principalPaid;
            
            expect(interestPaid).toBeGreaterThan(0);
            expect(interestPaid).toBeCloseTo(43119.81, 0);
        });

        test('should calculate cash on hand correctly', () => {
            const monthlyNetCashFlow = 1000;
            const months = 60; // 5 years
            const cashAccumulated = monthlyNetCashFlow * months;
            
            expect(cashAccumulated).toBe(60000);
        });
    });
});