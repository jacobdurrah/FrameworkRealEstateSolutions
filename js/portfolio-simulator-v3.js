/**
 * Portfolio Simulator V3
 * AI-powered goal-based strategy generator
 */

// Import V2 functionality
// Note: V2 scripts should be loaded before this file

// Global state for V3
window.v3State = {
    parsedGoal: null,
    generatedStrategies: [],
    selectedStrategy: null,
    useRealListings: false,
    listingsMatcher: null
};

// Initialize V3
document.addEventListener('DOMContentLoaded', () => {
    // Ensure timelineData is initialized
    if (!window.timelineData) {
        window.timelineData = [];
    }
    
    // Initialize components with safety check
    if (typeof ListingsMatcher !== 'undefined') {
        window.v3State.listingsMatcher = new ListingsMatcher();
        console.log('ListingsMatcher initialized successfully');
    } else {
        console.error('ListingsMatcher not found - real listings feature will not work');
    }
    
    // Set up event handlers
    setupV3EventHandlers();
    
    // Load example queries
    loadExampleQueries();
    
    // Log initialization
    console.log('Portfolio Simulator V3 initialized');
    console.log('V2 functions available:', {
        renderTimelineTable: typeof renderTimelineTable === 'function',
        recalculateAll: typeof recalculateAll === 'function',
        addTimelineRow: typeof addTimelineRow === 'function'
    });
});

/**
 * Set up V3-specific event handlers
 */
function setupV3EventHandlers() {
    // Goal input handler
    const goalInput = document.getElementById('goalInput');
    if (goalInput) {
        goalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                generateStrategy();
            }
        });
    }

    // Real listings toggle
    const listingsToggle = document.getElementById('useRealListings');
    if (listingsToggle) {
        listingsToggle.addEventListener('change', (e) => {
            window.v3State.useRealListings = e.target.checked;
            if (window.v3State.selectedStrategy && window.v3State.useRealListings) {
                applyRealListings();
            }
        });
    }

    // Strategy approach radio buttons
    document.querySelectorAll('input[name="strategyApproach"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (window.v3State.parsedGoal) {
                regenerateWithApproach(e.target.value);
            }
        });
    });
}

/**
 * Load example queries
 */
function loadExampleQueries() {
    const examples = [
        "Build a portfolio that generates $10K/month within 36 months. I have $50K to start.",
        "I want $5K passive income in 2 years with $30K capital and can save $2K/month.",
        "Generate $15K/month within 5 years starting with $100K. Prefer BRRR strategy.",
        "Need $8K/month rental income. Have $75K cash, aggressive approach is OK."
    ];

    const examplesContainer = document.getElementById('exampleQueries');
    if (examplesContainer) {
        examplesContainer.innerHTML = examples.map(example => 
            `<div class="example-query" onclick="useExample('${example.replace(/'/g, "\\'")}')">${example}</div>`
        ).join('');
    }
}

/**
 * Use an example query
 */
function useExample(example) {
    document.getElementById('goalInput').value = example;
    generateStrategy();
}

/**
 * Toggle between natural language and structured input
 */
function toggleInputMode() {
    const toggle = document.getElementById('inputModeToggle');
    const naturalInput = document.getElementById('naturalLanguageInput');
    const structuredInput = document.getElementById('structuredInput');
    
    if (toggle.checked) {
        naturalInput.style.display = 'none';
        structuredInput.style.display = 'block';
    } else {
        naturalInput.style.display = 'block';
        structuredInput.style.display = 'none';
    }
}

/**
 * Generate strategy from goal input
 */
