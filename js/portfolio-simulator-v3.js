/**
 * Portfolio Simulator V3
 * AI-powered goal-based strategy generator
 */

// Import V2 functionality
// Note: V2 scripts should be loaded before this file

// Global state for V3
let v3State = {
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
    
    // Initialize components
    v3State.listingsMatcher = new ListingsMatcher();
    
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
            v3State.useRealListings = e.target.checked;
            if (v3State.selectedStrategy && v3State.useRealListings) {
                applyRealListings();
            }
        });
    }

    // Strategy approach radio buttons
    document.querySelectorAll('input[name="strategyApproach"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (v3State.parsedGoal) {
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
        const strategy = document.getElementById('strategyPreference').value;
        const minRent = document.getElementById('minRent').value;
        const maxRent = document.getElementById('maxRent').value;
        
        goalText = `Target income: $${targetIncome}/month. Timeline: ${timeline} months. Starting capital: $${startingCapital}. Monthly savings: $${monthlySavings}/month. `;
        goalText += `Prefer ${strategy} strategy. Target rent range: $${minRent}-$${maxRent}/month.`;
        
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
        v3State.parsedGoal = parser.parse(goalText);
        console.log('Parsed goal:', v3State.parsedGoal);
        
        // Log individual parsed values for debugging
        console.log('Parsed values:', {
            targetMonthlyIncome: v3State.parsedGoal.targetMonthlyIncome,
            timeHorizon: v3State.parsedGoal.timeHorizon,
            startingCapital: v3State.parsedGoal.startingCapital,
            monthlyContributions: v3State.parsedGoal.monthlyContributions
        });
        
        // Display parsed goal
        displayParsedGoal(v3State.parsedGoal);
        
        // Generate strategies with timeout
        console.log('Generating strategies...');
        const generator = new StrategyGenerator();
        
        // Add timeout to prevent hanging
        const strategyPromise = generator.generateMultipleStrategies(v3State.parsedGoal);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Strategy generation timed out after 10 seconds')), 10000)
        );
        
        const strategies = await Promise.race([strategyPromise, timeoutPromise]);
        console.log('Generated strategies:', strategies.length);
        v3State.generatedStrategies = strategies;
        
        // Check if we have valid strategies
        if (!strategies || strategies.length === 0) {
            throw new Error('No strategies could be generated. Please try different parameters.');
        }
        
        // Check if any strategy is feasible
        const feasibleStrategies = strategies.filter(s => s.feasibility);
        if (feasibleStrategies.length === 0) {
            console.warn('No feasible strategies found, showing best attempts');
            showV3Warning(`Unable to achieve $${v3State.parsedGoal.targetMonthlyIncome}/month within ${v3State.parsedGoal.timeHorizon} months. Showing closest possible strategies.`);
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
                    <li><strong>Timeline:</strong> ${goal.timeHorizon} months</li>
                    <li><strong>Starting Capital:</strong> ${formatCurrency(goal.startingCapital)}</li>
                    <li><strong>Monthly Savings:</strong> ${formatCurrency(goal.monthlyContributions)}</li>
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
        <div class="strategy-card ${strategy === v3State.selectedStrategy ? 'selected' : ''}" 
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
            </div>
            ${!strategy.feasibility ? `
                <div style="background: #fee; padding: 8px; border-radius: 4px; margin: 10px 0;">
                    <i class="fas fa-exclamation-circle" style="color: #e74c3c;"></i>
                    Goal not achieved: Only reaches ${formatCurrency(strategy.finalMonthlyIncome)}/mo
                </div>
            ` : `
                <div style="background: #d4edda; padding: 8px; border-radius: 4px; margin: 10px 0;">
                    <i class="fas fa-check-circle" style="color: #27ae60;"></i>
                    Goal achieved!
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
        ? v3State.generatedStrategies[strategyOrIndex]
        : strategyOrIndex;
    
    if (!strategy) return;
    
    v3State.selectedStrategy = strategy;
    
    // Update UI
    document.querySelectorAll('.strategy-card').forEach((card, index) => {
        card.classList.toggle('selected', v3State.generatedStrategies[index] === strategy);
    });
    
    // Apply strategy to V2 timeline
    applyStrategyToTimeline(strategy);
    
    // Apply real listings if enabled
    if (v3State.useRealListings) {
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
        const timelineEvent = {
            id: Date.now() + Math.random(),
            month: event.month,
            action: event.action,
            property: event.property || `Property ${index + 1}`,
            price: event.price || 0,
            downPercent: event.downPercent || 20,
            downAmount: event.price * (event.downPercent || 20) / 100,
            loanAmount: event.price * (1 - (event.downPercent || 20) / 100),
            rate: event.rate || 7,
            term: event.term || 30,
            payment: event.payment || 0,
            rent: event.rent || 0,
            monthlyExpenses: event.monthlyExpenses || 350,
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
                <input type="number" class="editable number percentage" value="${row.downPercent}" 
                       onchange="updateTimeline(${row.id}, 'downPercent', this.value)" 
                       min="0" max="100" step="5"
                       ${row.action !== 'buy' ? 'disabled' : ''}>
            </td>
            <td class="number currency">${formatCurrency(row.downAmount || 0)}</td>
            <td class="number currency">${formatCurrency(row.loanAmount || 0)}</td>
            <td>
                <input type="number" class="editable number percentage" value="${row.rate}" 
                       onchange="updateTimeline(${row.id}, 'rate', this.value)" 
                       min="0" max="20" step="0.25">
            </td>
            <td>
                <input type="number" class="editable number" value="${row.term}" 
                       onchange="updateTimeline(${row.id}, 'term', this.value)" 
                       min="1" max="30" step="1">
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
    v3State.useRealListings = checkbox ? checkbox.checked : true;
    
    if (!v3State.selectedStrategy) {
        showV3Error('Please generate a strategy first before finding listings');
        return;
    }
    
    if (!window.timelineData || window.timelineData.length === 0) {
        showV3Error('No timeline events to match with listings');
        return;
    }
    
    showV3Loading(true, 'Searching for real Detroit properties...');
    
    try {
        // Check if property API is available
        if (typeof searchPropertiesZillow !== 'function') {
            throw new Error('Property search API not loaded. Please refresh the page.');
        }
        
        // Get rent preferences from structured input if available
        let minRent = 1000;
        let maxRent = 1500;
        
        if (document.getElementById('inputModeToggle').checked) {
            minRent = parseInt(document.getElementById('minRent').value) || 1000;
            maxRent = parseInt(document.getElementById('maxRent').value) || 1500;
        }
        
        // Match timeline to real listings with user preferences
        const matchedTimeline = await v3State.listingsMatcher.matchTimelineToListings(
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
        const summary = v3State.listingsMatcher.getMatchingSummary(matchedTimeline);
        showListingsSummary(summary);
        
        // Show success message if matches found
        if (summary.matched > 0) {
            showV3Success(`Found ${summary.matched} real listings matching your criteria!`);
        } else {
            showV3Warning('No real listings found matching your criteria. Try adjusting your strategy or criteria.');
        }
        
    } catch (error) {
        console.error('Listings matching error:', error);
        showV3Error('Failed to find real listings: ' + error.message);
    } finally {
        showV3Loading(false);
    }
}

/**
 * Show listings matching summary
 */
function showListingsSummary(summary) {
    const display = document.getElementById('listingsSummary');
    if (!display) return;
    
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
    if (!v3State.parsedGoal) return;
    
    showV3Loading(true);
    
    try {
        const generator = new StrategyGenerator();
        const strategy = await generator.generateStrategy(v3State.parsedGoal, approach);
        
        // Find and update the strategy in our list
        const index = v3State.generatedStrategies.findIndex(s => s.approach === approach);
        if (index !== -1) {
            v3State.generatedStrategies[index] = strategy;
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