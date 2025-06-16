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

    // Calculate loan details including closing costs
    calculateLoanDetails(loanAmount, interestRate, termMonths, closingCostRate = 0.03, points = 0) {
        const closingCosts = loanAmount * closingCostRate;
        const pointsCost = loanAmount * (points / 100);
        const totalClosingCosts = closingCosts + pointsCost;
        const monthlyPayment = this.calculateMortgagePayment(loanAmount, interestRate, termMonths / 12);
        
        return {
            loanAmount,
            interestRate,
            termMonths,
            monthlyPayment,
            closingCosts: totalClosingCosts,
            totalCashNeeded: totalClosingCosts, // Just closing costs, loan covers the rest
            totalDebt: loanAmount
        };
    }

    // Calculate property equity based on current value and loans
    calculatePropertyEquity(currentValue, totalDebt) {
        return Math.max(0, currentValue - totalDebt);
    }

    // Get property status based on strategy and months owned
    getPropertyStatus(strategy, monthsOwned, rehabMonths = 6, isSold = false) {
        if (isSold) return 'sold';
        
        switch (strategy) {
            case 'brrrr':
                if (monthsOwned < rehabMonths) return 'brrrr_active';
                return 'hold'; // After rehab, it becomes a hold
            case 'flip':
                if (monthsOwned < rehabMonths) return 'flip_active';
                return 'flip_ready'; // Ready to sell
            case 'buy-hold':
            default:
                return 'hold';
        }
    }

    // Simulate a complete portfolio over time
    simulatePortfolio(simulation, phases) {
        const projections = [];
        const timeHorizon = simulation.time_horizon_months || 36;
        let cashReserves = simulation.initial_capital;
        let accumulatedRent = 0; // Track total rent collected
        let properties = [];
        let loans = [];
        let currentPhaseIndex = 0;

        for (let month = 0; month <= timeHorizon; month++) {
            // Process phases that start this month
            while (currentPhaseIndex < phases.length && phases[currentPhaseIndex].month_number === month) {
                const phase = phases[currentPhaseIndex];
                
                if (phase.action_type === 'buy') {
                    // Calculate total cash needed including rehab
                    const downPayment = phase.purchase_price * ((phase.down_payment_percent || 20) / 100);
                    const closingCosts = phase.purchase_price * 0.03;
                    const rehabCost = phase.rehab_cost || 0;
                    const totalCashNeeded = downPayment + closingCosts + rehabCost;
                    
                    if (cashReserves >= totalCashNeeded) {
                        cashReserves -= totalCashNeeded;
                        
                        const loanAmount = phase.purchase_price * (1 - (phase.down_payment_percent || 20) / 100);
                        const mortgagePayment = this.calculateMortgagePayment(loanAmount);
                        
                        const property = {
                            id: phase.property_id || `property_${properties.length + 1}`,
                            address: phase.property_address,
                            purchasePrice: phase.purchase_price,
                            currentValue: phase.purchase_price,
                            afterRepairValue: phase.purchase_price + rehabCost,
                            monthlyRent: phase.monthly_rental_income || 0,
                            loanAmount: loanAmount,
                            mortgagePayment: mortgagePayment,
                            purchaseMonth: month,
                            monthsOwned: 0,
                            strategy: phase.notes ? phase.notes.toLowerCase().replace(' ', '-') : 'buy-hold',
                            rehabMonths: rehabCost > 0 ? 6 : 0,
                            rehabCost: rehabCost,
                            status: 'active'
                        };
                        
                        properties.push(property);
                        
                        // Track loan
                        loans.push({
                            propertyId: property.id,
                            loanAmount: loanAmount,
                            monthlyPayment: mortgagePayment,
                            originationMonth: month,
                            type: 'mortgage'
                        });
                    }
                } else if (phase.action_type === 'sell') {
                    const propertyIndex = properties.findIndex(p => p.address === phase.property_address);
                    if (propertyIndex !== -1) {
                        const property = properties[propertyIndex];
                        const salePrice = phase.sale_price || property.currentValue;
                        const sellingCosts = salePrice * 0.06; // 6% selling costs
                        const saleProceeds = salePrice - sellingCosts;
                        
                        // Calculate remaining loan balance
                        const propertyLoans = loans.filter(l => l.propertyId === property.id && l.status !== 'paid');
                        let totalLoanBalance = 0;
                        propertyLoans.forEach(loan => {
                            const balance = this.calculateLoanBalance(
                                loan.loanAmount,
                                loan.monthlyPayment,
                                this.defaults.mortgageRate,
                                month - loan.originationMonth
                            );
                            totalLoanBalance += balance;
                            loan.status = 'paid';
                        });
                        
                        const netProceeds = saleProceeds - totalLoanBalance;
                        cashReserves += netProceeds;
                        
                        // Mark property as sold instead of removing
                        property.status = 'sold';
                        property.salePrice = salePrice;
                        property.saleMonth = month;
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
            let propertyBreakdown = {
                hold: 0,
                brrrr_active: 0,
                flip_active: 0,
                sold: 0
            };

            properties.forEach(property => {
                if (property.status === 'sold') {
                    propertyBreakdown.sold++;
                    return; // Skip sold properties for income calculations
                }
                // Update property values
                property.monthsOwned++;
                const yearsOwned = property.monthsOwned / 12;
                
                // Update value based on rehab progress
                if (property.monthsOwned <= property.rehabMonths) {
                    const rehabProgress = property.monthsOwned / property.rehabMonths;
                    property.currentValue = property.purchasePrice + (property.rehabCost * rehabProgress);
                } else {
                    property.currentValue = this.calculateFutureValue(
                        property.afterRepairValue,
                        yearsOwned - (property.rehabMonths / 12),
                        this.defaults.appreciationRate
                    );
                }
                
                // Only collect rent after rehab is complete
                const isCollectingRent = property.monthsOwned > property.rehabMonths;
                property.currentRent = isCollectingRent ? this.calculateFutureRent(
                    property.monthlyRent,
                    (property.monthsOwned - property.rehabMonths) / 12,
                    this.defaults.rentGrowthRate
                ) : 0;
                
                // Update property status
                const status = this.getPropertyStatus(property.strategy, property.monthsOwned, property.rehabMonths, false);
                propertyBreakdown[status] = (propertyBreakdown[status] || 0) + 1;

                // Calculate income and expenses
                totalRentalIncome += property.currentRent;
                const expenses = property.currentRent > 0 ? 
                    this.calculateMonthlyExpenses(property.currentValue, property.currentRent) : 
                    { total: 0 };
                totalExpenses += expenses.total;
                
                // Calculate total debt for this property
                const propertyLoans = loans.filter(l => l.propertyId === property.id && l.status !== 'paid');
                let propertyDebt = 0;
                let propertyPayments = 0;
                
                propertyLoans.forEach(loan => {
                    const balance = this.calculateLoanBalance(
                        loan.loanAmount,
                        loan.monthlyPayment,
                        this.defaults.mortgageRate,
                        month - loan.originationMonth
                    );
                    propertyDebt += balance;
                    propertyPayments += loan.monthlyPayment;
                });
                
                totalMortgagePayments += propertyPayments;
                totalDebt += propertyDebt;
                totalEquity += property.currentValue - propertyDebt;
            });

            const netCashFlow = totalRentalIncome - totalExpenses - totalMortgagePayments;
            cashReserves += netCashFlow;
            
            // Track accumulated rent (income after all expenses)
            if (netCashFlow > 0) {
                accumulatedRent += netCashFlow;
            }

            // Calculate ROI
            const totalInvested = simulation.initial_capital;
            const totalValue = totalEquity + cashReserves;
            const roi = this.calculateROI(totalValue - totalInvested, totalInvested);

            projections.push({
                month_number: month,
                total_properties: properties.filter(p => p.status !== 'sold').length,
                rental_income: Math.round(totalRentalIncome),
                total_expenses: Math.round(totalExpenses),
                mortgage_payments: Math.round(totalMortgagePayments),
                net_cashflow: Math.round(netCashFlow),
                cash_reserves: Math.round(cashReserves),
                accumulated_rent: Math.round(accumulatedRent),
                total_equity: Math.round(totalEquity),
                total_debt: Math.round(totalDebt),
                roi_percentage: Math.round(roi * 100) / 100,
                property_breakdown: propertyBreakdown,
                properties_data: properties.map(p => {
                    const propertyLoans = loans.filter(l => l.propertyId === p.id && l.status !== 'paid');
                    let propertyDebt = 0;
                    propertyLoans.forEach(loan => {
                        propertyDebt += this.calculateLoanBalance(
                            loan.loanAmount,
                            loan.monthlyPayment,
                            this.defaults.mortgageRate,
                            month - loan.originationMonth
                        );
                    });
                    
                    return {
                        address: p.address,
                        value: Math.round(p.currentValue),
                        rent: Math.round(p.currentRent),
                        equity: Math.round(p.currentValue - propertyDebt),
                        status: p.status,
                        strategy: p.strategy
                    };
                })
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