async function generateStrategy() {
    let goalText;
    const isStructured = document.getElementById('inputModeToggle').checked;
    
    if (isStructured) {
        // Build goal text from structured inputs
        const targetIncome = document.getElementById('targetIncome').value;
        const timeline = document.getElementById('timeline').value;
        const startingCapital = document.getElementById('startingCapital').value;
        const monthlySavings = document.getElementById('monthlySavings').value;
        const targetCashFromSales = document.getElementById('targetCashFromSales').value;
        const strategy = document.getElementById('strategyPreference').value;
        const minRent = document.getElementById('minRent').value;
        const maxRent = document.getElementById('maxRent').value;
        
        // Use average of min/max rent as the rent per unit
        const avgRent = Math.round((parseInt(minRent) + parseInt(maxRent)) / 2);
        
        goalText = `Target income: $${targetIncome}/month. Timeline: ${timeline} months. Starting capital: $${startingCapital}. Monthly savings: $${monthlySavings}/month. `;
        
        // Add cash target if specified
        if (targetCashFromSales && parseInt(targetCashFromSales) > 0) {
            goalText += `Target $${targetCashFromSales} cash from sales. `;
        }
        
        goalText += `Prefer ${strategy} strategy. Rent is $${avgRent}/month per unit.`;
        
        // Add advanced options
        if (!document.getElementById('allowBRRR').checked) goalText += ' No BRRR.';
        if (!document.getElementById('allowFlips').checked) goalText += ' No flips.';
        if (document.getElementById('conservativeLeverage').checked) goalText += ' Conservative leverage (25% down).';
        
        // Update the natural language input for reference
        document.getElementById('goalInput').value = goalText;
    } else {
        goalText = document.getElementById('goalInput').value.trim();
        if (!goalText) {
            showV3Error('Please describe your investment goal');
            return;
        }
    }

    // Show loading state
    showV3Loading(true);
    hideV3Error();

    try {
        // Parse the goal
        console.log('Parsing goal:', goalText);
        const parser = new GoalParser();
        window.v3State.parsedGoal = parser.parse(goalText);
        console.log('Parsed goal:', window.v3State.parsedGoal);
        
        // Log individual parsed values for debugging
        console.log('Parsed values:', {
            targetMonthlyIncome: window.v3State.parsedGoal.targetMonthlyIncome,
            timeHorizon: window.v3State.parsedGoal.timeHorizon,
            startingCapital: window.v3State.parsedGoal.startingCapital,
            monthlyContributions: window.v3State.parsedGoal.monthlyContributions
        });
        
        // Display parsed goal
        displayParsedGoal(window.v3State.parsedGoal);
        
        // Generate strategies with timeout
        console.log('Generating strategies...');
        const generator = new StrategyGenerator();
        
        // Add timeout to prevent hanging
        const strategyPromise = generator.generateMultipleStrategies(window.v3State.parsedGoal);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Strategy generation timed out after 10 seconds')), 10000)
        );
        
        const strategies = await Promise.race([strategyPromise, timeoutPromise]);
        console.log('Generated strategies:', strategies.length);
        window.v3State.generatedStrategies = strategies;
        
        // Check if we have valid strategies
        if (!strategies || strategies.length === 0) {
            throw new Error('No strategies could be generated. Please try different parameters.');
        }
        
        // Check if any strategy is feasible
        const feasibleStrategies = strategies.filter(s => s.feasibility);
        if (feasibleStrategies.length === 0) {
            console.warn('No feasible strategies found, showing best attempts');
            showV3Warning(`Unable to achieve $${window.v3State.parsedGoal.targetMonthlyIncome}/month within ${window.v3State.parsedGoal.timeHorizon} months. Showing closest possible strategies.`);
        }
        
        // Select default strategy (balanced if feasible, otherwise best attempt)
        const defaultStrategy = strategies.find(s => s.approach === 'balanced' && s.feasibility) ||
                               strategies.find(s => s.approach === 'balanced') ||
                               strategies[0];
        selectStrategy(defaultStrategy);
        
        // Show strategy options
        displayStrategyOptions(strategies);
        
        // Show results sections
        document.getElementById('strategyOptionsSection').style.display = 'block';
        
        // Only show timeline if we have events
        if (defaultStrategy.timeline && defaultStrategy.timeline.length > 0) {
            document.getElementById('v2Components').style.display = 'block';
        } else {
            showV3Warning('No investment events could be generated with the given constraints. Try adjusting your goals.');
        }
        
    } catch (error) {
        console.error('Strategy generation error:', error);
        showV3Error('Failed to generate strategy: ' + error.message);
    } finally {
        showV3Loading(false);
    }
}

/**
 * Display parsed goal information
 */
