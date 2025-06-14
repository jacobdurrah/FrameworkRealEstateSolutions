// Property API Integration - Zillow RapidAPI

// Zillow RapidAPI configuration
const ZILLOW_CONFIG = {
    baseUrl: 'https://zillow-com1.p.rapidapi.com',
    headers: {
        'X-RapidAPI-Key': '', // To be filled with actual API key
        'X-RapidAPI-Host': 'zillow-com1.p.rapidapi.com'
    }
};

// Available Zillow API endpoints
const ZILLOW_ENDPOINTS = {
    propertyExtendedSearch: '/propertyExtendedSearch',
    property: '/property',
    propertyByCoordinates: '/propertyByCoordinates',
    similarSales: '/similarSales',
    rentEstimate: '/rentEstimate'
};

// Set API Key
function setApiKey(zillowKey) {
    if (zillowKey) {
        ZILLOW_CONFIG.headers['X-RapidAPI-Key'] = zillowKey;
        localStorage.setItem('zillow_configured', 'true');
        localStorage.setItem('zillow_key', btoa(zillowKey));
    } else if (zillowKey === '') {
        // Clear key
        ZILLOW_CONFIG.headers['X-RapidAPI-Key'] = '';
        localStorage.removeItem('zillow_configured');
        localStorage.removeItem('zillow_key');
    }
}

// Load saved API key on page load
function loadSavedApiKey() {
    const zillowKey = localStorage.getItem('zillow_key');
    
    if (zillowKey) {
        try {
            ZILLOW_CONFIG.headers['X-RapidAPI-Key'] = atob(zillowKey);
        } catch (e) {
            console.error('Failed to load Zillow API key');
        }
    }
}

// Check if API is configured
function isApiConfigured() {
    return localStorage.getItem('zillow_configured') === 'true' && ZILLOW_CONFIG.headers['X-RapidAPI-Key'];
}


