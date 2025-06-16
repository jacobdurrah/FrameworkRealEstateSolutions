// Portfolio State Manager
// Centralized state management for portfolio simulator
// Ensures all UI components stay synchronized

class PortfolioStateManager {
    constructor(financialCalculator) {
        this.financialCalc = financialCalculator;
        this.listeners = new Map();
        this.currentState = null;
        this.transactions = [];
        this.simulation = null;
    }

    // Subscribe UI components to state changes
    subscribe(componentId, callback) {
        this.listeners.set(componentId, callback);
        // Immediately notify with current state if available
        if (this.currentState) {
            callback(this.currentState);
        }
    }

    // Unsubscribe component
    unsubscribe(componentId) {
        this.listeners.delete(componentId);
    }

    // Set current simulation
    setSimulation(simulation) {
        this.simulation = simulation;
        this.recalculateState();
    }

    // Add transaction and recalculate state
    addTransaction(transaction) {
        this.transactions.push(transaction);
        this.transactions.sort((a, b) => a.month - b.month);
        this.recalculateState();
    }

    // Update transaction
    updateTransaction(transactionId, updates) {
        const index = this.transactions.findIndex(t => t.id === transactionId);
        if (index >= 0) {
            this.transactions[index] = { ...this.transactions[index], ...updates };
            this.recalculateState();
        }
    }

    // Remove transaction
    removeTransaction(transactionId) {
        this.transactions = this.transactions.filter(t => t.id !== transactionId);
        this.recalculateState();
    }

    // Set all transactions (for loading saved state)
    setTransactions(transactions) {
        this.transactions = [...transactions];
        this.transactions.sort((a, b) => a.month - b.month);
        this.recalculateState();
    }

