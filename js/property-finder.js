// Property Finder JavaScript

// Store for pre-loaded parcel data
let preloadedParcelData = {};

// Mock property data for demonstration
// Based on real Detroit investment properties
const mockProperties = [
    {
        id: 1,
        address: '442 CHANDLER',
        city: 'Detroit',
        state: 'MI',
        zip: '48202',
        price: 68500,
        bedrooms: 3,
        bathrooms: 1,
        sqft: 2514,
        yearBuilt: 1912,
        propertyType: 'single-family',
        estimatedRehab: 8000,
        monthlyRent: 1329,
        description: 'Single family home with original hardwood floors, needs kitchen update. Great rental potential in North End neighborhood.',
        images: ['https://photos.zillowstatic.com/fp/demo1.jpg']
    },
    {
        id: 2,
        address: '444 HORTON',
        city: 'Detroit',
        state: 'MI',
        zip: '48202',
        price: 52000,
        bedrooms: 3,
        bathrooms: 1,
        sqft: 1700,
        yearBuilt: 1905,
        propertyType: 'single-family',
        estimatedRehab: 9500,
        monthlyRent: 1329,
        description: 'Solid investment property in Lower North End. Needs cosmetic updates but structurally sound.',
        images: ['https://photos.zillowstatic.com/fp/demo2.jpg']
    },
    {
        id: 3,
        address: '420 E FERRY',
        city: 'Detroit',
        state: 'MI',
        zip: '48202',
        price: 75000,
        bedrooms: 3,
        bathrooms: 2,
        sqft: 3920,
        yearBuilt: 1917,
        propertyType: 'single-family',
        estimatedRehab: 7500,
        monthlyRent: 1329,
        description: 'Two family flat in Cultural Center area. Great investment opportunity with rental income potential.',
        images: ['https://photos.zillowstatic.com/fp/demo3.jpg']
    },
    {
        id: 4,
        address: '246 E EUCLID',
        city: 'Detroit',
        state: 'MI',
        zip: '48202',
        price: 59900,
        bedrooms: 2,
        bathrooms: 1,
        sqft: 1542,
        yearBuilt: 1916,
        propertyType: 'single-family',
        estimatedRehab: 6500,
        monthlyRent: 1024,
        description: 'Single family home in Upper North End. Perfect for Section 8 rental program.',
        images: ['https://photos.zillowstatic.com/fp/demo4.jpg']
    },
    {
        id: 5,
        address: '235 MELBOURNE',
        city: 'Detroit',
        state: 'MI',
        zip: '48202',
        price: 82000,
        bedrooms: 4,
        bathrooms: 1.5,
        sqft: 1602,
        yearBuilt: 1918,
        propertyType: 'single-family',
        estimatedRehab: 10000,
        monthlyRent: 1628,
        description: 'Spacious 4-bedroom in Upper North End. Great bones, needs updating. High rental demand area.',
        images: ['https://photos.zillowstatic.com/fp/demo5.jpg']
    },
    {
        id: 6,
        address: '231 CHANDLER',
        city: 'Detroit',
        state: 'MI',
        zip: '48202',
        price: 95000,
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1749,
        yearBuilt: 1914,
        propertyType: 'single-family',
        estimatedRehab: 5000,
        monthlyRent: 1329,
        description: 'Charming home in Lower North End. Well-maintained with original features. Just needs cosmetic work.',
        images: ['https://photos.zillowstatic.com/fp/demo6.jpg']
    }
];

// Property search form handler
document.getElementById('propertySearchForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form values
    const formData = new FormData(this);
    const searchCriteria = {
        zipCode: formData.get('zipCode'),
        maxPrice: parseInt(formData.get('maxPrice')) || 100000,
        minBeds: parseInt(formData.get('minBeds')) || 0,
        propertyType: formData.get('propertyType')
    };
    
    // Show loading state
    showLoading();
    
    try {
        // Check if API is available
        if (window.propertyAPI && window.propertyAPI.isApiConfigured()) {
            // Use real API
            const results = await window.propertyAPI.searchPropertiesWithAPI(searchCriteria);
            displayResults(results);
        } else {
            // Fall back to mock data
            setTimeout(() => {
                const results = searchProperties(searchCriteria);
                displayResults(results);
            }, 1000);
        }
    } catch (error) {
        console.error('Search error:', error);
        // Fall back to mock data on error
        const results = searchProperties(searchCriteria);
        displayResults(results);
    }
});

