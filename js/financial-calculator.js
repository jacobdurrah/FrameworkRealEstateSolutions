// Financial Calculator for Portfolio Simulation
// Handles all financial calculations for real estate investments

class FinancialCalculator {
    constructor() {
        // Detroit-specific defaults
        this.defaults = {
            propertyTaxRate: 0.8, // Detroit millage rate (0.8% of assessed value)
            insuranceRate: 0.004, // 0.4% of property value annually
            maintenanceRate: 0.01, // 1% of property value annually
            vacancyRate: 0.08, // 8% vacancy rate
            propertyManagementRate: 0.08, // 8% of rental income
            closingCostRate: 0.03, // 3% of purchase price
            appreciationRate: 0.03, // 3% annual appreciation
            rentGrowthRate: 0.02, // 2% annual rent growth
            mortgageRate: 0.07, // 7% interest rate
            mortgageTerm: 30 // 30 years
        };
    }

    // Calculate monthly mortgage payment
    calculateMortgagePayment(loanAmount, annualRate = this.defaults.mortgageRate, years = this.defaults.mortgageTerm) {
        const monthlyRate = annualRate / 12;
        const numPayments = years * 12;
        
        if (monthlyRate === 0) return loanAmount / numPayments;
        
        const payment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                       (Math.pow(1 + monthlyRate, numPayments) - 1);
        
        return Math.round(payment);
    }

    // Calculate loan balance after n months
    calculateLoanBalance(originalLoan, monthlyPayment, annualRate, monthsPassed) {
        const monthlyRate = annualRate / 12;
        let balance = originalLoan;
        
        for (let i = 0; i < monthsPassed; i++) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            balance -= principalPayment;
        }
        
