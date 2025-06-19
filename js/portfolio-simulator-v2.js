/**
 * Portfolio Simulator V2
 * Excel-like real estate portfolio simulator with real-time calculations
 */

// Global state
let timelineData = [];
let portfolioState = {
    properties: {},
    loans: {},
    totals: {
        propertyCount: 0,
        portfolioValue: 0,
        totalEquity: 0,
        totalDebt: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        netCashFlow: 0,
        cashOnCash: 0,
        totalCashInvested: 0,
        totalInterestPaid: 0,
        cashOnHand: 0,
        rentalIncome: 0,
        cashFromSales: 0,
        totalNetWorth: 0
    }
};

// Current viewing month for projections
let currentViewMonth = 0;

// Make key variables available globally for testing
// Use getter/setter to sync both references
Object.defineProperty(window, 'timelineData', {
    get: function() { return timelineData; },
    set: function(value) { 
        timelineData = value;
        console.log('Timeline data updated via window.timelineData');
    }
});
window.portfolioState = portfolioState;

// Calculator instances (initialized after DOM load)
let loanCalc, roiCalc, cashFlowCalc, equityCalc;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize calculators after ensuring classes are loaded
    if (typeof LoanCalculator !== 'undefined') {
        loanCalc = new LoanCalculator();
        roiCalc = new ROICalculator();
        cashFlowCalc = new CashFlowCalculator();
        equityCalc = new EquityCalculator();
    } else {
        console.error('Calculator classes not loaded! Check script loading order.');
        return;
    }
    
    initializeSimulator();
    loadFromLocalStorage();
});

/**
 * Initialize the simulator
 */
function initializeSimulator() {
    // Set up auto-save
    setInterval(autoSave, 5000); // Auto-save every 5 seconds
    
    // Add initial row if empty
    if (timelineData.length === 0) {
        addTimelineRow();
    } else {
        // If we have data, render it
        renderTimelineTable();
    }
    
    // Refresh calculations
    recalculateAll();
}

/**
 * Add a new timeline row
 */
function addTimelineRow() {
    // Find the highest month value to suggest next month
    const maxMonth = timelineData.length > 0 
        ? Math.max(...timelineData.map(row => row.month)) 
        : -1;
    
    const newRow = {
        id: Date.now(),
        month: maxMonth + 1,  // Suggest next month, but user can change it
        action: 'buy',
        property: '',
        price: 0,
        downPercent: 20,
        downAmount: 0,
        loanAmount: 0,
        rate: 4.5,
        term: 30,
        payment: 0,
        rent: 0,
        monthlyExpenses: 0
    };
    
    timelineData.push(newRow);
    renderTimelineTable();
    recalculateAll();
}

/**
 * Delete a timeline row
 */
function deleteTimelineRow(id) {
    if (timelineData.length <= 1) {
        alert('Cannot delete the last row');
        return;
    }
    
    timelineData = timelineData.filter(row => row.id !== id);
    
    // Do NOT renumber months - keep user-entered values
    
    renderTimelineTable();
    recalculateAll();
}

/**
 * Render the timeline table
 */
