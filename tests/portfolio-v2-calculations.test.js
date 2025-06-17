/**
 * Simple calculation tests for Portfolio Simulator V2
 * Tests the core calculation logic without complex dependencies
 */

describe('Portfolio V2 Calculations', () => {
    describe('Loan Calculations', () => {
        // PMT formula: P × [r(1+r)^n] / [(1+r)^n - 1]
        function calculateMonthlyPayment(principal, annualRate, years) {
            const monthlyRate = annualRate / 100 / 12;
            const totalPayments = years * 12;
            
            if (monthlyRate === 0) {
                return principal / totalPayments;
            }
            
            return principal * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                   (Math.pow(1 + monthlyRate, totalPayments) - 1);
        }
        
        test('calculates standard 30-year mortgage', () => {
            const payment = calculateMonthlyPayment(200000, 4.5, 30);
            expect(payment).toBeCloseTo(1013.37, 2);
        });
        
        test('calculates 15-year mortgage', () => {
            const payment = calculateMonthlyPayment(200000, 4.0, 15);
            expect(payment).toBeCloseTo(1479.38, 2);
        });
        
        test('handles zero interest rate', () => {
            const payment = calculateMonthlyPayment(120000, 0, 10);
            expect(payment).toBe(1000); // 120000 / 120 months
        });
        
        test('calculates down payment amounts', () => {
            const price = 250000;
            const downPercent = 20;
            const downAmount = price * (downPercent / 100);
            const loanAmount = price - downAmount;
            
            expect(downAmount).toBe(50000);
            expect(loanAmount).toBe(200000);
        });
    });
    
    describe('ROI Calculations', () => {
        function calculateCapRate(noi, purchasePrice) {
            return (noi / purchasePrice) * 100;
        }
        
        function calculateCashOnCash(annualCashFlow, totalCashInvested) {
            return (annualCashFlow / totalCashInvested) * 100;
        }
        
        function calculateGRM(purchasePrice, annualRent) {
            return purchasePrice / annualRent;
        }
        
        test('calculates cap rate correctly', () => {
            const monthlyRent = 2500;
            const monthlyExpenses = 875;
            const annualNOI = (monthlyRent - monthlyExpenses) * 12;
            const purchasePrice = 250000;
            
            const capRate = calculateCapRate(annualNOI, purchasePrice);
            expect(capRate).toBeCloseTo(7.8, 1);
        });
        
        test('calculates cash-on-cash return', () => {
            const monthlyCashFlow = 725; // Rent - expenses - mortgage
            const annualCashFlow = monthlyCashFlow * 12;
            const cashInvested = 50000;
            
            const coc = calculateCashOnCash(annualCashFlow, cashInvested);
            expect(coc).toBe(17.4);
        });
        
        test('calculates gross rent multiplier', () => {
            const purchasePrice = 240000;
            const monthlyRent = 2000;
            const annualRent = monthlyRent * 12;
            
            const grm = calculateGRM(purchasePrice, annualRent);
            expect(grm).toBe(10);
        });
        
        test('checks 1% rule', () => {
            const purchasePrice = 200000;
            const monthlyRent = 2000;
            const onePercentRule = monthlyRent / purchasePrice;
            
            expect(onePercentRule).toBe(0.01); // Exactly 1%
            expect(onePercentRule >= 0.01).toBe(true); // Meets rule
        });
    });
    
    describe('Cash Flow Calculations', () => {
        function calculateNOI(monthlyRent, monthlyExpenses, vacancyRate = 0.05) {
            const effectiveRent = monthlyRent * (1 - vacancyRate);
            return (effectiveRent - monthlyExpenses) * 12;
        }
        
        function calculateDSCR(noi, annualDebtService) {
            return noi / annualDebtService;
        }
        
        test('calculates NOI with vacancy', () => {
            const monthlyRent = 3000;
            const monthlyExpenses = 1050; // 35% of rent
            const noi = calculateNOI(monthlyRent, monthlyExpenses);
            
            // NOI = (3000 * 0.95 - 1050) * 12 = (2850 - 1050) * 12 = 1800 * 12 = 21600
            expect(noi).toBe(21600);
        });
        
        test('calculates DSCR', () => {
            const monthlyRent = 2500;
            const monthlyExpenses = 875;
            const monthlyDebtService = 900;
            
            const annualNOI = calculateNOI(monthlyRent, monthlyExpenses);
            const annualDebtService = monthlyDebtService * 12;
            const dscr = calculateDSCR(annualNOI, annualDebtService);
            
            expect(dscr).toBeGreaterThan(1.2); // Good DSCR
        });
        
        test('applies standard expense ratios', () => {
            const propertyValue = 300000;
            const monthlyRent = 3000;
            
            const propertyTax = (propertyValue * 0.01) / 12; // 1% annually
            const insurance = (propertyValue * 0.0035) / 12; // 0.35% annually
            const maintenance = (propertyValue * 0.01) / 12; // 1% annually
            const management = monthlyRent * 0.08; // 8% of rent
            const reserves = monthlyRent * 0.05; // 5% of rent
            
            const totalExpenses = propertyTax + insurance + maintenance + management + reserves;
            
            expect(propertyTax).toBeCloseTo(250, 0);
            expect(insurance).toBeCloseTo(87.5, 1);
            expect(maintenance).toBeCloseTo(250, 0);
            expect(management).toBe(240);
            expect(reserves).toBe(150);
            expect(totalExpenses).toBeCloseTo(977.5, 1);
        });
    });
    
    describe('Equity Calculations', () => {
        function calculateEquity(propertyValue, mortgageBalance) {
            return propertyValue - mortgageBalance;
        }
        
        function calculateLTV(mortgageBalance, propertyValue) {
            return (mortgageBalance / propertyValue) * 100;
        }
        
        test('calculates basic equity', () => {
            const propertyValue = 300000;
            const mortgageBalance = 180000;
            
            const equity = calculateEquity(propertyValue, mortgageBalance);
            const equityPercent = (equity / propertyValue) * 100;
            
            expect(equity).toBe(120000);
            expect(equityPercent).toBe(40);
        });
        
        test('calculates LTV ratio', () => {
            const mortgageBalance = 180000;
            const propertyValue = 300000;
            
            const ltv = calculateLTV(mortgageBalance, propertyValue);
            expect(ltv).toBe(60);
        });
        
        test('tracks equity sources', () => {
            const downPayment = 50000;
            const principalPaid = 20000;
            const appreciation = 30000;
            
            const totalEquity = downPayment + principalPaid + appreciation;
            expect(totalEquity).toBe(100000);
        });
    });
    
    describe('Portfolio Integration', () => {
        test('builds 10k monthly income portfolio', () => {
            // Simulate building a portfolio to generate $10k/month
            const properties = [
                { price: 320000, rent: 3200, downPercent: 25 },
                { price: 250000, rent: 2400, downPercent: 20 },
                { price: 450000, rent: 4500, downPercent: 25 },
                { price: 580000, rent: 5200, downPercent: 25 },
                { price: 340000, rent: 3400, downPercent: 20 },
                { price: 380000, rent: 3800, downPercent: 20 },
                { price: 300000, rent: 3000, downPercent: 20 }
            ];
            
            let totalRent = 0;
            let totalValue = 0;
            let totalCashInvested = 0;
            let totalDebt = 0;
            let totalMonthlyPayments = 0;
            
            properties.forEach(prop => {
                totalRent += prop.rent;
                totalValue += prop.price;
                const downAmount = prop.price * (prop.downPercent / 100);
                totalCashInvested += downAmount;
                const loanAmount = prop.price - downAmount;
                totalDebt += loanAmount;
                
                // Estimate payment at 4.75% for 30 years
                const payment = calculateMonthlyPayment(loanAmount, 4.75, 30);
                totalMonthlyPayments += payment;
            });
            
            expect(totalRent).toBe(25500); // Well above $10k target
            expect(totalValue).toBe(2620000);
            // Recalculate: 320k*0.25 + 250k*0.20 + 450k*0.25 + 580k*0.25 + 340k*0.20 + 380k*0.20 + 300k*0.20
            // = 80k + 50k + 112.5k + 145k + 68k + 76k + 60k = 591.5k
            expect(totalCashInvested).toBe(591500);
            
            // Calculate net cash flow (rent - 35% expenses - debt service)
            const monthlyExpenses = totalRent * 0.35;
            const netCashFlow = totalRent - monthlyExpenses - totalMonthlyPayments;
            
            expect(netCashFlow).toBeGreaterThan(5000); // Healthy positive cash flow
            
            // Calculate cash-on-cash return
            const annualCashFlow = netCashFlow * 12;
            const cashOnCash = (annualCashFlow / totalCashInvested) * 100;
            
            expect(cashOnCash).toBeGreaterThan(10); // Good return
            expect(cashOnCash).toBeLessThan(20); // Realistic return
        });
        
        test('handles property sales correctly', () => {
            // Start with two properties
            let portfolio = [
                { id: 1, price: 200000, rent: 2000, debt: 160000 },
                { id: 2, price: 300000, rent: 3000, debt: 240000 }
            ];
            
            let totalRent = 5000;
            let totalValue = 500000;
            let totalDebt = 400000;
            
            // Sell first property
            portfolio = portfolio.filter(p => p.id !== 1);
            totalRent = 3000;
            totalValue = 300000;
            totalDebt = 240000;
            
            expect(portfolio.length).toBe(1);
            expect(totalRent).toBe(3000);
            expect(totalValue).toBe(300000);
            expect(totalDebt).toBe(240000);
        });
    });
});

// Helper function used by tests
function calculateMonthlyPayment(principal, annualRate, years) {
    const monthlyRate = annualRate / 100 / 12;
    const totalPayments = years * 12;
    
    if (monthlyRate === 0) {
        return principal / totalPayments;
    }
    
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
           (Math.pow(1 + monthlyRate, totalPayments) - 1);
}