function displayParsedGoal(goal) {
    const display = document.getElementById('parsedGoalDisplay');
    if (!display) {
        console.warn('parsedGoalDisplay element not found');
        return;
    }

    try {
        display.innerHTML = `
            <div class="parsed-goal-summary">
                <h4>Understanding Your Goal:</h4>
                <ul>
                    <li><strong>Target Income:</strong> ${formatCurrency(goal.targetMonthlyIncome)}/month</li>
                    ${goal.targetCashFromSales > 0 ? 
                        `<li><strong>Target Cash from Sales:</strong> ${formatCurrency(goal.targetCashFromSales)}</li>` : ''}
                    <li><strong>Timeline:</strong> ${goal.timeHorizon} months</li>
                    <li><strong>Starting Capital:</strong> ${formatCurrency(goal.startingCapital)}</li>
                    <li><strong>Monthly Savings:</strong> ${formatCurrency(goal.monthlyContributions)}</li>
                    <li><strong>Rent per Unit:</strong> ${formatCurrency(goal.rentPerUnit)}/month</li>
                    <li><strong>Expenses per Unit:</strong> ${formatCurrency(goal.monthlyExpensesPerUnit)}/month</li>
                    <li><strong>Cash Flow per Unit:</strong> ${formatCurrency(goal.cashFlowPerUnit)}/month</li>
                    ${goal.preferredStrategies && goal.preferredStrategies.length > 0 ? 
                        `<li><strong>Preferences:</strong> ${goal.preferredStrategies.join(', ')}</li>` : ''}
                </ul>
            </div>
        `;
    } catch (error) {
        console.error('Error displaying parsed goal:', error);
        display.innerHTML = '<div class="error">Error displaying goal details</div>';
    }
}

/**
 * Display strategy options
 */
function displayStrategyOptions(strategies) {
    const container = document.getElementById('strategyComparison');
    if (!container) return;

    container.innerHTML = strategies.map(strategy => `
        <div class="strategy-card ${strategy === window.v3State.selectedStrategy ? 'selected' : ''}" 
             onclick="selectStrategy(${strategies.indexOf(strategy)})">
            <h4>${getStrategyTitle(strategy.approach)}</h4>
            <div class="strategy-metrics">
                <div class="metric">
                    <span class="metric-label">Time Used:</span>
                    <span class="metric-value">${strategy.monthsToGoal} months</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Properties:</span>
                    <span class="metric-value">${strategy.propertyCount || 0}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Total Investment:</span>
                    <span class="metric-value">${formatCurrency(strategy.totalInvestment)}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Monthly Income:</span>
                    <span class="metric-value">${formatCurrency(strategy.finalMonthlyIncome)}/mo</span>
                </div>
                ${strategy.finalCashFromSales > 0 ? `
                <div class="metric">
                    <span class="metric-label">Cash from Sales:</span>
                    <span class="metric-value">${formatCurrency(strategy.finalCashFromSales)}</span>
                </div>
                ` : ''}
            </div>
            ${(!strategy.feasibility || !strategy.feasibilityCash) ? `
                <div style="background: #fee; padding: 8px; border-radius: 4px; margin: 10px 0;">
                    <i class="fas fa-exclamation-circle" style="color: #e74c3c;"></i>
                    ${!strategy.feasibility ? `Income goal not achieved: Only ${formatCurrency(strategy.finalMonthlyIncome)}/mo<br>` : ''}
                    ${strategy.feasibilityCash === false ? `Cash goal not achieved: Only ${formatCurrency(strategy.finalCashFromSales || 0)} from sales` : ''}
                </div>
            ` : `
                <div style="background: #d4edda; padding: 8px; border-radius: 4px; margin: 10px 0;">
                    <i class="fas fa-check-circle" style="color: #27ae60;"></i>
                    All goals achieved!
                </div>
            `}
            <p class="strategy-description">${strategy.description}</p>
        </div>
    `).join('');
}

/**
 * Select a strategy
 */
function selectStrategy(strategyOrIndex) {
    const strategy = typeof strategyOrIndex === 'number' 
        ? window.v3State.generatedStrategies[strategyOrIndex]
        : strategyOrIndex;
    
    if (!strategy) return;
    
    window.v3State.selectedStrategy = strategy;
    
    // Update UI
    document.querySelectorAll('.strategy-card').forEach((card, index) => {
        card.classList.toggle('selected', window.v3State.generatedStrategies[index] === strategy);
    });
    
    // Apply strategy to V2 timeline
    applyStrategyToTimeline(strategy);
    
    // Apply real listings if enabled
    if (window.v3State.useRealListings) {
        applyRealListings();
    }
}

/**
 * Apply strategy to V2 timeline
 */