// Search properties using Zillow RapidAPI
async function searchPropertiesZillow(params) {
    try {
        const queryParams = new URLSearchParams({
            location: params.location || 'Detroit, MI',
            status_type: params.status_type || 'ForSale',
            home_type: params.home_type || 'Houses',
            ...(params.minPrice && { minPrice: params.minPrice }),
            ...(params.maxPrice && { maxPrice: params.maxPrice }),
            ...(params.beds_min && { beds_min: params.beds_min }),
            ...(params.sqft_min && { sqft_min: params.sqft_min }),
            ...(params.sqft_max && { sqft_max: params.sqft_max }),
            ...(params.sort && { sort: params.sort })
        });
        
        const response = await fetch(`${ZILLOW_CONFIG.baseUrl}${ZILLOW_ENDPOINTS.propertyExtendedSearch}?${queryParams}`, {
            headers: ZILLOW_CONFIG.headers
        });
        
        if (!response.ok) {
            throw new Error(`Zillow API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error('Zillow API error:', error);
        throw error;
    }
}

// Search properties by coordinates and radius
async function searchPropertiesByRadius(params) {
    try {
        const queryParams = new URLSearchParams({
            lat: params.lat,
            lng: params.lng,
            radius: params.radius || '1', // radius in miles
            status_type: params.status_type || 'ForSale',
            home_type: params.home_type || 'Houses',
            ...(params.minPrice && { minPrice: params.minPrice }),
            ...(params.maxPrice && { maxPrice: params.maxPrice })
        });
        
        const response = await fetch(`${ZILLOW_CONFIG.baseUrl}${ZILLOW_ENDPOINTS.propertyByCoordinates}?${queryParams}`, {
            headers: ZILLOW_CONFIG.headers
        });
        
        if (!response.ok) {
            throw new Error(`Zillow API error: ${response.status}`);
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('Zillow radius search error:', error);
        throw error;
    }
}

// Get similar sales for property analysis
async function getSimilarSales(zpid) {
    try {
        const queryParams = new URLSearchParams({
            zpid: zpid
        });
        
        const response = await fetch(`${ZILLOW_CONFIG.baseUrl}${ZILLOW_ENDPOINTS.similarSales}?${queryParams}`, {
            headers: ZILLOW_CONFIG.headers
        });
        
        if (!response.ok) {
            throw new Error(`Zillow API error: ${response.status}`);
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('Zillow similar sales error:', error);
        throw error;
    }
}

// Get property details from Zillow
async function getPropertyDetailsZillow(zpid) {
    try {
        const queryParams = new URLSearchParams({
            zpid: zpid
        });
        
        const response = await fetch(`${ZILLOW_CONFIG.baseUrl}/property?${queryParams}`, {
            headers: ZILLOW_CONFIG.headers
        });
        
        if (!response.ok) {
            throw new Error(`Zillow API error: ${response.status}`);
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('Zillow property details error:', error);
        throw error;
    }
}

// Filter properties based on Framework's investment criteria
function filterPropertiesByCriteria(properties, searchParams) {
    if (!properties || !Array.isArray(properties)) {
        return [];
    }
    
    return properties.filter(property => {
        // Framework's criteria: $50K-$100K acquisition
        const price = property.price || property.listPrice || 0;
        if (price < 50000 || price > 100000) {
            return false;
        }
        
        // Check bedrooms if specified
        if (searchParams.minBeds) {
            const beds = property.bedrooms || 0;
            if (beds < parseInt(searchParams.minBeds)) {
                return false;
            }
        }
        
        // Check property type if specified
        if (searchParams.propertyType && property.propertyType) {
            const type = property.propertyType.toLowerCase();
            const searchType = searchParams.propertyType.toLowerCase();
            if (!type.includes(searchType.replace('-', ' '))) {
                return false;
            }
        }
        
        return true;
    });
}

// Convert Zillow property data to our display format
function formatZillowProperty(property) {
    return {
        id: property.zpid || Math.random().toString(36).substr(2, 9),
        address: property.address || property.streetAddress || property.street,
        city: property.city || 'Detroit',
        state: property.state || 'MI',
        zipCode: property.zipcode || property.zip,
        price: property.price || property.unformattedPrice || 0,
        bedrooms: property.bedrooms || property.beds || 0,
        bathrooms: property.bathrooms || property.baths || 0,
        squareFeet: property.livingArea || property.area || 0,
        sqft: property.livingArea || property.area || 0, // Alias for compatibility
        yearBuilt: property.yearBuilt || 'N/A',
        propertyType: property.homeType || property.propertyType || 'Single Family',
        lotSize: property.lotAreaValue || property.lotSize || 0,
        // Rent estimation based on bedrooms
        monthlyRent: property.rentZestimate || estimateRentByBedrooms(property.bedrooms || property.beds || 3),
        estimatedRent: property.rentZestimate || estimateRentByBedrooms(property.bedrooms || property.beds || 3),
        // Placeholder for rehab costs
        estimatedRehab: estimateRehabCost(property),
        // Additional data
        daysOnMarket: property.daysOnMarket || property.timeOnZillow || 0,
        description: property.description || '',
        images: property.imgSrc ? [property.imgSrc] : (property.image ? [property.image] : []),
        listingStatus: property.listingStatus || property.status,
        zestimate: property.zestimate,
        rentZestimate: property.rentZestimate,
        detailUrl: property.detailUrl || property.url
    };
}

// Estimate rent based on Section 8 FMR for Detroit
function estimateRentByBedrooms(bedrooms) {
    const rentLimits = {
        0: 715,
        1: 858,
        2: 1024,
        3: 1329,
        4: 1628
    };
    
    return rentLimits[bedrooms] || rentLimits[3];
}

// Basic rehab cost estimation (to be enhanced with AI)
function estimateRehabCost(property) {
    // Basic formula based on age and size
    const age = new Date().getFullYear() - (property.yearBuilt || 1950);
    const sqft = property.squareFeet || 1200;
    
    // Base cost: $5 per sqft for properties over 50 years old
    let baseCost = age > 50 ? sqft * 5 : sqft * 3;
    
    // Cap at $10,000 to meet Framework's criteria
    return Math.min(baseCost, 10000);
}

// Main search function using Zillow API
async function searchPropertiesWithAPI(searchParams) {
    // Check if API is configured
    if (!isApiConfigured()) {
        console.log('Zillow API not configured - using mock data');
        return searchProperties(searchParams); // Falls back to mock data
    }
    
    try {
        // Build Zillow search parameters
        const zillowParams = {
            location: searchParams.zipCode || 'Detroit, MI',
            minPrice: '50000',
            maxPrice: searchParams.maxPrice || '100000',
            home_type: mapPropertyType(searchParams.propertyType),
            status_type: searchParams.status_type || 'ForSale'
        };
        
        if (searchParams.minBeds) {
            zillowParams.beds_min = searchParams.minBeds;
        }
        
        const response = await searchPropertiesZillow(zillowParams);
        
        if (response && response.props) {
            // Format Zillow results
            const properties = response.props.map(formatZillowProperty);
            // Additional filtering if needed
            return properties.filter(p => p.price >= 50000 && p.price <= (searchParams.maxPrice || 100000));
        }
        
        return [];
    } catch (error) {
        console.error('Zillow search failed, using mock data:', error);
        return searchProperties(searchParams); // Falls back to mock data
    }
}

// Map property types to Zillow format
function mapPropertyType(type) {
    const typeMap = {
        'single-family': 'Houses',
        'multi-family': 'Multi-family',
        'condo': 'Condos'
    };
    return typeMap[type] || 'Houses';
}

// Initialize API on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if config.js exists and has API keys
    if (window.API_CONFIG && window.API_CONFIG.ZILLOW_API_KEY && window.API_CONFIG.ZILLOW_API_KEY !== 'your_zillow_api_key_here') {
        setApiKey(window.API_CONFIG.ZILLOW_API_KEY);
    } else {
        // Fall back to loading saved keys from localStorage
        loadSavedApiKey();
    }
});

// Export functions for use in property-finder.js
window.propertyAPI = {
    setApiKey,
    isApiConfigured,
    searchPropertiesWithAPI,
    searchPropertiesZillow,
    searchPropertiesByRadius,
    getPropertyDetailsZillow,
    getSimilarSales,
    loadSavedApiKey,
    formatZillowProperty
};