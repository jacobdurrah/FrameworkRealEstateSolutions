/**
 * Unit tests for calculator modules
 */

// Load calculator modules
const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = {};

// Load calculator files
const baseCalcCode = fs.readFileSync(path.join(__dirname, '../js/calculators/base-calculator.js'), 'utf8');
const loanCalcCode = fs.readFileSync(path.join(__dirname, '../js/calculators/loan-calculator.js'), 'utf8');
const roiCalcCode = fs.readFileSync(path.join(__dirname, '../js/calculators/roi-calculator.js'), 'utf8');
const cashFlowCalcCode = fs.readFileSync(path.join(__dirname, '../js/calculators/cashflow-calculator.js'), 'utf8');
const equityCalcCode = fs.readFileSync(path.join(__dirname, '../js/calculators/equity-calculator.js'), 'utf8');

// Execute calculator code
eval(baseCalcCode);
eval(loanCalcCode);
eval(roiCalcCode);
eval(cashFlowCalcCode);
eval(equityCalcCode);

// Get calculator classes
const BaseCalculator = window.BaseCalculator;
const LoanCalculator = window.LoanCalculator;
const ROICalculator = window.ROICalculator;
const CashFlowCalculator = window.CashFlowCalculator;
const EquityCalculator = window.EquityCalculator;

