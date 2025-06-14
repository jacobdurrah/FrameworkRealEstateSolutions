// Property Finder JavaScript

// Mock property data for demonstration
// Based on real Detroit investment properties
const mockProperties = [
    {
        id: 1,
        address: '14567 Eastwood St',
        city: 'Detroit',
        state: 'MI',
        zip: '48205',
        price: 68500,
        bedrooms: 3,
        bathrooms: 1,
        sqft: 1150,
        yearBuilt: 1952,
        propertyType: 'single-family',
        estimatedRehab: 8000,
        monthlyRent: 1329,
        description: 'Brick bungalow with hardwood floors, needs kitchen update. Great rental potential in stable neighborhood.',
        images: ['https://photos.zillowstatic.com/fp/demo1.jpg']
    },
    {
        id: 2,
        address: '8923 Chalmers St',
        city: 'Detroit',
        state: 'MI',
        zip: '48213',
        price: 52000,
        bedrooms: 3,
        bathrooms: 1,
        sqft: 1080,
        yearBuilt: 1954,
        propertyType: 'single-family',
        estimatedRehab: 9500,
        monthlyRent: 1329,
        description: 'Solid investment property near Chandler Park. Needs cosmetic updates but structurally sound.',
        images: ['https://photos.zillowstatic.com/fp/demo2.jpg']
    },
    {
        id: 3,
        address: '15234 Piedmont St',
        city: 'Detroit',
        state: 'MI',
        zip: '48223',
        price: 75000,
        bedrooms: 3,
        bathrooms: 1.5,
        sqft: 1250,
        yearBuilt: 1956,
        propertyType: 'single-family',
        estimatedRehab: 7500,
        monthlyRent: 1329,
        description: 'Well-maintained brick home in Rosedale Park area. Move-in ready with minor updates needed.',
        images: ['https://photos.zillowstatic.com/fp/demo3.jpg']
    },
    {
        id: 4,
        address: '12890 Wade St',
        city: 'Detroit',
        state: 'MI',
        zip: '48213',
        price: 59900,
        bedrooms: 2,
        bathrooms: 1,
        sqft: 924,
        yearBuilt: 1951,
        propertyType: 'single-family',
        estimatedRehab: 6500,
        monthlyRent: 1024,
        description: 'Compact starter home perfect for Section 8 rental. New roof in 2022.',
        images: ['https://photos.zillowstatic.com/fp/demo4.jpg']
    },
    {
        id: 5,
        address: '9876 Longview St',
        city: 'Detroit',
        state: 'MI',
        zip: '48219',
        price: 82000,
        bedrooms: 4,
        bathrooms: 1.5,
        sqft: 1475,
        yearBuilt: 1958,
        propertyType: 'single-family',
        estimatedRehab: 10000,
        monthlyRent: 1628,
        description: 'Spacious 4-bedroom in Grandmont. Great bones, needs updating. High rental demand area.',
        images: ['https://photos.zillowstatic.com/fp/demo5.jpg']
    },
    {
        id: 6,
        address: '4521 Lakepointe St',
        city: 'Detroit',
        state: 'MI',
        zip: '48224',
        price: 95000,
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1320,
        yearBuilt: 1925,
        propertyType: 'single-family',
        estimatedRehab: 5000,
        monthlyRent: 1329,
        description: 'Charming home near Alter Rd. Updated plumbing and electrical. Just needs cosmetic work.',
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
            <h4 class="property-result-address">${property.address}</h4>
            <p class="property-result-price">$${property.price.toLocaleString()}</p>
            <div class="property-result-info">
                <span>${property.bedrooms} bed</span>
                <span>${property.bathrooms} bath</span>
                <span>${sqft} sqft</span>
                <span>Built ${property.yearBuilt}</span>
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
                <button class="btn btn-primary" onclick="analyzeProperty('${property.id}')">
                    Full Analysis
                </button>
                <button class="btn btn-outline" onclick="contactAboutProperty('${property.address}')">
                    Inquire
                </button>
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
function analyzeProperty(propertyId) {
    const property = mockProperties.find(p => p.id === propertyId);
    if (property) {
        alert(`Full analysis for ${property.address} would include:\n\n` +
              `- Detailed financial projections\n` +
              `- Comparable sales analysis\n` +
              `- Neighborhood metrics\n` +
              `- Repair cost breakdown\n` +
              `- Section 8 compliance check\n\n` +
              `This feature is coming soon!`);
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
document.addEventListener('DOMContentLoaded', function() {
    // Set default max price
    const maxPriceInput = document.getElementById('maxPrice');
    if (maxPriceInput && !maxPriceInput.value) {
        maxPriceInput.value = '100000';
    }
});

// Export functions for chatbot
window.displayResults = displayResults;
window.searchProperties = searchProperties;