// Pre-load parcel data for mock properties
async function preloadParcelData() {
    console.group('preloadParcelData function');
    console.log('APP_CONFIG exists:', !!window.APP_CONFIG);
    console.log('ENABLE_PARCEL_DATA:', window.APP_CONFIG?.FEATURES?.ENABLE_PARCEL_DATA);
    console.log('parcelAPIService exists:', !!window.parcelAPIService);
    console.log('parcelAPIService.isReady():', window.parcelAPIService?.isReady());
    
    if (window.APP_CONFIG && window.APP_CONFIG.FEATURES.ENABLE_PARCEL_DATA && 
        window.parcelAPIService && window.parcelAPIService.isReady()) {
        
        const addresses = mockProperties.map(p => p.address);
        console.log('Pre-loading parcel data for addresses:', addresses);
        
        try {
            preloadedParcelData = await window.parcelAPIService.batchLoadParcels(addresses);
            console.log('Pre-loaded parcel data successfully:');
            console.log('- Number of properties:', Object.keys(preloadedParcelData).length);
            console.log('- Keys:', Object.keys(preloadedParcelData));
            
            // Log sample data
            const firstKey = Object.keys(preloadedParcelData)[0];
            if (firstKey) {
                console.log('Sample data for', firstKey + ':', preloadedParcelData[firstKey]);
            }
        } catch (error) {
            console.error('Error pre-loading parcel data:', error);
        }
    } else {
        console.log('Skipping parcel data preload - conditions not met');
    }
    console.groupEnd();
}

// Search properties based on criteria
function searchProperties(criteria) {
    return mockProperties.filter(property => {
        // Check if property meets Framework's criteria
        const totalInvestment = property.price + property.estimatedRehab;
        const meetsFrameworkCriteria = 
            property.price >= 50000 && 
            property.price <= 100000 && 
            property.estimatedRehab <= 10000;
        
        // Apply user search filters
        const meetsSearchCriteria =
            (!criteria.zipCode || property.zip.includes(criteria.zipCode)) &&
            property.price <= criteria.maxPrice &&
            property.bedrooms >= criteria.minBeds &&
            property.propertyType === criteria.propertyType;
        
        return meetsFrameworkCriteria && meetsSearchCriteria;
    });
}

