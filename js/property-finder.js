// Property Finder JavaScript

// Mock property data for demonstration
// In production, this would come from an API
const mockProperties = [
    {
        id: 1,
        address: '12345 Gratiot Ave',
        city: 'Detroit',
        state: 'MI',
        zip: '48205',
        price: 65000,
        bedrooms: 3,
        bathrooms: 1,
        sqft: 1200,
        yearBuilt: 1950,
        propertyType: 'single-family',
        estimatedRehab: 8500,
        monthlyRent: 1329,
        description: 'Well-maintained single family home with original hardwood floors'
    },
    {
        id: 2,
        address: '5678 Van Dyke St',
        city: 'Detroit',
        state: 'MI',
        zip: '48213',
        price: 78000,
        bedrooms: 4,
        bathrooms: 1.5,
        sqft: 1400,
        yearBuilt: 1955,
        propertyType: 'single-family',
        estimatedRehab: 10000,
        monthlyRent: 1628,
        description: 'Spacious home with large backyard, needs minor updates'
    },
    {
        id: 3,
        address: '9012 Warren Ave',
        city: 'Detroit',
        state: 'MI',
        zip: '48217',
        price: 55000,
        bedrooms: 2,
        bathrooms: 1,
        sqft: 950,
        yearBuilt: 1945,
        propertyType: 'single-family',
        estimatedRehab: 6000,
        monthlyRent: 1024,
        description: 'Cozy home perfect for small family, updated kitchen'
    },
    {
        id: 4,
        address: '3456 Grand River Ave',
        city: 'Detroit',
        state: 'MI',
        zip: '48208',
        price: 92000,
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1350,
        yearBuilt: 1960,
        propertyType: 'single-family',
        estimatedRehab: 12000,
        monthlyRent: 1329,
        description: 'Recently updated bathroom, needs some exterior work'
    }
];

// Property search form handler
document.getElementById('propertySearchForm')?.addEventListener('submit', function(e) {
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
    
    // Simulate API call with setTimeout
    setTimeout(() => {
        const results = searchProperties(searchCriteria);
        displayResults(results);
    }, 1000);
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
    const annualRent = property.monthlyRent * 12;
    const estimatedROI = ((annualRent - (totalInvestment * 0.1)) / totalInvestment * 100).toFixed(1);
    const cashFlow = property.monthlyRent - (totalInvestment * 0.006); // Rough estimate
    
    const card = document.createElement('div');
    card.className = 'property-result-card';
    
    card.innerHTML = `
        <div class="property-result-image">
            <span>Photo Coming Soon</span>
        </div>
        <div class="property-result-details">
            <h4 class="property-result-address">${property.address}</h4>
            <p class="property-result-price">$${property.price.toLocaleString()}</p>
            <div class="property-result-info">
                <span>${property.bedrooms} bed</span>
                <span>${property.bathrooms} bath</span>
                <span>${property.sqft} sqft</span>
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
                    <span class="analysis-value">$${property.monthlyRent}/mo</span>
                </div>
                <div class="analysis-item">
                    <span class="analysis-label">Est. ROI:</span>
                    <span class="analysis-value">${estimatedROI}%</span>
                </div>
            </div>
            <p style="margin-bottom: var(--spacing-md); font-size: 0.875rem; color: var(--dark-gray);">
                ${property.description}
            </p>
            <div class="property-result-actions">
                <button class="btn btn-primary" onclick="analyzeProperty(${property.id})">
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