function applyStrategyToTimeline(strategy) {
    // Clear existing timeline
    window.timelineData = []; // This will trigger the setter in V2
    
    // Log for debugging
    console.log('Applying strategy to timeline:', strategy);
    console.log('Strategy timeline events:', strategy.timeline);
    
    // Build new timeline array
    const newTimelineData = [];
    
    // Convert strategy events to V2 timeline format
    strategy.timeline.forEach((event, index) => {
        // For sell events, ensure all loan fields are 0
        const isSell = event.action === 'sell';
        
        const timelineEvent = {
            id: Date.now() + Math.random(),
            month: event.month,
            action: event.action,
            property: event.property || '', // Keep empty if no property name
            price: event.price || 0,
            downPercent: isSell ? 0 : (event.downPercent || 20),
            downAmount: isSell ? 0 : (event.price * (event.downPercent || 20) / 100),
            loanAmount: isSell ? 0 : (event.price * (1 - (event.downPercent || 20) / 100)),
            rate: isSell ? 0 : (event.rate || 7),
            term: isSell ? 0 : (event.term || 30),
            payment: isSell ? 0 : (event.payment || 0),
            rent: isSell ? 0 : (event.rent || 0),
            monthlyExpenses: isSell ? 0 : (event.monthlyExpenses || 350),
            salePrice: event.salePrice || 0
        };
        
        // Add to new array
        newTimelineData.push(timelineEvent);
        console.log(`Added timeline event ${index + 1}:`, timelineEvent);
    });
    
    // Set the timeline data (will trigger setter)
    window.timelineData = newTimelineData;
    
    console.log('Total timeline events:', window.timelineData.length);
    console.log('V2 timelineData length:', typeof timelineData !== 'undefined' ? timelineData.length : 'undefined');
    
    // Show V2 components section
    const v2Components = document.getElementById('v2Components');
    if (v2Components) {
        v2Components.style.display = 'block';
    }
    
    // Force update the timeline table
    const tbody = document.getElementById('timelineBody');
    if (tbody && window.timelineData.length > 0) {
        console.log('Directly updating timeline table...');
        // Call renderTimelineTable if available
        if (typeof renderTimelineTable === 'function') {
            renderTimelineTable();
        } else {
            // Fallback: directly render if function not available
            console.warn('renderTimelineTable not found, using fallback rendering');
            renderTimelineTableFallback();
        }
        
        // Also recalculate
        if (typeof recalculateAll === 'function') {
            recalculateAll();
        }
        
        // Scroll to timeline section for visibility
        const timelineSection = document.querySelector('.table-section');
        if (timelineSection) {
            setTimeout(() => {
                timelineSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 500);
        }
    } else {
        console.error('Timeline body not found or no events to display');
    }
}

/**
 * Fallback rendering function for timeline table
 */
function renderTimelineTableFallback() {
    const tbody = document.getElementById('timelineBody');
    if (!tbody) {
        console.error('Timeline body element not found');
        return;
    }
    
    tbody.innerHTML = '';
    
    window.timelineData.forEach(row => {
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
                       onchange="updateTimeline(${row.id}, 'price', this.value)" min="0">
            </td>
            <td>
                <input type="number" class="editable number percentage" value="${row.downPercent || 0}" 
                       onchange="updateTimeline(${row.id}, 'downPercent', this.value)" 
                       min="0" max="100" step="5"
                       ${row.action !== 'buy' ? 'disabled' : ''}>
            </td>
            <td class="number currency">${formatCurrency(row.downAmount || 0)}</td>
            <td class="number currency">${formatCurrency(row.loanAmount || 0)}</td>
            <td>
                <input type="number" class="editable number percentage" value="${row.rate || 0}" 
                       onchange="updateTimeline(${row.id}, 'rate', this.value)" 
                       min="0" max="20" step="0.25"
                       ${row.action !== 'buy' ? 'disabled' : ''}>
            </td>
            <td>
                <input type="number" class="editable number" value="${row.term || 0}" 
                       onchange="updateTimeline(${row.id}, 'term', this.value)" 
                       min="1" max="30" step="1"
                       ${row.action !== 'buy' ? 'disabled' : ''}>
            </td>
            <td class="number currency">${formatCurrency(row.payment || 0)}</td>
            <td>
                <input type="number" class="editable number currency" value="${row.rent || 0}" 
                       onchange="updateTimeline(${row.id}, 'rent', this.value)" min="0"
                       ${row.action !== 'buy' ? 'disabled' : ''}>
            </td>
            <td>
                <input type="number" class="editable number currency" value="${row.monthlyExpenses || 0}" 
                       onchange="updateTimeline(${row.id}, 'monthlyExpenses', this.value)" min="0"
                       ${row.action !== 'buy' ? 'disabled' : ''}>
            </td>
            <td>
                <button class="delete-btn" onclick="deleteTimelineRow(${row.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    console.log(`Rendered ${window.timelineData.length} timeline rows`);
}

/**
 * Apply real listings to timeline
 */
async function applyRealListings() {
    // Update checkbox state
    const checkbox = document.getElementById('useRealListings');
    window.v3State.useRealListings = checkbox ? checkbox.checked : true;
    
    if (!window.v3State.selectedStrategy) {
        showV3Error('Please generate a strategy first before finding listings');
        return;
    }
    
    if (!window.timelineData || window.timelineData.length === 0) {
        showV3Error('No timeline events to match with listings');
        return;
    }
    
    // Check if ListingsMatcher is initialized
    if (!window.v3State.listingsMatcher) {
        console.error('ListingsMatcher not initialized, attempting to initialize...');
        if (typeof ListingsMatcher !== 'undefined') {
            window.v3State.listingsMatcher = new ListingsMatcher();
        } else {
            showV3Error('Real listings feature not available. Please refresh the page.');
            return;
        }
    }
    
    showV3Loading(true, 'Searching for real Detroit properties...');
    
    try {
        // Check if property API is available
        const hasAPI = (typeof searchPropertiesZillow === 'function') || 
                      (window.propertyAPI && typeof window.propertyAPI.searchPropertiesZillow === 'function');
        
        if (!hasAPI) {
            throw new Error('Property search API not loaded. Please refresh the page.');
        }
        
        console.log('Starting real listings search for timeline events...');
        
        // Get rent preferences from structured input if available
        let minRent = 1000;
        let maxRent = 1500;
        
        if (document.getElementById('inputModeToggle').checked) {
            minRent = parseInt(document.getElementById('minRent').value) || 1000;
            maxRent = parseInt(document.getElementById('maxRent').value) || 1500;
        }
        
        // Match timeline to real listings with user preferences
        const matchedTimeline = await window.v3State.listingsMatcher.matchTimelineToListings(
            window.timelineData,
            {
                minRent: minRent,
                maxRent: maxRent,
                targetPrice: 65000,
                minPrice: 40000,
                maxPrice: 90000
            }
        );
        
        // Update timeline with matched listings
        window.timelineData = matchedTimeline;
        
        // Refresh display
        if (typeof renderTimelineTable === 'function') {
            renderTimelineTable();
        } else {
            renderTimelineTableFallback();
        }
        
        if (typeof recalculateAll === 'function') {
            recalculateAll();
        }
        
        // Show matching summary
        const summary = window.v3State.listingsMatcher.getMatchingSummary(matchedTimeline);
        showListingsSummary(summary);
        
        // Show success message if matches found
        if (summary.matched > 0) {
            showV3Success(`Found ${summary.matched} real listings matching your criteria!`);
            console.log('Matched listings:', summary.listings);
        } else {
            // Show friendly warning instead of error
            showV3Warning('No properties found in the current market matching your price range. The simulation will continue with estimated values based on Detroit market averages.');
            console.log('No listings matched. This is normal if inventory is limited or API has no results in the price range.');
        }
        
    } catch (error) {
        console.error('Listings matching error:', error);
        
        // Show user-friendly message based on error type
        if (error.message.includes('401') || error.message.includes('authentication')) {
            showV3Warning('The property listings service requires authentication. Using estimated values instead.');
        } else if (error.message.includes('403') || error.message.includes('rate limit')) {
            showV3Warning('Property search limit reached. Please try again later. Using estimated values for now.');
        } else if (error.message.includes('404') || error.message.includes('405')) {
            showV3Warning('Property listings service is currently unavailable. Using estimated market values.');
        } else {
            showV3Warning('Unable to load live listings at this time. The simulation will continue with estimated property values.');
        }
    } finally {
        showV3Loading(false);
    }
}

/**
 * Show listings matching summary
 */
function showListingsSummary(summary) {
    const display = document.getElementById('listingsSummary');
    if (!display) {
        // Create summary display if it doesn't exist
        const strategyContainer = document.querySelector('.strategy-options');
        if (strategyContainer) {
            const summaryDiv = document.createElement('div');
            summaryDiv.id = 'listingsSummary';
            summaryDiv.className = 'mt-3';
            strategyContainer.appendChild(summaryDiv);
        }
        return;
    }
    
    display.innerHTML = `
        <div class="listings-summary">
            <h4>Real Listings Matched: ${summary.matched}/${summary.total} (${summary.percentage}%)</h4>
            ${summary.listings.map(listing => `
                <div class="matched-listing">
                    <span>Month ${listing.month}: ${listing.address}</span>
                    <span>${formatCurrency(listing.price)} - Est. Rent: ${formatCurrency(listing.rent)}/mo</span>
                    ${listing.url ? `<a href="${listing.url}" target="_blank">View Listing</a>` : ''}
                </div>
            `).join('')}
        </div>
    `;
    
    display.style.display = 'block';
}

/**
 * Regenerate strategy with different approach
 */
async function regenerateWithApproach(approach) {
    if (!window.v3State.parsedGoal) return;
    
    showV3Loading(true);
    
    try {
        const generator = new StrategyGenerator();
        const strategy = await generator.generateStrategy(window.v3State.parsedGoal, approach);
        
        // Find and update the strategy in our list
        const index = window.v3State.generatedStrategies.findIndex(s => s.approach === approach);
        if (index !== -1) {
            window.v3State.generatedStrategies[index] = strategy;
        }
        
        // Select the new strategy
        selectStrategy(strategy);
        
    } catch (error) {
        console.error('Strategy regeneration error:', error);
        showV3Error('Failed to regenerate strategy: ' + error.message);
    } finally {
        showV3Loading(false);
    }
}

/**
 * Get strategy title
 */
function getStrategyTitle(approach) {
    const titles = {
        'conservative': '🛡️ Conservative (Rental-Focused)',
        'balanced': '⚖️ Balanced (Mixed Strategy)',
        'aggressive': '🚀 Aggressive (Flip-Heavy)'
    };
    return titles[approach] || approach;
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
    }).format(value || 0);
}

/**
 * Show/hide loading state
 */
function showV3Loading(show, message = 'Generating strategy...') {
    const loader = document.getElementById('v3LoadingState');
    if (loader) {
        loader.style.display = show ? 'block' : 'none';
        const messageEl = loader.querySelector('.loading-message');
        if (messageEl) {
            messageEl.textContent = message;
        }
    }
}

/**
 * Show error message
 */
function showV3Error(message) {
    const errorEl = document.getElementById('v3ErrorMessage');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

/**
 * Hide error message
 */
function hideV3Error() {
    const errorEl = document.getElementById('v3ErrorMessage');
    if (errorEl) {
        errorEl.style.display = 'none';
    }
}

/**
 * Show warning message
 */
function showV3Warning(message) {
    // For now, use the error message element with warning styling
    const errorEl = document.getElementById('v3ErrorMessage');
    if (errorEl) {
        errorEl.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
        errorEl.style.display = 'block';
        errorEl.style.background = '#fff3cd';
        errorEl.style.color = '#856404';
        errorEl.style.border = '1px solid #ffeaa7';
    }
}

/**
 * Show success message
 */
function showV3Success(message) {
    const errorEl = document.getElementById('v3ErrorMessage');
    if (errorEl) {
        errorEl.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        errorEl.style.display = 'block';
        errorEl.style.background = '#d4edda';
        errorEl.style.color = '#155724';
        errorEl.style.border = '1px solid #c3e6cb';
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorEl.innerHTML.includes(message)) {
                errorEl.style.display = 'none';
            }
        }, 5000);
    }
}

