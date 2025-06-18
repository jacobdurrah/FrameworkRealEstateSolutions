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
    // Initialize components
    v3State.listingsMatcher = new ListingsMatcher();
    
    // Set up event handlers
    setupV3EventHandlers();
    
    // Load example queries
    loadExampleQueries();
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
 * Generate strategy from goal input
 */
async function generateStrategy() {
    const goalText = document.getElementById('goalInput').value.trim();
    if (!goalText) {
        showV3Error('Please describe your investment goal');
        return;
    }

    // Show loading state
    showV3Loading(true);
    hideV3Error();

    try {
        // Parse the goal
        const parser = new GoalParser();
        v3State.parsedGoal = parser.parse(goalText);
        
        // Display parsed goal
        displayParsedGoal(v3State.parsedGoal);
        
        // Generate strategies
        const generator = new StrategyGenerator();
        const strategies = await generator.generateMultipleStrategies(v3State.parsedGoal);
        v3State.generatedStrategies = strategies;
        
        // Select default strategy (balanced)
        const balancedStrategy = strategies.find(s => s.approach === 'balanced') || strategies[0];
        selectStrategy(balancedStrategy);
        
        // Show strategy options
        displayStrategyOptions(strategies);
        
        // Show results sections
        document.getElementById('strategyOptionsSection').style.display = 'block';
        document.getElementById('v2Components').style.display = 'block';
        
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
    if (!display) return;

    display.innerHTML = `
        <div class="parsed-goal-summary">
            <h4>Understanding Your Goal:</h4>
            <ul>
                <li><strong>Target Income:</strong> ${formatCurrency(goal.targetMonthlyIncome)}/month</li>
                <li><strong>Timeline:</strong> ${goal.timeHorizon} months</li>
                <li><strong>Starting Capital:</strong> ${formatCurrency(goal.startingCapital)}</li>
                <li><strong>Monthly Savings:</strong> ${formatCurrency(goal.monthlyContributions)}</li>
                ${goal.preferredStrategies.length > 0 ? 
                    `<li><strong>Preferences:</strong> ${goal.preferredStrategies.join(', ')}</li>` : ''}
            </ul>
        </div>
    `;
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
                    <span class="metric-label">Time to Goal:</span>
                    <span class="metric-value">${strategy.monthsToGoal} months</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Properties Needed:</span>
                    <span class="metric-value">${strategy.propertyCount}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Total Investment:</span>
                    <span class="metric-value">${formatCurrency(strategy.totalInvestment)}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Success Rate:</span>
                    <span class="metric-value">${strategy.feasibility ? '✅ Achievable' : '⚠️ Challenging'}</span>
                </div>
            </div>
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
    window.timelineData = [];
    
    // Convert strategy events to V2 timeline format
    strategy.timeline.forEach(event => {
        window.timelineData.push({
            id: Date.now() + Math.random(),
            month: event.month,
            action: event.action,
            property: event.property || `Property ${window.timelineData.length + 1}`,
            price: event.price,
            downPercent: event.downPercent || 20,
            downAmount: event.price * (event.downPercent || 20) / 100,
            loanAmount: event.price * (1 - (event.downPercent || 20) / 100),
            rate: event.rate || 7,
            term: event.term || 30,
            payment: event.payment || 0,
            rent: event.rent || 0,
            monthlyExpenses: event.monthlyExpenses || 350
        });
    });
    
    // Refresh V2 display
    if (typeof renderTimelineTable === 'function') {
        renderTimelineTable();
        recalculateAll();
    }
}

/**
 * Apply real listings to timeline
 */
async function applyRealListings() {
    if (!v3State.selectedStrategy || !v3State.useRealListings) return;
    
    showV3Loading(true, 'Matching real properties...');
    
    try {
        // Match timeline to real listings
        const matchedTimeline = await v3State.listingsMatcher.matchTimelineToListings(
            window.timelineData,
            {
                minRent: 1200,
                maxRent: 1600,
                targetPrice: 65000
            }
        );
        
        // Update timeline with matched listings
        window.timelineData = matchedTimeline;
        
        // Refresh display
        renderTimelineTable();
        recalculateAll();
        
        // Show matching summary
        const summary = v3State.listingsMatcher.getMatchingSummary(matchedTimeline);
        showListingsSummary(summary);
        
    } catch (error) {
        console.error('Listings matching error:', error);
        showV3Error('Failed to match real listings: ' + error.message);
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

// Make V3 functions available globally
window.generateStrategy = generateStrategy;
window.useExample = useExample;
window.selectStrategy = selectStrategy;
window.applyRealListings = applyRealListings;