        return Math.max(0, Math.round(balance));
    }

    // Calculate property expenses
    calculateMonthlyExpenses(propertyValue, monthlyRent, includeManagement = true) {
        const monthlyExpenses = {
            propertyTax: Math.round((propertyValue * this.defaults.propertyTaxRate) / 12),
            insurance: Math.round((propertyValue * this.defaults.insuranceRate) / 12),
            maintenance: Math.round((propertyValue * this.defaults.maintenanceRate) / 12),
            vacancy: Math.round(monthlyRent * this.defaults.vacancyRate),
            management: includeManagement ? Math.round(monthlyRent * this.defaults.propertyManagementRate) : 0
        };
        
        monthlyExpenses.total = Object.values(monthlyExpenses).reduce((sum, expense) => sum + expense, 0);
        return monthlyExpenses;
    }

    // Calculate net operating income (NOI)
    calculateNOI(monthlyRent, propertyValue, includeManagement = true) {
        const expenses = this.calculateMonthlyExpenses(propertyValue, monthlyRent, includeManagement);
        const effectiveRent = monthlyRent - expenses.vacancy;
        return effectiveRent - expenses.propertyTax - expenses.insurance - 
               expenses.maintenance - expenses.management;
    }

    // Calculate cash flow after mortgage
    calculateMonthlyCashFlow(monthlyRent, propertyValue, mortgagePayment, includeManagement = true) {
        const noi = this.calculateNOI(monthlyRent, propertyValue, includeManagement);
        return noi - mortgagePayment;
    }

    // Calculate return on investment
    calculateROI(totalCashFlow, totalInvestment) {
        if (totalInvestment === 0) return 0;
        return (totalCashFlow / totalInvestment) * 100;
    }

    // Calculate cap rate
    calculateCapRate(annualNOI, propertyValue) {
        if (propertyValue === 0) return 0;
        return (annualNOI / propertyValue) * 100;
    }

    // Calculate cash-on-cash return
    calculateCashOnCash(annualCashFlow, totalCashInvested) {
        if (totalCashInvested === 0) return 0;
        return (annualCashFlow / totalCashInvested) * 100;
    }

    // Calculate property value after appreciation
    calculateFutureValue(currentValue, years, appreciationRate = this.defaults.appreciationRate) {
        return currentValue * Math.pow(1 + appreciationRate, years);
    }

    // Calculate future rent after growth
    calculateFutureRent(currentRent, years, rentGrowthRate = this.defaults.rentGrowthRate) {
        return currentRent * Math.pow(1 + rentGrowthRate, years);
    }

    // Calculate total investment needed for a property
    calculateTotalInvestment(purchasePrice, rehabCost = 0, downPaymentPercent = 20) {
        const downPayment = purchasePrice * (downPaymentPercent / 100);
        const closingCosts = purchasePrice * this.defaults.closingCostRate;
        return downPayment + closingCosts + rehabCost;
    }

    // Calculate BRRRR strategy returns
    calculateBRRRR(purchasePrice, rehabCost, afterRepairValue, newRentAmount, refinancePercent = 75) {
        const totalInvestment = this.calculateTotalInvestment(purchasePrice, rehabCost);
        const refinanceAmount = afterRepairValue * (refinancePercent / 100);
        const cashRecovered = refinanceAmount - (purchasePrice * 0.8); // Assuming 20% down initially
        const cashLeftInDeal = totalInvestment - cashRecovered;
        
        const newMortgagePayment = this.calculateMortgagePayment(refinanceAmount);
        const monthlyCashFlow = this.calculateMonthlyCashFlow(newRentAmount, afterRepairValue, newMortgagePayment);
        
        return {
            totalInvestment,
            refinanceAmount,
            cashRecovered,
            cashLeftInDeal,
            newMortgagePayment,
            monthlyCashFlow,
            cashOnCashReturn: this.calculateCashOnCash(monthlyCashFlow * 12, cashLeftInDeal)
        };
    }

    // Simulate a complete portfolio over time
    simulatePortfolio(simulation, phases) {
        const projections = [];
        const timeHorizon = simulation.time_horizon_months || 36;
        let cashReserves = simulation.initial_capital;
        let properties = [];
        let currentPhaseIndex = 0;

        for (let month = 0; month <= timeHorizon; month++) {
            // Process phases that start this month
            while (currentPhaseIndex < phases.length && phases[currentPhaseIndex].month_number === month) {
                const phase = phases[currentPhaseIndex];
                
                if (phase.action_type === 'buy') {
                    const totalInvestment = this.calculateTotalInvestment(
                        phase.purchase_price,
                        phase.rehab_cost || 0,
                        phase.down_payment_percent || 20
                    );
                    
                    if (cashReserves >= totalInvestment) {
                        cashReserves -= totalInvestment;
                        
                        const loanAmount = phase.purchase_price * (1 - (phase.down_payment_percent || 20) / 100);
                        const mortgagePayment = this.calculateMortgagePayment(loanAmount);
                        
                        properties.push({
                            id: phase.property_id || `property_${properties.length + 1}`,
                            address: phase.property_address,
                            purchasePrice: phase.purchase_price,
                            currentValue: phase.purchase_price + (phase.rehab_cost || 0),
                            monthlyRent: phase.monthly_rental_income || 0,
                            loanAmount: loanAmount,
                            mortgagePayment: mortgagePayment,
                            purchaseMonth: month,
                            monthsOwned: 0
                        });
                    }
                } else if (phase.action_type === 'sell') {
                    const propertyIndex = properties.findIndex(p => p.address === phase.property_address);
                    if (propertyIndex !== -1) {
                        const property = properties[propertyIndex];
                        const saleProceeds = phase.sale_price - (phase.sale_price * 0.06); // 6% selling costs
                        const loanBalance = this.calculateLoanBalance(
                            property.loanAmount,
                            property.mortgagePayment,
                            this.defaults.mortgageRate,
                            property.monthsOwned
                        );
                        const netProceeds = saleProceeds - loanBalance;
                        cashReserves += netProceeds;
                        properties.splice(propertyIndex, 1);
                    }
                } else if (phase.action_type === 'refinance') {
                    const propertyIndex = properties.findIndex(p => p.address === phase.property_address);
                    if (propertyIndex !== -1) {
                        const property = properties[propertyIndex];
                        const newLoanAmount = property.currentValue * 0.75; // 75% LTV
                        const oldLoanBalance = this.calculateLoanBalance(
                            property.loanAmount,
                            property.mortgagePayment,
                            this.defaults.mortgageRate,
                            property.monthsOwned
                        );
                        const cashOut = newLoanAmount - oldLoanBalance;
                        cashReserves += cashOut;
                        
                        // Update property with new loan
                        property.loanAmount = newLoanAmount;
                        property.mortgagePayment = this.calculateMortgagePayment(newLoanAmount);
                    }
                }
                
                currentPhaseIndex++;
            }

            // Calculate monthly metrics
            let totalRentalIncome = 0;
            let totalExpenses = 0;
            let totalMortgagePayments = 0;
            let totalEquity = 0;
            let totalDebt = 0;

            properties.forEach(property => {
                // Update property values
                property.monthsOwned++;
                const yearsOwned = property.monthsOwned / 12;
                property.currentValue = this.calculateFutureValue(
                    property.purchasePrice,
                    yearsOwned,
                    this.defaults.appreciationRate
                );
                property.currentRent = this.calculateFutureRent(
                    property.monthlyRent,
                    yearsOwned,
                    this.defaults.rentGrowthRate
                );

                // Calculate income and expenses
                totalRentalIncome += property.currentRent;
                const expenses = this.calculateMonthlyExpenses(property.currentValue, property.currentRent);
                totalExpenses += expenses.total;
                totalMortgagePayments += property.mortgagePayment;

                // Calculate equity and debt
                const loanBalance = this.calculateLoanBalance(
                    property.loanAmount,
                    property.mortgagePayment,
                    this.defaults.mortgageRate,
                    property.monthsOwned
                );
                totalDebt += loanBalance;
                totalEquity += property.currentValue - loanBalance;
            });

            const netCashFlow = totalRentalIncome - totalExpenses - totalMortgagePayments;
            cashReserves += netCashFlow;

            // Calculate ROI
            const totalInvested = simulation.initial_capital;
            const totalValue = totalEquity + cashReserves;
            const roi = this.calculateROI(totalValue - totalInvested, totalInvested);

            projections.push({
                month_number: month,
                total_properties: properties.length,
                rental_income: Math.round(totalRentalIncome),
                total_expenses: Math.round(totalExpenses),
                mortgage_payments: Math.round(totalMortgagePayments),
                net_cashflow: Math.round(netCashFlow),
                cash_reserves: Math.round(cashReserves),
                total_equity: Math.round(totalEquity),
                total_debt: Math.round(totalDebt),
                roi_percentage: Math.round(roi * 100) / 100,
                properties_data: properties.map(p => ({
                    address: p.address,
                    value: Math.round(p.currentValue),
                    rent: Math.round(p.currentRent),
                    equity: Math.round(p.currentValue - this.calculateLoanBalance(
                        p.loanAmount,
                        p.mortgagePayment,
                        this.defaults.mortgageRate,
                        p.monthsOwned
                    ))
                }))
            });
        }

        return projections;
    }

    // Helper to format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    // Helper to format percentage
    formatPercentage(value) {
        return `${value.toFixed(2)}%`;
    }
}

// Export as singleton
window.FinancialCalculator = FinancialCalculator;