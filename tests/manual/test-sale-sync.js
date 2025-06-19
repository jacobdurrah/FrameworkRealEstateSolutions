// Manual test for sale event sync
console.log('Testing sale event property name sync...');

// Create test timeline with buy/sell pairs
const testTimeline = [
    {
        id: 1,
        month: 0,
        action: 'buy',
        property: 'Flip 1',
        price: 50000
    },
    {
        id: 2,
        month: 6,
        action: 'sell',
        property: 'Flip 1',
        price: 80000
    },
    {
        id: 3,
        month: 1,
        action: 'buy',
        property: 'Rental 1',
        price: 60000
    }
];

// Mock assumptions
const assumptions = {
    avgMonthlyRent: 1300,
    monthlyExpenses: 350
};

// Create a test instance
if (typeof ListingsMatcher \!== 'undefined') {
    const matcher = new ListingsMatcher();
    
    // Override findBestMatch to return mock data
    matcher.findBestMatch = async function(event) {
        return {
            address: '123 Test St',
            price: event.price + 5000,
            bedrooms: 3,
            bathrooms: 2,
            livingArea: 1200
        };
    };
    
    // Test the matching
    matcher.matchTimelineToListings(testTimeline, assumptions).then(result => {
        console.log('Test Results:');
        result.forEach(event => {
            console.log(`${event.action} - ${event.property}`);
        });
        
        // Check if sell event was updated
        const sellEvent = result.find(e => e.action === 'sell');
        if (sellEvent && sellEvent.property.includes(':')) {
            console.log('✅ SUCCESS: Sell event property name was synced\!');
        } else {
            console.log('❌ FAILED: Sell event property name was not synced');
            console.log('Sell event:', sellEvent);
        }
    });
} else {
    console.error('ListingsMatcher not available');
}
EOF < /dev/null