// Make V3 functions available globally
window.generateStrategy = generateStrategy;
window.useExample = useExample;
window.selectStrategy = selectStrategy;
window.applyRealListings = applyRealListings;
window.toggleInputMode = toggleInputMode;

/**
 * Serialize V3 state to shareable format
 */
function serializeV3State() {
    // Get goal input (from textarea or structured inputs)
    const isStructured = document.getElementById('inputModeToggle').checked;
    let goalInput = '';
    
    if (isStructured) {
        // Serialize structured inputs
        goalInput = {
            structured: true,
            targetIncome: document.getElementById('targetIncome').value,
            timeline: document.getElementById('timeline').value,
            startingCapital: document.getElementById('startingCapital').value,
            monthlySavings: document.getElementById('monthlySavings').value,
            strategyPreference: document.getElementById('strategyPreference').value,
            minRent: document.getElementById('minRent').value,
            maxRent: document.getElementById('maxRent').value,
            allowBRRR: document.getElementById('allowBRRR').checked,
            allowFlips: document.getElementById('allowFlips').checked,
            conservativeLeverage: document.getElementById('conservativeLeverage').checked
        };
    } else {
        goalInput = document.getElementById('goalInput').value;
    }
    
    // Create state object
    const state = {
        version: 'v3',
        timestamp: new Date().toISOString(),
        goalInput: goalInput,
        parsedGoal: window.v3State.parsedGoal,
        selectedStrategy: window.v3State.selectedStrategy,
        timelineData: window.timelineData,
        simulationName: document.getElementById('simulationName').textContent,
        currentViewMonth: window.currentViewMonth || 0,
        useRealListings: window.v3State.useRealListings
    };
    
    return state;
}

