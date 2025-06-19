/**
 * Diagnostics for ListingsMatcher initialization
 */

// Log when this script loads
console.log('[DIAG] listings-matcher-diagnostics.js loaded');

// Check various stages of initialization
window.addEventListener('DOMContentLoaded', () => {
    console.log('[DIAG] DOMContentLoaded event fired');
    
    // Check if ListingsMatcher is available
    console.log('[DIAG] ListingsMatcher type:', typeof ListingsMatcher);
    console.log('[DIAG] window.ListingsMatcher type:', typeof window.ListingsMatcher);
    
    // Check if property API is available
    console.log('[DIAG] searchPropertiesZillow type:', typeof searchPropertiesZillow);
    console.log('[DIAG] window.propertyAPI:', window.propertyAPI);
    if (window.propertyAPI) {
        console.log('[DIAG] window.propertyAPI.searchPropertiesZillow type:', typeof window.propertyAPI.searchPropertiesZillow);
    }
    
    // Check v3State
    if (typeof window.v3State !== 'undefined') {
        console.log('[DIAG] window.v3State exists');
        console.log('[DIAG] window.v3State.listingsMatcher:', window.v3State.listingsMatcher);
    } else {
        console.log('[DIAG] window.v3State is undefined');
    }
    
    // Try to create ListingsMatcher instance
    try {
        const testMatcher = new ListingsMatcher();
        console.log('[DIAG] Successfully created ListingsMatcher instance');
        console.log('[DIAG] Instance methods:', {
            matchTimelineToListings: typeof testMatcher.matchTimelineToListings,
            getStrategyType: typeof testMatcher.getStrategyType,
            findBestMatch: typeof testMatcher.findBestMatch,
            fetchListings: typeof testMatcher.fetchListings
        });
    } catch (error) {
        console.error('[DIAG] Error creating ListingsMatcher:', error);
    }
    
    // Check for timing issues
    setTimeout(() => {
        console.log('[DIAG] After 1 second delay:');
        console.log('[DIAG] - ListingsMatcher type:', typeof ListingsMatcher);
        console.log('[DIAG] - window.v3State.listingsMatcher:', typeof window.v3State !== 'undefined' ? window.v3State.listingsMatcher : 'window.v3State undefined');
    }, 1000);
});

// Add click handler to diagnose runtime issues
document.addEventListener('click', (e) => {
    if (e.target.textContent && e.target.textContent.includes('Find Actual Listings')) {
        console.log('[DIAG] Find Actual Listings clicked');
        console.log('[DIAG] Current state:', {
            v3State: typeof window.v3State !== 'undefined' ? 'defined' : 'undefined',
            listingsMatcher: typeof window.v3State !== 'undefined' && window.v3State.listingsMatcher ? 'initialized' : 'not initialized',
            ListingsMatcherClass: typeof ListingsMatcher
        });
        
        // Try to fix it on the fly
        if (typeof window.v3State !== 'undefined' && !window.v3State.listingsMatcher && typeof ListingsMatcher !== 'undefined') {
            console.log('[DIAG] Attempting to initialize ListingsMatcher on demand...');
            window.v3State.listingsMatcher = new ListingsMatcher();
            console.log('[DIAG] ListingsMatcher initialized on demand!');
        }
    }
});