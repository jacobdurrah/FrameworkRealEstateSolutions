/**
 * Listings Matcher - Matches simulated properties to real Detroit listings
 * Integrates with Portfolio Simulator V3 to replace placeholders with actual properties
 */

class ListingsMatcher {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
        this.matchedListings = new Map(); // Track used listings to avoid duplicates
    }

    /**
     * Match timeline events to real listings
     * @param {Array} timeline - Timeline events from strategy generator
     * @param {Object} assumptions - User's assumptions (price range, rent, etc.)
     * @returns {Array} Timeline with matched real listings
     */
    async matchTimelineToListings(timeline, assumptions) {
        console.log('Matching timeline to real listings...', { timeline, assumptions });
        
        // Clear previous matches for fresh search
        this.clearMatchedListings();
        
        // Filter only buy events that need matching
        const buyEvents = timeline.filter(event => 
            event.action === 'buy' && !event.realListing
        );

        if (buyEvents.length === 0) {
            return timeline; // No events to match
        }

        console.log(`Processing ${buyEvents.length} buy events...`);

        // Process each buy event
        const matchedTimeline = [...timeline];
        let matchedCount = 0;
        
        // Track property name changes for updating sell events
        const propertyNameMap = new Map();
        
        for (const event of buyEvents) {
            try {
                const listing = await this.findBestMatch(event, assumptions);
                if (listing) {
                    // Update the event in the timeline
                    const eventIndex = matchedTimeline.findIndex(e => e.id === event.id || e === event);
                    if (eventIndex !== -1) {
                        // Format property label with original name and address
                        const originalName = event.property; // e.g., "Rental 1", "Flip 2"
                        const address = listing.address || listing.streetAddress || 'Detroit Property';
                        const propertyLabel = `${originalName}: ${address}`;
                        
                        // Track the name change
                        propertyNameMap.set(originalName, propertyLabel);
                        
                        matchedTimeline[eventIndex] = {
                            ...matchedTimeline[eventIndex],
                            realListing: listing,
                            property: propertyLabel,
                            price: listing.price,
                            // Update rent based on actual property if available
                            rent: this.estimateRent(listing, assumptions),
                            listingUrl: listing.url || listing.hdpUrl,
                            image: listing.image || listing.imgSrc,
                            beds: listing.bedrooms,
                            baths: listing.bathrooms,
                            sqft: listing.livingArea
                        };
                        matchedCount++;
                    }
                }
            } catch (error) {
                console.error('Error matching listing for event:', event, error);
                // Continue with other events even if one fails
            }
        }
        
        // Update corresponding sell events with new property names
        console.log('Updating sell events with new property names...');
        matchedTimeline.forEach((event, index) => {
            if (event.action === 'sell' && propertyNameMap.has(event.property)) {
                matchedTimeline[index] = {
                    ...event,
                    property: propertyNameMap.get(event.property)
                };
                console.log(`Updated sell event property name: ${event.property} -> ${propertyNameMap.get(event.property)}`);
            }
        });
        
        console.log(`Successfully matched ${matchedCount} of ${buyEvents.length} properties`);
        return matchedTimeline;
    }

    /**
     * Find the best matching listing for a timeline event
     */
    async findBestMatch(event, assumptions) {
        console.log(`Finding best match for event:`, event);
        
        // Try multiple search attempts with expanding criteria
        const searchAttempts = [
            { priceBuffer: 0.15, requireBeds: false }, // ±15%, no bedroom requirement
            { priceBuffer: 0.20, requireBeds: false }, // ±20%, no bedroom requirement
            { priceBuffer: 0.25, requireBeds: false }, // ±25%, fallback
            { priceBuffer: 0.30, requireBeds: false }  // ±30%, last resort
        ];
        
        for (const attempt of searchAttempts) {
            // Define search criteria based on event and assumptions
            const criteria = {
                minPrice: Math.max(20000, Math.floor(event.price * (1 - attempt.priceBuffer))),
                maxPrice: Math.min(200000, Math.ceil(event.price * (1 + attempt.priceBuffer))),
                location: 'Detroit, MI', // Broad search across all Detroit
                status_type: 'ForSale',
                home_type: 'Houses',
                sort: 'Price_Low_High'
            };
            
            // Only add bedroom requirement if specified
            if (attempt.requireBeds) {
                criteria.beds_min = 2;
            }
            
            console.log(`Search attempt with criteria:`, criteria);

            // Check cache first
            const cacheKey = JSON.stringify(criteria);
            const cachedListings = this.getFromCache(cacheKey);
            
            let listings;
            if (cachedListings) {
                listings = cachedListings;
                console.log(`Using cached listings: ${listings.length} results`);
            } else {
                // Fetch from API
                listings = await this.fetchListings(criteria);
                console.log(`API returned ${listings ? listings.length : 0} listings`);
                if (listings && listings.length > 0) {
                    this.storeInCache(cacheKey, listings);
                }
            }

            if (listings && listings.length > 0) {
                // Score and rank listings
                const scoredListings = listings
                    .filter(listing => !this.matchedListings.has(listing.zpid || listing.id))
                    .map(listing => ({
                        listing,
                        score: this.calculateMatchScore(listing, event, assumptions)
                    }))
                    .sort((a, b) => b.score - a.score);

                if (scoredListings.length > 0) {
                    // Select best match
                    const bestMatch = scoredListings[0].listing;
                    console.log(`Found match: ${bestMatch.address || 'Property'} at $${bestMatch.price}`);
                    
                    // Mark as used
                    this.matchedListings.set(bestMatch.zpid || bestMatch.id, true);
                    
                    return this.formatListing(bestMatch);
                }
            }
        }
        
        console.warn('No listings found after all attempts for event:', event);
        return null;
    }

    /**
     * Calculate match score for a listing
     */
    calculateMatchScore(listing, event, assumptions) {
        let score = 100;

        // Price match (40 points max) - more lenient scoring for ±15% range
        const priceDiff = Math.abs(listing.price - event.price);
        const priceRatio = priceDiff / event.price;
        
        if (priceRatio <= 0.15) {
            // Within ±15%, minimal penalty
            score -= priceRatio * 50; // Max 7.5 points off for 15% difference
        } else {
            // Outside ±15%, steeper penalty
            score -= Math.min(40, priceRatio * 100);
        }

        // Expected rent match (30 points max)
        const estimatedRent = this.estimateRent(listing, assumptions);
        const rentDiff = Math.abs(estimatedRent - event.rent);
        const rentRatio = rentDiff / event.rent;
        score -= Math.min(30, rentRatio * 50);

        // Property quality factors (30 points)
        // Bedrooms
        if (listing.bedrooms >= 3) score += 10;
        else if (listing.bedrooms === 2) score += 5;
        
        // Bathrooms
        if (listing.bathrooms >= 2) score += 10;
        else if (listing.bathrooms >= 1) score += 5;

        // Square footage
        if (listing.livingArea >= 1200) score += 10;
        else if (listing.livingArea >= 900) score += 5;

        // Penalize if needs major rehab (based on price being very low)
        if (listing.price < 40000) score -= 20;

        return Math.max(0, score);
    }

    /**
     * Estimate rent for a property
     */
    estimateRent(listing, assumptions) {
        // Basic rent estimation based on Detroit market
        let baseRent = 800;

        // Adjust for bedrooms
        if (listing.bedrooms >= 4) baseRent += 400;
        else if (listing.bedrooms === 3) baseRent += 200;
        else if (listing.bedrooms === 2) baseRent += 0;
        else baseRent -= 200;

        // Adjust for bathrooms
        if (listing.bathrooms >= 2) baseRent += 150;

        // Adjust for size
        if (listing.livingArea) {
            if (listing.livingArea > 1500) baseRent += 200;
            else if (listing.livingArea < 800) baseRent -= 150;
        }

        // Adjust for neighborhood (would need neighborhood data)
        // For now, use price as proxy
        if (listing.price > 80000) baseRent += 200;
        else if (listing.price < 40000) baseRent -= 200;

        // Ensure within assumptions range
        const minRent = assumptions.minRent || 1000;
        const maxRent = assumptions.maxRent || 1600;
        
        return Math.min(maxRent, Math.max(minRent, baseRent));
    }

    /**
     * Fetch listings from API
     */
    async fetchListings(criteria) {
        try {
            // Check for property API in different locations
            let searchFunction = null;
            
            // First check if it's directly available
            if (typeof searchPropertiesZillow === 'function') {
                searchFunction = searchPropertiesZillow;
            }
            // Then check if it's in window.propertyAPI
            else if (window.propertyAPI && typeof window.propertyAPI.searchPropertiesZillow === 'function') {
                searchFunction = window.propertyAPI.searchPropertiesZillow;
            }
            
            if (searchFunction) {
                console.log('Calling searchPropertiesZillow with:', criteria);
                const results = await searchFunction(criteria);
                
                // Handle the response structure from the API
                if (results) {
                    // Check if results is an array or has a props property
                    if (Array.isArray(results)) {
                        return results;
                    } else if (results.props && Array.isArray(results.props)) {
                        return results.props;
                    } else if (results.results && Array.isArray(results.results)) {
                        return results.results;
                    }
                }
                
                console.warn('Unexpected API response structure:', results);
                return [];
            } else {
                console.error('Property API not available in any expected location');
                console.log('Checked: window.searchPropertiesZillow and window.propertyAPI.searchPropertiesZillow');
                return [];
            }
        } catch (error) {
            console.error('Error fetching listings:', error);
            return [];
        }
    }

    /**
     * Format listing for timeline use
     */
    formatListing(listing) {
        return {
            id: listing.zpid || listing.id,
            address: listing.address || listing.streetAddress || 'Property ' + (listing.zpid || listing.id),
            price: listing.price,
            bedrooms: listing.bedrooms || listing.beds,
            bathrooms: listing.bathrooms || listing.baths,
            livingArea: listing.livingArea || listing.sqft,
            image: listing.imgSrc || listing.image,
            url: listing.hdpUrl || listing.url || `https://www.zillow.com/homedetails/${listing.zpid}_zpid/`,
            propertyType: listing.propertyType || 'Single Family',
            yearBuilt: listing.yearBuilt,
            lotSize: listing.lotSize,
            description: listing.description || '',
            // Additional fields for analysis
            pricePerSqft: listing.livingArea ? Math.round(listing.price / listing.livingArea) : null,
            daysOnMarket: listing.daysOnMarket || listing.timeOnZillow || null,
            listingStatus: listing.listingStatus || 'For Sale'
        };
    }

    /**
     * Cache management
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    storeInCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    /**
     * Clear matched listings (for new strategy generation)
     */
    clearMatchedListings() {
        this.matchedListings.clear();
    }

    /**
     * Get summary of matched listings
     */
    getMatchingSummary(timeline) {
        const matched = timeline.filter(event => event.realListing).length;
        const total = timeline.filter(event => event.action === 'buy').length;
        
        return {
            matched,
            total,
            percentage: total > 0 ? Math.round((matched / total) * 100) : 0,
            listings: timeline
                .filter(event => event.realListing)
                .map(event => ({
                    month: event.month,
                    address: event.property,
                    price: event.price,
                    rent: event.rent,
                    url: event.listingUrl
                }))
        };
    }

    /**
     * Extract strategy type from property name
     */
    getStrategyType(propertyName) {
        if (!propertyName) return 'Property';
        
        const name = propertyName.toLowerCase();
        if (name.includes('flip')) return 'Flip';
        if (name.includes('brrr')) return 'BRRR';
        if (name.includes('rental')) return 'Rental';
        
        // Extract type from pattern like "Flip 1", "BRRR 2", etc.
        const match = propertyName.match(/^(\w+)\s+\d+/);
        if (match) return match[1];
        
        return 'Property';
    }
}

// Make available globally
window.ListingsMatcher = ListingsMatcher;