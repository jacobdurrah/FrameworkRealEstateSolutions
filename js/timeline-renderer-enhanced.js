/**
 * Enhanced Timeline Renderer with Zillow Links
 * Adds clickable Zillow links to properties with real listings
 */

// Store original renderTimelineTable function
let originalRenderTimelineTable = null;

/**
 * Enhanced render timeline table with Zillow links
 */
function enhancedRenderTimelineTable() {
    const tbody = document.getElementById('timelineBody');
    if (!tbody) {
        console.error('Timeline body element not found');
        return;
    }
    
    tbody.innerHTML = '';
    
    // Use window.timelineData to ensure we get the global variable
    const timelineData = window.timelineData || [];
    
    timelineData.forEach(row => {
        const tr = document.createElement('tr');
        
        // Check if this row has real listing data
        const hasRealListing = row.realListing && row.listingUrl;
        const hasAddress = row.property && row.property.includes(':');
        
        // Create property cell content with Zillow link if available
        let propertyCell = '';
        if (hasRealListing || hasAddress) {
            // Extract address from property name (format: "Rental 1: 123 Main St, Detroit, MI")
            const propertyParts = row.property.split(':');
            const propertyType = propertyParts[0];
            const address = propertyParts[1] ? propertyParts[1].trim() : row.property;
            
            // Determine the URL to use
            let zillowUrl = '';
            if (row.listingUrl) {
                // Use the actual listing URL if available
                zillowUrl = row.listingUrl;
            } else if (address && address !== row.property) {
                // Create a Zillow search URL as fallback
                const encodedAddress = encodeURIComponent(address);
                zillowUrl = `https://www.zillow.com/homes/${encodedAddress}_rb/`;
            }
            
            if (zillowUrl) {
                propertyCell = `
                    <div class="property-with-link">
                        <input type="text" class="editable property-input" 
                               value="${row.property}" 
                               onchange="updateTimeline(${row.id}, 'property', this.value)"
                               placeholder="Property address"
                               style="width: calc(100% - 30px); display: inline-block;">
                        <a href="${zillowUrl}" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           class="zillow-link"
                           title="View on Zillow"
                           style="display: inline-block; margin-left: 5px; vertical-align: middle;">
                            <i class="fas fa-external-link-alt" style="color: #006AFF;"></i>
                        </a>
                    </div>
                `;
            } else {
                // No link available, just show the input
                propertyCell = `
                    <input type="text" class="editable" value="${row.property}" 
                           onchange="updateTimeline(${row.id}, 'property', this.value)"
                           placeholder="Property address">
                `;
            }
        } else {
            // Standard property input without link
            propertyCell = `
                <input type="text" class="editable" value="${row.property}" 
                       onchange="updateTimeline(${row.id}, 'property', this.value)"
                       placeholder="Property address">
            `;
        }
        
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
            <td class="property-cell">
                ${propertyCell}
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
                       ${row.action !== 'buy' ? 'disabled' : ''}>
            </td>
            <td>
                <input type="number" class="editable number" value="${row.term}" 
                       onchange="updateTimeline(${row.id}, 'term', this.value)" 
                       min="1" max="30" step="1"
                       ${row.action !== 'buy' ? 'disabled' : ''}>
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
 * Format currency helper
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
 * Initialize enhanced timeline renderer
 */
function initializeEnhancedRenderer() {
    // Wait for original function to be available
    if (typeof window.renderTimelineTable === 'function') {
        // Store original function
        originalRenderTimelineTable = window.renderTimelineTable;
        
        // Replace with enhanced version
        window.renderTimelineTable = enhancedRenderTimelineTable;
        
        console.log('Timeline renderer enhanced with Zillow link support');
        
        // Add CSS for Zillow links
        addZillowLinkStyles();
    } else {
        // Try again in 100ms
        setTimeout(initializeEnhancedRenderer, 100);
    }
}

/**
 * Add CSS styles for Zillow links
 */
function addZillowLinkStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Property cell with link */
        .property-cell {
            position: relative;
        }
        
        .property-with-link {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .property-input {
            flex: 1;
        }
        
        /* Zillow link styling */
        .zillow-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border-radius: 4px;
            background: rgba(0, 106, 255, 0.1);
            transition: all 0.2s ease;
            text-decoration: none;
            position: relative;
        }
        
        .zillow-link:hover {
            background: rgba(0, 106, 255, 0.2);
            transform: scale(1.1);
        }
        
        .zillow-link i {
            font-size: 14px;
        }
        
        /* Tooltip on hover */
        .zillow-link::before {
            content: "View on Zillow";
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
            margin-bottom: 5px;
        }
        
        .zillow-link::after {
            content: "";
            position: absolute;
            top: -5px;
            left: 50%;
            transform: translateX(-50%);
            border: 5px solid transparent;
            border-top-color: #333;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
        }
        
        .zillow-link:hover::before,
        .zillow-link:hover::after {
            opacity: 1;
        }
        
        /* Mobile responsive */
        @media (max-width: 768px) {
            .property-with-link {
                flex-direction: row;
                gap: 8px;
            }
            
            .zillow-link {
                width: 32px;
                height: 32px;
            }
            
            .zillow-link i {
                font-size: 16px;
            }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            .zillow-link {
                background: rgba(0, 106, 255, 0.2);
            }
            
            .zillow-link:hover {
                background: rgba(0, 106, 255, 0.3);
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhancedRenderer);
} else {
    initializeEnhancedRenderer();
}

// Export for testing
window.enhancedRenderTimelineTable = enhancedRenderTimelineTable;