/**
 * Generate shareable link
 */
async function shareSimulation() {
    try {
        // Serialize state
        const state = serializeV3State();
        
        // Check if we have meaningful data to share
        if (!state.parsedGoal && (!state.timelineData || state.timelineData.length === 0)) {
            showV3Error('Please generate a strategy first before sharing');
            return;
        }
        
        // Initialize ShareManager if not already done
        if (!window.shareManager) {
            window.shareManager = new ShareManager();
        }
        
        showV3Loading(true, 'Generating share link...');
        
        let shareUrl;
        let shareMethod = 'url';
        let shareId = null;
        
        try {
            // Try using ShareManager (which will attempt database first, then URL fallback)
            const result = await window.shareManager.shareSimulation(state);
            shareUrl = result.url;
            shareMethod = result.method;
            shareId = result.id;
        } catch (error) {
            console.warn('ShareManager failed, using direct URL method:', error);
            // Direct fallback to URL-based sharing
            const stateJson = JSON.stringify(state);
            const compressed = LZString.compressToEncodedURIComponent(stateJson);
            const baseUrl = window.location.origin + window.location.pathname;
            shareUrl = `${baseUrl}?state=${compressed}`;
            
            if (shareUrl.length > 8000) {
                showV3Warning('The simulation data is too large to share via URL. Try simplifying your strategy.');
                showV3Loading(false);
                return;
            }
        }
        
        showV3Loading(false);
        
        // Copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            showV3Success('Shareable link copied to clipboard!');
            
            // Also show the link in a dialog for manual copying
            const message = `
                <div style="padding: 1rem;">
                    <p style="margin-bottom: 1rem;">Share this link to let others view your simulation:</p>
                    <input type="text" value="${shareUrl}" 
                           style="width: 100%; padding: 0.5rem; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 4px;"
                           onclick="this.select()" readonly>
                    <p style="font-size: 0.9rem; color: #666;">
                        ${shareMethod === 'database' 
                            ? '✅ Simulation saved to cloud. This link will work for 90 days.' 
                            : '⚠️ Using URL-based sharing. The entire simulation is encoded in the URL.'}
                    </p>
                    ${shareId ? `<p style="font-size: 0.8rem; color: #999;">ID: ${shareId}</p>` : ''}
                </div>
            `;
            
            // Create a simple modal to show the link
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                z-index: 1000;
                max-width: 600px;
                width: 90%;
            `;
            modal.innerHTML = `
                <h3 style="margin-bottom: 1rem;">Share Your Simulation</h3>
                ${message}
                <button onclick="this.parentElement.remove(); document.getElementById('modalOverlay').remove();" 
                        style="background: #3498db; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
                    Close
                </button>
            `;
            
            // Add overlay
            const overlay = document.createElement('div');
            overlay.id = 'modalOverlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 999;
            `;
            overlay.onclick = () => {
                modal.remove();
                overlay.remove();
            };
            
            document.body.appendChild(overlay);
            document.body.appendChild(modal);
            
        }).catch(err => {
            console.error('Failed to copy to clipboard:', err);
            showV3Error('Failed to copy link to clipboard. Please copy it manually.');
        });
        
    } catch (error) {
        console.error('Error generating shareable link:', error);
        showV3Error('Failed to generate shareable link: ' + error.message);
    }
}

