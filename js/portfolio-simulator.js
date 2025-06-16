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
    updateMetrics();
    updateProgressBar();
    updatePortfolioSummary();
    updateCashReservesDisplay();
    updateLoanSummary();
    updateTimelineView(); // Call this after metrics are updated
    checkMilestones();
    updateMetricsWithGrowth(); // Ensure growth percentages are shown
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
            // Include extra fields in properties_data until schema is updated
            const projectionToSave = {
                ...projection,
                properties_data: {
                    ...projection.properties_data,
                    accumulated_rent: projection.accumulated_rent || 0,
                    property_breakdown: projection.property_breakdown || {}
                }
            };
            await simulationAPI.saveProjection(
                currentSimulation.id,
                projection.month_number,
                projectionToSave
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

// Update metrics with growth percentages
function updateMetricsWithGrowth() {
    if (!currentProjections || currentProjections.length === 0) return;
    
    const lastProjection = currentProjections[currentProjections.length - 1];
    const firstProjection = currentProjections[0] || { net_cashflow: 0, total_equity: currentSimulation.initial_capital };
    
    // Update income metric with growth
    const incomeCard = document.querySelector('#metricsGrid > .metric-card:nth-child(1)');
    if (incomeCard) {
        const incomeGrowth = firstProjection.net_cashflow > 0 
            ? ((lastProjection.net_cashflow - firstProjection.net_cashflow) / firstProjection.net_cashflow * 100).toFixed(1)
            : lastProjection.net_cashflow > 0 ? '∞' : '0';
        
        incomeCard.innerHTML = `
            <div class="metric-label">Current Monthly Income</div>
            <div class="metric-value">${financialCalc.formatCurrency(lastProjection.net_cashflow)}</div>
            ${incomeGrowth !== '0' ? `<div class="metric-change positive">↑ ${incomeGrowth}%</div>` : ''}
        `;
    }
    
    // Update equity metric with growth
    const equityCard = document.querySelector('#metricsGrid > .metric-card:nth-child(3)');
    if (equityCard) {
        const equityGrowth = ((lastProjection.total_equity - currentSimulation.initial_capital) / currentSimulation.initial_capital * 100).toFixed(1);
        
        equityCard.innerHTML = `
            <div class="metric-label">Total Equity</div>
            <div class="metric-value">${financialCalc.formatCurrency(lastProjection.total_equity)}</div>
            ${equityGrowth !== '0.0' ? `<div class="metric-change ${equityGrowth >= 0 ? 'positive' : 'negative'}">
                ${equityGrowth >= 0 ? '↑' : '↓'} ${Math.abs(equityGrowth)}%
            </div>` : ''}
        `;
    }
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
        notes: brrrrDetails ? JSON.stringify(brrrrDetails) : strategyLabels[strategy]
    });
    
    if (result.error) {
        alert('Error adding property: ' + result.error.message);
        return;
    }
    
    // If BRRRR, automatically schedule refinance
    if (strategy === 'brrrr' && brrrrDetails) {
        const refinanceMonth = purchaseMonth + brrrrDetails.refinanceAfter;
        await simulationAPI.addPhase(currentSimulation.id, {
            phaseNumber: currentPhases.length + 2,
            monthNumber: refinanceMonth,
            actionType: 'refinance',
            propertyAddress: address,
            purchasePrice: 0,
            monthlyRentalIncome: 0,
            notes: `BRRRR Refinance at ${brrrrDetails.refinanceLTV}% LTV`
        });
    }
    
    // Close modal and reload
    closePropertyModal();
    await loadSimulation(currentSimulation.id);
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
                    <button class="btn btn-primary" onclick="exportAsHTML()">
                        <i class="fas fa-file-alt"></i> Full Report (HTML)
                    </button>
                    <button class="btn btn-outline" onclick="exportAsCSV()">
                        <i class="fas fa-file-csv"></i> Data Only (CSV)
                    </button>
                </div>
                <p class="export-note">
                    <i class="fas fa-info-circle"></i> The HTML report can be opened in your browser and printed to PDF
                </p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
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
    const sortedPhases = [...currentPhases].sort((a, b) => a.month_number - b.month_number);
    
    sortedPhases.forEach((phase, index) => {
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
        } else if (phase.action_type === 'wait') {
            addWaitCard(phase);
        } else if (phase.action_type === 'refinance') {
            addRefinanceCard(phase);
        } else if (phase.action_type === 'snapshot') {
            // Skip explicit snapshots as we add automatic ones
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
    setTimeout(() => {
        addTimeSnapshotCard(phase.month_number + 1, true);
    }, 100); // Small delay to ensure projections are updated
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
    if (!currentSimulation || currentProjections.length === 0) {
        document.getElementById('progressText').textContent = '$0 / $' + (currentSimulation?.target_monthly_income || 10000) + ' per month';
        document.getElementById('progressFill').style.width = '0%';
        return;
    }
    
    const targetIncome = currentSimulation.target_monthly_income;
    const lastProjection = currentProjections[currentProjections.length - 1];
    const currentIncome = lastProjection.net_cashflow; // Use net cash flow for true income
    
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
    if (!currentProjections || currentProjections.length === 0) return;
    
    const lastProjection = currentProjections[currentProjections.length - 1];
    const cashReserves = lastProjection.cash_reserves || 0;
    const initialCapital = currentSimulation.initial_capital || 0;
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
            <span style="font-size: 1.5rem; margin-right: 0.5rem;">🐷</span>
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
    const loanPhases = currentPhases.filter(p => p.action_type === 'loan');
    const propertyLoans = currentPhases.filter(p => p.action_type === 'buy' && p.loan_amount > 0);
    const totalLoans = loanPhases.length + propertyLoans.length;
    
    // Calculate total debt from last projection
    const lastProjection = currentProjections[currentProjections.length - 1];
    const totalDebt = lastProjection?.total_debt || 0;
    
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
            <span style="font-size: 1.5rem; margin-right: 0.5rem;">💳</span>
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