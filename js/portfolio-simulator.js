// Portfolio Simulator Main JavaScript
// Handles UI interactions and orchestrates the simulation

let simulationAPI;
let financialCalc;
let currentSimulation = null;
let currentPhases = [];
let currentProjections = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize services
    simulationAPI = new SimulationAPIService();
    financialCalc = new FinancialCalculator();
    
    // Initialize Supabase
    const initialized = await simulationAPI.init(
        window.APP_CONFIG.SUPABASE_URL,
        window.APP_CONFIG.SUPABASE_ANON_KEY
    );
    
    if (!initialized) {
        alert('Failed to initialize. Please check your connection.');
        return;
    }
    
    // Load saved simulations
    await loadSavedSimulations();
    
    // Check if we have a simulation ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const simulationId = urlParams.get('id');
    if (simulationId) {
        await loadSimulation(simulationId);
    }
});

// Start a new simulation
async function startNewSimulation() {
    const name = document.getElementById('simulationName').value || 'New Simulation';
    const targetIncome = parseFloat(document.getElementById('targetIncome').value) || 10000;
    const initialCapital = parseFloat(document.getElementById('initialCapital').value) || 50000;
    const timeHorizon = parseInt(document.getElementById('timeHorizon').value) || 36;
    const strategyType = document.getElementById('strategyType').value;
    
    const result = await simulationAPI.createSimulation({
        name,
        targetMonthlyIncome: targetIncome,
        initialCapital,
        timeHorizon,
        strategyType
    });
    
    if (result.error) {
        alert('Error creating simulation: ' + result.error.message);
        return;
    }
    
    currentSimulation = result.data;
    currentPhases = [];
    currentProjections = [];
    
    // Update URL
    window.history.pushState({}, '', `?id=${currentSimulation.id}`);
    
    // Update UI
    updateSimulationUI();
    await runSimulation();
    await loadSavedSimulations();
}

// Save current simulation
async function saveSimulation() {
    if (!currentSimulation) {
        alert('No active simulation to save');
        return;
    }
    
    // Update simulation details
    const name = document.getElementById('simulationName').value;
    const targetIncome = parseFloat(document.getElementById('targetIncome').value);
    const initialCapital = parseFloat(document.getElementById('initialCapital').value);
    const timeHorizon = parseInt(document.getElementById('timeHorizon').value);
    const strategyType = document.getElementById('strategyType').value;
    
    const result = await simulationAPI.updateSimulation(currentSimulation.id, {
        name,
        target_monthly_income: targetIncome,
        initial_capital: initialCapital,
        time_horizon_months: timeHorizon,
        strategy_type: strategyType
    });
    
    if (result.error) {
        alert('Error saving simulation: ' + result.error.message);
        return;
    }
    
    // Save projections
    for (const projection of currentProjections) {
        await simulationAPI.saveProjection(
            currentSimulation.id,
            projection.month_number,
            projection
        );
    }
    
    alert('Simulation saved successfully!');
    await loadSavedSimulations();
}

// Load saved simulations list
async function loadSavedSimulations() {
    const simulations = await simulationAPI.getUserSimulations();
    const listContainer = document.getElementById('savedSimulationsList');
    
    if (simulations.length === 0) {
        listContainer.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">No saved simulations yet</p>';
        return;
    }
    
    listContainer.innerHTML = simulations.map(sim => `
        <div class="saved-sim-item" onclick="loadSimulation('${sim.id}')">
            <h4>${sim.name}</h4>
            <p>Target: ${financialCalc.formatCurrency(sim.target_monthly_income)}/mo | 
               ${new Date(sim.updated_at).toLocaleDateString()}</p>
        </div>
    `).join('');
}

// Load a specific simulation
async function loadSimulation(simulationId) {
    const simulation = await simulationAPI.getSimulation(simulationId);
    if (!simulation) {
        alert('Simulation not found');
        return;
    }
    
    currentSimulation = simulation;
    currentPhases = simulation.phases || [];
    currentProjections = simulation.projections || [];
    
    // Update URL
    window.history.pushState({}, '', `?id=${simulationId}`);
    
    // Update form fields
    document.getElementById('simulationName').value = simulation.name;
    document.getElementById('targetIncome').value = simulation.target_monthly_income;
    document.getElementById('initialCapital').value = simulation.initial_capital;
    document.getElementById('timeHorizon').value = simulation.time_horizon_months;
    document.getElementById('strategyType').value = simulation.strategy_type;
    
    // Update UI
    updateSimulationUI();
    if (currentProjections.length === 0) {
        await runSimulation();
    } else {
        updateMetrics();
        updateProgressBar();
    }
}