// Display search results
function displayResults(properties) {
    const resultsSection = document.getElementById('resultsSection');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultCount = document.getElementById('resultCount');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    // Store for potential refresh
    window.lastSearchResults = properties;
    
    // Hide loading spinner
    loadingSpinner.style.display = 'none';
    
    // Update result count
    resultCount.textContent = properties.length;
    
    // Clear previous results
    resultsContainer.innerHTML = '';
    
    // Show results section
    resultsSection.style.display = 'block';
    
    if (properties.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <p>No properties found matching your criteria.</p>
                <p>Try adjusting your search parameters.</p>
            </div>
        `;
        return;
    }
    
    // Display each property
    properties.forEach(property => {
        const propertyCard = createPropertyCard(property);
        resultsContainer.appendChild(propertyCard);
    });
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Create property card element
function createPropertyCard(property) {
    const totalInvestment = property.price + property.estimatedRehab;
    const monthlyRent = property.monthlyRent || property.estimatedRent || property.rentZestimate || 1329;
    const annualRent = monthlyRent * 12;
    const estimatedROI = ((annualRent - (totalInvestment * 0.1)) / totalInvestment * 100).toFixed(1);
    const cashFlow = monthlyRent - (totalInvestment * 0.006); // Rough estimate
    
    // Get pre-loaded parcel data
    const parcelInfo = preloadedParcelData[property.address] || null;
    
    // Enhanced debug logging
    console.group(`Creating card for ${property.address}`);
    console.log('Property object:', property);
    console.log('Preloaded parcel data keys:', Object.keys(preloadedParcelData));
    console.log('Parcel info found:', parcelInfo ? 'YES' : 'NO');
    if (parcelInfo) {
        console.log('Parcel data:', parcelInfo);
        console.log('Owner:', parcelInfo.owner.fullName);
        console.log('Neighborhood:', parcelInfo.neighborhood);
        console.log('Parcel ID:', parcelInfo.parcelId);
    }
    console.groupEnd();
    
    const card = document.createElement('div');
    card.className = 'property-result-card';
    
    // Handle image display
    let imageContent = '<span>Photo Coming Soon</span>';
    if (property.images && property.images.length > 0) {
        imageContent = `<img src="${property.images[0]}" alt="${property.address}" style="width: 100%; height: 100%; object-fit: cover;">`;
    }
    
    // Handle property info display
    const sqft = property.squareFeet || property.sqft || 'N/A';
    
    card.innerHTML = `
        <div class="property-result-image">
            ${imageContent}
        </div>
        <div class="property-result-details">
            <h4 class="property-result-address">
                ${property.address}
                ${parcelInfo && parcelInfo.neighborhood ? 
                    `<span class="property-neighborhood">${parcelInfo.neighborhood}</span>` : ''}
            </h4>
            <p class="property-result-price">$${property.price.toLocaleString()}</p>
            ${parcelInfo ? `
            <div class="property-owner-info">
                <span class="owner-label">Owner:</span>
                <span class="owner-name">${parcelInfo.owner.fullName || 'Unknown'}</span>
            </div>
            <div class="property-parcel-info">
                <span class="parcel-label">Parcel ID:</span>
                <span class="parcel-id">${parcelInfo.parcelId || 'N/A'}</span>
            </div>
            ` : ''}
            <div class="property-result-info">
                <span>${property.bedrooms} bed</span>
                <span>${property.bathrooms} bath</span>
                <span>${sqft} sqft</span>
                <span>Built ${property.yearBuilt}</span>
                ${parcelInfo ? `<span>Assessed: $${(parcelInfo.assessedValue || 0).toLocaleString()}</span>` : ''}
            </div>
            <div class="property-result-analysis">
                <div class="analysis-item">
                    <span class="analysis-label">Est. Rehab:</span>
                    <span class="analysis-value">$${property.estimatedRehab.toLocaleString()}</span>
                </div>
                <div class="analysis-item">
                    <span class="analysis-label">Total Investment:</span>
                    <span class="analysis-value">$${totalInvestment.toLocaleString()}</span>
                </div>
                <div class="analysis-item">
                    <span class="analysis-label">Potential Rent:</span>
                    <span class="analysis-value">$${monthlyRent}/mo</span>
                </div>
                <div class="analysis-item">
                    <span class="analysis-label">Est. ROI:</span>
                    <span class="analysis-value">${estimatedROI}%</span>
                </div>
            </div>
            ${property.description ? `<p style="margin-bottom: var(--spacing-md); font-size: 0.875rem; color: var(--dark-gray);">
                ${property.description}
            </p>` : ''}
            ${property.zestimate ? `<p style="margin-bottom: var(--spacing-md); font-size: 0.875rem; color: var(--dark-gray);">
                Zestimate: $${property.zestimate.toLocaleString()}
            </p>` : ''}
            <div class="property-result-actions">
                <button class="btn btn-primary" onclick="analyzeProperty(${JSON.stringify(property).replace(/"/g, '&quot;')})">
                    📊 Analyze
                </button>
                ${parcelInfo ? `
                <button class="btn btn-outline" onclick="viewPropertyDetails('${property.address}')">
                    📋 Details
                </button>
                <button class="btn btn-outline" onclick="searchByOwner('${parcelInfo.owner.fullName}')">
                    👤 Owner Portfolio
                </button>
                <button class="btn btn-outline" onclick="searchByMailingAddress('${parcelInfo.owner.fullMailingAddress}')">
                    📍 Address Search
                </button>
                ` : `
                <button class="btn btn-outline" onclick="contactAboutProperty('${property.address}')">
                    📧 Inquire
                </button>
                `}
            </div>
        </div>
    `;
    
    return card;
}

// Show loading state
function showLoading() {
    const resultsSection = document.getElementById('resultsSection');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultsContainer = document.getElementById('resultsContainer');
    
    resultsSection.style.display = 'block';
    loadingSpinner.style.display = 'block';
    resultsContainer.innerHTML = '';
    
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Analyze property in detail
function analyzeProperty(property) {
    if (property) {
        openProforma(property);
    }
}

// Contact about specific property
function contactAboutProperty(address) {
    const message = `I'm interested in the property at ${address}. Please provide more information about this investment opportunity.`;
    const whatsappUrl = `https://wa.me/+13134517107?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// ROI Calculator
document.getElementById('roiCalculator')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const purchasePrice = parseFloat(document.getElementById('purchasePrice').value) || 0;
    const rehabCost = parseFloat(document.getElementById('rehabCost').value) || 0;
    const monthlyRent = parseFloat(document.getElementById('monthlyRent').value) || 0;
    
    if (purchasePrice && monthlyRent) {
        const totalInvestment = purchasePrice + rehabCost;
        const annualRent = monthlyRent * 12;
        const annualExpenses = totalInvestment * 0.1; // Rough estimate for taxes, insurance, etc.
        const annualProfit = annualRent - annualExpenses;
        const roi = (annualProfit / totalInvestment * 100).toFixed(1);
        const monthlyCashFlow = (annualProfit / 12).toFixed(0);
        
        document.getElementById('roiPercent').textContent = `${roi}%`;
        document.getElementById('cashFlow').textContent = `$${monthlyCashFlow}`;
        document.getElementById('roiResult').style.display = 'block';
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    console.group('DOMContentLoaded - Property Finder Initialization');
    console.log('Page URL:', window.location.href);
    console.log('Script loaded at:', new Date().toISOString());
    
    // Set default max price
    const maxPriceInput = document.getElementById('maxPrice');
    if (maxPriceInput && !maxPriceInput.value) {
        maxPriceInput.value = '100000';
    }
    
    // Initialize parcel API service if enabled
    console.log('Checking parcel data configuration...');
    console.log('APP_CONFIG:', window.APP_CONFIG);
    console.log('ENABLE_PARCEL_DATA:', window.APP_CONFIG?.FEATURES?.ENABLE_PARCEL_DATA);
    
    if (window.APP_CONFIG && window.APP_CONFIG.FEATURES.ENABLE_PARCEL_DATA) {
        console.log('Parcel data is enabled, waiting for service...');
        
        // Wait a bit for the service to be available
        let retries = 0;
        while (!window.parcelAPIService && retries < 10) {
            console.log(`Waiting for parcelAPIService... retry ${retries + 1}/10`);
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }
        
        if (window.parcelAPIService) {
            console.log('parcelAPIService found!');
            console.log('Service ready:', window.parcelAPIService.isReady());
            console.log('Service initialized:', window.parcelAPIService.initialized);
            console.log('Service client:', !!window.parcelAPIService.client);
            
            if (!window.parcelAPIService.isReady()) {
                console.log('Initializing parcel service...');
                const success = await window.parcelAPIService.init(
                    window.APP_CONFIG.SUPABASE_URL,
                    window.APP_CONFIG.SUPABASE_ANON_KEY
                );
                console.log('Initialization result:', success);
                if (success) {
                    console.log('Parcel API service initialized successfully');
                } else {
                    console.error('Failed to initialize parcel API service');
                }
            }
            
            // Pre-load parcel data for mock properties
            console.log('Starting parcel data preload...');
            await preloadParcelData();
            
            // Test some lookups
            console.group('Testing parcel lookups');
            const testAddresses = ['442 CHANDLER', '444 HORTON', '420 E FERRY'];
            for (const addr of testAddresses) {
                const data = preloadedParcelData[addr];
                if (data) {
                    console.log(`✓ ${addr}:`, data.owner.fullName, '-', data.neighborhood);
                } else {
                    console.log(`✗ ${addr}: No data found`);
                }
            }
            console.groupEnd();
            
            // If we have an active search, refresh it to show parcel data
            const resultsContainer = document.getElementById('resultsContainer');
            console.log('Results container exists:', !!resultsContainer);
            console.log('Results container has children:', resultsContainer?.children.length || 0);
            
            if (resultsContainer && resultsContainer.children.length > 0) {
                console.log('Refreshing search results with parcel data...');
                const currentResults = window.lastSearchResults || mockProperties.slice(0, 6);
                displayResults(currentResults);
            }
        } else {
            console.warn('Parcel API service not available after waiting');
        }
    } else {
        console.log('Parcel data feature is disabled');
    }
    
    console.groupEnd();
});

// Store last search results for refresh
window.lastSearchResults = null;

// View detailed property information
async function viewPropertyDetails(address) {
    if (!window.parcelAPIService || !window.parcelAPIService.isReady()) {
        alert('Property details service not available');
        return;
    }
    
    // Show loading state
    const modal = document.getElementById('propertyDetailsModal');
    if (!modal) {
        createPropertyDetailsModal();
    }
    
    document.getElementById('propertyDetailsContent').innerHTML = '<div style="text-align: center; padding: 40px;">Loading property details...</div>';
    document.getElementById('propertyDetailsModal').style.display = 'block';
    
    try {
        const parcelInfo = await window.parcelAPIService.getParcelByAddress(address);
        if (!parcelInfo) {
            document.getElementById('propertyDetailsContent').innerHTML = '<div style="text-align: center; padding: 40px;">Property details not found</div>';
            return;
        }
        
        openPropertyDetailsModal(parcelInfo);
    } catch (error) {
        console.error('Error loading property details:', error);
        document.getElementById('propertyDetailsContent').innerHTML = '<div style="text-align: center; padding: 40px;">Error loading property details</div>';
    }
}

// Open property details modal
function openPropertyDetailsModal(parcelInfo) {
    const modal = document.getElementById('propertyDetailsModal');
    if (!modal) {
        createPropertyDetailsModal();
    }
    
    // Populate modal with property data
    const detailsContent = document.getElementById('propertyDetailsContent');
    detailsContent.innerHTML = `
        <h3>${parcelInfo.address}</h3>
        <div class="details-section">
            <h4>Property Information</h4>
            <div class="detail-row">
                <span class="detail-label">Parcel ID:</span>
                <span class="detail-value">${parcelInfo.parcelId || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Neighborhood:</span>
                <span class="detail-value">${parcelInfo.neighborhood || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Property Class:</span>
                <span class="detail-value">${parcelInfo.propertyClass || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Year Built:</span>
                <span class="detail-value">${parcelInfo.yearBuilt || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Building Style:</span>
                <span class="detail-value">${parcelInfo.buildingStyle || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Total Floor Area:</span>
                <span class="detail-value">${parcelInfo.totalFloorArea || 'N/A'} sq ft</span>
            </div>
        </div>
        
        <div class="details-section">
            <h4>Owner Information</h4>
            <div class="detail-row">
                <span class="detail-label">Owner:</span>
                <span class="detail-value">${parcelInfo.owner.fullName || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Mailing Address:</span>
                <span class="detail-value">${parcelInfo.owner.fullMailingAddress || 'N/A'}</span>
            </div>
            <div class="owner-actions">
                <button class="btn btn-outline" onclick="searchByOwner('${parcelInfo.owner.fullName}')">
                    🔍 Find Other Properties by Owner
                </button>
                <button class="btn btn-outline" onclick="searchByMailingAddress('${parcelInfo.owner.fullMailingAddress}')">
                    📍 Find Properties at Mailing Address
                </button>
            </div>
        </div>
        
        <div class="details-section">
            <h4>Tax Assessment</h4>
            <div class="detail-row">
                <span class="detail-label">Assessed Value:</span>
                <span class="detail-value">$${parcelInfo.assessedValue.toLocaleString()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Taxable Value:</span>
                <span class="detail-value">$${parcelInfo.taxableValue.toLocaleString()}</span>
            </div>
        </div>
        
        <div class="details-section">
            <h4>Last Sale</h4>
            <div class="detail-row">
                <span class="detail-label">Sale Date:</span>
                <span class="detail-value">${parcelInfo.lastSale.date || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Sale Price:</span>
                <span class="detail-value">${parcelInfo.lastSale.price ? '$' + parcelInfo.lastSale.price.toLocaleString() : 'N/A'}</span>
            </div>
        </div>
        
        <div class="details-section">
            <h4>Lot Information</h4>
            <div class="detail-row">
                <span class="detail-label">Frontage:</span>
                <span class="detail-value">${parcelInfo.lotSize.frontage || 'N/A'} ft</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Depth:</span>
                <span class="detail-value">${parcelInfo.lotSize.depth || 'N/A'} ft</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Total Acreage:</span>
                <span class="detail-value">${parcelInfo.totalAcreage || 'N/A'} acres</span>
            </div>
        </div>
        
        <div class="details-section">
            <h4>Location Details</h4>
            <div class="detail-row">
                <span class="detail-label">Ward:</span>
                <span class="detail-value">${parcelInfo.ward || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Council District:</span>
                <span class="detail-value">${parcelInfo.councilDistrict || 'N/A'}</span>
            </div>
        </div>
    `;
    
    document.getElementById('propertyDetailsModal').style.display = 'block';
}

// Create property details modal if it doesn't exist
function createPropertyDetailsModal() {
    const modalHTML = `
        <div id="propertyDetailsModal" class="modal">
            <div class="modal-content property-details-modal">
                <span class="close" onclick="closePropertyDetailsModal()">&times;</span>
                <h2>Property Details</h2>
                <div id="propertyDetailsContent"></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close property details modal
function closePropertyDetailsModal() {
    document.getElementById('propertyDetailsModal').style.display = 'none';
}

// Search for properties by owner
async function searchByOwner(ownerName) {
    if (!window.parcelAPIService || !window.parcelAPIService.isReady()) {
        alert('Property search service not available');
        return;
    }
    
    // Show loading state
    showLoading();
    
    try {
        const properties = await window.parcelAPIService.searchByOwner(ownerName);
        displayOwnerResults(properties, `Properties owned by ${ownerName}`);
    } catch (error) {
        console.error('Error searching by owner:', error);
        alert('Error searching for properties');
    }
}

// Search for properties by mailing address
async function searchByMailingAddress(mailingAddress) {
    if (!window.parcelAPIService || !window.parcelAPIService.isReady()) {
        alert('Property search service not available');
        return;
    }
    
    // Show loading state
    showLoading();
    
    try {
        const properties = await window.parcelAPIService.searchByMailingAddress(mailingAddress);
        displayOwnerResults(properties, `Properties with mailing address: ${mailingAddress}`);
    } catch (error) {
        console.error('Error searching by mailing address:', error);
        alert('Error searching for properties');
    }
}

// Display owner search results
function displayOwnerResults(properties, title) {
    closePropertyDetailsModal();
    
    // Show results section
    const resultsSection = document.getElementById('resultsSection');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultCount = document.getElementById('resultCount');
    
    resultCount.textContent = properties.length;
    resultsContainer.innerHTML = `<h3 style="width: 100%; margin-bottom: 20px;">${title}</h3>`;
    
    if (properties.length === 0) {
        resultsContainer.innerHTML += `
            <div class="no-results">
                <p>No other properties found.</p>
            </div>
        `;
    } else {
        properties.forEach(parcel => {
            // Create simplified property object for display
            const property = {
                address: parcel.address,
                city: 'Detroit',
                state: 'MI',
                zip: parcel.zipCode,
                price: parcel.assessedValue || 0,
                yearBuilt: parcel.yearBuilt,
                propertyType: 'single-family',
                estimatedRehab: 8000,
                bedrooms: 3,
                bathrooms: 1,
                sqft: parcel.totalFloorArea || 1200
            };
            
            const card = createPropertyCard(property);
            resultsContainer.appendChild(card);
        });
    }
    
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Test function to verify parcel data
async function testParcelData() {
    console.log('=== Testing Parcel Data Integration ===');
    
    if (!window.parcelAPIService || !window.parcelAPIService.isReady()) {
        console.log('❌ Parcel API service not ready');
        return;
    }
    
    // Test addresses from our mock properties
    const testCases = [
        { address: '442 CHANDLER', expected: 'GLOVER, RONALD L' },
        { address: '444 HORTON', expected: 'FEDER,FEDER HOSKING LIVING T et al' },
        { address: '420 E FERRY', expected: 'MAUSI, SHAHIDA A' },
        { address: '246 E EUCLID', expected: 'REID, LILLIE MAY' },
        { address: '235 MELBOURNE', expected: 'PERRY, FREDA L' },
        { address: '231 CHANDLER', expected: 'MAISON DETROIT LLC' }
    ];
    
    console.log('Testing individual lookups...');
    for (const test of testCases) {
        try {
            const data = await window.parcelAPIService.getParcelByAddress(test.address);
            if (data) {
                console.log(`✓ ${test.address}: Found owner "${data.owner.fullName}" in ${data.neighborhood}`);
            } else {
                console.log(`✗ ${test.address}: No data found`);
            }
        } catch (error) {
            console.log(`✗ ${test.address}: Error - ${error.message}`);
        }
    }
    
    console.log('\nTesting batch load...');
    const addresses = testCases.map(t => t.address);
    const batchData = await window.parcelAPIService.batchLoadParcels(addresses);
    console.log(`Batch loaded ${Object.keys(batchData).length} of ${addresses.length} properties`);
    
    console.log('=== Test Complete ===');
}

// Export functions for chatbot
window.displayResults = displayResults;
window.searchProperties = searchProperties;
window.viewPropertyDetails = viewPropertyDetails;
window.searchByOwner = searchByOwner;
window.searchByMailingAddress = searchByMailingAddress;
window.testParcelData = testParcelData;

// Proforma Analysis Functions
let proformaCalculator = null;
let currentProperty = null;

// Open proforma modal
function openProforma(property) {
    currentProperty = property;
    
    // Initialize calculator if not already done
    if (!proformaCalculator) {
        proformaCalculator = new ProformaCalculator();
        initializeProformaListeners();
    }
    
    // Load property data
    proformaCalculator.loadProperty(property);
    
    // Update UI with property info
    document.getElementById('proformaAddress').textContent = 
        `${property.address}, ${property.city}, ${property.state} ${property.zip || property.zipCode || ''}`;
    
    // Update all fields
    updateProformaUI();
    
    // Show modal
    document.getElementById('proformaModal').classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

// Close proforma modal
function closeProforma() {
    document.getElementById('proformaModal').classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}

// Initialize proforma input listeners
function initializeProformaListeners() {
    // Get all proforma inputs
    const inputs = document.querySelectorAll('.proforma-input');
    
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            const field = this.id;
            const value = this.value;
            proformaCalculator.updateField(field, value);
            updateProformaUI();
        });
    });
    
    // Close modal when clicking outside
    document.getElementById('proformaModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeProforma();
        }
    });
}

// Update all UI elements with calculated values
function updateProformaUI() {
    const results = proformaCalculator.results;
    const calc = proformaCalculator;
    
    // Update metrics dashboard
    updateMetric('metricCashOnCash', results.cashOnCash, '%', 'cashOnCash');
    updateMetric('metricCapRate', results.capRate, '%', 'capRate');
    updateMetric('metricDSCR', results.dscr, '', 'dscr', 2);
    updateMetric('metricCashFlow', results.monthlyCashFlow, '$', 'monthlyCashFlow');
    updateMetric('metricROI', results.totalROI, '%', 'totalROI');
    updateMetric('metricGRM', results.grossRentMultiplier, '', 'grossRentMultiplier', 1);
    
    // Update summary values
    updateValue('totalInvestment', results.totalInvestment);
    updateValue('downPaymentAmount', results.downPayment);
    updateValue('loanAmount', results.loanAmount);
    updateValue('monthlyPayment', results.monthlyPayment);
    updateValue('totalCashNeeded', results.totalCashNeeded);
    
    // Update income values
    updateValue('grossMonthlyIncome', results.grossMonthlyIncome);
    updateValue('vacancyLoss', -results.vacancyLoss);
    updateValue('effectiveMonthlyIncome', results.effectiveMonthlyIncome);
    
    // Update expense values
    updateValue('propertyManagementAmount', results.propertyManagement);
    updateValue('maintenanceAmount', results.maintenance);
    updateValue('reservesAmount', results.reserves);
    updateValue('totalMonthlyExpenses', results.totalMonthlyExpenses);
    
    // Update cash flow analysis
    updateValue('cfEffectiveIncome', results.effectiveMonthlyIncome);
    updateValue('cfOperatingExpenses', -results.totalMonthlyExpenses);
    updateValue('monthlyNOI', results.monthlyNOI);
    updateValue('cfDebtService', -results.monthlyPayment);
    updateValue('cfMonthlyCashFlow', results.monthlyCashFlow);
    updateValue('annualCashFlow', results.annualCashFlow);
    
    // Update 5-year projection
    updateHoldProjection(results.fiveYearProjection);
    
    // Update metric explanations
    updateMetricExplanations();
}

// Update a metric display
function updateMetric(elementId, value, suffix, metricType, decimals = 1) {
    const valueElement = document.getElementById(elementId);
    const statusElement = document.getElementById(`status${elementId.replace('metric', '')}`);
    
    if (suffix === '$') {
        valueElement.textContent = proformaCalculator.formatCurrency(value);
    } else if (suffix === '%') {
        valueElement.textContent = proformaCalculator.formatPercent(value, decimals);
    } else {
        valueElement.textContent = value.toFixed(decimals);
    }
    
    // Update status
    const rating = proformaCalculator.getMetricRating(metricType, value);
    statusElement.textContent = rating.label;
    statusElement.className = `metric-status metric-${rating.rating}`;
    
    // Special handling for cash flow
    if (metricType === 'monthlyCashFlow') {
        valueElement.className = `metric-value ${value >= 0 ? 'cash-flow-positive' : 'cash-flow-negative'}`;
    }
}

// Update a value display
function updateValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = proformaCalculator.formatCurrency(value);
        
        // Add color coding for negative values
        if (value < 0) {
            element.classList.add('cash-flow-negative');
        } else {
            element.classList.remove('cash-flow-negative');
        }
    }
}

// Update 5-year hold projection
function updateHoldProjection(projection) {
    const container = document.getElementById('holdProjection');
    
    let html = '<div class="summary-table">';
    
    projection.forEach(year => {
        html += `
            <div class="summary-row">
                <span class="summary-label">Year ${year.year}</span>
                <span class="summary-value">
                    Cash Flow: ${proformaCalculator.formatCurrency(year.cashFlow)} | 
                    Total Return: ${proformaCalculator.formatCurrency(year.totalReturn)}
                </span>
            </div>
        `;
    });
    
    // Calculate totals
    const totalCashFlow = projection.reduce((sum, year) => sum + year.cashFlow, 0);
    const totalReturn = projection.reduce((sum, year) => sum + year.totalReturn, 0);
    const totalROI = (totalReturn / proformaCalculator.results.totalCashNeeded) * 100;
    
    html += `
        <div class="summary-row summary-total">
            <span class="summary-label">5-Year Totals</span>
            <span class="summary-value">
                Cash Flow: ${proformaCalculator.formatCurrency(totalCashFlow)} | 
                Total Return: ${proformaCalculator.formatCurrency(totalReturn)} | 
                ROI: ${totalROI.toFixed(1)}%
            </span>
        </div>
    `;
    
    html += '</div>';
    container.innerHTML = html;
}

// Update metric explanations
function updateMetricExplanations() {
    const container = document.getElementById('metricExplanations');
    const results = proformaCalculator.results;
    const data = proformaCalculator.data;
    
    const explanations = [
        {
            icon: '💵',
            title: 'Cash on Cash Return',
            value: proformaCalculator.formatPercent(results.cashOnCash),
            formula: `Annual Cash Flow ÷ Total Cash Invested = $${results.annualCashFlow.toLocaleString()} ÷ $${results.totalCashNeeded.toLocaleString()} = ${results.cashOnCash.toFixed(1)}%`,
            text: `You earn ${results.cashOnCash.toFixed(1)}% annually on your $${results.totalCashNeeded.toLocaleString()} cash investment. ${results.cashOnCash >= 12 ? 'This is an excellent return!' : results.cashOnCash >= 8 ? 'This is a good return.' : 'Consider if this meets your investment goals.'}`
        },
        {
            icon: '📈',
            title: 'Cap Rate',
            value: proformaCalculator.formatPercent(results.capRate),
            formula: `NOI ÷ Purchase Price = $${results.annualNOI.toLocaleString()} ÷ $${data.purchasePrice.toLocaleString()} = ${results.capRate.toFixed(1)}%`,
            text: `The property earns ${results.capRate.toFixed(1)}% annually based on net operating income, regardless of financing. ${results.capRate >= 10 ? 'This indicates strong returns!' : results.capRate >= 6 ? 'This is a solid cap rate for the market.' : 'The cap rate is below typical investment thresholds.'}`
        },
        {
            icon: '🏦',
            title: 'DSCR (Debt Service Coverage Ratio)',
            value: results.dscr.toFixed(2),
            formula: `NOI ÷ Annual Debt Service = $${results.annualNOI.toLocaleString()} ÷ $${results.annualDebtService.toLocaleString()} = ${results.dscr.toFixed(2)}`,
            text: `The property generates ${((results.dscr - 1) * 100).toFixed(0)}% more income than needed for loan payments. ${results.dscr >= 1.4 ? 'Excellent coverage - lenders love this!' : results.dscr >= 1.25 ? 'Good coverage - meets most lender requirements.' : results.dscr >= 1.0 ? 'Minimal coverage - may need to improve income or reduce debt.' : 'Negative coverage - the property cannot support this debt level.'}`
        }
    ];
    
    let html = '';
    explanations.forEach(exp => {
        html += `
            <div class="explanation-item">
                <div class="explanation-header">
                    <span>${exp.icon}</span>
                    <span class="explanation-title">${exp.title}: ${exp.value}</span>
                </div>
                <div class="explanation-formula">${exp.formula}</div>
                <div class="explanation-text">${exp.text}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Strategy tab switching
function switchStrategy(strategy) {
    // Update tabs
    document.querySelectorAll('.strategy-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update content
    document.querySelectorAll('.strategy-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`strategy${strategy.charAt(0).toUpperCase() + strategy.slice(1)}`).classList.add('active');
}

// Action buttons
function saveProforma() {
    const data = proformaCalculator.exportData();
    localStorage.setItem('proforma_' + currentProperty.id, JSON.stringify(data));
    alert('Analysis saved! You can access it later from your saved analyses.');
}

function exportProforma() {
    // In a real implementation, this would generate a PDF
    alert('PDF export feature coming soon! For now, you can print this page using Ctrl+P or Cmd+P.');
    window.print();
}

function emailProforma() {
    const subject = `Investment Analysis - ${currentProperty.address}`;
    const body = `I'd like to share this investment property analysis with you.\n\nProperty: ${currentProperty.address}\n\nKey Metrics:\n- Cap Rate: ${proformaCalculator.formatPercent(proformaCalculator.results.capRate)}\n- Cash on Cash: ${proformaCalculator.formatPercent(proformaCalculator.results.cashOnCash)}\n- Monthly Cash Flow: ${proformaCalculator.formatCurrency(proformaCalculator.results.monthlyCashFlow)}\n\nPlease contact me for the full analysis.`;
    
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function resetProforma() {
    if (confirm('Reset all values to defaults?')) {
        proformaCalculator = new ProformaCalculator();
        if (currentProperty) {
            proformaCalculator.loadProperty(currentProperty);
        }
        
        // Reset all inputs to default values
        document.getElementById('downPaymentPercent').value = 25;
        document.getElementById('interestRate').value = 7.5;
        document.getElementById('loanTermYears').value = 30;
        document.getElementById('vacancyRate').value = 5;
        document.getElementById('propertyManagementPercent').value = 8;
        document.getElementById('maintenancePercent').value = 5;
        document.getElementById('reservesPercent').value = 5;
        
        updateProformaUI();
    }
}

// Make functions available globally
window.openProforma = openProforma;
window.closeProforma = closeProforma;
window.switchStrategy = switchStrategy;
window.saveProforma = saveProforma;
window.exportProforma = exportProforma;
window.emailProforma = emailProforma;
window.resetProforma = resetProforma;

