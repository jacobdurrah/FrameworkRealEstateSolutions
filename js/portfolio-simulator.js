// Portfolio Simulator Main JavaScript
// Handles UI interactions and orchestrates the simulation

let simulationAPI;
let financialCalc;
let stateManager;
let currentSimulation = null;
let currentPhases = [];
let currentProjections = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize services
    simulationAPI = new SimulationAPIService();
    financialCalc = new FinancialCalculator();
    stateManager = new PortfolioStateManager(financialCalc);
    
    // Initialize Supabase
    const initialized = await simulationAPI.init(
        window.APP_CONFIG.SUPABASE_URL,
        window.APP_CONFIG.SUPABASE_ANON_KEY
    );
    
    if (!initialized) {
        console.warn('Failed to initialize API. Running in offline mode.');
        // Show refresh button as fallback
        const refreshBtn = document.getElementById('refreshTimelineBtn');
        if (refreshBtn) refreshBtn.style.display = 'inline-flex';
    }
    
    // Load saved simulations
    await loadSavedSimulations();
    
    // Check if we have a simulation ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const simulationId = urlParams.get('id');
    if (simulationId) {
        await loadSimulation(simulationId);
    }
    
    // Listen for connection status changes
    window.addEventListener('simulationApiStatus', (event) => {
        const { status } = event.detail;
        const refreshBtn = document.getElementById('refreshTimelineBtn');
        if (refreshBtn) {
            refreshBtn.style.display = status === 'error' ? 'inline-flex' : 'none';
        }
    });
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
    
    // Subscribe components after initial setup
    subscribeUIComponents();
    
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
    
    // Set simulation in state manager
    stateManager.setSimulation(simulation);
    
    // Convert phases to transactions for state manager
    const transactions = [];
    currentPhases.forEach(phase => {
        if (phase.action_type === 'buy') {
            let transactionData = {};
            try {
                // Try to parse enhanced data from notes
                transactionData = JSON.parse(phase.notes || '{}');
            } catch (e) {
                // Fallback to basic data
                transactionData = {
                    address: phase.property_address,
                    purchasePrice: phase.purchase_price,
                    monthlyRent: phase.monthly_rental_income,
                    rehabCost: phase.rehab_cost || 0,
                    totalCashNeeded: phase.purchase_price * 0.25 // Estimate
                };
            }
            
            transactions.push({
                id: transactionData.transactionId || `txn_${phase.id}`,
                type: 'PROPERTY_PURCHASE',
                month: phase.month_number,
                propertyId: `prop_${phase.id}`,
                data: transactionData
            });
        } else if (phase.action_type === 'sell') {
            transactions.push({
                id: `txn_${phase.id}`,
                type: 'PROPERTY_SALE',
                month: phase.month_number,
                propertyId: phase.property_id,
                data: {
                    salePrice: phase.sale_price,
                    address: phase.property_address
                }
            });
        }
    });
    
    // Load transactions into state manager
    stateManager.setTransactions(transactions);
    
    // Subscribe UI components to state changes
    subscribeUIComponents();
    
    // Update UI
    updateSimulationUI();
    
    // Reconstruct timeline events from phases
    reconstructTimelineFromPhases();
}

// Subscribe UI components to state manager
function subscribeUIComponents() {
    // Subscribe summary metrics
    stateManager.subscribe('summary-metrics', (state) => {
        if (state && state.summary) {
            updateMetrics();
            updateProgressBar();
            updateCashReservesDisplay();
            updateLoanSummary();
            updateMetricsWithGrowth();
        }
    });
    
    // Subscribe portfolio summary
    stateManager.subscribe('portfolio-summary', (state) => {
        if (state && state.summary) {
            updatePortfolioSummary();
        }
    });
}

// Update the simulation UI
function updateSimulationUI() {
    if (!currentSimulation) return;
    
    document.getElementById('simulationTitle').textContent = currentSimulation.name;
    updateMetrics();
    updateProgressBar();
    updatePortfolioSummary();
    updateCashReservesDisplay();
    updateLoanSummary();
    updateTimelineView(); // Call this after metrics are updated
    checkMilestones();
    updateMetricsWithGrowth(); // Ensure growth percentages are shown
    
    // Ensure all phases are displayed in timeline
    updatePhasesList();
}