/**
 * Load state from URL on page load
 */
async function loadStateFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const simulationId = urlParams.get('id');
    const compressedState = urlParams.get('state');
    
    if (!simulationId && !compressedState) {
        return false;
    }
    
    let state = null;
    
    try {
        // Show loading message
        showV3Loading(true, 'Loading shared simulation...');
        
        if (simulationId) {
            // Try to load from database
            if (!window.shareManager) {
                window.shareManager = new ShareManager();
            }
            
            state = await window.shareManager.loadFromDatabase(simulationId);
            
            if (!state) {
                throw new Error('Simulation not found or expired');
            }
        } else if (compressedState) {
            // Load from compressed URL
            const stateJson = LZString.decompressFromEncodedURIComponent(compressedState);
            if (!stateJson) {
                throw new Error('Invalid or corrupted share link');
            }
            
            state = JSON.parse(stateJson);
        }
        
        // Validate state version
        if (state.version !== 'v3') {
            throw new Error('This link is for a different version of the simulator');
        }
        
        // Show loading message
        showV3Loading(true, 'Loading shared simulation...');
        
        // Restore simulation name
        if (state.simulationName) {
            document.getElementById('simulationName').textContent = state.simulationName + ' (Shared)';
        }
        
        // Restore view month if present
        if (state.currentViewMonth !== undefined) {
            window.currentViewMonth = state.currentViewMonth;
            document.getElementById('summaryMonth').value = state.currentViewMonth;
            updateSummaryMonth();
        }
        
        // Restore goal input
        if (state.goalInput) {
            if (typeof state.goalInput === 'object' && state.goalInput.structured) {
                // Restore structured inputs
                document.getElementById('inputModeToggle').checked = true;
                toggleInputMode();
                
                document.getElementById('targetIncome').value = state.goalInput.targetIncome;
                document.getElementById('timeline').value = state.goalInput.timeline;
                document.getElementById('startingCapital').value = state.goalInput.startingCapital;
                document.getElementById('monthlySavings').value = state.goalInput.monthlySavings;
                document.getElementById('strategyPreference').value = state.goalInput.strategyPreference;
                document.getElementById('minRent').value = state.goalInput.minRent;
                document.getElementById('maxRent').value = state.goalInput.maxRent;
                document.getElementById('allowBRRR').checked = state.goalInput.allowBRRR;
                document.getElementById('allowFlips').checked = state.goalInput.allowFlips;
                document.getElementById('conservativeLeverage').checked = state.goalInput.conservativeLeverage;
            } else {
                // Restore natural language input
                document.getElementById('goalInput').value = state.goalInput;
            }
        }
        
        // Restore parsed goal
        if (state.parsedGoal) {
            window.v3State.parsedGoal = state.parsedGoal;
            displayParsedGoal(state.parsedGoal);
        }
        
        // Restore selected strategy
        if (state.selectedStrategy) {
            window.v3State.selectedStrategy = state.selectedStrategy;
            window.v3State.generatedStrategies = [state.selectedStrategy]; // For now, just restore the selected one
            
            // Display the strategy
            displayStrategyOptions([state.selectedStrategy]);
            document.getElementById('strategyOptionsSection').style.display = 'block';
        }
        
        // Restore timeline data
        if (state.timelineData && state.timelineData.length > 0) {
            window.timelineData = state.timelineData;
            
            // Show V2 components
            document.getElementById('v2Components').style.display = 'block';
            
            // Render timeline
            if (typeof renderTimelineTable === 'function') {
                renderTimelineTable();
            }
            
            // Recalculate
            if (typeof recalculateAll === 'function') {
                recalculateAll();
            }
        }
        
        // Restore real listings preference
        if (state.useRealListings !== undefined) {
            document.getElementById('useRealListings').checked = state.useRealListings;
            window.v3State.useRealListings = state.useRealListings;
        }
        
        // Show success message
        showV3Success('Simulation loaded from shared link!');
        
        // Clear the URL parameter to avoid confusion on refresh
        window.history.replaceState({}, document.title, window.location.pathname);
        
        return true;
        
    } catch (error) {
        console.error('Error loading state from URL:', error);
        showV3Error('Failed to load shared simulation: ' + error.message);
        return false;
    } finally {
        showV3Loading(false);
    }
}

// Add shareSimulation to global scope
window.shareSimulation = shareSimulation;

// Check for shared state on page load
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other components to initialize
    setTimeout(() => {
        loadStateFromUrl();
    }, 500);
});