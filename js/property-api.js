// Property API Integration - Backend API

// API configuration - now using our secure backend
const API_CONFIG = {
    // Use app configuration if available, otherwise fallback
    baseUrl: window.APP_CONFIG ? 
        window.APP_CONFIG.API.getBaseUrl() : 
        (window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api'),
    headers: {
        'Content-Type': 'application/json'
    }
};

// Backend API endpoints
const API_ENDPOINTS = {
    search: '/properties/search',
    property: '/properties',
    radius: '/properties/radius',
    chatbot: '/chatbot/message'
};

// Check if backend API is available
function isApiConfigured() {
    // Always return true since we're using backend API
    return true;
}


// Search properties using our backend API
async function searchPropertiesZillow(params) {
    try {
        const response = await fetch(`${API_CONFIG.baseUrl}/properties/search`, {
            method: 'POST',
            headers: API_CONFIG.headers,
            body: JSON.stringify({
                location: params.location || 'Detroit, MI',
                status_type: params.status_type || 'ForSale',
                home_type: params.home_type || 'Houses',
                minPrice: params.minPrice,
                maxPrice: params.maxPrice,
                beds_min: params.beds_min,
                sqft_min: params.sqft_min,
                sqft_max: params.sqft_max,
                sort: params.sort
            })
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                console.error('API authentication required - Vercel protection is enabled');
                const apiStatus = document.getElementById('apiStatus');
                if (apiStatus) {
                    apiStatus.textContent = '⚠ API Protected - See Console for Fix';
                    apiStatus.className = 'api-status disconnected';
                }
                console.log('%c⚠ Vercel Authentication Enabled', 'color: orange; font-size: 16px; font-weight: bold;');
                console.log('%cTo fix this:', 'color: blue; font-size: 14px;');
                console.log('%c1. Go to https://vercel.com/dashboard', 'color: green; font-size: 12px;');
                console.log('%c2. Select your project (framework-api)', 'color: green; font-size: 12px;');
                console.log('%c3. Go to Settings → General', 'color: green; font-size: 12px;');
                console.log('%c4. Disable "Vercel Authentication" or "Deployment Protection"', 'color: green; font-size: 12px;');
                console.log('%c5. Redeploy the project', 'color: green; font-size: 12px;');
                throw new Error('API requires authentication. Using mock data instead.');
            }
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 403) {
                console.error('API rate limit exceeded');
                throw new Error(errorData.message || 'API rate limit exceeded. Using mock data instead.');
            }
            throw new Error(errorData.message || `API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error('Property search error:', error);
        throw error;
    }
}

// Search properties by coordinates and radius
async function searchPropertiesByRadius(params) {
    try {
        const response = await fetch(`${API_CONFIG.baseUrl}/properties/radius`, {
            method: 'POST',
            headers: API_CONFIG.headers,
            body: JSON.stringify({
                lat: params.lat,
                lng: params.lng,
                radius: params.radius || '1',
                status_type: params.status_type || 'ForSale',
                home_type: params.home_type || 'Houses',
                minPrice: params.minPrice,
                maxPrice: params.maxPrice
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `API error: ${response.status}`);
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('Radius search error:', error);
        throw error;
    }
}

// Get similar sales for property analysis
async function getSimilarSales(zpid) {
    try {
        const response = await fetch(`${API_CONFIG.baseUrl}/properties/${zpid}/similar`, {
            method: 'GET',
            headers: API_CONFIG.headers
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `API error: ${response.status}`);
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('Similar sales error:', error);
        throw error;
    }
}

// Get property details from backend
async function getPropertyDetailsZillow(zpid) {
    try {
        const response = await fetch(`${API_CONFIG.baseUrl}/properties/${zpid}`, {
            method: 'GET',
            headers: API_CONFIG.headers
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `API error: ${response.status}`);
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('Property details error:', error);
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
        // Show user-friendly message
        const apiStatus = document.getElementById('apiStatus');
        if (apiStatus) {
            apiStatus.textContent = '⚠ API Limit Reached - Using Demo Data';
            apiStatus.className = 'api-status disconnected';
        }
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

// Export functions for use in property-finder.js
window.propertyAPI = {
    isApiConfigured,
    searchPropertiesWithAPI,
    searchPropertiesZillow,
    searchPropertiesByRadius,
    getPropertyDetailsZillow,
    getSimilarSales,
    formatZillowProperty
};