describe('Calculator Tests', () => {
    describe('LoanCalculator', () => {
        let loanCalc;
        
        beforeEach(() => {
            loanCalc = new LoanCalculator();
        });
        
        test('calculates standard mortgage payment correctly', () => {
            const result = loanCalc.calculate({
                principal: 200000,
                interestRate: 4.5,
                termYears: 30
            });
            
            expect(result.monthlyPayment).toBeCloseTo(1013.37, 2);
            expect(result.totalPaid).toBeCloseTo(364813.42, 0);
            expect(result.totalInterest).toBeCloseTo(164813.42, 0);
        });
        
        test('calculates down payment correctly', () => {
            const result = loanCalc.calculate({
                principal: 200000,
                interestRate: 4.5,
                termYears: 30,
                purchasePrice: 250000,
                downPaymentPercent: 20
            });
            
            expect(result.downPaymentAmount).toBe(50000);
            expect(result.loanToValue).toBe(80);
        });
        
        test('handles zero interest rate', () => {
            const result = loanCalc.calculate({
                principal: 120000,
                interestRate: 0,
                termYears: 10
            });
            
            expect(result.monthlyPayment).toBe(1000); // 120000 / (10 * 12)
            expect(result.totalInterest).toBe(0);
        });
        
        test('validates inputs correctly', () => {
            const validation = loanCalc.validate({
                principal: -100000,
                interestRate: 4.5,
                termYears: 30
            });
            
            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain('Principal must be positive');
        });
        
        test('calculates first year amortization', () => {
            const result = loanCalc.calculate({
                principal: 100000,
                interestRate: 6,
                termYears: 30
            });
            
            expect(result.principalFirstYear).toBeGreaterThan(0);
            expect(result.interestFirstYear).toBeGreaterThan(0);
            expect(result.balanceAfterFirstYear).toBeLessThan(100000);
        });
    });
    
    describe('ROICalculator', () => {
        let roiCalc;
        
        beforeEach(() => {
            roiCalc = new ROICalculator();
        });
        
        test('calculates cap rate correctly', () => {
            const result = roiCalc.calculate({
                purchasePrice: 250000,
                currentValue: 250000,
                totalCashInvested: 62500,
                monthlyRent: 2500,
                monthlyExpenses: 875,
                monthlyDebtService: 900
            });
            
            // NOI = (2500 * 12) - (875 * 12) = 19,500
            // Cap Rate = 19,500 / 250,000 = 7.8%
            expect(result.capRate).toBeCloseTo(7.8, 1);
        });
        
        test('calculates cash-on-cash return correctly', () => {
            const result = roiCalc.calculate({
                purchasePrice: 250000,
                currentValue: 250000,
                totalCashInvested: 62500,
                monthlyRent: 2500,
                monthlyExpenses: 875,
                monthlyDebtService: 900
            });
            
            // Cash Flow = (2500 - 875 - 900) * 12 = 8,700
            // Cash-on-Cash = 8,700 / 62,500 = 13.92%
            expect(result.cashOnCashReturn).toBeCloseTo(13.92, 1);
        });
        
        test('calculates GRM correctly', () => {
            const result = roiCalc.calculate({
                purchasePrice: 250000,
                currentValue: 250000,
                totalCashInvested: 62500,
                monthlyRent: 2500,
                monthlyExpenses: 875,
                monthlyDebtService: 900
            });
            
            // GRM = 250,000 / (2500 * 12) = 8.33
            expect(result.grossRentMultiplier).toBeCloseTo(8.33, 2);
        });
        
        test('meets 1% rule check', () => {
            const result = roiCalc.calculate({
                purchasePrice: 200000,
                currentValue: 200000,
                totalCashInvested: 50000,
                monthlyRent: 2000, // Exactly 1%
                monthlyExpenses: 700,
                monthlyDebtService: 800
            });
            
            expect(result.onePercentRule).toBe(0.01);
            expect(result.meetsOnePercentRule).toBe(true);
        });
        
        test('calculates portfolio metrics', () => {
            const properties = [
                {
                    purchasePrice: 200000,
                    currentValue: 220000,
                    totalCashInvested: 50000,
                    monthlyRent: 2000,
                    monthlyExpenses: 700,
                    monthlyDebtService: 800
                },
                {
                    purchasePrice: 300000,
                    currentValue: 310000,
                    totalCashInvested: 75000,
                    monthlyRent: 3000,
                    monthlyExpenses: 1050,
                    monthlyDebtService: 1200
                }
            ];
            
            const portfolio = roiCalc.calculatePortfolio(properties);
            
            expect(portfolio.propertyCount).toBe(2);
            expect(portfolio.totalMonthlyCashFlow).toBe(1250); // (2000-700-800) + (3000-1050-1200)
            expect(portfolio.totalAnnualCashFlow).toBe(15000);
        });
    });
    
    describe('CashFlowCalculator', () => {
        let cashFlowCalc;
        
        beforeEach(() => {
            cashFlowCalc = new CashFlowCalculator();
        });
        
        test('calculates NOI correctly', () => {
            const result = cashFlowCalc.calculate({
                monthlyRent: 2500,
                propertyValue: 250000,
                monthlyDebtService: 900,
                useDefaultRatios: true
            });
            
            // Vacancy = 2500 * 0.05 = 125
            // Effective Rent = 2500 - 125 = 2375
            expect(result.vacancyLoss).toBeCloseTo(125, 0);
            expect(result.effectiveRent).toBeCloseTo(2375, 0);
            expect(result.noi).toBeGreaterThan(0);
        });
        
        test('uses custom expenses correctly', () => {
            const result = cashFlowCalc.calculate({
                monthlyRent: 3000,
                propertyValue: 300000,
                monthlyDebtService: 1200,
                expenses: {
                    propertyTax: 250,
                    insurance: 100,
                    maintenance: 150,
                    propertyManagement: 240,
                    capitalReserves: 150,
                    utilities: 0,
                    hoa: 50,
                    other: 0
                },
                useDefaultRatios: false
            });
            
            expect(result.expenses.propertyTax).toBe(250);
            expect(result.expenses.insurance).toBe(100);
            expect(result.totalMonthlyExpenses).toBe(940);
        });
        
        test('calculates DSCR correctly', () => {
            const result = cashFlowCalc.calculate({
                monthlyRent: 2500,
                propertyValue: 250000,
                monthlyDebtService: 900,
                useDefaultRatios: true
            });
            
            // DSCR should be NOI / Debt Service
            expect(result.debtServiceCoverageRatio).toBeGreaterThan(1);
        });
        
        test('projects cash flow over time', () => {
            const baseInputs = {
                monthlyRent: 2000,
                propertyValue: 200000,
                monthlyDebtService: 800,
                useDefaultRatios: true
            };
            
            const projections = cashFlowCalc.projectCashFlow(baseInputs, 5, {
                rentGrowth: 0.03,
                expenseGrowth: 0.02,
                valueAppreciation: 0.03
            });
            
            expect(projections).toHaveLength(5);
            expect(projections[4].monthlyRent).toBeGreaterThan(2000);
            expect(projections[4].netCashFlow).toBeGreaterThan(projections[0].netCashFlow);
        });
    });
    
    describe('EquityCalculator', () => {
        let equityCalc;
        
        beforeEach(() => {
            equityCalc = new EquityCalculator();
        });
        
        test('calculates basic equity correctly', () => {
            const result = equityCalc.calculate({
                currentValue: 300000,
                mortgageBalance: 180000,
                purchasePrice: 250000,
                initialDownPayment: 50000
            });
            
            expect(result.currentEquity).toBe(120000);
            expect(result.equityPercentage).toBe(40);
            expect(result.ltv).toBe(60);
        });
        
        test('breaks down equity sources correctly', () => {
            const result = equityCalc.calculate({
                currentValue: 300000,
                mortgageBalance: 180000,
                purchasePrice: 250000,
                initialDownPayment: 50000,
                principalPaid: 20000,
                appreciation: 50000
            });
            
            expect(result.equitySources.downPayment).toBe(50000);
            expect(result.equitySources.principalPaydown).toBe(20000);
            expect(result.equitySources.appreciation).toBe(50000);
            expect(result.equitySources.total).toBe(120000);
        });
        
        test('calculates equity growth rate', () => {
            const result = equityCalc.calculate({
                currentValue: 300000,
                mortgageBalance: 180000,
                purchasePrice: 250000,
                initialDownPayment: 50000
            });
            
            // Equity grew from 50k to 120k = 140% growth
            expect(result.equityGrowth).toBe(70000);
            expect(result.equityGrowthRate).toBe(140);
        });
        
        test('projects equity growth over time', () => {
            const projections = equityCalc.projectEquityGrowth(
                {
                    currentValue: 250000,
                    mortgageBalance: 200000
                },
                5,
                {
                    appreciationRate: 0.03,
                    monthlyPayment: 1013,
                    interestRate: 0.045
                }
            );
            
            expect(projections).toHaveLength(6); // 0 through 5 years
            expect(projections[5].propertyValue).toBeGreaterThan(250000);
            expect(projections[5].mortgageBalance).toBeLessThan(200000);
            expect(projections[5].equity).toBeGreaterThan(50000);
        });
        
        test('calculates portfolio equity', () => {
            const properties = [
                {
                    currentValue: 300000,
                    mortgageBalance: 180000,
                    purchasePrice: 250000,
                    initialDownPayment: 50000,
                    address: '123 Main St'
                },
                {
                    currentValue: 400000,
                    mortgageBalance: 280000,
                    purchasePrice: 350000,
                    initialDownPayment: 70000,
                    address: '456 Oak Ave'
                }
            ];
            
            const portfolio = equityCalc.calculatePortfolioEquity(properties);
            
            expect(portfolio.propertyCount).toBe(2);
            expect(portfolio.totalValue).toBe(700000);
            expect(portfolio.totalDebt).toBe(460000);
            expect(portfolio.totalEquity).toBe(240000);
            expect(portfolio.portfolioLTV).toBeCloseTo(65.71, 1);
        });
    });
    
    describe('Integration Tests', () => {
        test('calculators work together for complete property analysis', () => {
            const loanCalc = new LoanCalculator();
            const roiCalc = new ROICalculator();
            const cashFlowCalc = new CashFlowCalculator();
            const equityCalc = new EquityCalculator();
            
            // Property details
            const purchasePrice = 250000;
            const downPaymentPercent = 20;
            const monthlyRent = 2500;
            const interestRate = 4.5;
            const termYears = 30;
            
            // Calculate loan
            const loanResult = loanCalc.calculate({
                principal: purchasePrice * (1 - downPaymentPercent / 100),
                interestRate,
                termYears,
                purchasePrice,
                downPaymentPercent
            });
            
            // Calculate cash flow
            const cashFlowResult = cashFlowCalc.calculate({
                monthlyRent,
                propertyValue: purchasePrice,
                monthlyDebtService: loanResult.monthlyPayment,
                useDefaultRatios: true
            });
            
            // Calculate ROI
            const roiResult = roiCalc.calculate({
                purchasePrice,
                currentValue: purchasePrice,
                totalCashInvested: loanResult.downPaymentAmount,
                monthlyRent,
                monthlyExpenses: cashFlowResult.totalMonthlyExpenses - loanResult.monthlyPayment,
                monthlyDebtService: loanResult.monthlyPayment
            });
            
            // Calculate equity
            const equityResult = equityCalc.calculate({
                currentValue: purchasePrice,
                mortgageBalance: purchasePrice * (1 - downPaymentPercent / 100),
                purchasePrice,
                initialDownPayment: loanResult.downPaymentAmount
            });
            
            // Verify results make sense
            expect(loanResult.monthlyPayment).toBeGreaterThan(0);
            expect(cashFlowResult.netCashFlow).toBeGreaterThan(0);
            expect(roiResult.cashOnCashReturn).toBeGreaterThan(0);
            expect(equityResult.equityPercentage).toBe(downPaymentPercent);
        });
    });
});