    // Recalculate entire portfolio state
    recalculateState() {
        if (!this.simulation) return;

        const timeHorizon = this.simulation.time_horizon_months || 36;
        const newState = {
            simulation: this.simulation,
            transactions: this.transactions,
            months: [],
            summary: null
        };

        // Calculate state for each month
        let cashReserves = this.simulation.initial_capital;
        let properties = [];
        let loans = [];
        let monthlyIncome = 0;
        let monthlyExpenses = 0;
        let totalDebt = 0;
        let accumulatedRent = 0;

        for (let month = 0; month <= timeHorizon; month++) {
            // Process transactions for this month
            const monthTransactions = this.transactions.filter(t => t.month === month);
            
            monthTransactions.forEach(transaction => {
                switch (transaction.type) {
                    case 'PROPERTY_PURCHASE':
                        const purchaseData = transaction.data;
                        
                        // Deduct cash needed
                        cashReserves -= purchaseData.totalCashNeeded || 0;
                        
                        // Add property
                        const property = {
                            id: transaction.propertyId,
                            address: purchaseData.address,
                            purchasePrice: purchaseData.purchasePrice,
                            currentValue: purchaseData.purchasePrice,
                            monthlyRent: purchaseData.monthlyRent,
                            purchaseMonth: month,
                            strategy: purchaseData.strategy || 'buy-hold',
                            operatingExpenses: purchaseData.operatingExpenses,
                            loanDetails: purchaseData.loanDetails,
                            cashFlow: purchaseData.cashFlowAnalysis
                        };
                        
                        properties.push(property);
                        
                        // Update monthly income/expenses
                        if (purchaseData.cashFlowAnalysis) {
                            monthlyIncome += purchaseData.monthlyRent || 0;
                            monthlyExpenses += (purchaseData.cashFlowAnalysis.grossRent - purchaseData.cashFlowAnalysis.netCashFlow - purchaseData.cashFlowAnalysis.mortgagePayment) || 0;
                            if (purchaseData.loanDetails) {
                                monthlyExpenses += purchaseData.loanDetails.monthlyPayment || 0;
                                totalDebt += purchaseData.loanDetails.loanAmount || 0;
                            }
                        }
                        break;
                        
                    case 'PROPERTY_SALE':
                        // Handle property sale
                        const saleData = transaction.data;
                        const soldProperty = properties.find(p => p.id === transaction.propertyId);
                        if (soldProperty) {
                            // Add sale proceeds
                            cashReserves += saleData.netProceeds || (saleData.salePrice * 0.94);
                            
                            // Remove from monthly calculations
                            monthlyIncome -= soldProperty.monthlyRent || 0;
                            if (soldProperty.loanDetails) {
                                monthlyExpenses -= soldProperty.loanDetails.monthlyPayment || 0;
                                totalDebt -= soldProperty.loanDetails.loanAmount || 0;
                            }
                            
                            // Mark as sold
                            soldProperty.soldMonth = month;
                            soldProperty.salePrice = saleData.salePrice;
                        }
                        break;
                        
                    case 'WAIT_PERIOD':
                        // Just accumulate cash during wait
                        break;
                        
                    case 'LOAN_ORIGINATION':
                        const loanData = transaction.data;
                        cashReserves += loanData.loanAmount || 0;
                        cashReserves -= loanData.closingCosts || 0;
                        totalDebt += loanData.loanAmount || 0;
                        monthlyExpenses += loanData.monthlyPayment || 0;
                        
                        loans.push({
                            id: transaction.id,
                            ...loanData
                        });
                        break;
                }
            });
            
            // Calculate net cash flow for the month
            const netCashFlow = monthlyIncome - monthlyExpenses;
            cashReserves += netCashFlow;
            accumulatedRent += monthlyIncome;
            
            // Update property values (appreciation)
            properties.forEach(property => {
                if (!property.soldMonth || property.soldMonth > month) {
                    const monthsOwned = month - property.purchaseMonth;
                    property.currentValue = property.purchasePrice * Math.pow(1.03, monthsOwned / 12);
                }
            });
            
            // Calculate total equity
            const activeProperties = properties.filter(p => !p.soldMonth || p.soldMonth > month);
            const totalPropertyValue = activeProperties.reduce((sum, p) => sum + p.currentValue, 0);
            const totalEquity = totalPropertyValue - totalDebt;
            
            // Store month state
            newState.months[month] = {
                month: month,
                cashReserves: Math.round(cashReserves),
                monthlyIncome: Math.round(monthlyIncome),
                monthlyExpenses: Math.round(monthlyExpenses),
                netCashFlow: Math.round(netCashFlow),
                totalProperties: activeProperties.length,
                totalPropertyValue: Math.round(totalPropertyValue),
                totalDebt: Math.round(totalDebt),
                totalEquity: Math.round(totalEquity),
                accumulatedRent: Math.round(accumulatedRent),
                properties: activeProperties,
                loans: loans,
                roi: this.calculateROI(cashReserves, totalEquity, this.simulation.initial_capital)
            };
        }
        
        // Set summary to final month
        newState.summary = newState.months[timeHorizon];
        
        // Update current state
        this.currentState = newState;
        
        // Notify all listeners
        this.notifyListeners();
    }

    // Calculate ROI
    calculateROI(cashReserves, totalEquity, initialInvestment) {
        if (initialInvestment === 0) return 0;
        const totalValue = cashReserves + totalEquity;
        const gain = totalValue - initialInvestment;
        return Math.round((gain / initialInvestment) * 100);
    }

    // Notify all subscribed components
    notifyListeners() {
        for (const [componentId, callback] of this.listeners) {
            try {
                callback(this.currentState);
            } catch (error) {
                console.error(`Error notifying component ${componentId}:`, error);
            }
        }
    }

    // Get state for specific month
    getMonthState(month) {
        return this.currentState?.months[month] || null;
    }

    // Get current state
    getCurrentState() {
        return this.currentState;
    }

    // Clear all state
    clear() {
        this.transactions = [];
        this.simulation = null;
        this.currentState = null;
        this.notifyListeners();
    }
}

// Export for use in portfolio simulator
window.PortfolioStateManager = PortfolioStateManager;