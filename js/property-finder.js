// Property Finder JavaScript

// Remove preloaded data - we'll use API directly
// let preloadedParcelData = {};

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

// Address search form handler
document.getElementById('addressSearchForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const address = document.getElementById('addressInput').value;
    if (!address) return;
    
    showLoading();
    await searchByAddress(address);
});

// Owner search form handler
document.getElementById('ownerSearchForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const ownerName = document.getElementById('ownerName').value;
    if (!ownerName) return;
    
    showLoading();
    await searchByOwner(ownerName, false); // false = don't open in new tab
});

// Parcel search form handler
document.getElementById('parcelSearchForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const parcelId = document.getElementById('parcelId').value;
    if (!parcelId) return;
    
    showLoading();
    await searchByParcelId(parcelId);
});

// Block search form handler
document.getElementById('blockSearchForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const address = document.getElementById('blockAddress').value;
    const radius = document.getElementById('blockRadius').value;
    if (!address) return;
    
    showLoading();
    await searchByBlock(address, radius);
});

// Removed preloadParcelData function - using API directly instead

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
async function displayResults(properties, title = null) {
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
    
    // Add custom title if provided
    if (title) {
        resultsContainer.innerHTML = `<h3 style="width: 100%; margin-bottom: 20px; text-align: center;">${title}</h3>`;
    }
    
    // Show results section
    resultsSection.style.display = 'block';
    
    if (properties.length === 0) {
        resultsContainer.innerHTML += `
            <div class="no-results">
                <p>No properties found matching your criteria.</p>
                <p>Try adjusting your search parameters.</p>
            </div>
        `;
        return;
    }
    
    // Load parcel data for all properties if enabled
    let parcelDataMap = {};
    if (window.APP_CONFIG && window.APP_CONFIG.FEATURES.ENABLE_PARCEL_DATA && 
        window.parcelAPIService && window.parcelAPIService.isReady()) {
        
        console.log('Loading parcel data for search results...');
        
        // Extract street addresses from full addresses
        // Convert "4408 Crane St, Detroit, MI 48214" to "4408 CRANE"
        const streetAddresses = properties.map(p => {
            const fullAddress = p.address;
            const parts = fullAddress.split(',');
            const streetPart = parts[0].trim().toUpperCase();
            
            // Remove common suffixes
            const cleanStreet = streetPart
                .replace(/\bSTREET\b/g, '')
                .replace(/\bST\b/g, '')
                .replace(/\bAVENUE\b/g, '')
                .replace(/\bAVE\b/g, '')
                .replace(/\bDRIVE\b/g, '')
                .replace(/\bDR\b/g, '')
                .replace(/\bROAD\b/g, '')
                .replace(/\bRD\b/g, '')
                .replace(/\bBOULEVARD\b/g, '')
                .replace(/\bBLVD\b/g, '')
                .replace(/\bCOURT\b/g, '')
                .replace(/\bCT\b/g, '')
                .replace(/\bPLACE\b/g, '')
                .replace(/\bPL\b/g, '')
                .replace(/\bLANE\b/g, '')
                .replace(/\bLN\b/g, '')
                .replace(/\s+/g, ' ')
                .trim();
                
            console.log(`Converted "${fullAddress}" to "${cleanStreet}"`);
            return cleanStreet;
        });
        
        try {
            // Use batch loading with cleaned addresses
            const parcelResults = await window.parcelAPIService.batchLoadParcels(streetAddresses);
            console.log(`Loaded parcel data for ${Object.keys(parcelResults).length} of ${streetAddresses.length} properties`);
            
            // Map results back to original addresses
            properties.forEach((property, index) => {
                const streetAddress = streetAddresses[index];
                if (parcelResults[streetAddress]) {
                    parcelDataMap[property.address] = parcelResults[streetAddress];
                }
            });
        } catch (error) {
            console.error('Error loading parcel data:', error);
        }
    }
    
    // Display each property with parcel data
    properties.forEach(property => {
        // Attach parcel data to property if available
        const parcelData = parcelDataMap[property.address] || null;
        const propertyCard = createPropertyCard(property, parcelData);
        resultsContainer.appendChild(propertyCard);
    });
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Create property card element
function createPropertyCard(property, parcelData = null) {
    // Determine if property is from database (not listed for sale)
    const isFromDatabase = !property.price && parcelData && parcelData.assessedValue;
    
    // For database properties, use market value (2x assessed value)
    let displayPrice = property.price || property.zestimate || 0;
    let priceLabel = 'Listed Price';
    
    if (isFromDatabase && parcelData) {
        displayPrice = parcelData.assessedValue * 2; // Market value estimate
        priceLabel = 'Est. Market Value';
    }
    
    const price = displayPrice;
    const rehabEstimate = property.estimatedRehab || 8000; // Default rehab estimate
    const totalInvestment = price + rehabEstimate;
    const monthlyRent = property.monthlyRent || property.estimatedRent || property.rentZestimate || 1329;
    const annualRent = monthlyRent * 12;
    
    // Calculate key metrics
    const downPayment = price * 0.25; // 25% down
    const loanAmount = price - downPayment;
    const monthlyPayment = calculateMonthlyPayment(loanAmount, 7.5, 30); // 7.5% rate, 30 years
    const totalCashNeeded = downPayment + rehabEstimate + 2000; // +closing costs
    
    // Operating expenses (rough estimates)
    const monthlyTax = (parcelData?.taxableValue || price) * 0.02 / 12; // 2% annual tax
    const monthlyInsurance = 85;
    const propertyManagement = monthlyRent * 0.08; // 8%
    const maintenance = monthlyRent * 0.05; // 5%
    const reserves = monthlyRent * 0.05; // 5%
    const totalExpenses = monthlyTax + monthlyInsurance + propertyManagement + maintenance + reserves;
    
    // Cash flow and returns
    const monthlyCashFlow = monthlyRent - totalExpenses - monthlyPayment;
    const annualCashFlow = monthlyCashFlow * 12;
    const cashOnCash = totalCashNeeded > 0 ? (annualCashFlow / totalCashNeeded * 100) : 0;
    const capRate = price > 0 ? ((monthlyRent - totalExpenses) * 12 / price * 100) : 0;
    
    // Use provided parcel data
    const parcelInfo = parcelData || null;
    
    // Enhanced debug logging
    console.group(`Creating card for ${property.address}`);
    console.log('Property object:', property);
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
    } else if (isFromDatabase && property.address) {
        // For database properties, create a Zillow search URL for the image
        const zillowSearchUrl = `https://www.zillow.com/homes/${encodeURIComponent(property.address)}_rb/`;
        imageContent = `
            <div style="padding: 20px; text-align: center;">
                <span style="display: block; margin-bottom: 10px;">📷 Photo Coming Soon</span>
                <a href="${zillowSearchUrl}" target="_blank" style="font-size: 0.75rem; color: var(--accent-gold);">View on Zillow</a>
            </div>
        `;
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
            ${isFromDatabase ? `
            <div class="not-listed-badge">
                <span class="status-badge" style="background-color: #fff3cd; color: #856404;">Not Listed for Sale</span>
            </div>
            ` : ''}
            <p class="property-result-price">
                <span style="font-size: 0.75rem; color: var(--medium-gray); display: block;">${priceLabel}</span>
                $${price.toLocaleString()}
            </p>
            ${parcelInfo ? `
            <div class="property-owner-info">
                <span class="owner-label">Owner:</span>
                <span class="owner-name">${parcelInfo.owner.fullName || 'Unknown'}</span>
            </div>
            <div class="property-parcel-info">
                <span class="parcel-label">Parcel ID:</span>
                <span class="parcel-id">${parcelInfo.parcelId || 'N/A'}</span>
            </div>
            ${parcelInfo.lastSale && parcelInfo.lastSale.date ? `
            <div class="property-sale-info">
                <span class="sale-label">Last Sale:</span>
                <span class="sale-details">
                    ${parcelInfo.lastSale.date ? new Date(parcelInfo.lastSale.date).toLocaleDateString() : 'N/A'}
                    ${parcelInfo.lastSale.price ? ` - $${parcelInfo.lastSale.price.toLocaleString()}` : ''}
                    ${parcelInfo.lastSale.date ? ` (${calculateYearsOwned(parcelInfo.lastSale.date)} years)` : ''}
                </span>
            </div>
            ` : ''}
            ` : ''}
            <div class="property-result-info">
                <span>${property.bedrooms} bed</span>
                <span>${property.bathrooms} bath</span>
                <span>${sqft} sqft</span>
                <span>Built ${property.yearBuilt}</span>
                ${parcelInfo ? `<span>Assessed: $${(parcelInfo.assessedValue || 0).toLocaleString()}</span>` : ''}
            </div>
            ${parcelInfo ? `
            <div class="property-status-badges">
                ${parcelInfo.taxStatus ? 
                    (parcelInfo.taxStatus === 'TAXABLE' ? 
                        '<span class="status-badge tax-current">Taxable</span>' : 
                        '<span class="status-badge tax-exempt">Tax Exempt</span>') 
                    : ''}
                ${parcelInfo.propertyClass && parcelInfo.propertyClass.includes('VACANT') ? 
                    '<span class="status-badge vacant">Vacant</span>' : 
                    parcelInfo.propertyClass && parcelInfo.propertyClass.includes('IMPROVED') ?
                    '<span class="status-badge owner-occupied">Improved</span>' : ''}
            </div>
            ` : ''}
            <div class="property-metrics">
                <div class="metric-item">
                    <span class="metric-label">Monthly Cash Flow</span>
                    <span class="metric-value ${monthlyCashFlow >= 0 ? 'positive' : 'negative'}">
                        $${Math.abs(monthlyCashFlow).toFixed(0)}
                    </span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Cash on Cash</span>
                    <span class="metric-value ${cashOnCash >= 8 ? 'positive' : ''}">
                        ${cashOnCash.toFixed(1)}%
                    </span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Cap Rate</span>
                    <span class="metric-value ${capRate >= 8 ? 'positive' : ''}">
                        ${capRate.toFixed(1)}%
                    </span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Total Investment</span>
                    <span class="metric-value">$${totalInvestment.toLocaleString()}</span>
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
                <button class="btn btn-outline" onclick="viewPropertyDetails('${property.address}', ${JSON.stringify(parcelInfo).replace(/"/g, '&quot;')})">
                    📋 Details
                </button>
                <button class="btn btn-outline" onclick="searchByOwner('${parcelInfo.owner.fullName}')">
                    👤 Owner Portfolio
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
            
            // Test direct lookups
            console.group('Testing direct parcel lookups');
            const testAddresses = ['442 CHANDLER', '444 HORTON', '420 E FERRY'];
            for (const addr of testAddresses) {
                try {
                    const data = await window.parcelAPIService.getParcelByAddress(addr);
                    if (data) {
                        console.log(`✓ ${addr}:`, data.owner.fullName, '-', data.neighborhood);
                    } else {
                        console.log(`✗ ${addr}: No data found`);
                    }
                } catch (error) {
                    console.log(`✗ ${addr}: Error -`, error.message);
                }
            }
            console.groupEnd();
            
            // Add a test lookup for 2404 Pennsylvania
            console.group('Testing 2404 Pennsylvania lookup');
            try {
                const pennData = await window.parcelAPIService.getParcelByAddress('2404 PENNSYLVANIA');
                if (pennData) {
                    console.log('✅ 2404 PENNSYLVANIA found:', pennData.owner.fullName);
                    console.log('Full data:', pennData);
                } else {
                    console.log('❌ 2404 PENNSYLVANIA not found');
                    // Try with STREET
                    const pennData2 = await window.parcelAPIService.getParcelByAddress('2404 PENNSYLVANIA STREET');
                    if (pennData2) {
                        console.log('✅ Found with STREET added:', pennData2.owner.fullName);
                    }
                }
            } catch (error) {
                console.error('Error testing Pennsylvania address:', error);
            }
            console.groupEnd();
            
            // If we have an active search, refresh it to show parcel data
            const resultsContainer = document.getElementById('resultsContainer');
            console.log('Results container exists:', !!resultsContainer);
            console.log('Results container has children:', resultsContainer?.children.length || 0);
            
            if (resultsContainer && resultsContainer.children.length > 0) {
                console.log('Refreshing search results with parcel data...');
                const currentResults = window.lastSearchResults || mockProperties.slice(0, 6);
                // Don't call displayResults here as it will re-fetch parcel data
                // displayResults(currentResults);
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

// Switch between search types
function switchSearchType(type) {
    // Update tabs
    document.querySelectorAll('.search-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.closest('.search-tab').classList.add('active');
    
    // Update content
    document.querySelectorAll('.search-type-content').forEach(content => {
        content.style.display = 'none';
    });
    
    const searchTypeMap = {
        'criteria': 'searchCriteria',
        'address': 'searchAddress',
        'owner': 'searchOwner',
        'parcel': 'searchParcel',
        'block': 'searchBlock'
    };
    
    document.getElementById(searchTypeMap[type]).style.display = 'block';
}

// Calculate monthly payment (P&I)
function calculateMonthlyPayment(principal, annualRate, years) {
    const monthlyRate = annualRate / 100 / 12;
    const numPayments = years * 12;
    
    if (monthlyRate === 0) return principal / numPayments;
    
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
           (Math.pow(1 + monthlyRate, numPayments) - 1);
}

// Calculate years owned from sale date
function calculateYearsOwned(saleDate) {
    const sale = new Date(saleDate);
    const now = new Date();
    const years = (now - sale) / (1000 * 60 * 60 * 24 * 365.25);
    return years.toFixed(1);
}

// Extract street address from full address
function extractStreetAddress(fullAddress) {
    const parts = fullAddress.split(',');
    const streetPart = parts[0].trim().toUpperCase();
    
    // Remove common suffixes
    return streetPart
        .replace(/\bSTREET\b/g, '')
        .replace(/\bST\b/g, '')
        .replace(/\bAVENUE\b/g, '')
        .replace(/\bAVE\b/g, '')
        .replace(/\bDRIVE\b/g, '')
        .replace(/\bDR\b/g, '')
        .replace(/\bROAD\b/g, '')
        .replace(/\bRD\b/g, '')
        .replace(/\bBOULEVARD\b/g, '')
        .replace(/\bBLVD\b/g, '')
        .replace(/\bCOURT\b/g, '')
        .replace(/\bCT\b/g, '')
        .replace(/\bPLACE\b/g, '')
        .replace(/\bPL\b/g, '')
        .replace(/\bLANE\b/g, '')
        .replace(/\bLN\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// View detailed property information  
async function viewPropertyDetails(address, parcelData = null) {
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
        let parcelInfo = parcelData;
        
        // If parcel data not provided, fetch it
        if (!parcelInfo) {
            // Extract street address for API lookup
            const streetAddress = extractStreetAddress(address);
            console.log(`Looking up property details for: "${streetAddress}" (from "${address}")`);
            
            parcelInfo = await window.parcelAPIService.getParcelByAddress(streetAddress);
        }
        
        if (!parcelInfo) {
            document.getElementById('propertyDetailsContent').innerHTML = '<div style="text-align: center; padding: 40px;">Property details not found</div>';
            return;
        }
        
        // Pass both addresses for display
        openPropertyDetailsModal(parcelInfo, address);
    } catch (error) {
        console.error('Error loading property details:', error);
        document.getElementById('propertyDetailsContent').innerHTML = '<div style="text-align: center; padding: 40px;">Error loading property details</div>';
    }
}

// Open property details modal
function openPropertyDetailsModal(parcelInfo, fullAddress = null) {
    const modal = document.getElementById('propertyDetailsModal');
    if (!modal) {
        createPropertyDetailsModal();
    }
    
    // Create Zillow search URL
    const addressForZillow = fullAddress || parcelInfo.address;
    const zillowUrl = `https://www.zillow.com/homes/${encodeURIComponent(addressForZillow)}_rb/`;
    
    // Populate modal with property data
    const detailsContent = document.getElementById('propertyDetailsContent');
    detailsContent.innerHTML = `
        <h3>${parcelInfo.address}</h3>
        <div style="margin-bottom: 20px;">
            <a href="${zillowUrl}" target="_blank" class="btn btn-outline" style="display: inline-block;">
                🏠 View on Zillow
            </a>
        </div>
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

// Search by property address
async function searchByAddress(address) {
    try {
        // First try to get complete property data
        const propertyData = await getCompletePropertyData(address);
        
        if (propertyData.listing || propertyData.parcel) {
            // Display single property result
            const property = {
                address: address,
                price: propertyData.listing?.price || propertyData.parcel?.assessedValue || 0,
                bedrooms: propertyData.listing?.bedrooms || 3,
                bathrooms: propertyData.listing?.bathrooms || 1,
                sqft: propertyData.listing?.livingArea || propertyData.parcel?.totalFloorArea || 1200,
                yearBuilt: propertyData.listing?.yearBuilt || propertyData.parcel?.yearBuilt,
                propertyType: 'single-family',
                estimatedRehab: 8000,
                monthlyRent: propertyData.listing?.rentZestimate || 1329,
                description: propertyData.listing?.description,
                images: propertyData.listing?.images || [],
                latitude: propertyData.location?.lat,
                longitude: propertyData.location?.lng,
                zestimate: propertyData.listing?.zestimate,
                parcelData: propertyData.parcel,
                blockAnalysis: propertyData.blockAnalysis
            };
            
            displayResults([property], `Property at ${address}`);
        } else {
            alert('Property not found. Please check the address and try again.');
            hideLoading();
        }
    } catch (error) {
        console.error('Error searching by address:', error);
        alert('Error searching for property');
        hideLoading();
    }
}

// Search by parcel ID
async function searchByParcelId(parcelId) {
    if (!window.parcelAPIService || !window.parcelAPIService.isReady()) {
        alert('Parcel search service not available');
        return;
    }
    
    try {
        // Query Supabase for parcel
        const { data, error } = await window.parcelAPIService.client
            .from('parcels')
            .select('*')
            .eq('parcel_id', parcelId)
            .single();
            
        if (error || !data) {
            alert('Parcel not found');
            hideLoading();
            return;
        }
        
        const parcelData = window.parcelAPIService.transformParcelData(data);
        
        // Create property object from parcel data
        const property = {
            address: parcelData.address,
            city: 'Detroit',
            state: 'MI',
            zip: parcelData.zipCode,
            price: parcelData.assessedValue || 0,
            yearBuilt: parcelData.yearBuilt,
            propertyType: 'single-family',
            estimatedRehab: 8000,
            bedrooms: 3,
            bathrooms: 1,
            sqft: parcelData.totalFloorArea || 1200,
            monthlyRent: 1329, // Default to 3BR rent
            parcelData: parcelData
        };
        
        displayResults([property], `Parcel ${parcelId}`);
    } catch (error) {
        console.error('Error searching by parcel:', error);
        alert('Error searching for parcel');
        hideLoading();
    }
}

// Search properties on block
async function searchByBlock(address, radius) {
    try {
        // First geocode the address
        const geocoded = await geocodeAddress(address);
        if (!geocoded) {
            alert('Could not find the specified address');
            hideLoading();
            return;
        }
        
        // Search for properties within radius
        const results = await searchPropertiesByRadius({
            lat: geocoded.lat,
            lng: geocoded.lng,
            radius: radius || '500',
            minPrice: 1,
            maxPrice: 500000
        });
        
        if (results && results.length > 0) {
            displayResults(results, `Properties within ${radius} feet of ${address}`);
        } else {
            alert('No properties found in the specified area');
            hideLoading();
        }
    } catch (error) {
        console.error('Error searching block:', error);
        alert('Error searching for properties on block');
        hideLoading();
    }
}

// Search for properties by owner (updated to handle tab vs new window)
async function searchByOwner(ownerName, openInNewTab = true) {
    if (!window.parcelAPIService || !window.parcelAPIService.isReady()) {
        alert('Property search service not available');
        return;
    }
    
    try {
        const properties = await window.parcelAPIService.searchByOwner(ownerName);
        
        if (openInNewTab) {
            // Original behavior - open in new tab/window
            displayOwnerResults(properties, `Properties owned by ${ownerName}`);
        } else {
            // New behavior - display in current results
            if (properties.length > 0) {
                // Convert parcel data to property format
                const formattedProperties = properties.map(parcel => ({
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
                    sqft: parcel.totalFloorArea || 1200,
                    monthlyRent: 1329,
                    parcelData: parcel
                }));
                
                displayResults(formattedProperties, `Properties owned by ${ownerName}`);
            } else {
                alert('No properties found for this owner');
                hideLoading();
            }
        }
    } catch (error) {
        console.error('Error searching by owner:', error);
        alert('Error searching for properties');
        hideLoading();
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
            
            // Pass the parcel data directly since we already have it
            const card = createPropertyCard(property, parcel);
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

// Hide loading spinner
function hideLoading() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
    }
}

// Get complete property data from all sources
async function getCompletePropertyData(address) {
    try {
        // Try to search Zillow first
        const zillowResults = await window.propertyAPI?.searchPropertiesWithAPI({
            location: address,
            maxPrice: 500000
        }).catch(() => null);
        
        const zillowData = zillowResults?.results?.find(p => 
            p.address.toLowerCase().includes(address.toLowerCase().split(',')[0])
        );
        
        // Get parcel data
        const streetAddress = extractStreetAddress(address);
        const parcelData = await window.parcelAPIService?.getParcelByAddress(streetAddress).catch(() => null);
        
        // Geocode if needed
        let coordinates = null;
        if (zillowData?.latitude && zillowData?.longitude) {
            coordinates = { lat: zillowData.latitude, lng: zillowData.longitude };
        } else {
            coordinates = await geocodeAddress(address).catch(() => null);
        }
        
        // Get block analysis if available
        let blockAnalysis = null;
        if (coordinates && parcelData?.parcelId) {
            blockAnalysis = await analyzeBlock(parcelData.parcelId, coordinates).catch(() => null);
        }
        
        return {
            listing: zillowData,
            parcel: parcelData,
            location: coordinates,
            blockAnalysis: blockAnalysis
        };
    } catch (error) {
        console.error('Error getting complete property data:', error);
        return { listing: null, parcel: null, location: null, blockAnalysis: null };
    }
}

// Geocode address using Detroit geocoding service
async function geocodeAddress(address) {
    try {
        const GEOCODER = 'https://opengis.detroitmi.gov/opengis/rest/services/BaseUnits/BaseUnitGeocoder/GeocodeServer';
        
        const response = await fetch(`${GEOCODER}/findAddressCandidates?` + new URLSearchParams({
            singleLine: address + ', Detroit, MI',
            outFields: '*',
            f: 'json'
        }));
        
        const data = await response.json();
        if (data.candidates && data.candidates.length > 0) {
            const best = data.candidates[0];
            return {
                lat: best.location.y,
                lng: best.location.x,
                score: best.score,
                address: best.address
            };
        }
    } catch (error) {
        console.error('Geocoding error:', error);
    }
    return null;
}

// Search properties by radius (placeholder - would use Zillow API)
async function searchPropertiesByRadius(params) {
    try {
        if (window.propertyAPI && window.propertyAPI.searchPropertiesByRadius) {
            return await window.propertyAPI.searchPropertiesByRadius(params);
        }
    } catch (error) {
        console.error('Radius search error:', error);
    }
    
    // Fallback to empty results
    return [];
}

// Analyze block (placeholder - would use ArcGIS)
async function analyzeBlock(parcelId, coordinates) {
    // This would implement the block analysis from the API guide
    // For now, return mock data
    return {
        totalProperties: 25,
        vacantLots: 3,
        occupiedHomes: 18,
        vacantHomes: 4,
        distanceToDowntown: 3.5,
        blockScore: 75
    };
}

// Export functions for chatbot
window.displayResults = displayResults;
window.searchProperties = searchProperties;
window.viewPropertyDetails = viewPropertyDetails;
window.searchByOwner = searchByOwner;
window.searchByMailingAddress = searchByMailingAddress;
window.testParcelData = testParcelData;
window.switchSearchType = switchSearchType;
window.searchByAddress = searchByAddress;
window.searchByParcelId = searchByParcelId;
window.searchByBlock = searchByBlock;

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

// Get simple explanation for metrics (6th grade level)
function getSimpleExplanation(metricTitle, results, data) {
    const explanations = {
        'Cash on Cash Return': `Imagine you put $${results.totalCashNeeded.toLocaleString()} in a piggy bank. Each year, you get $${results.annualCashFlow.toLocaleString()} back. That's like getting ${results.cashOnCash.toFixed(1)}¢ for every dollar you put in!`,
        
        'Cap Rate': `If you bought this house with all cash (no loan), you'd make ${results.capRate.toFixed(1)}¢ for every dollar the house cost. It's like buying a lemonade stand - the cap rate shows how good the business is!`,
        
        'DSCR (Debt Service Coverage Ratio)': `This is like checking if your allowance can pay for your phone bill. A ${results.dscr.toFixed(2)} means the rent brings in ${results.dscr.toFixed(2)} times what you need for the mortgage. Above 1.0 means you have money left over!`,
        
        'Monthly Cash Flow': `This is the money you keep each month after paying all the bills. It's like your allowance after buying lunch - what's left is yours to save or spend!`,
        
        'Total ROI': `This shows how much your money grows. A ${results.totalROI.toFixed(1)}% return means if you invest $100, you'll have $${(100 + results.totalROI).toFixed(0)} after a year!`,
        
        'Gross Rent Multiplier': `This tells you how many years of rent equal the house price. If it's ${results.grossRentMultiplier.toFixed(1)}, that means ${results.grossRentMultiplier.toFixed(1)} years of rent = what you paid for the house.`
    };
    
    return explanations[metricTitle] || `This metric helps you understand if this is a good investment.`;
}

// Update metric explanations
function updateMetricExplanations() {
    const container = document.getElementById('metricExplanations');
    
    // Check if the container exists before proceeding
    if (!container) {
        console.warn('metricExplanations element not found - skipping metric explanations update');
        return;
    }
    
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
    
    // Add more metrics
    explanations.push({
        icon: '💰',
        title: 'Monthly Cash Flow',
        value: proformaCalculator.formatCurrency(results.monthlyCashFlow),
        formula: `Rent - Expenses - Mortgage = $${results.effectiveMonthlyIncome.toFixed(0)} - $${results.totalMonthlyExpenses.toFixed(0)} - $${results.monthlyPayment.toFixed(0)} = $${results.monthlyCashFlow.toFixed(0)}`,
        text: `This is your monthly profit after all expenses and mortgage. ${results.monthlyCashFlow >= 500 ? 'Strong positive cash flow!' : results.monthlyCashFlow >= 200 ? 'Decent monthly profit.' : results.monthlyCashFlow >= 0 ? 'Breaking even - risky if repairs needed.' : 'Negative cash flow - losing money monthly!'}`
    });
    
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
                <div class="simple-explanation">
                    <strong>Simple explanation:</strong> ${getSimpleExplanation(exp.title, results, data)}
                </div>
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
    
    // Initialize BRRRR calculator if switching to it
    if (strategy === 'brrrr') {
        updateBRRRRCalculator();
    }
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

// BRRRR Calculator Functions
function updateBRRRRCalculator() {
    if (!proformaCalculator || !proformaCalculator.data) return;
    
    const data = proformaCalculator.data;
    const results = proformaCalculator.results;
    
    // Update initial values
    document.getElementById('brrrrPurchase').textContent = proformaCalculator.formatCurrency(data.purchasePrice);
    document.getElementById('brrrrRehab').textContent = proformaCalculator.formatCurrency(data.rehabCost);
    document.getElementById('brrrrTotal').textContent = proformaCalculator.formatCurrency(data.purchasePrice + data.rehabCost);
    
    // Set up ARV input if not already set
    const arvInput = document.getElementById('brrrrARV');
    if (!arvInput.value) {
        // Default ARV to 2x the total investment as a starting point
        arvInput.value = Math.round((data.purchasePrice + data.rehabCost) * 2);
    }
    
    // Add event listener if not already added
    if (!arvInput.hasAttribute('data-listener-added')) {
        arvInput.addEventListener('input', calculateBRRRR);
        arvInput.setAttribute('data-listener-added', 'true');
    }
    
    // Calculate initial BRRRR numbers
    calculateBRRRR();
}

function calculateBRRRR() {
    if (!proformaCalculator || !proformaCalculator.data) return;
    
    const data = proformaCalculator.data;
    const totalInvestment = data.purchasePrice + data.rehabCost;
    const arv = parseFloat(document.getElementById('brrrrARV').value) || 0;
    
    // Calculate refinance at 75% LTV
    const loanAmount = arv * 0.75;
    const cashBack = Math.min(loanAmount, totalInvestment); // Can't get more than invested
    const moneyLeftIn = totalInvestment - cashBack;
    
    // Calculate new payment based on refinanced amount
    const monthlyRate = 7.5 / 100 / 12; // Assuming 7.5% rate
    const numPayments = 30 * 12; // 30-year term
    const newPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                      (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    // Get current rental income and expenses from proforma
    const monthlyRent = data.monthlyRent;
    const monthlyExpenses = proformaCalculator.results.totalMonthlyExpenses;
    const newCashFlow = monthlyRent - monthlyExpenses - newPayment;
    
    // Update display
    document.getElementById('brrrrLoanAmount').textContent = proformaCalculator.formatCurrency(loanAmount);
    document.getElementById('brrrrCashBack').textContent = proformaCalculator.formatCurrency(cashBack);
    document.getElementById('brrrrMoneyLeft').textContent = proformaCalculator.formatCurrency(moneyLeftIn);
    document.getElementById('brrrrNewPayment').textContent = proformaCalculator.formatCurrency(newPayment);
    document.getElementById('brrrrCashFlow').textContent = proformaCalculator.formatCurrency(newCashFlow);
    
    // Color code cash flow
    const cashFlowElement = document.getElementById('brrrrCashFlow');
    if (newCashFlow >= 0) {
        cashFlowElement.style.color = 'var(--accent-green)';
    } else {
        cashFlowElement.style.color = '#dc3545';
    }
    
    // Color code money left in
    const moneyLeftElement = document.getElementById('brrrrMoneyLeft');
    if (moneyLeftIn <= 10000) {
        moneyLeftElement.style.color = 'var(--accent-green)';
    } else {
        moneyLeftElement.style.color = 'var(--primary-black)';
    }
}

