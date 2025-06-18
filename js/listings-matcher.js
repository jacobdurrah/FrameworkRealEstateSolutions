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
        
        // Filter only buy events that need matching
        const buyEvents = timeline.filter(event => 
            event.action === 'buy' && !event.realListing
        );

        if (buyEvents.length === 0) {
            return timeline; // No events to match
        }

        // Process each buy event
        const matchedTimeline = [...timeline];
        
        for (const event of buyEvents) {
            try {
                const listing = await this.findBestMatch(event, assumptions);
                if (listing) {
                    // Update the event in the timeline
                    const eventIndex = matchedTimeline.findIndex(e => e.id === event.id || e === event);
                    if (eventIndex !== -1) {
                        matchedTimeline[eventIndex] = {
                            ...matchedTimeline[eventIndex],
                            realListing: listing,
                            property: listing.address || listing.streetAddress,
                            price: listing.price,
                            // Update rent based on actual property if available
                            rent: this.estimateRent(listing, assumptions),
                            listingUrl: listing.url || listing.hdpUrl,
                            image: listing.image || listing.imgSrc,
                            beds: listing.bedrooms,
                            baths: listing.bathrooms,
                            sqft: listing.livingArea
                        };
                    }
                }
            } catch (error) {
                console.error('Error matching listing for event:', event, error);
                // Continue with other events even if one fails
            }
        }

        return matchedTimeline;
    }

    /**
     * Find the best matching listing for a timeline event
     */
    async findBestMatch(event, assumptions) {
        // Define search criteria based on event and assumptions
        const criteria = {
            minPrice: Math.max(30000, event.price * 0.8), // 20% below target
            maxPrice: Math.min(150000, event.price * 1.2), // 20% above target
            location: 'Detroit, MI',
            status_type: 'ForSale',
            home_type: 'Houses',
            beds_min: 2, // Minimum for rental viability
            sort: 'Price_Low_High'
        };

        // Check cache first
        const cacheKey = JSON.stringify(criteria);
        const cachedListings = this.getFromCache(cacheKey);
        
        let listings;
        if (cachedListings) {
            listings = cachedListings;
        } else {
            // Fetch from API
            listings = await this.fetchListings(criteria);
            if (listings && listings.length > 0) {
                this.storeInCache(cacheKey, listings);
            }
        }

        if (!listings || listings.length === 0) {
            console.warn('No listings found for criteria:', criteria);
            return null;
        }

        // Score and rank listings
        const scoredListings = listings
            .filter(listing => !this.matchedListings.has(listing.zpid || listing.id))
            .map(listing => ({
                listing,
                score: this.calculateMatchScore(listing, event, assumptions)
            }))
            .sort((a, b) => b.score - a.score);

        if (scoredListings.length === 0) {
            return null;
        }

        // Select best match
        const bestMatch = scoredListings[0].listing;
        
        // Mark as used
        this.matchedListings.set(bestMatch.zpid || bestMatch.id, true);
        
        return this.formatListing(bestMatch);
    }

    /**
     * Calculate match score for a listing
     */
    calculateMatchScore(listing, event, assumptions) {
        let score = 100;

        // Price match (40 points max)
        const priceDiff = Math.abs(listing.price - event.price);
        const priceRatio = priceDiff / event.price;
        score -= Math.min(40, priceRatio * 100);

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
            // Use the existing property API
            if (typeof searchPropertiesZillow === 'function') {
                const results = await searchPropertiesZillow(criteria);
                return results;
            } else {
                console.error('Property API not available');
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
}

// Make available globally
window.ListingsMatcher = ListingsMatcher;