// Update the simulation UI
function updateSimulationUI() {
    if (!currentSimulation) return;
    
    document.getElementById('simulationTitle').textContent = currentSimulation.name;
    updateTimelineView();
    updateMetrics();
    updateProgressBar();
    updatePortfolioSummary();
}

// Update phases list
function updatePhasesList() {
    const container = document.getElementById('phasesList');
    
    if (currentPhases.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">No phases added yet. Click "Add Property" to begin planning.</p>';
        return;
    }
    
    container.innerHTML = currentPhases
        .sort((a, b) => a.phase_number - b.phase_number)
        .map(phase => `
            <div class="phase-item">
                <div class="phase-info">
                    <h4>Month ${phase.month_number}: ${phase.action_type.charAt(0).toUpperCase() + phase.action_type.slice(1)}</h4>
                    <p>${phase.property_address || 'Property'} - ${formatPhaseDetails(phase)}</p>
                </div>
                <button class="btn-icon" onclick="deletePhase('${phase.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
}

// Format phase details for display
function formatPhaseDetails(phase) {
    switch (phase.action_type) {
        case 'buy':
            return `Purchase: ${financialCalc.formatCurrency(phase.purchase_price)} | Rent: ${financialCalc.formatCurrency(phase.monthly_rental_income)}/mo`;
        case 'sell':
            return `Sale Price: ${financialCalc.formatCurrency(phase.sale_price)}`;
        case 'refinance':
            return `Refinance to pull out equity`;
        default:
            return phase.notes || '';
    }
}

// Delete a phase
async function deletePhase(phaseId) {
    if (!confirm('Are you sure you want to delete this phase?')) return;
    
    const result = await simulationAPI.deletePhase(phaseId);
    if (result.error) {
        alert('Error deleting phase: ' + result.error.message);
        return;
    }
    
    // Reload simulation
    await loadSimulation(currentSimulation.id);
}

// Run the simulation
async function runSimulation() {
    if (!currentSimulation) return;
    
    // Run financial calculations
    currentProjections = financialCalc.simulatePortfolio(currentSimulation, currentPhases);
    
    // Save projections if we have them
    if (currentProjections.length > 0) {
        for (const projection of currentProjections) {
            await simulationAPI.saveProjection(
                currentSimulation.id,
                projection.month_number,
                projection
            );
        }
    }
    
    updateMetrics();
    updateTimelineView();
    updateProgressBar();
    updatePortfolioSummary();
}

// Update metrics display
function updateMetrics() {
    if (currentProjections.length === 0) {
        document.getElementById('currentIncome').textContent = '$0';
        document.getElementById('totalProperties').textContent = '0';
        document.getElementById('totalEquity').textContent = '$0';
        document.getElementById('currentROI').textContent = '0%';
        return;
    }
    
    const lastProjection = currentProjections[currentProjections.length - 1];
    
    document.getElementById('currentIncome').textContent = 
        financialCalc.formatCurrency(lastProjection.net_cashflow);
    document.getElementById('totalProperties').textContent = 
        lastProjection.total_properties;
    document.getElementById('totalEquity').textContent = 
        financialCalc.formatCurrency(lastProjection.total_equity);
    document.getElementById('currentROI').textContent = 
        financialCalc.formatPercentage(lastProjection.roi_percentage);
}

// Portfolio summary section
function updatePortfolioSummary() {
    const container = document.getElementById('portfolioDetails');
    
    if (!currentSimulation || currentProjections.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">Add properties to see your portfolio summary.</p>';
        return;
    }
    
    const lastProjection = currentProjections[currentProjections.length - 1];
    const timeToGoal = estimateTimeToGoal();
    
    container.innerHTML = `
        <div class="summary-grid">
            <div class="summary-item">
                <h4>Time to Goal</h4>
                <p class="summary-value">${timeToGoal} months</p>
            </div>
            <div class="summary-item">
                <h4>Total Properties</h4>
                <p class="summary-value">${lastProjection.total_properties}</p>
            </div>
            <div class="summary-item">
                <h4>Portfolio Value</h4>
                <p class="summary-value">${financialCalc.formatCurrency(lastProjection.total_equity + lastProjection.total_debt)}</p>
            </div>
            <div class="summary-item">
                <h4>Total Debt</h4>
                <p class="summary-value">${financialCalc.formatCurrency(lastProjection.total_debt)}</p>
            </div>
            <div class="summary-item">
                <h4>Net Worth</h4>
                <p class="summary-value">${financialCalc.formatCurrency(lastProjection.total_equity)}</p>
            </div>
            <div class="summary-item">
                <h4>Debt-to-Equity</h4>
                <p class="summary-value">${(lastProjection.total_debt / lastProjection.total_equity).toFixed(2)}:1</p>
            </div>
        </div>
    `;
}

// Estimate time to reach goal
function estimateTimeToGoal() {
    if (currentProjections.length < 2) return 'N/A';
    
    const targetIncome = currentSimulation.target_monthly_income;
    
    // Find when we reach the target
    for (let i = 0; i < currentProjections.length; i++) {
        if (currentProjections[i].net_cashflow >= targetIncome) {
            return i;
        }
    }
    
    // If not reached, estimate based on growth rate
    const lastProjection = currentProjections[currentProjections.length - 1];
    const firstProjection = currentProjections[Math.max(0, currentProjections.length - 12)];
    const monthlyGrowth = (lastProjection.net_cashflow - firstProjection.net_cashflow) / 12;
    
    if (monthlyGrowth <= 0) return '>100';
    
    const monthsNeeded = (targetIncome - lastProjection.net_cashflow) / monthlyGrowth;
    return Math.ceil(currentSimulation.time_horizon_months + monthsNeeded);
}

// Show property search modal
async function showPropertySearch() {
    if (!currentSimulation) {
        alert('Please start a simulation first');
        return;
    }
    
    const modal = document.getElementById('propertyModal');
    const content = document.getElementById('propertyModalContent');
    
    // Show loading
    content.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> Loading properties...</div>';
    modal.classList.add('active');
    
    // Initialize property selector if needed
    if (!window.propertySelector.parcelAPI) {
        await window.propertySelector.init();
    }
    
    // Load properties
    await window.propertySelector.loadProperties();
    
    // Create tabbed interface
    content.innerHTML = `
        <div class="modal-tabs">
            <button class="tab-btn active" onclick="switchTab('search')">
                <i class="fas fa-search"></i> Search Properties
            </button>
            <button class="tab-btn" onclick="switchTab('manual')">
                <i class="fas fa-edit"></i> Manual Entry
            </button>
        </div>
        
        <div id="searchTab" class="tab-content active">
            <!-- Property selector will be rendered here -->
        </div>
        
        <div id="manualTab" class="tab-content" style="display: none;">
            <div class="goal-inputs">
                <div class="input-group">
                    <label>Property Address</label>
                    <input type="text" id="newPropertyAddress" placeholder="123 Main St" />
                </div>
                
                <div class="input-group">
                    <label>Purchase Price</label>
                    <input type="number" id="newPurchasePrice" placeholder="50000" />
                </div>
                
                <div class="input-group">
                    <label>Rehab Cost</label>
                    <input type="number" id="newRehabCost" placeholder="10000" />
                </div>
                
                <div class="input-group">
                    <label>Monthly Rent</label>
                    <input type="number" id="newMonthlyRent" placeholder="1200" />
                </div>
                
                <div class="input-group">
                    <label>Down Payment %</label>
                    <input type="number" id="newDownPayment" value="20" />
                </div>
                
                <div class="input-group">
                    <label>Month to Purchase</label>
                    <input type="number" id="newPurchaseMonth" value="${window.currentTimelineMonth || 1}" min="0" max="${currentSimulation.time_horizon_months}" />
                </div>
                
                <div class="input-group">
                    <label>Investment Strategy</label>
                    <div class="strategy-selector">
                        <label class="strategy-option">
                            <input type="radio" name="strategy" value="buy-hold" checked />
                            <span class="strategy-label">Buy & Hold</span>
                            <span class="strategy-desc">Long-term rental income</span>
                        </label>
                        <label class="strategy-option">
                            <input type="radio" name="strategy" value="brrrr" />
                            <span class="strategy-label">BRRRR</span>
                            <span class="strategy-desc">Buy, Rehab, Rent, Refinance</span>
                        </label>
                        <label class="strategy-option">
                            <input type="radio" name="strategy" value="flip" />
                            <span class="strategy-label">Fix & Flip</span>
                            <span class="strategy-desc">Quick renovation and sale</span>
                        </label>
                    </div>
                </div>
                
                <button class="btn btn-primary" onclick="addPropertyToSimulation()">
                    Add to Timeline
                </button>
            </div>
        </div>
    `;
    
    // Render property selector
    window.propertySelector.renderSelector('searchTab');
}

// Switch between tabs
function switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    if (tab === 'search') {
        document.getElementById('searchTab').style.display = 'block';
    } else {
        document.getElementById('manualTab').style.display = 'block';
    }
}

// Close property modal
function closePropertyModal() {
    document.getElementById('propertyModal').classList.remove('active');
}

// Add property to simulation
async function addPropertyToSimulation() {
    const address = document.getElementById('newPropertyAddress').value;
    const purchasePrice = parseFloat(document.getElementById('newPurchasePrice').value);
    const rehabCost = parseFloat(document.getElementById('newRehabCost').value) || 0;
    const monthlyRent = parseFloat(document.getElementById('newMonthlyRent').value);
    const downPayment = parseFloat(document.getElementById('newDownPayment').value) || 20;
    const purchaseMonth = parseInt(document.getElementById('newPurchaseMonth').value) || 0;
    
    // Get selected strategy
    const strategyInput = document.querySelector('input[name="strategy"]:checked');
    const strategy = strategyInput ? strategyInput.value : 'buy-hold';
    const strategyLabels = {
        'buy-hold': 'Buy & Hold',
        'brrrr': 'BRRRR',
        'flip': 'Fix & Flip'
    };
    
    if (!address || !purchasePrice || !monthlyRent) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Calculate loan amount
    const loanAmount = purchasePrice * (1 - downPayment / 100);
    
    // Add phase
    const result = await simulationAPI.addPhase(currentSimulation.id, {
        phaseNumber: currentPhases.length + 1,
        monthNumber: purchaseMonth,
        actionType: 'buy',
        propertyAddress: address,
        purchasePrice: purchasePrice,
        rehabCost: rehabCost,
        downPaymentPercent: downPayment,
        loanAmount: loanAmount,
        monthlyRentalIncome: monthlyRent,
        notes: strategyLabels[strategy]
    });
    
    if (result.error) {
        alert('Error adding property: ' + result.error.message);
        return;
    }
    
    // Close modal and reload
    closePropertyModal();
    await loadSimulation(currentSimulation.id);
}

// Export simulation
function exportSimulation() {
    if (!currentSimulation || currentProjections.length === 0) {
        alert('No simulation data to export');
        return;
    }
    
    // Create CSV data
    let csv = 'Month,Properties,Rental Income,Expenses,Mortgage,Net Cash Flow,Cash Reserves,Total Equity,ROI %\n';
    
    currentProjections.forEach(p => {
        csv += `${p.month_number},${p.total_properties},${p.rental_income},${p.total_expenses},${p.mortgage_payments},${p.net_cashflow},${p.cash_reserves},${p.total_equity},${p.roi_percentage}\n`;
    });
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSimulation.name.replace(/\s+/g, '_')}_simulation.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Timeline View Functions

// Update timeline view with cards
function updateTimelineView() {
    const track = document.getElementById('timelineTrack');
    if (!track) return;
    
    // Keep the initial snapshot
    const initialSnapshot = track.querySelector('.timeline-card[data-month="0"]');
    
    // Clear everything except initial snapshot
    while (track.children.length > 1) {
        track.removeChild(track.lastChild);
    }
    
    // Update initial snapshot with current simulation data
    if (initialSnapshot && currentSimulation) {
        const cashSpan = initialSnapshot.querySelector('#startingCash');
        if (cashSpan) {
            cashSpan.textContent = financialCalc.formatCurrency(currentSimulation.initial_capital);
        }
    }
    
    // Add timeline cards for each phase
    let lastMonth = 0;
    currentPhases.forEach((phase, index) => {
        // Add time snapshots between phases if needed
        if (phase.month_number > lastMonth + 6) {
            addTimeSnapshotCard(lastMonth + 6);
        }
        
        // Add appropriate card based on action type
        if (phase.action_type === 'buy') {
            addAcquisitionCard(phase);
        } else if (phase.action_type === 'sell') {
            addSaleCard(phase);
        } else if (phase.action_type === 'loan') {
            addLoanCard(phase);
        }
        
        lastMonth = phase.month_number;
    });
    
    // Add final add button
    const addBtn = document.createElement('button');
    addBtn.className = 'timeline-add-btn';
    addBtn.onclick = () => showAddTimelineModal(lastMonth + 1);
    addBtn.innerHTML = '<i class="fas fa-plus"></i>';
    track.appendChild(addBtn);
    
    // Add a final snapshot if we have projections
    if (currentProjections.length > 0) {
        const finalMonth = currentSimulation.time_horizon_months;
        if (lastMonth < finalMonth) {
            addTimeSnapshotCard(finalMonth);
        }
    }
    
    // Ensure horizontal scrolling works
    track.parentElement.scrollLeft = track.scrollWidth;
}

// Add acquisition card to timeline
function addAcquisitionCard(phase) {
    const track = document.getElementById('timelineTrack');
    
    const card = document.createElement('div');
    card.className = 'timeline-card acquisition-card';
    card.setAttribute('data-month', phase.month_number);
    
    const strategy = phase.notes || 'Buy & Hold';
    const downPayment = phase.purchase_price * (phase.down_payment_percent || 20) / 100;
    const loanAmount = phase.purchase_price - downPayment;
    const totalCash = downPayment + (phase.rehab_cost || 0) + (phase.purchase_price * 0.03); // Include closing costs
    
    card.innerHTML = `
        <div class="card-header">
            <span class="card-icon">🏠</span>
            <h3>Month ${phase.month_number}</h3>
        </div>
        <div class="card-content">
            <div class="property-address">${phase.property_address || 'Property'}</div>
            <div class="metric-row">
                <span class="metric-text">Price: <strong>${financialCalc.formatCurrency(phase.purchase_price)}</strong></span>
            </div>
            ${phase.rehab_cost > 0 ? `
            <div class="metric-row">
                <span class="metric-text">Rehab: <strong>${financialCalc.formatCurrency(phase.rehab_cost)}</strong></span>
            </div>
            ` : ''}
            <div class="metric-row">
                <span class="metric-text">Cash Needed: <strong>${financialCalc.formatCurrency(totalCash)}</strong></span>
            </div>
            <div class="metric-row">
                <span class="metric-text">Loan: <strong>${financialCalc.formatCurrency(loanAmount)}</strong></span>
            </div>
            <div class="metric-row">
                <span class="metric-text">Strategy: <strong>${strategy}</strong></span>
            </div>
            <div class="metric-row">
                <span class="metric-text">Rent: <strong>${financialCalc.formatCurrency(phase.monthly_rental_income)}/mo</strong></span>
            </div>
        </div>
    `;
    
    // Insert before the last add button
    const lastBtn = track.querySelector('.timeline-add-btn:last-child');
    if (lastBtn) {
        track.insertBefore(card, lastBtn);
    } else {
        track.appendChild(card);
    }
    
    // Add an add button after this card
    const addBtn = document.createElement('button');
    addBtn.className = 'timeline-add-btn';
    addBtn.onclick = () => showAddTimelineModal(phase.month_number + 1);
    addBtn.innerHTML = '<i class="fas fa-plus"></i>';
    
    if (lastBtn) {
        track.insertBefore(addBtn, lastBtn);
    } else {
        track.appendChild(addBtn);
    }
    
    // Add automatic snapshot after property acquisition
    addTimeSnapshotCard(phase.month_number + 1, true);
}

// Add snapshot card to timeline
function addTimeSnapshotCard(month, isAutomatic = false) {
    const track = document.getElementById('timelineTrack');
    
    // Find projection for this month
    const projection = currentProjections.find(p => p.month_number === month) || 
                      currentProjections[currentProjections.length - 1];
    
    if (!projection) return;
    
    const card = document.createElement('div');
    card.className = 'timeline-card snapshot-card';
    card.setAttribute('data-month', month);
    
    // Calculate equity percentage
    const totalValue = projection.total_equity + projection.total_debt;
    const equityPercent = totalValue > 0 ? (projection.total_equity / totalValue * 100).toFixed(1) : 0;
    
    // Get property breakdown
    const breakdown = projection.property_breakdown || {};
    const totalProps = breakdown.hold + breakdown.brrrr_active + breakdown.flip_active + breakdown.sold;
    
    card.innerHTML = `
        <div class="card-header">
            <span class="card-icon">📊</span>
            <h3>Month ${month} ${isAutomatic ? '(Auto)' : ''}</h3>
        </div>
        <div class="card-content">
            <div class="metric-row">
                <span class="metric-icon">💰</span>
                <span class="metric-text">Cash: <strong>${financialCalc.formatCurrency(projection.cash_reserves)}</strong></span>
            </div>
            <div class="metric-row">
                <span class="metric-icon">💵</span>
                <span class="metric-text">Rent Collected: <strong>${financialCalc.formatCurrency(projection.accumulated_rent || 0)}</strong></span>
            </div>
            <div class="metric-row">
                <span class="metric-icon">💎</span>
                <span class="metric-text">Equity: <strong>${financialCalc.formatCurrency(projection.total_equity)}</strong> (${equityPercent}%)</span>
            </div>
            <div class="property-breakdown">
                <div class="breakdown-header">
                    <span class="metric-icon">🏠</span>
                    <span>Properties (${totalProps}):</span>
                </div>
                <div class="breakdown-items">
                    ${breakdown.hold > 0 ? `<span class="breakdown-item">Hold: ${breakdown.hold}</span>` : ''}
                    ${breakdown.brrrr_active > 0 ? `<span class="breakdown-item brrrr">BRRRR: ${breakdown.brrrr_active}</span>` : ''}
                    ${breakdown.flip_active > 0 ? `<span class="breakdown-item flip">Flip: ${breakdown.flip_active}</span>` : ''}
                    ${breakdown.sold > 0 ? `<span class="breakdown-item sold">Sold: ${breakdown.sold}</span>` : ''}
                </div>
            </div>
            <div class="metric-row">
                <span class="metric-icon">📈</span>
                <span class="metric-text">Income: <strong>${financialCalc.formatCurrency(projection.net_cashflow)}/mo</strong></span>
            </div>
            <div class="metric-row">
                <span class="metric-icon">💳</span>
                <span class="metric-text">Total Debt: <strong>${financialCalc.formatCurrency(projection.total_debt)}</strong></span>
            </div>
        </div>
    `;
    
    // Insert before the last add button
    const lastBtn = track.querySelector('.timeline-add-btn:last-child');
    if (lastBtn) {
        track.insertBefore(card, lastBtn);
    } else {
        track.appendChild(card);
    }
}

// Update progress bar
function updateProgressBar() {
    if (!currentSimulation || currentProjections.length === 0) return;
    
    const targetIncome = currentSimulation.target_monthly_income;
    const lastProjection = currentProjections[currentProjections.length - 1];
    const currentIncome = lastProjection.rental_income; // Use rental income instead of net cash flow
    
    const progress = Math.min((currentIncome / targetIncome) * 100, 100);
    
    document.getElementById('progressText').textContent = 
        `${financialCalc.formatCurrency(currentIncome)} / ${financialCalc.formatCurrency(targetIncome)} rental income per month`;
    
    document.getElementById('progressFill').style.width = `${progress}%`;
}

// Add sale card to timeline
function addSaleCard(phase) {
    const track = document.getElementById('timelineTrack');
    
    const card = document.createElement('div');
    card.className = 'timeline-card sale-card';
    card.setAttribute('data-month', phase.month_number);
    
    card.innerHTML = `
        <div class="card-header">
            <span class="card-icon">💰</span>
            <h3>Month ${phase.month_number} - Sale</h3>
        </div>
        <div class="card-content">
            <div class="property-address">${phase.property_address || 'Property'}</div>
            <div class="metric-row">
                <span class="metric-text">Sale Price: <strong>${financialCalc.formatCurrency(phase.sale_price)}</strong></span>
            </div>
            <div class="metric-row">
                <span class="metric-text">Net Proceeds: <strong>~${financialCalc.formatCurrency(phase.sale_price * 0.94)}</strong></span>
            </div>
        </div>
    `;
    
    // Insert before the last add button
    const lastBtn = track.querySelector('.timeline-add-btn:last-child');
    if (lastBtn) {
        track.insertBefore(card, lastBtn);
    } else {
        track.appendChild(card);
    }
    
    // Add automatic snapshot after sale
    addTimeSnapshotCard(phase.month_number + 1, true);
}

// Add loan card to timeline
function addLoanCard(phase) {
    const track = document.getElementById('timelineTrack');
    
    const card = document.createElement('div');
    card.className = 'timeline-card loan-card';
    card.setAttribute('data-month', phase.month_number);
    
    const monthlyPayment = financialCalc.calculateMortgagePayment(
        phase.loan_amount,
        phase.interest_rate || 0.07,
        (phase.loan_term_months || 360) / 12
    );
    
    card.innerHTML = `
        <div class="card-header">
            <span class="card-icon">💳</span>
            <h3>Month ${phase.month_number} - Loan</h3>
        </div>
        <div class="card-content">
            <div class="property-address">${phase.property_address || 'General Loan'}</div>
            <div class="metric-row">
                <span class="metric-text">Amount: <strong>${financialCalc.formatCurrency(phase.loan_amount)}</strong></span>
            </div>
            <div class="metric-row">
                <span class="metric-text">Rate: <strong>${((phase.interest_rate || 0.07) * 100).toFixed(2)}%</strong></span>
            </div>
            <div class="metric-row">
                <span class="metric-text">Payment: <strong>${financialCalc.formatCurrency(monthlyPayment)}/mo</strong></span>
            </div>
        </div>
    `;
    
    // Insert before the last add button
    const lastBtn = track.querySelector('.timeline-add-btn:last-child');
    if (lastBtn) {
        track.insertBefore(card, lastBtn);
    } else {
        track.appendChild(card);
    }
}

// Show add timeline modal
function showAddTimelineModal(suggestedMonth) {
    window.currentTimelineMonth = suggestedMonth || 1;
    const modal = document.getElementById('timelineModal');
    modal.classList.add('active');
}

// Close timeline modal
function closeTimelineModal() {
    document.getElementById('timelineModal').classList.remove('active');
}

// Show property form
function showPropertyForm() {
    closeTimelineModal();
    showPropertySearch();
}

// Show time snapshot form
function showTimeSnapshotForm() {
    const month = window.currentTimelineMonth || 6;
    
    // Add a snapshot phase
    simulationAPI.addPhase(currentSimulation.id, {
        phaseNumber: currentPhases.length + 1,
        monthNumber: month,
        actionType: 'snapshot',
        propertyAddress: `Month ${month} Snapshot`,
        purchasePrice: 0,
        monthlyRentalIncome: 0,
        notes: 'Portfolio checkpoint'
    }).then(result => {
        if (!result.error) {
            closeTimelineModal();
            loadSimulation(currentSimulation.id);
        }
    });
}

// Show sell property form
function showSellPropertyForm() {
    closeTimelineModal();
    
    // Get list of active properties
    const activeProperties = currentProjections[currentProjections.length - 1]?.properties_data?.filter(p => p.status !== 'sold') || [];
    
    if (activeProperties.length === 0) {
        alert('No properties available to sell');
        return;
    }
    
    const modal = document.getElementById('propertyModal');
    const content = document.getElementById('propertyModalContent');
    
    content.innerHTML = `
        <div class="goal-inputs">
            <h3>Sell Property</h3>
            <div class="input-group">
                <label>Select Property</label>
                <select id="sellPropertySelect">
                    ${activeProperties.map(p => `
                        <option value="${p.address}">${p.address} - Value: ${financialCalc.formatCurrency(p.value)}</option>
                    `).join('')}
                </select>
            </div>
            
            <div class="input-group">
                <label>Sale Price</label>
                <input type="number" id="salePrice" placeholder="Sale price" />
            </div>
            
            <div class="input-group">
                <label>Month of Sale</label>
                <input type="number" id="saleMonth" value="${window.currentTimelineMonth || 1}" min="0" max="${currentSimulation.time_horizon_months}" />
            </div>
            
            <button class="btn btn-primary" onclick="addPropertySale()">
                Sell Property
            </button>
        </div>
    `;
    
    // Set default sale price based on selected property
    const propertySelect = document.getElementById('sellPropertySelect');
    const selectedProperty = activeProperties.find(p => p.address === propertySelect.value);
    if (selectedProperty) {
        document.getElementById('salePrice').value = Math.round(selectedProperty.value * 1.1); // 10% appreciation
    }
    
    propertySelect.addEventListener('change', (e) => {
        const prop = activeProperties.find(p => p.address === e.target.value);
        if (prop) {
            document.getElementById('salePrice').value = Math.round(prop.value * 1.1);
        }
    });
    
    modal.classList.add('active');
}

// Add property sale
async function addPropertySale() {
    const address = document.getElementById('sellPropertySelect').value;
    const salePrice = parseFloat(document.getElementById('salePrice').value);
    const saleMonth = parseInt(document.getElementById('saleMonth').value);
    
    if (!address || !salePrice) {
        alert('Please fill in all fields');
        return;
    }
    
    const result = await simulationAPI.addPhase(currentSimulation.id, {
        phaseNumber: currentPhases.length + 1,
        monthNumber: saleMonth,
        actionType: 'sell',
        propertyAddress: address,
        salePrice: salePrice,
        purchasePrice: 0,
        monthlyRentalIncome: 0,
        notes: 'Property sale'
    });
    
    if (result.error) {
        alert('Error adding sale: ' + result.error.message);
        return;
    }
    
    closePropertyModal();
    await loadSimulation(currentSimulation.id);
}

// Show loan form
function showLoanForm() {
    closeTimelineModal();
    
    const modal = document.getElementById('propertyModal');
    const content = document.getElementById('propertyModalContent');
    
    content.innerHTML = `
        <div class="goal-inputs">
            <h3>Add Loan</h3>
            <div class="input-group">
                <label>Loan Type</label>
                <select id="loanType">
                    <option value="heloc">HELOC (Home Equity Line)</option>
                    <option value="private">Private Money</option>
                    <option value="hard-money">Hard Money</option>
                    <option value="personal">Personal Loan</option>
                </select>
            </div>
            
            <div class="input-group">
                <label>Loan Amount</label>
                <input type="number" id="loanAmount" placeholder="100000" />
            </div>
            
            <div class="input-group">
                <label>Interest Rate (%)</label>
                <input type="number" id="interestRate" step="0.1" placeholder="7.0" value="7.0" />
            </div>
            
            <div class="input-group">
                <label>Term (months)</label>
                <input type="number" id="loanTerm" placeholder="360" value="360" />
            </div>
            
            <div class="input-group">
                <label>Closing Costs</label>
                <input type="number" id="closingCosts" placeholder="3000" value="0" />
            </div>
            
            <div class="input-group">
                <label>Points</label>
                <input type="number" id="loanPoints" step="0.25" placeholder="0" value="0" />
            </div>
            
            <div class="input-group">
                <label>Month to Take Loan</label>
                <input type="number" id="loanMonth" value="${window.currentTimelineMonth || 1}" min="0" max="${currentSimulation.time_horizon_months}" />
            </div>
            
            <div class="loan-preview">
                <p id="monthlyPaymentPreview">Monthly Payment: $0</p>
                <p id="totalCostPreview">Total Closing Costs: $0</p>
            </div>
            
            <button class="btn btn-primary" onclick="addLoan()">
                Add Loan
            </button>
        </div>
    `;
    
    // Add event listeners for preview
    const updateLoanPreview = () => {
        const amount = parseFloat(document.getElementById('loanAmount').value) || 0;
        const rate = parseFloat(document.getElementById('interestRate').value) / 100 || 0.07;
        const term = parseInt(document.getElementById('loanTerm').value) || 360;
        const closing = parseFloat(document.getElementById('closingCosts').value) || 0;
        const points = parseFloat(document.getElementById('loanPoints').value) || 0;
        
        const monthlyPayment = financialCalc.calculateMortgagePayment(amount, rate, term / 12);
        const pointsCost = amount * (points / 100);
        const totalClosing = closing + pointsCost;
        
        document.getElementById('monthlyPaymentPreview').textContent = 
            `Monthly Payment: ${financialCalc.formatCurrency(monthlyPayment)}`;
        document.getElementById('totalCostPreview').textContent = 
            `Total Closing Costs: ${financialCalc.formatCurrency(totalClosing)}`;
    };
    
    ['loanAmount', 'interestRate', 'loanTerm', 'closingCosts', 'loanPoints'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateLoanPreview);
    });
    
    updateLoanPreview();
    modal.classList.add('active');
}

// Add loan
async function addLoan() {
    const loanType = document.getElementById('loanType').value;
    const loanAmount = parseFloat(document.getElementById('loanAmount').value);
    const interestRate = parseFloat(document.getElementById('interestRate').value) / 100;
    const loanTerm = parseInt(document.getElementById('loanTerm').value);
    const closingCosts = parseFloat(document.getElementById('closingCosts').value) || 0;
    const points = parseFloat(document.getElementById('loanPoints').value) || 0;
    const loanMonth = parseInt(document.getElementById('loanMonth').value);
    
    if (!loanAmount || !interestRate || !loanTerm) {
        alert('Please fill in all required fields');
        return;
    }
    
    const result = await simulationAPI.addPhase(currentSimulation.id, {
        phaseNumber: currentPhases.length + 1,
        monthNumber: loanMonth,
        actionType: 'loan',
        propertyAddress: `${loanType.toUpperCase()} Loan`,
        purchasePrice: 0,
        loanAmount: loanAmount,
        monthlyRentalIncome: 0,
        loanType: loanType,
        interestRate: interestRate,
        loanTermMonths: loanTerm,
        closingCosts: closingCosts,
        points: points,
        notes: `${loanType} loan`
    });
    
    if (result.error) {
        alert('Error adding loan: ' + result.error.message);
        return;
    }
    
    closePropertyModal();
    await loadSimulation(currentSimulation.id);
}