// Proforma Calculator Engine
// Handles all investment property calculations and metrics

class ProformaCalculator {
    constructor() {
        this.data = {
            // Purchase Assumptions
            purchasePrice: 0,
            rehabBudget: 0,
            afterRepairValue: 0,
            closingCosts: 2000,
            
            // Financing
            downPaymentPercent: 25,
            interestRate: 7.5,
            loanTermYears: 30,
            
            // Income
            monthlyRent: 0,
            vacancyRate: 5,
            otherIncome: 0,
            
            // Operating Expenses (monthly)
            propertyTax: 150,
            insurance: 85,
            propertyManagementPercent: 8,
            maintenancePercent: 5,
            utilities: 40,
            hoa: 0,
            other: 0,
            reservesPercent: 5,
            
            // Market Assumptions
            appreciationRate: 3,
            rentIncreaseRate: 2,
            expenseIncreaseRate: 2
        };
        
        this.results = {};
    }
    
    // Update a data field and recalculate
    updateField(field, value) {
        if (this.data.hasOwnProperty(field)) {
            this.data[field] = parseFloat(value) || 0;
            this.calculate();
        }
    }
    
    // Main calculation function
    calculate() {
        // Purchase & Financing Calculations
        const totalInvestment = this.data.purchasePrice + this.data.rehabBudget;
        const downPayment = (this.data.purchasePrice * this.data.downPaymentPercent) / 100;
        const loanAmount = this.data.purchasePrice - downPayment;
        const totalCashNeeded = downPayment + this.data.rehabBudget + this.data.closingCosts;
        
        // Monthly Payment Calculation (P&I)
        const monthlyRate = (this.data.interestRate / 100) / 12;
        const numPayments = this.data.loanTermYears * 12;
        const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                              (Math.pow(1 + monthlyRate, numPayments) - 1);
        
        // Income Calculations
        const grossMonthlyIncome = this.data.monthlyRent + this.data.otherIncome;
        const vacancyLoss = (grossMonthlyIncome * this.data.vacancyRate) / 100;
        const effectiveMonthlyIncome = grossMonthlyIncome - vacancyLoss;
        const annualIncome = effectiveMonthlyIncome * 12;
        
        // Operating Expense Calculations
        const propertyManagement = (effectiveMonthlyIncome * this.data.propertyManagementPercent) / 100;
        const maintenance = (effectiveMonthlyIncome * this.data.maintenancePercent) / 100;
        const reserves = (effectiveMonthlyIncome * this.data.reservesPercent) / 100;
        
        const totalMonthlyExpenses = this.data.propertyTax + this.data.insurance + 
                                    propertyManagement + maintenance + 
                                    this.data.utilities + this.data.hoa + 
                                    this.data.other + reserves;
        
        const annualExpenses = totalMonthlyExpenses * 12;
        
        // NOI and Cash Flow
        const monthlyNOI = effectiveMonthlyIncome - totalMonthlyExpenses;
        const annualNOI = monthlyNOI * 12;
        const monthlyCashFlow = monthlyNOI - monthlyPayment;
        const annualCashFlow = monthlyCashFlow * 12;
        
        // Key Metrics Calculations
        const capRate = (annualNOI / this.data.purchasePrice) * 100;
        const cashOnCash = (annualCashFlow / totalCashNeeded) * 100;
        const annualDebtService = monthlyPayment * 12;
        const dscr = annualNOI / annualDebtService;
        const grossRentMultiplier = this.data.purchasePrice / (this.data.monthlyRent * 12);
        const totalROI = ((annualCashFlow + (this.data.purchasePrice * 0.03)) / totalCashNeeded) * 100;
        
        // 5-Year Projections
        const fiveYearProjection = this.calculateFiveYearProjection(
            monthlyCashFlow,
            monthlyPayment,
            loanAmount,
            monthlyRate
        );
        
        // Store all results
        this.results = {
            // Purchase & Financing
            totalInvestment,
            downPayment,
            loanAmount,
            totalCashNeeded,
            monthlyPayment: isNaN(monthlyPayment) ? 0 : monthlyPayment,
            
            // Income
            grossMonthlyIncome,
            vacancyLoss,
            effectiveMonthlyIncome,
            annualIncome,
            
            // Expenses
            propertyManagement,
            maintenance,
            reserves,
            totalMonthlyExpenses,
            annualExpenses,
            
            // Cash Flow
            monthlyNOI,
            annualNOI,
            monthlyCashFlow,
            annualCashFlow,
            
            // Key Metrics
            capRate: isNaN(capRate) ? 0 : capRate,
            cashOnCash: isNaN(cashOnCash) ? 0 : cashOnCash,
            dscr: isNaN(dscr) ? 0 : dscr,
            grossRentMultiplier: isNaN(grossRentMultiplier) ? 0 : grossRentMultiplier,
            totalROI: isNaN(totalROI) ? 0 : totalROI,
            annualDebtService,
            
            // Projections
            fiveYearProjection,
            
            // Additional Metrics
            equityCreated: this.data.afterRepairValue - totalInvestment,
            instantEquity: this.data.afterRepairValue - totalInvestment
        };
        
        return this.results;
    }
    
