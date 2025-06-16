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
        drawTimeline();
    }
}

// Update the simulation UI
function updateSimulationUI() {
    if (!currentSimulation) return;
    
    document.getElementById('simulationTitle').textContent = currentSimulation.name;
    updatePhasesList();
    updateMetrics();
    drawTimeline();
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
    drawTimeline();
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

// Draw timeline visualization
function drawTimeline() {
    const canvas = document.getElementById('timelineCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 300;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (currentProjections.length === 0) return;
    
    // Draw axes
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 250);
    ctx.lineTo(canvas.width - 20, 250);
    ctx.moveTo(50, 20);
    ctx.lineTo(50, 250);
    ctx.stroke();
    
    // Find max values for scaling
    const maxIncome = Math.max(...currentProjections.map(p => p.net_cashflow));
    const targetIncome = currentSimulation.target_monthly_income;
    const maxY = Math.max(maxIncome, targetIncome) * 1.1;
    
    // Draw target line
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    const targetY = 250 - (targetIncome / maxY) * 220;
    ctx.moveTo(50, targetY);
    ctx.lineTo(canvas.width - 20, targetY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw income line
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    currentProjections.forEach((projection, index) => {
        const x = 50 + (index / (currentProjections.length - 1)) * (canvas.width - 70);
        const y = 250 - (projection.net_cashflow / maxY) * 220;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Draw phase markers
    currentPhases.forEach(phase => {
        const x = 50 + (phase.month_number / currentSimulation.time_horizon_months) * (canvas.width - 70);
        
        ctx.fillStyle = phase.action_type === 'buy' ? '#2196F3' : 
                       phase.action_type === 'sell' ? '#FF9800' : '#9C27B0';
        ctx.beginPath();
        ctx.arc(x, 250, 5, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // Update details
    const detailsDiv = document.getElementById('timelineDetails');
    const lastProjection = currentProjections[currentProjections.length - 1];
    const goalProgress = (lastProjection.net_cashflow / targetIncome) * 100;
    
    detailsDiv.innerHTML = `
        <p><strong>Goal Progress:</strong> ${goalProgress.toFixed(1)}% 
           (${financialCalc.formatCurrency(lastProjection.net_cashflow)} / ${financialCalc.formatCurrency(targetIncome)})</p>
        <p><strong>Time to Goal:</strong> ${estimateTimeToGoal()} months</p>
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
                    <input type="number" id="newPurchaseMonth" value="0" min="0" max="${currentSimulation.time_horizon_months}" />
                </div>
                
                <button class="btn btn-primary" onclick="addPropertyToSimulation()">
                    Add to Simulation
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
        monthlyRentalIncome: monthlyRent
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