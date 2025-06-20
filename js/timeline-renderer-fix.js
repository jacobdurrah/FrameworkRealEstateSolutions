/**
 * Timeline Renderer Fix for Property Address Population
 * Ensures property addresses from real listings are properly displayed
 */

(function() {
    'use strict';
    
    // Store original renderTimelineTable if it exists
    const originalRender = window.renderTimelineTable;
    
    /**
     * Enhanced render that preserves property addresses from real listings
     */
    window.renderTimelineTable = function() {
        console.log('Enhanced renderTimelineTable called');
        
        const tbody = document.getElementById('timelineBody');
        if (!tbody) {
            console.error('Timeline body element not found');
            return;
        }
        
        tbody.innerHTML = '';
        
        // Use window.timelineData to ensure we get the global variable
        const timelineData = window.timelineData || [];
        console.log('Rendering timeline with', timelineData.length, 'events');
        
        timelineData.forEach(row => {
            const tr = document.createElement('tr');
            
            // Check if this row has real listing data
            const hasRealListing = row.realListing && row.listingUrl;
            const hasAddress = row.property && row.property.includes(':');
            
            // Debug logging
            if (row.realListing) {
                console.log(`Row ${row.id} has real listing:`, row.property, row.listingUrl);
            }
            
            // Create property cell content with Zillow link if available
            let propertyCell = '';
            
            // Ensure we have the property value to display
            const propertyValue = row.property || '';
            
            // Debug logging for property values
            if (row.id <= 5) { // Log first 5 rows for debugging
                console.log(`Row ${row.id} property value:`, propertyValue, 'hasRealListing:', hasRealListing);
            }
            
            if (hasRealListing || hasAddress) {
                // Determine the URL to use
                let zillowUrl = '';
                if (row.listingUrl) {
                    // Use the actual listing URL if available
                    zillowUrl = row.listingUrl;
                } else if (hasAddress) {
                    // Extract address and create search URL
                    const propertyParts = propertyValue.split(':');
                    const address = propertyParts[1] ? propertyParts[1].trim() : propertyValue;
                    const encodedAddress = encodeURIComponent(address);
                    zillowUrl = `https://www.zillow.com/homes/${encodedAddress}_rb/`;
                }
                
                if (zillowUrl) {
                    propertyCell = `
                        <div class="property-with-link" style="display: flex; align-items: center;">
                            <input type="text" class="editable property-input" 
                                   value="${propertyValue.replace(/"/g, '&quot;')}" 
                                   onchange="updateTimeline(${row.id}, 'property', this.value)"
                                   placeholder="Property address"
                                   style="flex: 1; margin-right: 5px;">
                            <a href="${zillowUrl}" 
                               target="_blank" 
                               rel="noopener noreferrer"
                               class="zillow-link"
                               title="View on Zillow"
                               style="display: inline-block;">
                                <i class="fas fa-external-link-alt" style="color: #006AFF;"></i>
                            </a>
                        </div>
                    `;
                } else {
                    // No link available, just show the input
                    propertyCell = `
                        <input type="text" class="editable property-input" 
                               value="${propertyValue.replace(/"/g, '&quot;')}" 
                               onchange="updateTimeline(${row.id}, 'property', this.value)"
                               placeholder="Property address">
                    `;
                }
            } else {
                // Standard property input without link
                propertyCell = `
                    <input type="text" class="editable property-input" 
                           value="${propertyValue.replace(/"/g, '&quot;')}" 
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
        
        console.log('Timeline rendering complete');
        
        // Trigger table enhancement if available
        if (window.TimelineTableManager && typeof window.TimelineTableManager.enhanceTableStructure === 'function') {
            setTimeout(() => {
                window.TimelineTableManager.enhanceTableStructure();
                window.TimelineTableManager.checkScrollPosition();
            }, 50);
        }
    };
    
    /**
     * Format currency helper
     */
    function formatCurrency(value) {
        if (typeof window.formatCurrency === 'function') {
            return window.formatCurrency(value);
        }
        
        // Fallback formatting
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value || 0);
    }
    
    // Log that the fix is loaded
    console.log('Timeline renderer fix loaded - property addresses will be preserved');
})();