    // Calculate 5-year projection
    calculateFiveYearProjection(initialCashFlow, monthlyPayment, loanAmount, monthlyRate) {
        const projection = [];
        let currentCashFlow = initialCashFlow;
        let currentLoanBalance = loanAmount;
        let currentPropertyValue = this.data.afterRepairValue || this.data.purchasePrice;
        
        for (let year = 1; year <= 5; year++) {
            // Annual cash flow with rent increases
            const annualCashFlow = currentCashFlow * 12;
            
            // Principal paid down this year
            let principalPaid = 0;
            for (let month = 1; month <= 12; month++) {
                const interestPayment = currentLoanBalance * monthlyRate;
                const principalPayment = monthlyPayment - interestPayment;
                principalPaid += principalPayment;
                currentLoanBalance -= principalPayment;
            }
            
            // Property appreciation
            currentPropertyValue *= (1 + this.data.appreciationRate / 100);
            const appreciation = currentPropertyValue - (this.data.afterRepairValue || this.data.purchasePrice);
            
            // Tax benefits (simplified)
            const taxBenefits = annualCashFlow * 0.25; // Assumes 25% tax bracket
            
            projection.push({
                year,
                cashFlow: annualCashFlow,
                principalPaid,
                appreciation,
                taxBenefits,
                totalReturn: annualCashFlow + principalPaid + appreciation + taxBenefits,
                loanBalance: currentLoanBalance,
                propertyValue: currentPropertyValue
            });
            
            // Increase rent for next year
            currentCashFlow *= (1 + this.data.rentIncreaseRate / 100);
        }
        
        return projection;
    }
    
    // Get metric rating (good/average/poor)
    getMetricRating(metric, value) {
        const benchmarks = {
            capRate: { excellent: 10, good: 6, poor: 4 },
            cashOnCash: { excellent: 12, good: 8, poor: 5 },
            dscr: { excellent: 1.4, good: 1.25, poor: 1.0 },
            grossRentMultiplier: { excellent: 5, good: 7, poor: 10 }, // Lower is better
            totalROI: { excellent: 15, good: 10, poor: 5 },
            monthlyCashFlow: { excellent: 400, good: 200, poor: 0 }
        };
        
        if (!benchmarks[metric]) return { rating: 'neutral', label: 'N/A' };
        
        const bench = benchmarks[metric];
        
        // Handle inverse metrics (lower is better)
        if (metric === 'grossRentMultiplier') {
            if (value <= bench.excellent) return { rating: 'excellent', label: 'EXCELLENT' };
            if (value <= bench.good) return { rating: 'good', label: 'GOOD' };
            if (value <= bench.poor) return { rating: 'average', label: 'AVERAGE' };
            return { rating: 'poor', label: 'POOR' };
        }
        
        // Normal metrics (higher is better)
        if (value >= bench.excellent) return { rating: 'excellent', label: 'EXCELLENT' };
        if (value >= bench.good) return { rating: 'good', label: 'GOOD' };
        if (value >= bench.poor) return { rating: 'average', label: 'AVERAGE' };
        return { rating: 'poor', label: 'POOR' };
    }
    
    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
    
    // Format percentage
    formatPercent(value, decimals = 1) {
        return `${value.toFixed(decimals)}%`;
    }
    
    // Export data for PDF/Email
    exportData() {
        return {
            inputs: this.data,
            results: this.results,
            property: this.propertyData || {},
            generatedAt: new Date().toISOString()
        };
    }
    
    // Load property data
    loadProperty(property) {
        this.propertyData = property;
        
        // Initialize estimators if not already loaded
        if (!window.RehabEstimator) {
            console.warn('RehabEstimator not loaded, using defaults');
        }
        if (!window.RentEstimator) {
            console.warn('RentEstimator not loaded, using defaults');
        }
        
        // Get property details
        const sqft = property.sqft || property.squareFeet || 1200; // Default sqft
        const bedrooms = property.bedrooms || 3;
        const bathrooms = property.bathrooms || 1;
        
        // Estimate rent if not provided
        let monthlyRent = property.monthlyRent || property.estimatedRent;
        if (!monthlyRent && window.RentEstimator) {
            const rentEstimator = new window.RentEstimator();
            monthlyRent = rentEstimator.estimate(bedrooms, 'single-family', property.rentZestimate);
        }
        monthlyRent = monthlyRent || 1329; // Fallback to default
        
        // Estimate rehab if not provided (default to cosmetic)
        let rehabBudget = property.estimatedRehab;
        if (!rehabBudget && window.RehabEstimator) {
            const rehabEstimator = new window.RehabEstimator();
            rehabBudget = rehabEstimator.estimate(sqft, bedrooms, bathrooms, 'cosmetic');
        }
        rehabBudget = rehabBudget || 8000; // Fallback to default
        
        // Set data
        this.data.purchasePrice = property.price || 0;
        this.data.monthlyRent = monthlyRent;
        this.data.rehabBudget = rehabBudget;
        this.data.propertyTax = Math.round((property.price * 0.025) / 12) || 150; // 2.5% annually
        this.data.afterRepairValue = property.afterRepairValue || Math.round(property.price * 1.3); // Default to 30% above purchase
        
        // Store property details for later use
        this.propertyDetails = {
            sqft: sqft,
            bedrooms: bedrooms,
            bathrooms: bathrooms
        };
        
        // Update input fields
        if (document.getElementById('purchasePrice')) {
            document.getElementById('purchasePrice').value = this.data.purchasePrice;
            document.getElementById('rehabBudget').value = this.data.rehabBudget;
            document.getElementById('monthlyRent').value = this.data.monthlyRent;
            document.getElementById('afterRepairValue').value = this.data.afterRepairValue;
            document.getElementById('propertyTax').value = this.data.propertyTax;
        }
        
        this.calculate();
    }
}