function renderTimelineTable() {
    const tbody = document.getElementById('timelineBody');
    tbody.innerHTML = '';
    
    timelineData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <input type="number" class="editable number" value="${row.month}" 
                       onchange="updateTimeline(${row.id}, 'month', this.value)" min="0">
            </td>
            <td>
                <select class="table-select" onchange="updateTimeline(${row.id}, 'action', this.value)">
                    <option value="buy" ${row.action === 'buy' ? 'selected' : ''}>Buy</option>
                    <option value="sell" ${row.action === 'sell' ? 'selected' : ''}>Sell</option>
                </select>
            </td>
            <td>
                <input type="text" class="editable" value="${row.property}" 
                       onchange="updateTimeline(${row.id}, 'property', this.value)"
                       placeholder="Property address">
            </td>
            <td>
                <input type="number" class="editable number currency" value="${row.price}" 
                       onchange="updateTimeline(${row.id}, 'price', this.value)" min="0"
                       ${row.action !== 'buy' && row.action !== 'sell' ? 'disabled' : ''}>
            </td>
            <td>
                <input type="number" class="editable number percentage" value="${row.downPercent}" 
                       onchange="updateTimeline(${row.id}, 'downPercent', this.value)" 
                       min="0" max="100" step="5"
                       ${row.action !== 'buy' ? 'disabled' : ''}>
            </td>
            <td class="number currency">${formatCurrency(row.downAmount)}</td>
            <td class="number currency">${formatCurrency(row.loanAmount)}</td>
            <td>
                <input type="number" class="editable number percentage" value="${row.rate}" 
                       onchange="updateTimeline(${row.id}, 'rate', this.value)" 
                       min="0" max="20" step="0.25"
                       ${row.action === 'wait' ? 'disabled' : ''}>
            </td>
            <td>
                <input type="number" class="editable number" value="${row.term}" 
                       onchange="updateTimeline(${row.id}, 'term', this.value)" 
                       min="1" max="30" step="1"
                       ${row.action === 'wait' ? 'disabled' : ''}>
            </td>
            <td class="number currency">${formatCurrency(row.payment)}</td>
            <td>
                <input type="number" class="editable number currency" value="${row.rent}" 
                       onchange="updateTimeline(${row.id}, 'rent', this.value)" min="0"
                       ${row.action !== 'buy' ? 'disabled' : ''}>
            </td>
            <td>
                <input type="number" class="editable number currency" value="${row.monthlyExpenses || 0}" 
                       onchange="updateTimeline(${row.id}, 'monthlyExpenses', this.value)" min="0"
                       ${row.action !== 'buy' ? 'disabled' : ''}>
            </td>
            <td class="table-actions">
                <button class="btn btn-sm btn-danger" onclick="deleteTimelineRow(${row.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Update timeline data
 */
function updateTimeline(id, field, value) {
    const row = timelineData.find(r => r.id === id);
    if (!row) return;
    
    // Convert values to appropriate types
    if (['month', 'price', 'downPercent', 'rate', 'term', 'rent', 'monthlyExpenses'].includes(field)) {
        value = parseFloat(value) || 0;
    }
    
    row[field] = value;
    
    // Recalculate dependent fields
    if (field === 'price' || field === 'downPercent') {
        row.downAmount = row.price * (row.downPercent / 100);
        row.loanAmount = row.price - row.downAmount;
    }
    
    // Recalculate payment if loan parameters change
    if (['price', 'downPercent', 'rate', 'term'].includes(field)) {
        if (row.loanAmount > 0) {
            try {
                if (loanCalc && typeof loanCalc.calculate === 'function') {
                    const loanResult = loanCalc.calculate({
                        principal: row.loanAmount,
                        interestRate: row.rate,
                        termYears: row.term
                    });
                    row.payment = loanResult.monthlyPayment;
                } else {
                    console.warn('Loan calculator not available');
                    row.payment = 0;
                }
            } catch (error) {
                console.error('Loan calculation error:', error);
                row.payment = 0;
            }
        } else {
            // No loan if 100% down payment
            row.payment = 0;
        }
    }
    
    // Update calculations and refresh the calculated fields in the table
    renderTimelineTable();
    recalculateAll();
}

/**
 * Recalculate all portfolio metrics
 */
function recalculateAll() {
    // Reset portfolio state
    portfolioState = {
        properties: {},
        loans: {},
        totals: {
            propertyCount: 0,
            portfolioValue: 0,
            totalEquity: 0,
            totalDebt: 0,
            monthlyIncome: 0,
            monthlyExpenses: 0,
            netCashFlow: 0,
            cashOnCash: 0,
            totalCashInvested: 0,
            totalInterestPaid: 0,
            cashOnHand: 0,
            rentalIncome: 0,
            cashFromSales: 0,
            totalNetWorth: 0
        }
    };
    
    // Process timeline events in chronological order
    const sortedEvents = [...timelineData].sort((a, b) => a.month - b.month);
    
    // Filter events to only include those that have occurred by currentViewMonth
    const activeEvents = sortedEvents.filter(event => event.month <= currentViewMonth);
    
    activeEvents.forEach(event => {
        processTimelineEvent(event);
    });
    
    // Calculate portfolio-wide metrics
    calculatePortfolioMetrics();
    
    // Update UI
    updateSummaryDisplay();
    updatePropertyList();
    updateLoanList();
}

/**
 * Process a single timeline event
 */
function processTimelineEvent(event) {
    switch (event.action) {
        case 'buy':
            processBuyEvent(event);
            break;
        case 'sell':
            processSellEvent(event);
            break;
        // Refinance and wait removed - use buy/sell sequence for refinancing
    }
}

/**
 * Process a buy event
 */
function processBuyEvent(event) {
    if (!event.property || event.price <= 0) return;
    
    const propertyId = `prop_${event.id}`;
    
    // Add property to portfolio
    portfolioState.properties[propertyId] = {
        id: propertyId,
        address: event.property,
        purchasePrice: event.price,
        currentValue: event.price, // Assume no instant appreciation
        monthlyRent: event.rent,
        monthlyExpenses: event.monthlyExpenses || 0,
        purchaseMonth: event.month
    };
    
    // Add loan if applicable
    if (event.loanAmount > 0) {
        const loanId = `loan_${event.id}`;
        portfolioState.loans[loanId] = {
            id: loanId,
            propertyId: propertyId,
            originalAmount: event.loanAmount,
            currentBalance: event.loanAmount,
            rate: event.rate,
            term: event.term,
            monthlyPayment: event.payment,
            startMonth: event.month
        };
    }
    
    // Update totals
    portfolioState.totals.propertyCount++;
    portfolioState.totals.portfolioValue += event.price;
    portfolioState.totals.totalDebt += event.loanAmount;
    portfolioState.totals.monthlyIncome += event.rent;
    portfolioState.totals.totalCashInvested += event.downAmount;
}

/**
 * Process a sell event
 */
function processSellEvent(event) {
    if (!event.property) return;
    
    // Find property to sell
    const property = Object.values(portfolioState.properties).find(
        p => p.address === event.property
    );
    
    if (!property) return;
    
    // Calculate sale proceeds
    const salePrice = event.price || property.currentValue;
    
    // Find associated loan
    const loan = Object.values(portfolioState.loans).find(
        l => l.propertyId === property.id
    );
    
    // Calculate cash from sale (sale price - loan payoff)
    const loanPayoff = loan ? loan.currentBalance : 0;
    const cashFromThisSale = salePrice - loanPayoff;
    portfolioState.totals.cashFromSales += cashFromThisSale;
    
    // Remove property
    delete portfolioState.properties[property.id];
    portfolioState.totals.propertyCount--;
    portfolioState.totals.portfolioValue -= property.currentValue;
    portfolioState.totals.monthlyIncome -= property.monthlyRent;
    
    // Remove loan
    if (loan) {
        portfolioState.totals.totalDebt -= loan.currentBalance;
        delete portfolioState.loans[loan.id];
    }
}

// Refinance functionality removed - use sell/buy sequence instead
// See help instructions for how to simulate a cash-out refinance

/**
 * Calculate portfolio-wide metrics
 */
function calculatePortfolioMetrics() {
    const totals = portfolioState.totals;
    
    // Calculate total monthly expenses from properties
    totals.monthlyExpenses = 0;
    Object.values(portfolioState.properties).forEach(property => {
        totals.monthlyExpenses += property.monthlyExpenses || 0;
    });
    
    // Add debt service to expenses
    Object.values(portfolioState.loans).forEach(loan => {
        totals.monthlyExpenses += loan.monthlyPayment;
    });
    
    // Calculate net cash flow
    totals.netCashFlow = totals.monthlyIncome - totals.monthlyExpenses;
    
    // Apply time-based projections if viewing future
    if (currentViewMonth > 0) {
        applyTimeProjections(currentViewMonth);
    } else {
        // For current view, just calculate total cash on hand
        totals.cashOnHand = totals.rentalIncome + totals.cashFromSales;
    }
    
    // Calculate total equity
    totals.totalEquity = totals.portfolioValue - totals.totalDebt;
    
    // Calculate total net worth (equity + cash)
    totals.totalNetWorth = totals.totalEquity + totals.cashOnHand;
    
    // Calculate cash-on-cash return
    if (totals.totalCashInvested > 0) {
        const annualCashFlow = totals.netCashFlow * 12;
        totals.cashOnCash = (annualCashFlow / totals.totalCashInvested) * 100;
    }
}

/**
 * Apply time-based projections
 */
function applyTimeProjections(monthsInFuture) {
    const totals = portfolioState.totals;
    const annualAppreciationRate = 0.03; // 3% annually
    const monthlyAppreciationRate = Math.pow(1 + annualAppreciationRate, 1/12) - 1;
    
    // Reset values for recalculation
    totals.portfolioValue = 0;
    totals.totalDebt = 0;
    totals.totalInterestPaid = 0;
    totals.cashOnHand = 0;
    totals.rentalIncome = 0;
    
    // Calculate for each property
    Object.values(portfolioState.properties).forEach(property => {
        // Only count months after purchase and up to current view month
        const monthsOwned = monthsInFuture - property.purchaseMonth;
        if (monthsOwned > 0) {
            // Apply appreciation
            const appreciationFactor = Math.pow(1 + monthlyAppreciationRate, monthsOwned);
            property.currentValue = property.purchasePrice * appreciationFactor;
            totals.portfolioValue += property.currentValue;
            
            // Calculate rental income from this property
            const propertyNetRent = property.monthlyRent - (property.monthlyExpenses || 0);
            totals.rentalIncome += propertyNetRent * monthsOwned;
        }
    });
    
    // Calculate loan balances and interest paid
    Object.values(portfolioState.loans).forEach(loan => {
        // Only count months after loan start and up to current view month
        const monthsPaid = monthsInFuture - loan.startMonth;
        if (monthsPaid > 0 && loan.originalAmount > 0) {
            // Calculate remaining balance using amortization formula
            const r = loan.rate / 100 / 12; // Monthly rate
            const n = loan.term * 12; // Total payments
            
            if (r > 0) {
                const remainingPayments = Math.max(n - monthsPaid, 0);
                if (remainingPayments > 0) {
                    loan.currentBalance = loan.monthlyPayment * 
                        (1 - Math.pow(1 + r, -remainingPayments)) / r;
                } else {
                    loan.currentBalance = 0;
                }
                
                // Calculate total interest paid
                const totalPaid = loan.monthlyPayment * monthsPaid;
                const principalPaid = loan.originalAmount - loan.currentBalance;
                const interestPaid = totalPaid - principalPaid;
                if (interestPaid > 0) {
                    totals.totalInterestPaid += interestPaid;
                }
            } else {
                // No interest loan
                loan.currentBalance = Math.max(loan.originalAmount - (loan.monthlyPayment * monthsPaid), 0);
            }
            
            totals.totalDebt += loan.currentBalance;
            
            // Subtract loan payments from rental income
            totals.rentalIncome -= loan.monthlyPayment * monthsPaid;
        }
    });
    
    // Total invested remains the same (initial investments)
    totals.totalInvested = totals.totalCashInvested;
    
    // Calculate total cash on hand (rental income + cash from sales)
    totals.cashOnHand = totals.rentalIncome + totals.cashFromSales;
}

/**
 * Update summary display
 */
function updateSummaryDisplay() {
    const totals = portfolioState.totals;
    
    document.getElementById('totalProperties').textContent = totals.propertyCount;
    document.getElementById('portfolioValue').textContent = formatCurrency(totals.portfolioValue);
    document.getElementById('totalEquity').textContent = formatCurrency(totals.totalEquity);
    document.getElementById('totalDebt').textContent = formatCurrency(totals.totalDebt);
    document.getElementById('monthlyIncome').textContent = formatCurrency(totals.monthlyIncome);
    document.getElementById('monthlyExpenses').textContent = formatCurrency(totals.monthlyExpenses);
    
    const cashFlowElement = document.getElementById('netCashFlow');
    cashFlowElement.textContent = formatCurrency(totals.netCashFlow);
    cashFlowElement.className = totals.netCashFlow >= 0 ? 'summary-value positive' : 'summary-value negative';
    
    document.getElementById('cashOnCash').textContent = `${totals.cashOnCash.toFixed(2)}%`;
    document.getElementById('totalInvested').textContent = formatCurrency(totals.totalInvested || totals.totalCashInvested);
    document.getElementById('totalInterestPaid').textContent = formatCurrency(totals.totalInterestPaid);
    document.getElementById('rentalIncome').textContent = formatCurrency(totals.rentalIncome);
    document.getElementById('cashFromSales').textContent = formatCurrency(totals.cashFromSales);
    document.getElementById('totalCashOnHand').textContent = formatCurrency(totals.cashOnHand);
    
    // Update Net Worth display
    const netWorthElement = document.getElementById('totalNetWorth');
    netWorthElement.textContent = formatCurrency(totals.totalNetWorth);
    netWorthElement.className = totals.totalNetWorth >= 0 ? 'summary-value positive' : 'summary-value negative';
}

/**
 * Get property timeline status at a specific month
 */
function getPropertyTimelineStatus(propertyAddress, viewMonth) {
    // Find all events for this property
    const propertyEvents = timelineData
        .filter(event => event.property === propertyAddress)
        .sort((a, b) => a.month - b.month);
    
    if (propertyEvents.length === 0) {
        return { active: false, message: 'Property not found' };
    }
    
    // Find first buy and last sell
    const firstBuy = propertyEvents.find(e => e.action === 'buy');
    const lastSell = propertyEvents.filter(e => e.action === 'sell').pop();
    
    if (!firstBuy) {
        return { active: false, message: 'No buy event found' };
    }
    
    // Check timeline status
    if (viewMonth < firstBuy.month) {
        return { active: false, message: `Not yet purchased (buys at month ${firstBuy.month})` };
    }
    
    if (lastSell && viewMonth >= lastSell.month) {
        return { active: false, message: `No longer on timeline as of Month ${viewMonth}` };
    }
    
    return { active: true, message: `On timeline as of Month ${viewMonth}` };
}

/**
 * Update property list display
 */
function updatePropertyList() {
    const propertyList = document.getElementById('propertyList');
    propertyList.innerHTML = '';
    
    if (Object.keys(portfolioState.properties).length === 0) {
        propertyList.innerHTML = '<li style="color: var(--text-secondary); padding: 1rem;">No properties in portfolio</li>';
        return;
    }
    
    Object.values(portfolioState.properties).forEach(property => {
        const li = document.createElement('li');
        li.className = 'property-item';
        
        const loan = Object.values(portfolioState.loans).find(l => l.propertyId === property.id);
        const equity = property.currentValue - (loan ? loan.currentBalance : 0);
        const equityPercent = (equity / property.currentValue) * 100;
        
        // Check if property is active at current view month
        const timelineStatus = getPropertyTimelineStatus(property.address, currentViewMonth);
        
        li.innerHTML = `
            <div>
                <div class="property-address">${property.address}</div>
                <div class="property-metrics">
                    <span>Value: ${formatCurrency(property.currentValue)}</span>
                    <span>Rent: ${formatCurrency(property.monthlyRent)}/mo</span>
                </div>
            </div>
            <div class="property-metrics">
                <span>Equity: ${formatCurrency(equity)} (${equityPercent.toFixed(1)}%)</span>
                <span class="timeline-status ${timelineStatus.active ? 'active' : 'inactive'}">
                    ${timelineStatus.active ? '✅' : '❌'} ${timelineStatus.message}
                </span>
            </div>
        `;
        
        propertyList.appendChild(li);
    });
}

/**
 * Update loan list display
 */
function updateLoanList() {
    const loanList = document.getElementById('loanList');
    loanList.innerHTML = '';
    
    if (Object.keys(portfolioState.loans).length === 0) {
        loanList.innerHTML = '<li style="color: var(--text-secondary); padding: 1rem;">No active loans</li>';
        return;
    }
    
    Object.values(portfolioState.loans).forEach(loan => {
        const property = portfolioState.properties[loan.propertyId];
        if (!property) return;
        
        const li = document.createElement('li');
        li.className = 'property-item';
        
        li.innerHTML = `
            <div>
                <div class="property-address">${property.address}</div>
                <div class="property-metrics">
                    <span>Balance: ${formatCurrency(loan.currentBalance)}</span>
                    <span>Rate: ${loan.rate}%</span>
                    <span>Term: ${loan.term}yr</span>
                </div>
            </div>
            <div class="property-metrics">
                <span>Payment: ${formatCurrency(loan.monthlyPayment)}/mo</span>
            </div>
        `;
        
        loanList.appendChild(li);
    });
}

/**
 * Format currency
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

/**
 * Toggle equation panel
 */
function toggleEquations() {
    const content = document.getElementById('equationContent');
    const toggle = document.getElementById('equationToggle');
    
    content.classList.toggle('active');
    toggle.className = content.classList.contains('active') ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
}

/**
 * Toggle instructions panel
 */
function toggleInstructions() {
    const content = document.getElementById('instructionsContent');
    const toggle = document.getElementById('instructionsToggle');
    
    content.classList.toggle('active');
    toggle.className = content.classList.contains('active') ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
}

/**
 * New simulation
 */
function newSimulation() {
    if (confirm('Start a new simulation? Current data will be lost unless saved.')) {
        // Clear existing data
        timelineData = [];
        portfolioState = {
            properties: {},
            loans: {},
            totals: {
                propertyCount: 0,
                portfolioValue: 0,
                totalEquity: 0,
                totalDebt: 0,
                monthlyIncome: 0,
                monthlyExpenses: 0,
                netCashFlow: 0,
                cashOnCash: 0,
                totalCashInvested: 0,
                totalInterestPaid: 0,
                cashOnHand: 0,
                rentalIncome: 0,
                cashFromSales: 0,
                totalNetWorth: 0
            }
        };
        
        document.getElementById('simulationName').textContent = 'New Simulation';
        
        // Reset summary month view
        currentViewMonth = 0;
        document.getElementById('summaryMonth').value = 0;
        document.getElementById('summaryYears').textContent = '(Today)';
        
        // Add initial row
        addTimelineRow();
        
        // Clear local storage
        localStorage.removeItem('portfolioSimulatorV2');
    }
}

/**
 * Save simulation
 */
function saveSimulation() {
    const name = prompt('Enter simulation name:', document.getElementById('simulationName').textContent);
    if (!name) return;
    
    document.getElementById('simulationName').textContent = name;
    saveToLocalStorage();
    
    // Update status
    const status = document.getElementById('autoSaveStatus');
    status.innerHTML = '<i class="fas fa-check-circle"></i> Saved';
    status.style.color = 'var(--success-color)';
    
    setTimeout(() => {
        status.style.color = 'var(--text-secondary)';
    }, 2000);
}

/**
 * Load simulation
 */
function loadSimulation() {
    const savedData = localStorage.getItem('portfolioSimulatorV2');
    if (!savedData) {
        alert('No saved simulation found');
        return;
    }
    
    try {
        const data = JSON.parse(savedData);
        timelineData = data.timeline || [];
        document.getElementById('simulationName').textContent = data.name || 'Loaded Simulation';
        
        renderTimelineTable();
        recalculateAll();
    } catch (error) {
        console.error('Error loading simulation:', error);
        alert('Error loading simulation data');
    }
}

/**
 * Export data
 */
function exportData() {
    const data = {
        name: document.getElementById('simulationName').textContent,
        timeline: timelineData,
        portfolio: portfolioState,
        exportDate: new Date().toISOString()
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-simulation-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

/**
 * Save to local storage
 */
function saveToLocalStorage() {
    const data = {
        name: document.getElementById('simulationName').textContent,
        timeline: timelineData,
        savedAt: new Date().toISOString()
    };
    
    localStorage.setItem('portfolioSimulatorV2', JSON.stringify(data));
}

/**
 * Load from local storage
 */
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('portfolioSimulatorV2');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            timelineData = data.timeline || [];
            document.getElementById('simulationName').textContent = data.name || 'Loaded Simulation';
            
            renderTimelineTable();
            recalculateAll();
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }
}

/**
 * Auto-save function
 */
function autoSave() {
    saveToLocalStorage();
    
    // Update status briefly
    const status = document.getElementById('autoSaveStatus');
    status.innerHTML = '<i class="fas fa-sync fa-spin"></i> Saving...';
    
    setTimeout(() => {
        status.innerHTML = '<i class="fas fa-check-circle"></i> Saved';
    }, 500);
}

/**
 * Refresh summary (manual trigger)
 */
function refreshSummary() {
    recalculateAll();
    
    // Visual feedback
    const btn = event.target.closest('button');
    const icon = btn.querySelector('i');
    icon.classList.add('fa-spin');
    
    setTimeout(() => {
        icon.classList.remove('fa-spin');
    }, 500);
}

/**
 * Update summary month view
 */
function updateSummaryMonth() {
    const monthInput = document.getElementById('summaryMonth');
    const yearsSpan = document.getElementById('summaryYears');
    
    currentViewMonth = parseInt(monthInput.value) || 0;
    
    if (currentViewMonth === 0) {
        yearsSpan.textContent = '(Today)';
    } else {
        const years = (currentViewMonth / 12).toFixed(1);
        yearsSpan.textContent = `(${years} years)`;
    }
    
    recalculateAll();
}

// Make functions available globally
window.updateTimeline = updateTimeline;
window.addTimelineRow = addTimelineRow;
window.deleteTimelineRow = deleteTimelineRow;
window.recalculateAll = recalculateAll;
window.newSimulation = newSimulation;
window.saveSimulation = saveSimulation;
window.loadSimulation = loadSimulation;
window.exportData = exportData;
window.toggleEquations = toggleEquations;
window.toggleInstructions = toggleInstructions;
window.refreshSummary = refreshSummary;
window.updateSummaryMonth = updateSummaryMonth;