// Update phases list
function updatePhasesList() {
    const container = document.getElementById('phasesList');
    
    // Add null check to prevent errors
    if (!container) {
        console.warn('phasesList element not found in DOM');
        return;
    }
    
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

// Run the simulation - simplified to just trigger state recalculation
async function runSimulation() {
    if (!currentSimulation) return;
    
    // State manager will handle all calculations
    stateManager.recalculateState();
}

// Update metrics display
function updateMetrics() {
    const state = stateManager.getCurrentState();
    
    // Get all metric elements with null checks
    const incomeEl = document.getElementById('currentIncome');
    const propertiesEl = document.getElementById('totalProperties');
    const equityEl = document.getElementById('totalEquity');
    const roiEl = document.getElementById('currentROI');
    
    if (!state || !state.summary) {
        if (incomeEl) incomeEl.textContent = '$0';
        if (propertiesEl) propertiesEl.textContent = '0';
        if (equityEl) equityEl.textContent = '$0';
        if (roiEl) roiEl.textContent = '0%';
        return;
    }
    
    const summary = state.summary;
    
    // Update only if elements exist
    if (incomeEl) incomeEl.textContent = financialCalc.formatCurrency(summary.monthlyIncome);
    if (propertiesEl) propertiesEl.textContent = summary.totalProperties;
    if (equityEl) equityEl.textContent = financialCalc.formatCurrency(summary.totalEquity);
    if (roiEl) roiEl.textContent = `${summary.roi}%`;
}

// Update metrics with growth percentages
function updateMetricsWithGrowth() {
    const state = stateManager.getCurrentState();
    if (!state || !state.summary) return;
    
    const summary = state.summary;
    const initialCapital = currentSimulation?.initial_capital || 0;
    
    // Update income metric with growth
    const incomeCard = document.querySelector('#metricsGrid > .metric-card:nth-child(1)');
    if (incomeCard && summary.monthlyIncome > 0) {
        const incomeGrowth = summary.monthlyIncome > 0 ? '∞' : '0';
        
        incomeCard.innerHTML = `
            <div class="metric-label">Current Monthly Income</div>
            <div class="metric-value">${financialCalc.formatCurrency(summary.monthlyIncome)}</div>
            ${summary.monthlyIncome > 0 ? `<div class="metric-change positive">↑ Active</div>` : ''}
        `;
    }
    
    // Update equity metric with growth
    const equityCard = document.querySelector('#metricsGrid > .metric-card:nth-child(3)');
    if (equityCard && initialCapital > 0) {
        const equityGrowth = ((summary.totalEquity - initialCapital) / initialCapital * 100).toFixed(1);
        
        equityCard.innerHTML = `
            <div class="metric-label">Total Equity</div>
            <div class="metric-value">${financialCalc.formatCurrency(summary.totalEquity)}</div>
            ${equityGrowth !== '0.0' ? `<div class="metric-change ${equityGrowth >= 0 ? 'positive' : 'negative'}">
                ${equityGrowth >= 0 ? '↑' : '↓'} ${Math.abs(equityGrowth)}%
            </div>` : ''}
        `;
    }
}

// Portfolio summary section
function updatePortfolioSummary() {
    const container = document.getElementById('portfolioDetails');
    const state = stateManager.getCurrentState();
    
    if (!state || !state.summary) {
        container.innerHTML = '<p style="color: var(--text-secondary);">Add properties to see your portfolio summary.</p>';
        return;
    }
    
    const summary = state.summary;
    const timeToGoal = estimateTimeToGoal();
    const portfolioValue = summary.totalPropertyValue || 0;
    const debtToEquity = summary.totalEquity > 0 ? (summary.totalDebt / summary.totalEquity).toFixed(2) : '0';
    
    container.innerHTML = `
        <div class="summary-grid">
            <div class="summary-item">
                <h4>Time to Goal</h4>
                <p class="summary-value">${timeToGoal}</p>
            </div>
            <div class="summary-item">
                <h4>Total Properties</h4>
                <p class="summary-value">${summary.totalProperties}</p>
            </div>
            <div class="summary-item">
                <h4>Portfolio Value</h4>
                <p class="summary-value">${financialCalc.formatCurrency(portfolioValue)}</p>
            </div>
            <div class="summary-item">
                <h4>Total Debt</h4>
                <p class="summary-value">${financialCalc.formatCurrency(summary.totalDebt)}</p>
            </div>
            <div class="summary-item">
                <h4>Net Worth</h4>
                <p class="summary-value">${financialCalc.formatCurrency(summary.totalEquity)}</p>
            </div>
            <div class="summary-item">
                <h4>Debt-to-Equity</h4>
                <p class="summary-value">${debtToEquity}:1</p>
            </div>
        </div>
    `;
}

// Estimate time to reach goal
function estimateTimeToGoal() {
    const state = stateManager.getCurrentState();
    if (!state || !currentSimulation) return 'N/A';
    
    const targetIncome = currentSimulation.target_monthly_income;
    
    // Find when we reach the target
    for (let month = 0; month < state.months.length; month++) {
        if (state.months[month] && state.months[month].monthlyIncome >= targetIncome) {
            return `${month} months`;
        }
    }
    
    // If not reached yet
    const summary = state.summary;
    if (summary && summary.monthlyIncome > 0) {
        const remaining = targetIncome - summary.monthlyIncome;
        const monthlyGrowth = summary.monthlyIncome / state.months.length;
        
        if (monthlyGrowth > 0) {
            const additionalMonths = Math.ceil(remaining / monthlyGrowth);
            return `~${state.months.length + additionalMonths} months`;
        }
    }
    
    return '>100 months';
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
                <h3>Property Details</h3>
                <div class="input-group">
                    <label>Property Address</label>
                    <input type="text" id="newPropertyAddress" placeholder="123 Main St" />
                </div>
                
                <div class="input-group">
                    <label>Purchase Price</label>
                    <input type="number" id="newPurchasePrice" placeholder="50000" onchange="updatePropertyDefaults()" />
                </div>
                
                <div class="input-group">
                    <label>Rehab Cost</label>
                    <input type="number" id="newRehabCost" placeholder="10000" value="0" />
                </div>
                
                <div class="input-group">
                    <label>Monthly Rent</label>
                    <input type="number" id="newMonthlyRent" placeholder="1200" onchange="updateCashFlowPreview()" />
                </div>
                
                <h3 style="margin-top: 1.5rem;">Operating Expenses</h3>
                <div class="input-group">
                    <label>Annual Property Tax</label>
                    <input type="number" id="newPropertyTax" placeholder="3200" />
                    <small style="color: var(--text-secondary);">Default: 0.8% of purchase price</small>
                </div>
                
                <div class="input-group">
                    <label>Monthly Insurance</label>
                    <input type="number" id="newInsurance" value="100" />
                    <small style="color: var(--text-secondary);">Default: $100/month</small>
                </div>
                
                <div class="input-group">
                    <label>Property Management (%)</label>
                    <input type="number" id="newManagementPercent" value="8" min="0" max="100" />
                    <small style="color: var(--text-secondary);">Percentage of monthly rent</small>
                </div>
                
                <div class="input-group">
                    <label>Maintenance Reserve (%)</label>
                    <input type="number" id="newMaintenancePercent" value="5" min="0" max="100" />
                    <small style="color: var(--text-secondary);">Percentage of monthly rent</small>
                </div>
                
                <div class="input-group">
                    <label>Vacancy Rate (%)</label>
                    <input type="number" id="newVacancyRate" value="8" min="0" max="100" />
                    <small style="color: var(--text-secondary);">Expected vacancy percentage</small>
                </div>
                
                <h3 style="margin-top: 1.5rem;">Financing</h3>
                <div class="input-group">
                    <label>Financing Type</label>
                    <div style="display: flex; gap: 1rem;">
                        <label><input type="radio" name="financingType" value="CASH" onchange="toggleFinancingFields()"> All Cash</label>
                        <label><input type="radio" name="financingType" value="FINANCED" checked onchange="toggleFinancingFields()"> Financed</label>
                    </div>
                </div>
                
                <div id="financingFields">
                    <div class="input-group">
                        <label>Down Payment %</label>
                        <input type="number" id="newDownPayment" value="20" min="0" max="100" onchange="updateCashFlowPreview()" />
                        <small style="color: var(--text-secondary);">Cash required: <span id="downPaymentAmount">$0</span></small>
                    </div>
                    
                    <div class="input-group">
                        <label>Interest Rate (%)</label>
                        <input type="number" id="newInterestRate" value="8.0" step="0.1" onchange="updateCashFlowPreview()" />
                    </div>
                    
                    <div class="input-group">
                        <label>Loan Term (years)</label>
                        <input type="number" id="newLoanTerm" value="30" min="1" max="40" onchange="updateCashFlowPreview()" />
                    </div>
                    
                    <div class="input-group">
                        <label>Closing Costs (%)</label>
                        <input type="number" id="newClosingCostPercent" value="1.0" step="0.1" />
                        <small style="color: var(--text-secondary);">Percentage of loan amount</small>
                    </div>
                </div>
                
                <div class="input-group">
                    <label>Month to Purchase</label>
                    <input type="number" id="newPurchaseMonth" value="${window.currentTimelineMonth || 1}" min="0" max="${currentSimulation.time_horizon_months}" />
                </div>
                
                <div id="cashFlowPreview" style="background: var(--bg-color); padding: 1rem; border-radius: 4px; margin-top: 1rem;">
                    <h4 style="margin-top: 0;">Cash Flow Analysis</h4>
                    <div id="cashFlowDetails">Calculate cash flow...</div>
                </div>
                
                <div class="input-group">
                    <label>Investment Strategy</label>
                    <div class="strategy-selector">
                        <label class="strategy-option">
                            <input type="radio" name="strategy" value="buy-hold" checked onchange="updateStrategyOptions()" />
                            <span class="strategy-label">Buy & Hold</span>
                            <span class="strategy-desc">Long-term rental income</span>
                        </label>
                        <label class="strategy-option">
                            <input type="radio" name="strategy" value="brrrr" onchange="updateStrategyOptions()" />
                            <span class="strategy-label">BRRRR</span>
                            <span class="strategy-desc">Buy, Rehab, Rent, Refinance</span>
                        </label>
                        <label class="strategy-option">
                            <input type="radio" name="strategy" value="flip" onchange="updateStrategyOptions()" />
                            <span class="strategy-label">Fix & Flip</span>
                            <span class="strategy-desc">Quick renovation and sale</span>
                        </label>
                    </div>
                </div>
                
                <div id="brrrr-options" style="display: none;">
                    <div class="input-group">
                        <label>Refinance After (months)</label>
                        <input type="number" id="refinanceAfter" value="6" min="6" max="12" />
                        <small style="color: var(--text-secondary);">Seasoning period before refinance</small>
                    </div>
                    <div class="input-group">
                        <label>Target LTV for Refinance (%)</label>
                        <input type="number" id="refinanceLTV" value="75" min="60" max="80" />
                        <small style="color: var(--text-secondary);">Loan-to-value ratio for cash-out refinance</small>
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

// Update strategy options visibility
function updateStrategyOptions() {
    const selectedStrategy = document.querySelector('input[name="strategy"]:checked')?.value;
    const brrrrOptions = document.getElementById('brrrr-options');
    
    if (brrrrOptions) {
        brrrrOptions.style.display = selectedStrategy === 'brrrr' ? 'block' : 'none';
    }
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

// Update property defaults when purchase price changes
function updatePropertyDefaults() {
    const purchasePrice = parseFloat(document.getElementById('newPurchasePrice').value) || 0;
    
    // Set default property tax (0.8% annually)
    const propertyTaxInput = document.getElementById('newPropertyTax');
    if (!propertyTaxInput.value || propertyTaxInput.value === propertyTaxInput.placeholder) {
        propertyTaxInput.value = Math.round(purchasePrice * 0.008);
    }
    
    updateCashFlowPreview();
}

// Toggle financing fields based on selection
function toggleFinancingFields() {
    const financingType = document.querySelector('input[name="financingType"]:checked').value;
    const financingFields = document.getElementById('financingFields');
    
    if (financingType === 'CASH') {
        financingFields.style.display = 'none';
    } else {
        financingFields.style.display = 'block';
    }
    
    updateCashFlowPreview();
}

// Update cash flow preview in real-time
function updateCashFlowPreview() {
    const purchasePrice = parseFloat(document.getElementById('newPurchasePrice').value) || 0;
    const monthlyRent = parseFloat(document.getElementById('newMonthlyRent').value) || 0;
    const propertyTaxAnnual = parseFloat(document.getElementById('newPropertyTax').value) || (purchasePrice * 0.008);
    const insuranceMonthly = parseFloat(document.getElementById('newInsurance').value) || 100;
    const managementPercent = parseFloat(document.getElementById('newManagementPercent').value) || 8;
    const maintenancePercent = parseFloat(document.getElementById('newMaintenancePercent').value) || 5;
    const vacancyRate = parseFloat(document.getElementById('newVacancyRate').value) || 8;
    
    // Calculate operating expenses
    const vacancy = monthlyRent * (vacancyRate / 100);
    const propertyTaxMonthly = propertyTaxAnnual / 12;
    const management = monthlyRent * (managementPercent / 100);
    const maintenance = monthlyRent * (maintenancePercent / 100);
    
    // Calculate NOI
    const effectiveRent = monthlyRent - vacancy;
    const totalExpenses = propertyTaxMonthly + insuranceMonthly + management + maintenance;
    const noi = effectiveRent - totalExpenses;
    
    // Calculate mortgage payment if financed
    let mortgagePayment = 0;
    let totalCashNeeded = 0;
    const financingType = document.querySelector('input[name="financingType"]:checked')?.value || 'FINANCED';
    
    if (financingType === 'CASH') {
        totalCashNeeded = purchasePrice + (purchasePrice * 0.03); // 3% closing costs for cash
    } else {
        const downPaymentPercent = parseFloat(document.getElementById('newDownPayment').value) || 20;
        const interestRate = parseFloat(document.getElementById('newInterestRate').value) || 8;
        const loanTermYears = parseFloat(document.getElementById('newLoanTerm').value) || 30;
        const closingCostPercent = parseFloat(document.getElementById('newClosingCostPercent').value) || 1;
        
        const downPayment = purchasePrice * (downPaymentPercent / 100);
        const loanAmount = purchasePrice - downPayment;
        const closingCosts = loanAmount * (closingCostPercent / 100);
        
        totalCashNeeded = downPayment + closingCosts;
        
        // Update down payment amount display
        const downPaymentSpan = document.getElementById('downPaymentAmount');
        if (downPaymentSpan) {
            downPaymentSpan.textContent = financialCalc.formatCurrency(downPayment);
        }
        
        // Calculate monthly payment
        if (loanAmount > 0) {
            mortgagePayment = financialCalc.calculateMortgagePayment(loanAmount, interestRate / 100, loanTermYears);
        }
    }
    
    const netCashFlow = noi - mortgagePayment;
    const rehabCost = parseFloat(document.getElementById('newRehabCost').value) || 0;
    totalCashNeeded += rehabCost;
    
    // Update preview
    const preview = document.getElementById('cashFlowDetails');
    preview.innerHTML = `
        <div style="display: grid; gap: 0.5rem;">
            <div style="display: flex; justify-content: space-between;">
                <span>Monthly Rent:</span>
                <span><strong>${financialCalc.formatCurrency(monthlyRent)}</strong></span>
            </div>
            <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
                <span>- Vacancy (${vacancyRate}%):</span>
                <span>${financialCalc.formatCurrency(vacancy)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
                <span>- Property Tax:</span>
                <span>${financialCalc.formatCurrency(propertyTaxMonthly)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
                <span>- Insurance:</span>
                <span>${financialCalc.formatCurrency(insuranceMonthly)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
                <span>- Management:</span>
                <span>${financialCalc.formatCurrency(management)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
                <span>- Maintenance:</span>
                <span>${financialCalc.formatCurrency(maintenance)}</span>
            </div>
            ${mortgagePayment > 0 ? `
            <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
                <span>- Mortgage:</span>
                <span>${financialCalc.formatCurrency(mortgagePayment)}</span>
            </div>
            ` : ''}
            <div style="border-top: 1px solid var(--border-color); padding-top: 0.5rem; display: flex; justify-content: space-between;">
                <span><strong>Net Cash Flow:</strong></span>
                <span style="color: ${netCashFlow >= 0 ? 'var(--accent-green)' : '#f44336'}">
                    <strong>${financialCalc.formatCurrency(netCashFlow)}/mo</strong>
                </span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span><strong>Total Cash Needed:</strong></span>
                <span><strong>${financialCalc.formatCurrency(totalCashNeeded)}</strong></span>
            </div>
        </div>
    `;
}

// Add property to simulation
async function addPropertyToSimulation() {
    const address = document.getElementById('newPropertyAddress').value;
    const purchasePrice = parseFloat(document.getElementById('newPurchasePrice').value);
    const rehabCost = parseFloat(document.getElementById('newRehabCost').value) || 0;
    const monthlyRent = parseFloat(document.getElementById('newMonthlyRent').value);
    const purchaseMonth = parseInt(document.getElementById('newPurchaseMonth').value) || 0;
    
    // Get operating expenses
    const propertyTaxAnnual = parseFloat(document.getElementById('newPropertyTax').value) || (purchasePrice * 0.008);
    const insuranceMonthly = parseFloat(document.getElementById('newInsurance').value) || 100;
    const managementPercent = parseFloat(document.getElementById('newManagementPercent').value) || 8;
    const maintenancePercent = parseFloat(document.getElementById('newMaintenancePercent').value) || 5;
    const vacancyRate = parseFloat(document.getElementById('newVacancyRate').value) || 8;
    
    // Get financing details
    const financingType = document.querySelector('input[name="financingType"]:checked')?.value || 'FINANCED';
    let loanDetails = null;
    let totalCashNeeded = rehabCost;
    
    if (!address || !purchasePrice || !monthlyRent) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Calculate financing details
    let mortgagePayment = 0;
    if (financingType === 'CASH') {
        totalCashNeeded += purchasePrice + (purchasePrice * 0.03); // 3% closing for cash
    } else {
        const downPaymentPercent = parseFloat(document.getElementById('newDownPayment').value) || 20;
        const interestRate = parseFloat(document.getElementById('newInterestRate').value) || 8;
        const loanTermYears = parseFloat(document.getElementById('newLoanTerm').value) || 30;
        const closingCostPercent = parseFloat(document.getElementById('newClosingCostPercent').value) || 1;
        
        const downPayment = purchasePrice * (downPaymentPercent / 100);
        const loanAmount = purchasePrice - downPayment;
        const closingCosts = loanAmount * (closingCostPercent / 100);
        
        totalCashNeeded += downPayment + closingCosts;
        
        if (loanAmount > 0) {
            mortgagePayment = financialCalc.calculateMortgagePayment(loanAmount, interestRate / 100, loanTermYears);
        }
        
        loanDetails = {
            downPaymentPercent,
            downPaymentAmount: downPayment,
            loanAmount,
            interestRate: interestRate / 100,
            loanTermYears,
            closingCostPercent: closingCostPercent / 100,
            closingCostAmount: closingCosts,
            monthlyPayment: mortgagePayment
        };
    }
    
    // Calculate cash flow analysis
    const vacancy = monthlyRent * (vacancyRate / 100);
    const propertyTaxMonthly = propertyTaxAnnual / 12;
    const management = monthlyRent * (managementPercent / 100);
    const maintenance = monthlyRent * (maintenancePercent / 100);
    const effectiveRent = monthlyRent - vacancy;
    const totalExpenses = propertyTaxMonthly + insuranceMonthly + management + maintenance;
    const noi = effectiveRent - totalExpenses;
    const netCashFlow = noi - mortgagePayment;
    
    // Get selected strategy
    const strategyInput = document.querySelector('input[name="strategy"]:checked');
    const strategy = strategyInput ? strategyInput.value : 'buy-hold';
    
    // Get BRRRR options if applicable
    let brrrrDetails = null;
    if (strategy === 'brrrr') {
        const refinanceAfter = parseInt(document.getElementById('refinanceAfter').value) || 6;
        const refinanceLTV = parseFloat(document.getElementById('refinanceLTV').value) || 75;
        brrrrDetails = {
            strategy: 'brrrr',
            refinanceAfter: refinanceAfter,
            refinanceLTV: refinanceLTV
        };
    }
    
    // Create transaction for state manager
    const transaction = {
        id: `txn_${Date.now()}`,
        type: 'PROPERTY_PURCHASE',
        month: purchaseMonth,
        propertyId: `prop_${Date.now()}`,
        data: {
            address,
            purchasePrice,
            monthlyRent,
            rehabCost,
            strategy,
            
            // Operating expenses
            operatingExpenses: {
                propertyTaxAnnual,
                insuranceMonthly,
                managementPercent,
                maintenancePercent,
                vacancyPercent: vacancyRate
            },
            
            // Financing
            financingType,
            loanDetails,
            
            // Cash flow analysis
            cashFlowAnalysis: {
                grossRent: monthlyRent,
                vacancy,
                propertyTax: propertyTaxMonthly,
                insurance: insuranceMonthly,
                management,
                maintenance,
                mortgagePayment,
                netCashFlow
            },
            
            // Total investment
            totalCashNeeded,
            
            // BRRRR details if applicable
            brrrrDetails
        }
    };
    
    // Add transaction to state manager
    stateManager.addTransaction(transaction);
    
    // Also save to database for persistence
    const result = await simulationAPI.addPhase(currentSimulation.id, {
        phaseNumber: currentPhases.length + 1,
        monthNumber: purchaseMonth,
        actionType: 'buy',
        propertyAddress: address,
        purchasePrice: purchasePrice,
        rehabCost: rehabCost,
        downPaymentPercent: loanDetails?.downPaymentPercent || 100,
        loanAmount: loanDetails?.loanAmount || 0,
        monthlyRentalIncome: monthlyRent,
        notes: JSON.stringify({
            ...transaction.data,
            transactionId: transaction.id
        })
    });
    
    if (result.error) {
        alert('Error adding property: ' + result.error.message);
        return;
    }
    
    // If BRRRR, schedule refinance
    if (strategy === 'brrrr' && brrrrDetails) {
        const refinanceMonth = purchaseMonth + brrrrDetails.refinanceAfter;
        const refinanceTransaction = {
            id: `txn_${Date.now()}_ref`,
            type: 'PROPERTY_REFINANCE',
            month: refinanceMonth,
            propertyId: transaction.propertyId,
            data: {
                address,
                refinanceLTV: brrrrDetails.refinanceLTV,
                notes: `BRRRR Refinance at ${brrrrDetails.refinanceLTV}% LTV`
            }
        };
        
        stateManager.addTransaction(refinanceTransaction);
        
        await simulationAPI.addPhase(currentSimulation.id, {
            phaseNumber: currentPhases.length + 2,
            monthNumber: refinanceMonth,
            actionType: 'refinance',
            propertyAddress: address,
            purchasePrice: 0,
            monthlyRentalIncome: 0,
            notes: JSON.stringify(refinanceTransaction.data)
        });
    }
    
    // Close modal
    closePropertyModal();
    
    // Reload simulation to ensure all phases are properly loaded
    await loadSimulation(currentSimulation.id);
    
    // Refresh all UI components
    await refreshAllUI();
}

// Export simulation
function exportSimulation() {
    if (!currentSimulation || currentProjections.length === 0) {
        alert('No simulation data to export');
        return;
    }
    
    // Show export options modal
    showExportOptionsModal();
}

// Show export options modal
function showExportOptionsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Export Simulation Report</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <p>Choose your export format:</p>
                <div class="export-options">
                    <button class="btn btn-primary" onclick="exportAsExcel()">
                        <i class="fas fa-file-excel"></i> Excel with Formulas
                    </button>
                    <button class="btn btn-outline" onclick="exportAsHTML()">
                        <i class="fas fa-file-alt"></i> Full Report (HTML)
                    </button>
                    <button class="btn btn-outline" onclick="exportAsCSV()">
                        <i class="fas fa-file-csv"></i> Data Only (CSV)
                    </button>
                </div>
                <p class="export-note">
                    <i class="fas fa-info-circle"></i> Excel export includes formulas for ROI, cash flow, and break-even analysis
                </p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Export as Excel with formulas
function exportAsExcel() {
    // Close modal
    document.querySelector('.modal').remove();
    
    // Initialize Excel exporter
    const exporter = new ExcelExporter();
    
    // Export with formulas
    try {
        exporter.exportToExcel(currentSimulation, currentPhases, stateManager);
        
        // Show success message
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            Excel file exported successfully with formulas included!
        `;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 1000;
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    } catch (error) {
        console.error('Export error:', error);
        alert('Error exporting to Excel: ' + error.message);
    }
}

// Export as comprehensive HTML report
function exportAsHTML() {
    // Close modal
    document.querySelector('.modal').remove();
    
    const lastProjection = currentProjections[currentProjections.length - 1] || {};
    const goalAchieved = (lastProjection.net_cashflow || 0) >= currentSimulation.target_monthly_income;
    
    // Generate HTML report
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${currentSimulation.name} - Investment Plan Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .report-header {
            background: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .report-title {
            font-size: 2em;
            margin: 0 0 10px 0;
            color: #2c3e50;
        }
        .report-date {
            color: #666;
            font-size: 0.9em;
        }
        .section {
            background: white;
            padding: 25px;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .section-title {
            font-size: 1.5em;
            margin: 0 0 20px 0;
            color: #2c3e50;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 10px;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .metric-box {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #3498db;
        }
        .metric-label {
            font-size: 0.85em;
            color: #666;
            margin-bottom: 5px;
        }
        .metric-value {
            font-size: 1.4em;
            font-weight: bold;
            color: #2c3e50;
        }
        .timeline-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .timeline-table th,
        .timeline-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }
        .timeline-table th {
            background: #f8f9fa;
            font-weight: 600;
            color: #2c3e50;
        }
        .timeline-table tr:hover {
            background: #f8f9fa;
        }
        .property-card {
            background: #f8f9fa;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 6px;
            border-left: 4px solid #27ae60;
        }
        .assumptions-list {
            list-style: none;
            padding: 0;
        }
        .assumptions-list li {
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .assumptions-list li:last-child {
            border-bottom: none;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 500;
        }
        .status-success {
            background: #d4edda;
            color: #155724;
        }
        .status-pending {
            background: #fff3cd;
            color: #856404;
        }
        .chart-container {
            margin: 20px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 6px;
        }
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .section {
                box-shadow: none;
                border: 1px solid #ddd;
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="report-header">
        <h1 class="report-title">${currentSimulation.name}</h1>
        <div class="report-date">Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>

    <!-- Executive Summary -->
    <div class="section">
        <h2 class="section-title">Executive Summary</h2>
        <div class="metrics-grid">
            <div class="metric-box">
                <div class="metric-label">Target Monthly Income</div>
                <div class="metric-value">$${currentSimulation.target_monthly_income.toLocaleString()}</div>
            </div>
            <div class="metric-box">
                <div class="metric-label">Initial Capital</div>
                <div class="metric-value">$${currentSimulation.initial_capital.toLocaleString()}</div>
            </div>
            <div class="metric-box">
                <div class="metric-label">Time Horizon</div>
                <div class="metric-value">${currentSimulation.time_horizon_months} months</div>
            </div>
            <div class="metric-box">
                <div class="metric-label">Strategy Type</div>
                <div class="metric-value">${currentSimulation.strategy_type.charAt(0).toUpperCase() + currentSimulation.strategy_type.slice(1)}</div>
            </div>
        </div>
        <div style="margin-top: 20px;">
            <p><strong>Goal Status:</strong> 
                <span class="status-badge ${goalAchieved ? 'status-success' : 'status-pending'}">
                    ${goalAchieved ? 'Achieved' : 'In Progress'}
                </span>
            </p>
            <p><strong>Projected Monthly Income:</strong> $${(lastProjection.net_cashflow || 0).toLocaleString()}</p>
            <p><strong>Total Properties:</strong> ${lastProjection.total_properties || 0}</p>
            <p><strong>Total Equity Built:</strong> $${(lastProjection.total_equity || 0).toLocaleString()}</p>
            <p><strong>Return on Investment:</strong> ${(lastProjection.roi_percentage || 0).toFixed(1)}%</p>
        </div>
    </div>

    <!-- Investment Timeline -->
    <div class="section">
        <h2 class="section-title">Investment Timeline</h2>
        <table class="timeline-table">
            <thead>
                <tr>
                    <th>Month</th>
                    <th>Action</th>
                    <th>Property</th>
                    <th>Investment</th>
                    <th>Monthly Income Impact</th>
                </tr>
            </thead>
            <tbody>
                ${generateTimelineRows()}
            </tbody>
        </table>
    </div>

    <!-- Properties Portfolio -->
    <div class="section">
        <h2 class="section-title">Properties in Portfolio</h2>
        ${generatePropertiesList()}
    </div>

    <!-- Financial Projections -->
    <div class="section">
        <h2 class="section-title">Financial Projections</h2>
        <div class="chart-container">
            <p><em>Monthly cash flow progression over ${currentSimulation.time_horizon_months} months</em></p>
            ${generateCashFlowChart()}
        </div>
        <h3>Key Milestones</h3>
        ${generateMilestonesList()}
    </div>

    <!-- Assumptions -->
    <div class="section">
        <h2 class="section-title">Key Assumptions</h2>
        <ul class="assumptions-list">
            <li><strong>Loan Terms:</strong> ${getMostCommonLoanTerms()}</li>
            <li><strong>Down Payment:</strong> Typically 20-25% of purchase price</li>
            <li><strong>Closing Costs:</strong> 3% of purchase price</li>
            <li><strong>Property Management:</strong> 10% of rental income</li>
            <li><strong>Maintenance Reserve:</strong> 5% of rental income</li>
            <li><strong>Vacancy Rate:</strong> 5% assumed</li>
            <li><strong>Insurance:</strong> ~$100/month per property</li>
            <li><strong>Property Tax:</strong> Based on actual property data</li>
            <li><strong>Market Conditions:</strong> Current Detroit market data</li>
        </ul>
    </div>

    <!-- Footer -->
    <div class="section" style="text-align: center; color: #666;">
        <p>This report is for planning purposes only and does not constitute financial advice.</p>
        <p>Generated by Framework Real Estate Solutions Portfolio Simulator</p>
    </div>
</body>
</html>
`;
    
    // Download HTML file
    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSimulation.name.replace(/\s+/g, '_')}_investment_plan.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Export as CSV (keep existing functionality)
function exportAsCSV() {
    // Close modal
    document.querySelector('.modal').remove();
    
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

// Helper functions for report generation
function generateTimelineRows() {
    let rows = '';
    currentPhases.forEach(phase => {
        const actionIcon = {
            'buy_rental': '🏠',
            'buy_flip': '🔨',
            'sell': '💰',
            'refinance': '🔄',
            'wait': '⏳'
        }[phase.action_type] || '📍';
        
        const investmentAmount = phase.action_type === 'sell' 
            ? `+$${(phase.sale_price || 0).toLocaleString()}`
            : phase.action_type === 'refinance'
            ? `+$${((phase.properties_data?.cashOut || 0)).toLocaleString()}`
            : `-$${((phase.down_payment_percent / 100 * phase.purchase_price) + (phase.purchase_price * 0.03) + (phase.rehab_cost || 0)).toLocaleString()}`;
            
        const incomeImpact = phase.monthly_rental_income 
            ? `+$${phase.monthly_rental_income.toLocaleString()}/mo`
            : phase.action_type === 'sell' ? 'Property removed' : '-';
            
        rows += `
            <tr>
                <td>Month ${phase.month_number}</td>
                <td>${actionIcon} ${phase.action_type.replace(/_/g, ' ').toUpperCase()}</td>
                <td>${phase.property_address || '-'}</td>
                <td>${investmentAmount}</td>
                <td>${incomeImpact}</td>
            </tr>
        `;
    });
    return rows;
}

function generatePropertiesList() {
    const activeProperties = [];
    const soldProperties = [];
    
    currentPhases.forEach(phase => {
        if (phase.action_type === 'buy_rental' || phase.action_type === 'buy_flip') {
            activeProperties.push(phase);
        } else if (phase.action_type === 'sell') {
            const propIndex = activeProperties.findIndex(p => p.property_address === phase.property_address);
            if (propIndex !== -1) {
                soldProperties.push(activeProperties[propIndex]);
                activeProperties.splice(propIndex, 1);
            }
        }
    });
    
    let html = '<h3>Active Properties</h3>';
    if (activeProperties.length === 0) {
        html += '<p style="color: #666;">No active properties</p>';
    } else {
        activeProperties.forEach(prop => {
            html += `
                <div class="property-card">
                    <strong>${prop.property_address}</strong><br>
                    Type: ${prop.action_type === 'buy_rental' ? 'Rental' : 'Flip'}<br>
                    Purchase Price: $${prop.purchase_price.toLocaleString()}<br>
                    ${prop.monthly_rental_income ? `Monthly Income: $${prop.monthly_rental_income.toLocaleString()}` : 'Under renovation'}
                </div>
            `;
        });
    }
    
    if (soldProperties.length > 0) {
        html += '<h3 style="margin-top: 20px;">Sold Properties</h3>';
        soldProperties.forEach(prop => {
            html += `
                <div class="property-card" style="border-left-color: #e74c3c;">
                    <strong>${prop.property_address}</strong><br>
                    Sold for profit/loss calculation
                </div>
            `;
        });
    }
    
    return html;
}

function generateCashFlowChart() {
    // Simple ASCII chart for cash flow progression
    const maxIncome = Math.max(...currentProjections.map(p => p.net_cashflow));
    const chartHeight = 10;
    let chart = '<pre style="font-family: monospace; line-height: 1.2;">';
    
    // Create simple bar chart
    for (let i = chartHeight; i >= 0; i--) {
        const threshold = (maxIncome / chartHeight) * i;
        let line = String(Math.round(threshold)).padStart(6, ' ') + ' |';
        
        currentProjections.forEach((proj, idx) => {
            if (idx % 3 === 0) { // Show every 3rd month to avoid crowding
                line += proj.net_cashflow >= threshold ? '█' : ' ';
            }
        });
        
        chart += line + '\\n';
    }
    
    chart += '       +' + '-'.repeat(Math.ceil(currentProjections.length / 3)) + '\\n';
    chart += '       ';
    currentProjections.forEach((proj, idx) => {
        if (idx % 3 === 0) {
            chart += String(idx).padEnd(1);
        }
    });
    chart += ' (months)\\n</pre>';
    
    return chart;
}

function generateMilestonesList() {
    const milestones = [];
    let firstIncomeMonth = null;
    let goalAchievedMonth = null;
    let cashRecoveredMonth = null;
    
    currentProjections.forEach((proj, idx) => {
        if (!firstIncomeMonth && proj.net_cashflow > 0) {
            firstIncomeMonth = idx;
            milestones.push(`Month ${idx}: First positive cash flow ($${proj.net_cashflow.toLocaleString()}/month)`);
        }
        
        if (!goalAchievedMonth && proj.net_cashflow >= currentSimulation.target_monthly_income) {
            goalAchievedMonth = idx;
            milestones.push(`Month ${idx}: Target income achieved ($${proj.net_cashflow.toLocaleString()}/month)`);
        }
        
        if (!cashRecoveredMonth && proj.cash_reserves >= currentSimulation.initial_capital) {
            cashRecoveredMonth = idx;
            milestones.push(`Month ${idx}: Initial capital recovered (reserves: $${proj.cash_reserves.toLocaleString()})`);
        }
        
        // Check for major income jumps (25% increase)
        if (idx > 0) {
            const prevIncome = currentProjections[idx - 1].net_cashflow;
            const increase = proj.net_cashflow - prevIncome;
            if (increase > prevIncome * 0.25 && increase > 500) {
                milestones.push(`Month ${idx}: Major income increase (+$${increase.toLocaleString()}/month)`);
            }
        }
    });
    
    if (milestones.length === 0) {
        return '<p style="color: #666;">No major milestones reached yet</p>';
    }
    
    return '<ul>' + milestones.map(m => `<li>${m}</li>`).join('') + '</ul>';
}

function getMostCommonLoanTerms() {
    const loanTypes = {};
    currentPhases.forEach(phase => {
        if (phase.properties_data?.loanType) {
            const key = `${phase.properties_data.loanType} - ${phase.properties_data.interestRate}% for ${phase.properties_data.loanTermMonths} months`;
            loanTypes[key] = (loanTypes[key] || 0) + 1;
        }
    });
    
    const mostCommon = Object.entries(loanTypes).sort((a, b) => b[1] - a[1])[0];
    return mostCommon ? mostCommon[0] : '30-year fixed at market rates';
}

// Timeline View Functions

// Reconstruct timeline from phases data
function reconstructTimelineFromPhases() {
    if (!currentPhases || currentPhases.length === 0) return;
    
    // Sort phases by month number
    const sortedPhases = [...currentPhases].sort((a, b) => a.month_number - b.month_number);
    
    // Process each phase and add appropriate timeline events
    sortedPhases.forEach(phase => {
        const month = phase.month_number;
        
        switch (phase.action_type) {
            case 'snapshot':
                // Snapshot events are visual only, handled in updateTimelineView
                break;
            case 'wait':
                // Wait period events are visual only, handled in updateTimelineView
                break;
            case 'loan':
                // Loan events are visual only, handled in updateTimelineView
                break;
            case 'refinance':
                // Refinance events are visual only, handled in updateTimelineView
                break;
            // Property purchases and sales are already handled by transactions
        }
    });
    
    // The actual timeline rendering happens in updateTimelineView which reads from phases
}

// Refresh timeline - manual trigger
function refreshTimeline() {
    console.log('Manually refreshing timeline...');
    
    // Force state recalculation
    if (stateManager) {
        stateManager.recalculateState();
    }
    
    // Update timeline view
    updateTimelineView();
    
    // Update metrics
    updateMetrics();
    
    // Try to reconnect if disconnected
    if (simulationAPI && simulationAPI.connectionStatus !== 'connected') {
        simulationAPI.init(
            window.APP_CONFIG.SUPABASE_URL,
            window.APP_CONFIG.SUPABASE_ANON_KEY
        ).then(initialized => {
            if (initialized && currentSimulation) {
                loadSimulation(currentSimulation.id);
            }
        });
    }
}

// Update timeline view with cards
function updateTimelineView() {
    const track = document.getElementById('timelineTrack');
    if (!track) {
        console.warn('Timeline track element not found');
        return;
    }
    
    // Clear all cards
    track.innerHTML = '';
    
    // Add initial snapshot card
    const initialCard = createTimelineCard(0, 'snapshot', {
        cashReserves: currentSimulation?.initial_capital || 0,
        monthlyIncome: 0,
        totalProperties: 0,
        totalEquity: 0
    });
    track.appendChild(initialCard);
    
    // Subscribe this card to state updates
    stateManager.subscribe(`timeline-card-0`, (state) => {
        if (state && state.months[0]) {
            updateTimelineCard(initialCard, 0, state.months[0]);
        }
    });
    
    // Get all transactions from state manager
    const transactions = stateManager.transactions || [];
    console.log('Timeline update - transactions from state manager:', transactions.length);
    
    // Get all timeline events from phases
    const allEvents = [];
    
    // Add property transactions
    transactions.forEach(txn => {
        allEvents.push({
            month: txn.month,
            type: txn.type,
            data: txn
        });
    });
    
    // Add other timeline events from phases
    if (currentPhases) {
        console.log('Timeline update - currentPhases:', currentPhases.length, currentPhases);
        currentPhases.forEach(phase => {
            // Check if this is a property purchase that wasn't converted to a transaction
            if (phase.action_type === 'buy' && !transactions.find(t => t.id === `txn_${phase.id}`)) {
                console.log('Found buy phase not in transactions:', phase);
                let transactionData = {};
                try {
                    transactionData = JSON.parse(phase.notes || '{}');
                } catch (e) {
                    transactionData = {
                        address: phase.property_address,
                        purchasePrice: phase.purchase_price,
                        monthlyRent: phase.monthly_rental_income,
                        rehabCost: phase.rehab_cost || 0,
                        totalCashNeeded: phase.purchase_price * 0.25
                    };
                }
                allEvents.push({
                    month: phase.month_number,
                    type: 'PROPERTY_PURCHASE',
                    data: {
                        id: `txn_${phase.id}`,
                        type: 'PROPERTY_PURCHASE',
                        month: phase.month_number,
                        propertyId: `prop_${phase.id}`,
                        data: transactionData
                    }
                });
            } else if (phase.action_type === 'snapshot') {
                allEvents.push({
                    month: phase.month_number,
                    type: 'SNAPSHOT',
                    data: phase
                });
            } else if (phase.action_type === 'wait') {
                allEvents.push({
                    month: phase.month_number,
                    type: 'WAIT',
                    data: phase
                });
            } else if (phase.action_type === 'loan') {
                allEvents.push({
                    month: phase.month_number,
                    type: 'LOAN',
                    data: phase
                });
            } else if (phase.action_type === 'refinance') {
                allEvents.push({
                    month: phase.month_number,
                    type: 'REFINANCE',
                    data: phase
                });
            }
        });
    }
    
    // Sort all events by month
    allEvents.sort((a, b) => a.month - b.month);
    console.log('Timeline update - all events:', allEvents.length, allEvents);
    
    // Group events by month
    const eventsByMonth = {};
    allEvents.forEach(event => {
        if (!eventsByMonth[event.month]) {
            eventsByMonth[event.month] = [];
        }
        eventsByMonth[event.month].push(event);
    });
    
    // Add cards for each month with events
    Object.keys(eventsByMonth).sort((a, b) => a - b).forEach(month => {
        const monthNum = parseInt(month);
        const monthEvents = eventsByMonth[month];
        
        monthEvents.forEach(event => {
            let card = null;
            
            switch (event.type) {
                case 'PROPERTY_PURCHASE':
                    card = createPropertyCard(monthNum, event.data);
                    break;
                case 'PROPERTY_SALE':
                    card = createSaleCard(monthNum, event.data);
                    break;
                case 'SNAPSHOT':
                    const state = stateManager.getMonthState(monthNum);
                    if (state) {
                        card = createTimelineCard(monthNum, 'snapshot', state);
                    }
                    break;
                case 'WAIT':
                    try {
                        const waitData = JSON.parse(event.data.notes || '{}');
                        card = createTimelineCard(monthNum, 'wait', waitData);
                    } catch (e) {
                        console.error('Error parsing wait data:', e);
                    }
                    break;
                case 'LOAN':
                    try {
                        const loanData = JSON.parse(event.data.notes || '{}');
                        card = createTimelineCard(monthNum, 'loan', loanData);
                    } catch (e) {
                        console.error('Error parsing loan data:', e);
                    }
                    break;
                case 'REFINANCE':
                    try {
                        const refinanceData = JSON.parse(event.data.notes || '{}');
                        card = createTimelineCard(monthNum, 'refinance', refinanceData);
                    } catch (e) {
                        console.error('Error parsing refinance data:', e);
                    }
                    break;
            }
            
            if (card) {
                track.appendChild(card);
            }
        });
        
        // Add "add" button after each month's events
        const addBtn = document.createElement('button');
        addBtn.className = 'timeline-add-btn';
        addBtn.onclick = () => showAddTimelineModal(monthNum + 1);
        addBtn.innerHTML = '<i class="fas fa-plus"></i>';
        track.appendChild(addBtn);
    });
    
    // Add final add button if no transactions
    if (transactions.length === 0) {
        const addBtn = document.createElement('button');
        addBtn.className = 'timeline-add-btn';
        addBtn.onclick = () => showAddTimelineModal(1);
        addBtn.innerHTML = '<i class="fas fa-plus"></i>';
        track.appendChild(addBtn);
    }
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
    
    // No more automatic snapshots - user must add manually
}

// Create a timeline card element
function createTimelineCard(month, type, data) {
    const card = document.createElement('div');
    card.className = `timeline-card ${type}-card`;
    card.setAttribute('data-month', month);
    
    if (type === 'snapshot') {
        card.innerHTML = `
            <div class="card-header">
                <span class="card-icon">📊</span>
                <h3>Month ${month}</h3>
            </div>
            <div class="card-content">
                <div class="metric-row">
                    <span class="metric-icon">💰</span>
                    <span class="metric-text">Cash: <strong class="cash-value">${financialCalc.formatCurrency(data.cashReserves || 0)}</strong></span>
                </div>
                <div class="metric-row">
                    <span class="metric-icon">🏠</span>
                    <span class="metric-text">Properties: <span class="property-count">${data.totalProperties || 0}</span></span>
                </div>
                <div class="metric-row">
                    <span class="metric-icon">📈</span>
                    <span class="metric-text">Income: <strong class="income-value">${financialCalc.formatCurrency(data.monthlyIncome || 0)}/mo</strong></span>
                </div>
                <div class="metric-row">
                    <span class="metric-icon">💎</span>
                    <span class="metric-text">Equity: <strong class="equity-value">${financialCalc.formatCurrency(data.totalEquity || 0)}</strong></span>
                </div>
            </div>
        `;
    } else if (type === 'wait') {
        card.innerHTML = `
            <div class="card-header">
                <span class="card-icon">⏰</span>
                <h3>Month ${month}</h3>
            </div>
            <div class="card-content">
                <div class="metric-row">
                    <span class="metric-icon">⏳</span>
                    <span class="metric-text">Wait ${data.months || 1} months</span>
                </div>
                <div class="metric-row">
                    <span class="metric-icon">💰</span>
                    <span class="metric-text">Target: ${financialCalc.formatCurrency(data.targetAmount || 0)}</span>
                </div>
                ${data.purpose ? `
                <div class="metric-row">
                    <span class="metric-icon">📝</span>
                    <span class="metric-text">${data.purpose}</span>
                </div>
                ` : ''}
            </div>
        `;
    } else if (type === 'loan') {
        card.innerHTML = `
            <div class="card-header">
                <span class="card-icon">💳</span>
                <h3>Month ${month}</h3>
            </div>
            <div class="card-content">
                <div class="metric-row">
                    <span class="metric-icon">💵</span>
                    <span class="metric-text">Amount: ${financialCalc.formatCurrency(data.amount || 0)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-icon">📊</span>
                    <span class="metric-text">${data.loanType || 'Loan'}</span>
                </div>
                ${data.interestRate ? `
                <div class="metric-row">
                    <span class="metric-icon">%</span>
                    <span class="metric-text">Rate: ${data.interestRate}%</span>
                </div>
                ` : ''}
            </div>
        `;
    } else if (type === 'refinance') {
        card.innerHTML = `
            <div class="card-header">
                <span class="card-icon">🏦</span>
                <h3>Month ${month}</h3>
            </div>
            <div class="card-content">
                <div class="property-address">${data.propertyAddress || 'Property'}</div>
                <div class="metric-row">
                    <span class="metric-icon">💰</span>
                    <span class="metric-text">Cash Out: ${financialCalc.formatCurrency(data.cashOut || 0)}</span>
                </div>
                ${data.newRate ? `
                <div class="metric-row">
                    <span class="metric-icon">%</span>
                    <span class="metric-text">New Rate: ${data.newRate}%</span>
                </div>
                ` : ''}
            </div>
        `;
    }
    
    return card;
}

// Create property purchase card
function createPropertyCard(month, transaction) {
    const card = document.createElement('div');
    card.className = 'timeline-card acquisition-card';
    card.setAttribute('data-month', month);
    
    const data = transaction.data;
    const isAllCash = data.financingType === 'CASH';
    const cashFlow = data.cashFlowAnalysis || {};
    const expenses = data.operatingExpenses || {};
    
    card.innerHTML = `
        <div class="card-header">
            <span class="card-icon">🏠</span>
            <h3>Month ${month} - Property Purchase</h3>
        </div>
        <div class="card-content">
            <div class="property-address" style="font-size: 1.1rem; font-weight: bold; margin-bottom: 1rem;">${data.address}</div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem;">
                <div class="metric-row">
                    <span class="metric-text">Purchase Price:</span>
                </div>
                <div style="text-align: right;">
                    <strong>${financialCalc.formatCurrency(data.purchasePrice)}</strong>
                </div>
                
                <div class="metric-row">
                    <span class="metric-text">Cash Required:</span>
                </div>
                <div style="text-align: right;">
                    <strong>${financialCalc.formatCurrency(data.totalCashNeeded)}</strong>
                </div>
                
                ${isAllCash ? `
                <div class="metric-row">
                    <span class="metric-text">Financing:</span>
                </div>
                <div style="text-align: right;">
                    <strong>All Cash</strong>
                </div>
                ` : `
                <div class="metric-row">
                    <span class="metric-text">Down Payment:</span>
                </div>
                <div style="text-align: right;">
                    <strong>${data.loanDetails?.downPaymentPercent || 20}% (${financialCalc.formatCurrency(data.loanDetails?.downPaymentAmount || 0)})</strong>
                </div>
                
                <div class="metric-row">
                    <span class="metric-text">Loan Amount:</span>
                </div>
                <div style="text-align: right;">
                    <strong>${financialCalc.formatCurrency(data.loanDetails?.loanAmount || 0)}</strong>
                </div>
                
                <div class="metric-row">
                    <span class="metric-text">Interest Rate:</span>
                </div>
                <div style="text-align: right;">
                    <strong>${((data.loanDetails?.interestRate || 0.08) * 100).toFixed(1)}%</strong>
                </div>
                `}
            </div>
            
            <div style="border-top: 1px solid var(--border-color); padding-top: 0.75rem; margin-bottom: 0.75rem;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem;">Monthly Cash Flow Analysis</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.25rem; font-size: 0.85rem;">
                    <div>Gross Rent:</div>
                    <div style="text-align: right;">${financialCalc.formatCurrency(data.monthlyRent)}</div>
                    
                    <div style="color: #666;">- Vacancy (${expenses.vacancyPercent || 8}%):</div>
                    <div style="text-align: right; color: #666;">${financialCalc.formatCurrency(cashFlow.vacancy || 0)}</div>
                    
                    <div style="color: #666;">- Property Tax:</div>
                    <div style="text-align: right; color: #666;">${financialCalc.formatCurrency(cashFlow.propertyTax || 0)}</div>
                    
                    <div style="color: #666;">- Insurance:</div>
                    <div style="text-align: right; color: #666;">${financialCalc.formatCurrency(cashFlow.insurance || 0)}</div>
                    
                    <div style="color: #666;">- Management (${expenses.managementPercent || 8}%):</div>
                    <div style="text-align: right; color: #666;">${financialCalc.formatCurrency(cashFlow.management || 0)}</div>
                    
                    <div style="color: #666;">- Maintenance (${expenses.maintenancePercent || 5}%):</div>
                    <div style="text-align: right; color: #666;">${financialCalc.formatCurrency(cashFlow.maintenance || 0)}</div>
                    
                    ${!isAllCash ? `
                    <div style="color: #666;">- Debt Service:</div>
                    <div style="text-align: right; color: #666;">${financialCalc.formatCurrency(cashFlow.mortgagePayment || 0)}</div>
                    ` : ''}
                    
                    <div style="border-top: 1px solid var(--border-color); padding-top: 0.25rem; margin-top: 0.25rem; font-weight: bold;">Net Cash Flow:</div>
                    <div style="border-top: 1px solid var(--border-color); padding-top: 0.25rem; margin-top: 0.25rem; text-align: right; font-weight: bold; color: ${cashFlow.netCashFlow >= 0 ? 'var(--accent-green)' : '#f44336'}">
                        ${financialCalc.formatCurrency(cashFlow.netCashFlow || 0)}/mo
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// Create property sale card
function createSaleCard(month, transaction) {
    const card = document.createElement('div');
    card.className = 'timeline-card sale-card';
    card.setAttribute('data-month', month);
    
    const data = transaction.data;
    
    card.innerHTML = `
        <div class="card-header">
            <span class="card-icon">💰</span>
            <h3>Month ${month} - Sale</h3>
        </div>
        <div class="card-content">
            <div class="property-address">${data.address}</div>
            <div class="metric-row">
                <span class="metric-text">Sale Price: <strong>${financialCalc.formatCurrency(data.salePrice)}</strong></span>
            </div>
            <div class="metric-row">
                <span class="metric-text">Net Proceeds: <strong>${financialCalc.formatCurrency(data.netProceeds)}</strong></span>
            </div>
            ${data.capitalGains > 0 ? `
            <div class="metric-row">
                <span class="metric-text">Profit: <strong style="color: var(--accent-green)">${financialCalc.formatCurrency(data.capitalGains)}</strong></span>
            </div>
            ` : ''}
        </div>
    `;
    
    return card;
}

// Update timeline card with new data
function updateTimelineCard(card, month, monthState) {
    if (!card || !monthState) return;
    
    // Update values
    const cashElement = card.querySelector('.cash-value');
    if (cashElement) cashElement.textContent = financialCalc.formatCurrency(monthState.cashReserves);
    
    const propertyElement = card.querySelector('.property-count');
    if (propertyElement) propertyElement.textContent = monthState.totalProperties;
    
    const incomeElement = card.querySelector('.income-value');
    if (incomeElement) incomeElement.textContent = `${financialCalc.formatCurrency(monthState.monthlyIncome)}/mo`;
    
    const equityElement = card.querySelector('.equity-value');
    if (equityElement) equityElement.textContent = financialCalc.formatCurrency(monthState.totalEquity);
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
    
    // Get property breakdown from properties_data if not in main object
    const breakdown = projection.property_breakdown || 
                     (projection.properties_data && projection.properties_data.property_breakdown) || 
                     { hold: 0, brrrr_active: 0, flip_active: 0, sold: 0 };
    const totalProps = (breakdown.hold || 0) + (breakdown.brrrr_active || 0) + 
                      (breakdown.flip_active || 0) + (breakdown.sold || 0);
    
    // Get accumulated rent from properties_data if not in main object
    const accumulatedRent = projection.accumulated_rent || 
                           (projection.properties_data && projection.properties_data.accumulated_rent) || 
                           0;
    
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
                <span class="metric-text">Rent Collected: <strong>${financialCalc.formatCurrency(accumulatedRent)}</strong></span>
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
    const state = stateManager.getCurrentState();
    const targetIncome = currentSimulation?.target_monthly_income || 10000;
    
    if (!state || !state.summary) {
        document.getElementById('progressText').textContent = `$0 / $${targetIncome} per month`;
        document.getElementById('progressFill').style.width = '0%';
        return;
    }
    
    const currentIncome = state.summary.monthlyIncome;
    const progress = Math.min((currentIncome / targetIncome) * 100, 100);
    
    document.getElementById('progressText').textContent = 
        `${financialCalc.formatCurrency(currentIncome)} / ${financialCalc.formatCurrency(targetIncome)} per month`;
    
    document.getElementById('progressFill').style.width = `${progress}%`;
    
    // Add color indication based on progress
    const progressBar = document.getElementById('progressFill');
    if (progress >= 100) {
        progressBar.style.background = 'var(--accent-green)';
    } else if (progress >= 75) {
        progressBar.style.background = '#4CAF50';
    } else if (progress >= 50) {
        progressBar.style.background = '#FFC107';
    } else {
        progressBar.style.background = 'var(--primary-color)';
    }
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
    
    // Parse loan details from notes if available
    let loanDetails = {};
    try {
        if (phase.notes && phase.notes.startsWith('{')) {
            loanDetails = JSON.parse(phase.notes);
        }
    } catch (e) {
        console.log('Could not parse loan details from notes');
    }
    
    const interestRate = loanDetails.rate || phase.interest_rate || 0.07;
    const loanTerm = loanDetails.term || phase.loan_term_months || 360;
    
    const monthlyPayment = financialCalc.calculateMortgagePayment(
        phase.loan_amount,
        interestRate,
        loanTerm / 12
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
                <span class="metric-text">Rate: <strong>${(interestRate * 100).toFixed(2)}%</strong></span>
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

// Refresh all UI components after any change
async function refreshAllUI() {
    if (!currentSimulation) return;
    
    // Reload phases from database to ensure sync
    const result = await simulationAPI.getPhases(currentSimulation.id);
    if (result && !result.error) {
        currentPhases = result;
    }
    
    // Run simulation to recalculate projections
    await runSimulation();
    
    // Update all UI components
    updateMetrics();
    updateTimelineView();
    updateProgressBar();
    updatePortfolioSummary();
    updatePhasesList();
    updateCashReservesDisplay();
    updateLoanSummary();
    checkMilestones();
    
    // Ensure metrics show growth percentages
    updateMetricsWithGrowth();
}

// Update cash reserves display (piggy bank)
function updateCashReservesDisplay() {
    const state = stateManager.getCurrentState();
    if (!state || !state.summary) return;
    
    const cashReserves = state.summary.cashReserves || 0;
    const initialCapital = currentSimulation?.initial_capital || 0;
    const cashGrowthPercent = initialCapital > 0 ? ((cashReserves - initialCapital) / initialCapital * 100).toFixed(1) : 0;
    
    // Add or update cash reserves card in metrics grid
    let cashCard = document.getElementById('cashReservesCard');
    if (!cashCard) {
        const metricsGrid = document.getElementById('metricsGrid');
        cashCard = document.createElement('div');
        cashCard.id = 'cashReservesCard';
        cashCard.className = 'metric-card';
        metricsGrid.appendChild(cashCard);
    }
    
    cashCard.innerHTML = `
        <div class="metric-label">
            <span style="font-size: 1.2rem; margin-right: 0.25rem;">🐷</span>
            Cash Reserves
        </div>
        <div class="metric-value">${financialCalc.formatCurrency(cashReserves)}</div>
        <div class="metric-change ${cashGrowthPercent >= 0 ? 'positive' : 'negative'}">
            ${cashGrowthPercent >= 0 ? '+' : ''}${cashGrowthPercent}% from start
        </div>
    `;
}

// Update loan summary display
function updateLoanSummary() {
    const state = stateManager.getCurrentState();
    if (!state || !state.summary) return;
    
    const totalDebt = state.summary.totalDebt || 0;
    const totalLoans = state.summary.loans?.length || 0;
    
    // Add or update loan summary card
    let loanCard = document.getElementById('loanSummaryCard');
    if (!loanCard) {
        const metricsGrid = document.getElementById('metricsGrid');
        loanCard = document.createElement('div');
        loanCard.id = 'loanSummaryCard';
        loanCard.className = 'metric-card';
        metricsGrid.appendChild(loanCard);
    }
    
    loanCard.innerHTML = `
        <div class="metric-label">
            <span style="font-size: 1.2rem; margin-right: 0.25rem;">💳</span>
            Active Loans
        </div>
        <div class="metric-value">${totalLoans}</div>
        <div class="metric-subtext">Total Debt: ${financialCalc.formatCurrency(totalDebt)}</div>
    `;
}

// Check and display milestones
function checkMilestones() {
    if (!currentProjections || currentProjections.length === 0) return;
    
    const milestones = [];
    const targetIncome = currentSimulation.target_monthly_income;
    
    // Check for income milestones
    const incomeThresholds = [1000, 5000, 10000, 25000];
    for (const threshold of incomeThresholds) {
        const reachedMonth = currentProjections.findIndex(p => p.rental_income >= threshold);
        if (reachedMonth >= 0) {
            milestones.push({
                month: reachedMonth,
                type: 'income',
                value: threshold,
                description: `Reached ${financialCalc.formatCurrency(threshold)}/mo income`
            });
        }
    }
    
    // Check for goal achievement
    const goalMonth = currentProjections.findIndex(p => p.rental_income >= targetIncome);
    if (goalMonth >= 0) {
        milestones.push({
            month: goalMonth,
            type: 'goal',
            value: targetIncome,
            description: `🎯 Goal achieved: ${financialCalc.formatCurrency(targetIncome)}/mo`
        });
    }
    
    // Check for cash recovery (infinite return)
    const recoveryMonth = currentProjections.findIndex(p => p.cash_reserves >= currentSimulation.initial_capital);
    if (recoveryMonth > 0) {
        milestones.push({
            month: recoveryMonth,
            type: 'recovery',
            value: currentSimulation.initial_capital,
            description: `💰 Initial capital recovered`
        });
    }
    
    // Display milestones on timeline
    milestones.forEach(milestone => {
        addMilestoneMarker(milestone);
    });
}

// Add milestone marker to timeline
function addMilestoneMarker(milestone) {
    const track = document.getElementById('timelineTrack');
    const existingMarker = track.querySelector(`.milestone-marker[data-month="${milestone.month}"]`);
    
    if (existingMarker) return; // Don't duplicate markers
    
    // Find the right position to insert the marker
    const cards = track.querySelectorAll('.timeline-card');
    let insertBefore = null;
    
    for (const card of cards) {
        const cardMonth = parseInt(card.getAttribute('data-month'));
        if (cardMonth > milestone.month) {
            insertBefore = card;
            break;
        }
    }
    
    const marker = document.createElement('div');
    marker.className = `milestone-marker ${milestone.type}`;
    marker.setAttribute('data-month', milestone.month);
    marker.innerHTML = `
        <div class="milestone-flag">
            <span class="milestone-icon">${milestone.type === 'goal' ? '🎯' : milestone.type === 'recovery' ? '💰' : '📈'}</span>
            <span class="milestone-text">${milestone.description}</span>
        </div>
    `;
    
    if (insertBefore) {
        track.insertBefore(marker, insertBefore);
    } else {
        // Insert before the last add button
        const lastBtn = track.querySelector('.timeline-add-btn:last-child');
        if (lastBtn) {
            track.insertBefore(marker, lastBtn);
        } else {
            track.appendChild(marker);
        }
    }
}

// Show time snapshot form
async function showTimeSnapshotForm() {
    const month = window.currentTimelineMonth || 6;
    
    // Get current state for this month
    const state = stateManager.getMonthState(month);
    if (!state) {
        alert('No data available for this month');
        return;
    }
    
    // Add snapshot card to timeline
    const track = document.getElementById('timelineTrack');
    const card = createTimelineCard(month, 'snapshot', state);
    
    // Find correct position to insert
    const cards = track.querySelectorAll('.timeline-card');
    let insertBefore = null;
    
    for (const existingCard of cards) {
        const cardMonth = parseInt(existingCard.getAttribute('data-month'));
        if (cardMonth > month) {
            insertBefore = existingCard;
            break;
        }
    }
    
    if (insertBefore) {
        track.insertBefore(card, insertBefore);
    } else {
        // Insert before last add button
        const lastBtn = track.querySelector('.timeline-add-btn:last-child');
        if (lastBtn) {
            track.insertBefore(card, lastBtn);
        } else {
            track.appendChild(card);
        }
    }
    
    // Save snapshot to database
    if (currentSimulation) {
        await simulationAPI.addPhase(currentSimulation.id, {
            phaseNumber: currentPhases.length + 1,
            monthNumber: month,
            actionType: 'snapshot',
            propertyAddress: '',
            purchasePrice: 0,
            monthlyRentalIncome: 0,
            notes: JSON.stringify({
                cashReserves: state.cashReserves,
                monthlyIncome: state.monthlyIncome,
                totalProperties: state.totalProperties,
                totalEquity: state.totalEquity
            })
        });
        
        // Reload phases to update local state
        const simulation = await simulationAPI.getSimulation(currentSimulation.id);
        if (simulation) {
            currentPhases = simulation.phases || [];
        }
    }
    
    // Subscribe card to state updates
    stateManager.subscribe(`timeline-card-${month}`, (newState) => {
        if (newState && newState.months[month]) {
            updateTimelineCard(card, month, newState.months[month]);
        }
    });
    
    closeTimelineModal();
    
    // Reload current phases to ensure database sync
    if (currentSimulation) {
        const result = await simulationAPI.getPhases(currentSimulation.id);
        if (result && !result.error) {
            currentPhases = result;
        }
    }
    
    // Refresh UI to ensure timeline persists
    await refreshAllUI();
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
    
    // Find the property being sold
    const state = stateManager.getCurrentState();
    const property = state?.months[saleMonth - 1]?.properties?.find(p => p.address === address);
    
    if (!property) {
        alert('Property not found');
        return;
    }
    
    // Create sale transaction
    const transaction = {
        id: `txn_${Date.now()}_sale`,
        type: 'PROPERTY_SALE',
        month: saleMonth,
        propertyId: property.id,
        data: {
            address,
            salePrice,
            netProceeds: salePrice * 0.94, // 6% selling costs
            capitalGains: salePrice - property.purchasePrice
        }
    };
    
    // Add to state manager
    stateManager.addTransaction(transaction);
    
    // Save to database
    const result = await simulationAPI.addPhase(currentSimulation.id, {
        phaseNumber: currentPhases.length + 1,
        monthNumber: saleMonth,
        actionType: 'sell',
        propertyAddress: address,
        salePrice: salePrice,
        purchasePrice: 0,
        monthlyRentalIncome: 0,
        notes: JSON.stringify(transaction.data)
    });
    
    if (result.error) {
        alert('Error adding sale: ' + result.error.message);
        return;
    }
    
    closePropertyModal();
    
    // Reload simulation and refresh UI
    await loadSimulation(currentSimulation.id);
    await refreshAllUI();
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
    
    // Store loan details in notes field until schema is updated
    const loanDetails = {
        type: loanType,
        rate: interestRate,
        term: loanTerm,
        closingCosts: closingCosts,
        points: points
    };
    
    const result = await simulationAPI.addPhase(currentSimulation.id, {
        phaseNumber: currentPhases.length + 1,
        monthNumber: loanMonth,
        actionType: 'loan',
        propertyAddress: `${loanType.toUpperCase()} Loan`,
        purchasePrice: 0,
        loanAmount: loanAmount,
        monthlyRentalIncome: 0,
        notes: JSON.stringify(loanDetails)
    });
    
    if (result.error) {
        alert('Error adding loan: ' + result.error.message);
        return;
    }
    
    closePropertyModal();
    await loadSimulation(currentSimulation.id);
    await refreshAllUI();
}

// Show waiting period form
function showWaitingPeriodForm() {
    closeTimelineModal();
    
    // Calculate current cash flow
    const lastProjection = currentProjections[currentProjections.length - 1];
    const monthlyCashFlow = lastProjection?.net_cashflow || 0;
    const currentCash = lastProjection?.cash_reserves || 0;
    
    const modal = document.getElementById('propertyModal');
    const content = document.getElementById('propertyModalContent');
    
    content.innerHTML = `
        <div class="goal-inputs">
            <h3>Add Waiting Period</h3>
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                Current monthly cash flow: ${financialCalc.formatCurrency(monthlyCashFlow)}<br>
                Current cash reserves: ${financialCalc.formatCurrency(currentCash)}
            </p>
            
            <div class="input-group">
                <label>Wait Duration (months)</label>
                <input type="number" id="waitMonths" value="6" min="1" max="24" />
            </div>
            
            <div class="input-group">
                <label>Starting Month</label>
                <input type="number" id="waitStartMonth" value="${window.currentTimelineMonth || 1}" min="0" max="${currentSimulation.time_horizon_months}" />
            </div>
            
            <div class="wait-preview" style="background: var(--bg-color); padding: 1rem; border-radius: 4px; margin-top: 1rem;">
                <p id="cashAccumulationPreview">Cash after 6 months: ${financialCalc.formatCurrency(currentCash + (monthlyCashFlow * 6))}</p>
            </div>
            
            <button class="btn btn-primary" onclick="addWaitingPeriod()">
                Add Wait Period
            </button>
        </div>
    `;
    
    // Update preview when duration changes
    document.getElementById('waitMonths').addEventListener('input', (e) => {
        const months = parseInt(e.target.value) || 0;
        const accumulated = currentCash + (monthlyCashFlow * months);
        document.getElementById('cashAccumulationPreview').textContent = 
            `Cash after ${months} months: ${financialCalc.formatCurrency(accumulated)}`;
    });
    
    modal.classList.add('active');
}

// Add waiting period
async function addWaitingPeriod() {
    const waitMonths = parseInt(document.getElementById('waitMonths').value);
    const startMonth = parseInt(document.getElementById('waitStartMonth').value);
    
    if (!waitMonths || waitMonths < 1) {
        alert('Please enter a valid wait duration');
        return;
    }
    
    const result = await simulationAPI.addPhase(currentSimulation.id, {
        phaseNumber: currentPhases.length + 1,
        monthNumber: startMonth,
        actionType: 'wait',
        propertyAddress: `Wait ${waitMonths} months`,
        purchasePrice: 0,
        monthlyRentalIncome: 0,
        notes: `Waiting period: ${waitMonths} months to accumulate cash`
    });
    
    if (result.error) {
        alert('Error adding wait period: ' + result.error.message);
        return;
    }
    
    closePropertyModal();
    await loadSimulation(currentSimulation.id);
    await refreshAllUI();
}

// Add wait card to timeline
function addWaitCard(phase) {
    const track = document.getElementById('timelineTrack');
    
    const card = document.createElement('div');
    card.className = 'timeline-card wait-card';
    card.setAttribute('data-month', phase.month_number);
    
    // Extract wait duration from notes
    const waitMatch = phase.notes?.match(/(\d+) months/);
    const waitDuration = waitMatch ? waitMatch[1] : '?';
    
    card.innerHTML = `
        <div class="card-header">
            <span class="card-icon">⏰</span>
            <h3>Month ${phase.month_number}</h3>
        </div>
        <div class="card-content">
            <div class="property-address">Wait Period</div>
            <div class="metric-row">
                <span class="metric-text">Duration: <strong>${waitDuration} months</strong></span>
            </div>
            <div class="metric-row">
                <span class="metric-text">Accumulating cash flow</span>
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
    addBtn.onclick = () => showAddTimelineModal(phase.month_number + parseInt(waitDuration));
    addBtn.innerHTML = '<i class="fas fa-plus"></i>';
    
    if (lastBtn) {
        track.insertBefore(addBtn, lastBtn);
    } else {
        track.appendChild(addBtn);
    }
}

// Show refinance form
function showRefinanceForm() {
    closeTimelineModal();
    
    // Get list of properties that can be refinanced
    const lastProjection = currentProjections[currentProjections.length - 1];
    const eligibleProperties = [];
    
    if (lastProjection?.properties_data) {
        lastProjection.properties_data.forEach(prop => {
            if (prop.status !== 'sold' && prop.equity > 10000) { // Min equity to refinance
                eligibleProperties.push(prop);
            }
        });
    }
    
    if (eligibleProperties.length === 0) {
        alert('No properties available for refinance. Properties need sufficient equity.');
        return;
    }
    
    const modal = document.getElementById('propertyModal');
    const content = document.getElementById('propertyModalContent');
    
    content.innerHTML = `
        <div class="goal-inputs">
            <h3>Refinance Property</h3>
            <div class="input-group">
                <label>Select Property</label>
                <select id="refinancePropertySelect">
                    ${eligibleProperties.map(p => `
                        <option value="${p.address}">
                            ${p.address} - Value: ${financialCalc.formatCurrency(p.value)}, Equity: ${financialCalc.formatCurrency(p.equity)}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div class="input-group">
                <label>Target LTV (%)</label>
                <input type="number" id="refinanceLTV" value="75" min="60" max="80" />
                <small style="color: var(--text-secondary);">Loan-to-value ratio for new loan</small>
            </div>
            
            <div class="input-group">
                <label>Month to Refinance</label>
                <input type="number" id="refinanceMonth" value="${window.currentTimelineMonth || 1}" min="0" max="${currentSimulation.time_horizon_months}" />
            </div>
            
            <div class="refinance-preview" style="background: var(--bg-color); padding: 1rem; border-radius: 4px; margin-top: 1rem;">
                <p id="cashOutPreview">Estimated cash out: $0</p>
                <p id="newPaymentPreview">New monthly payment: $0</p>
            </div>
            
            <button class="btn btn-primary" onclick="addRefinance()">
                Add Refinance
            </button>
        </div>
    `;
    
    // Update preview when property or LTV changes
    const updateRefinancePreview = () => {
        const selectedAddress = document.getElementById('refinancePropertySelect').value;
        const selectedProperty = eligibleProperties.find(p => p.address === selectedAddress);
        const ltv = parseFloat(document.getElementById('refinanceLTV').value) / 100;
        
        if (selectedProperty) {
            const newLoanAmount = selectedProperty.value * ltv;
            const currentDebt = selectedProperty.value - selectedProperty.equity;
            const cashOut = newLoanAmount - currentDebt;
            const monthlyPayment = financialCalc.calculateMortgagePayment(newLoanAmount, 0.07, 30);
            
            document.getElementById('cashOutPreview').textContent = 
                `Estimated cash out: ${financialCalc.formatCurrency(cashOut)}`;
            document.getElementById('newPaymentPreview').textContent = 
                `New monthly payment: ${financialCalc.formatCurrency(monthlyPayment)}`;
        }
    };
    
    document.getElementById('refinancePropertySelect').addEventListener('change', updateRefinancePreview);
    document.getElementById('refinanceLTV').addEventListener('input', updateRefinancePreview);
    
    updateRefinancePreview();
    modal.classList.add('active');
}

// Add refinance
async function addRefinance() {
    const propertyAddress = document.getElementById('refinancePropertySelect').value;
    const ltv = parseFloat(document.getElementById('refinanceLTV').value);
    const month = parseInt(document.getElementById('refinanceMonth').value);
    
    if (!propertyAddress || !ltv) {
        alert('Please fill in all fields');
        return;
    }
    
    const result = await simulationAPI.addPhase(currentSimulation.id, {
        phaseNumber: currentPhases.length + 1,
        monthNumber: month,
        actionType: 'refinance',
        propertyAddress: propertyAddress,
        purchasePrice: 0,
        monthlyRentalIncome: 0,
        notes: `Cash-out refinance at ${ltv}% LTV`
    });
    
    if (result.error) {
        alert('Error adding refinance: ' + result.error.message);
        return;
    }
    
    closePropertyModal();
    await loadSimulation(currentSimulation.id);
    await refreshAllUI();
}

// Add refinance card to timeline
function addRefinanceCard(phase) {
    const track = document.getElementById('timelineTrack');
    
    const card = document.createElement('div');
    card.className = 'timeline-card refinance-card';
    card.setAttribute('data-month', phase.month_number);
    
    card.innerHTML = `
        <div class="card-header">
            <span class="card-icon">🏦</span>
            <h3>Month ${phase.month_number} - Refinance</h3>
        </div>
        <div class="card-content">
            <div class="property-address">${phase.property_address || 'Property'}</div>
            <div class="metric-row">
                <span class="metric-text">${phase.notes || 'Cash-out refinance'}</span>
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
    
    // Add automatic snapshot after refinance
    addTimeSnapshotCard(phase.month_number + 1, true);
}