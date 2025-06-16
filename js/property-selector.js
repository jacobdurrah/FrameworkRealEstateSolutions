// Property Selector Component for Portfolio Simulator
// Integrates with existing property finder data

class PropertySelector {
    constructor() {
        this.properties = [];
        this.filteredProperties = [];
        this.selectedProperty = null;
        this.parcelAPI = null;
        this.salesAPI = null;
    }

    // Initialize APIs
    async init() {
        // Initialize parcel API if available
        if (window.parcelAPIService) {
            this.parcelAPI = window.parcelAPIService;
        } else if (window.ParcelAPIService) {
            window.parcelAPIService = new ParcelAPIService();
            await window.parcelAPIService.init(
                window.APP_CONFIG.SUPABASE_URL,
                window.APP_CONFIG.SUPABASE_ANON_KEY
            );
            this.parcelAPI = window.parcelAPIService;
        }

        // Initialize sales API if available
        if (window.salesAPIService) {
            this.salesAPI = window.salesAPIService;
        } else if (window.SalesAPIService) {
            window.salesAPIService = new SalesAPIService();
            await window.salesAPIService.init(
                window.APP_CONFIG.SUPABASE_URL,
                window.APP_CONFIG.SUPABASE_ANON_KEY
            );
            this.salesAPI = window.salesAPIService;
        }
    }

    // Load properties from parcel API or use existing search results
    async loadProperties(searchCriteria = {}) {
        try {
            // Default search criteria for investment properties
            const defaults = {
                maxPrice: 100000,
                minBedrooms: 2,
                propertyType: 'single-family'
            };
            
            const criteria = { ...defaults, ...searchCriteria };
            
            // If we have search results from property finder, use those
            if (window.currentSearchResults && window.currentSearchResults.length > 0) {
                this.properties = window.currentSearchResults.map(prop => this.convertToSelectorFormat(prop));
            } else {
                // Otherwise use mock data as fallback
                this.properties = this.generateMockProperties(20);
            }
            
            this.filteredProperties = [...this.properties];
            
            return this.properties;
        } catch (error) {
            console.error('Error loading properties:', error);
            return [];
        }
    }

    // Convert property finder format to selector format
    convertToSelectorFormat(property) {
        const parcelInfo = property.parcelInfo || {};
        const totalInvestment = property.price + (property.estimatedRehab || 0);
        const monthlyRent = property.monthlyRent || this.estimateRent(property);
        const monthlyExpenses = this.calculateExpenses(property.price, monthlyRent);
        const loanAmount = property.price * 0.8;
        const monthlyPayment = this.calculateMortgagePayment(loanAmount, 0.07, 30);
        const monthlyCashFlow = monthlyRent - monthlyExpenses - monthlyPayment;
        const capRate = ((monthlyRent * 12 - monthlyExpenses * 12) / property.price * 100);

        return {
            id: property.id || `prop_${Date.now()}`,
            address: property.address,
            city: property.city || 'Detroit',
            state: property.state || 'MI',
            zip: property.zip || parcelInfo.zipCode || '48202',
            price: property.price,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            sqft: property.sqft,
            yearBuilt: property.yearBuilt || parcelInfo.yearBuilt,
            propertyType: property.propertyType || 'single-family',
            estimatedRehab: property.estimatedRehab || 10000,
            monthlyRent: monthlyRent,
            capRate: capRate.toFixed(1),
            cashFlow: Math.round(monthlyCashFlow),
            parcelInfo: parcelInfo,
            owner: parcelInfo.owner || {},
            taxStatus: parcelInfo.taxStatus,
            assessedValue: parcelInfo.assessedValue,
            lastSale: parcelInfo.lastSale || {},
            image: property.images && property.images[0] || 'https://photos.zillowstatic.com/fp/demo.jpg'
        };
    }

    // Estimate monthly rent based on property characteristics
    estimateRent(property) {
        // Base rent calculation similar to property finder
        const baseRent = property.bedrooms * 400;
        const sqftBonus = Math.min(property.sqft * 0.1, 200);
        return Math.round(baseRent + sqftBonus);
    }

    // Calculate monthly expenses
    calculateExpenses(propertyValue, monthlyRent) {
        const propertyTax = (propertyValue * 0.8) / 12; // Detroit millage
        const insurance = (propertyValue * 0.004) / 12;
        const maintenance = (propertyValue * 0.01) / 12;
        const vacancy = monthlyRent * 0.08;
        const management = monthlyRent * 0.08;
        
        return Math.round(propertyTax + insurance + maintenance + vacancy + management);
    }

    // Generate mock properties for demonstration
    generateMockProperties(count) {
        const streets = ['CHANDLER', 'HORTON', 'MELBOURNE', 'EUCLID', 'FERRY', 'OAKLAND', 'WOODWARD', 'GRAND', 'JEFFERSON', 'MICHIGAN'];
        const properties = [];
        
        for (let i = 0; i < count; i++) {
            const price = Math.floor(Math.random() * 50000) + 40000; // $40K-$90K
            const sqft = Math.floor(Math.random() * 1500) + 1000; // 1000-2500 sqft
            const bedrooms = Math.floor(Math.random() * 2) + 2; // 2-3 bedrooms
            const monthlyRent = Math.floor(bedrooms * 400 + Math.random() * 300); // $800-$1500
            
            properties.push({
                id: `prop_${i + 1}`,
                address: `${Math.floor(Math.random() * 900) + 100} ${streets[Math.floor(Math.random() * streets.length)]}`,
                city: 'Detroit',
                state: 'MI',
                zip: '48202',
                price: price,
                bedrooms: bedrooms,
                bathrooms: Math.random() > 0.5 ? 1.5 : 1,
                sqft: sqft,
                yearBuilt: Math.floor(Math.random() * 50) + 1900,
                propertyType: 'single-family',
                estimatedRehab: Math.floor(Math.random() * 10000) + 5000,
                monthlyRent: monthlyRent,
                capRate: ((monthlyRent * 12 * 0.7) / price * 100).toFixed(1), // Assuming 70% NOI
                cashFlow: Math.floor(monthlyRent * 0.7 - (price * 0.8 * 0.007 * 30 / 12)), // Rough calculation
                image: 'https://photos.zillowstatic.com/fp/demo.jpg'
            });
        }
        
        return properties.sort((a, b) => b.capRate - a.capRate);
    }

    // Filter properties based on criteria
    filterProperties(filters) {
        this.filteredProperties = this.properties.filter(property => {
            if (filters.maxPrice && property.price > filters.maxPrice) return false;
            if (filters.minPrice && property.price < filters.minPrice) return false;
            if (filters.minBedrooms && property.bedrooms < filters.minBedrooms) return false;
            if (filters.minRent && property.monthlyRent < filters.minRent) return false;
            if (filters.minCapRate && parseFloat(property.capRate) < filters.minCapRate) return false;
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                if (!property.address.toLowerCase().includes(searchLower)) return false;
            }
            return true;
        });
        
        return this.filteredProperties;
    }

    // Render property selector UI
    renderSelector(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="property-selector">
                <div class="selector-filters">
                    <div class="filter-row">
                        <input type="text" id="propSearch" placeholder="Search address..." class="filter-input" />
                        <input type="number" id="maxPrice" placeholder="Max price" class="filter-input" />
                        <input type="number" id="minRent" placeholder="Min rent" class="filter-input" />
                        <button class="btn btn-secondary" onclick="propertySelector.applyFilters()">
                            <i class="fas fa-filter"></i> Filter
                        </button>
                    </div>
                    <div class="search-actions">
                        <button class="btn btn-outline" onclick="propertySelector.searchRealProperties()">
                            <i class="fas fa-search"></i> Search Detroit Properties
                        </button>
                        <button class="btn btn-outline" onclick="propertySelector.loadMockProperties()">
                            <i class="fas fa-dice"></i> Load Sample Properties
                        </button>
                    </div>
                </div>
                
                <div class="property-list" id="propertyList">
                    ${this.renderPropertyList()}
                </div>
                
                <div class="selected-property" id="selectedPropertyDetails" style="display: none;">
                    <!-- Selected property details will appear here -->
                </div>
            </div>
        `;
        
        // Add event listeners
        this.attachEventListeners();
    }

    // Search for real properties using parcel API
    async searchRealProperties() {
        const searchInput = document.getElementById('propSearch');
        const maxPriceInput = document.getElementById('maxPrice');
        
        if (!searchInput.value && !maxPriceInput.value) {
            alert('Please enter search criteria (address or max price)');
            return;
        }

        // Show loading
        const listContainer = document.getElementById('propertyList');
        listContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> Searching Detroit properties...</div>';

        try {
            const results = [];
            
            // If we have an address, search by address
            if (searchInput.value && this.parcelAPI) {
                const parcelData = await this.parcelAPI.getParcelByAddress(searchInput.value);
                if (parcelData) {
                    // Create a property object from parcel data
                    const property = {
                        id: parcelData.parcel_id,
                        address: parcelData.address,
                        city: 'Detroit',
                        state: 'MI',
                        zip: parcelData.zip_code,
                        price: 50000, // Default price, user can adjust
                        bedrooms: 3, // Default values
                        bathrooms: 1,
                        sqft: parcelData.total_square_footage || 1500,
                        yearBuilt: parcelData.year_built,
                        propertyType: 'single-family',
                        estimatedRehab: 10000,
                        monthlyRent: 1200,
                        parcelInfo: parcelData
                    };
                    results.push(this.convertToSelectorFormat(property));
                }
            }

            // If no results from address search, use mock data filtered by price
            if (results.length === 0) {
                const mockProperties = this.generateMockProperties(20);
                const maxPrice = parseFloat(maxPriceInput.value) || 100000;
                results.push(...mockProperties.filter(p => p.price <= maxPrice));
            }

            this.properties = results;
            this.filteredProperties = [...this.properties];
            listContainer.innerHTML = this.renderPropertyList();

        } catch (error) {
            console.error('Error searching properties:', error);
            listContainer.innerHTML = '<p class="no-results">Error searching properties. Please try again.</p>';
        }
    }

    // Load mock properties
    loadMockProperties() {
        this.properties = this.generateMockProperties(20);
        this.filteredProperties = [...this.properties];
        document.getElementById('propertyList').innerHTML = this.renderPropertyList();
    }

    // Render property list
    renderPropertyList() {
        if (this.filteredProperties.length === 0) {
            return '<p class="no-results">No properties found matching your criteria.</p>';
        }
        
        return this.filteredProperties.map(property => `
            <div class="property-item ${property.id === this.selectedProperty?.id ? 'selected' : ''}" onclick="propertySelector.selectProperty('${property.id}')">
                <div class="property-item-header">
                    <h4>${property.address}</h4>
                    <span class="property-price">${this.formatCurrency(property.price)}</span>
                </div>
                ${property.owner && property.owner.fullName ? `
                <div class="property-owner-info">
                    <span class="owner-label">Owner:</span>
                    <span class="owner-name">${property.owner.fullName}</span>
                </div>
                ` : ''}
                ${property.lastSale && property.lastSale.date ? `
                <div class="property-sale-info">
                    <span class="sale-label">Last Sale:</span>
                    <span class="sale-details">
                        ${new Date(property.lastSale.date).toLocaleDateString()}
                        ${property.lastSale.price ? ` - $${property.lastSale.price.toLocaleString()}` : ''}
                    </span>
                </div>
                ` : ''}
                <div class="property-item-details">
                    <span><i class="fas fa-bed"></i> ${property.bedrooms} bed</span>
                    <span><i class="fas fa-bath"></i> ${property.bathrooms} bath</span>
                    <span><i class="fas fa-ruler-combined"></i> ${property.sqft} sqft</span>
                    ${property.yearBuilt ? `<span>Built ${property.yearBuilt}</span>` : ''}
                    ${property.assessedValue ? `<span>Assessed: $${property.assessedValue.toLocaleString()}</span>` : ''}
                </div>
                ${property.taxStatus ? `
                <div class="property-status-badges">
                    ${property.taxStatus === 'TAXABLE' ? 
                        '<span class="status-badge tax-current">Taxable</span>' : 
                        '<span class="status-badge tax-exempt">Tax Exempt</span>'}
                </div>
                ` : ''}
                <div class="property-item-metrics">
                    <div class="metric">
                        <span class="metric-label">Monthly Cash Flow</span>
                        <span class="metric-value ${property.cashFlow >= 0 ? 'positive' : 'negative'}">
                            $${Math.abs(property.cashFlow)}
                        </span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Cap Rate</span>
                        <span class="metric-value ${parseFloat(property.capRate) >= 8 ? 'positive' : ''}">
                            ${property.capRate}%
                        </span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Est. Rent</span>
                        <span class="metric-value">${this.formatCurrency(property.monthlyRent)}/mo</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Select a property
    selectProperty(propertyId) {
        this.selectedProperty = this.properties.find(p => p.id === propertyId);
        if (!this.selectedProperty) return;
        
        // Update selected property details
        const detailsContainer = document.getElementById('selectedPropertyDetails');
        if (detailsContainer) {
            detailsContainer.style.display = 'block';
            detailsContainer.innerHTML = this.renderPropertyDetails(this.selectedProperty);
        }
        
        // Highlight selected property
        document.querySelectorAll('.property-item').forEach(item => {
            item.classList.remove('selected');
        });
        event.currentTarget.classList.add('selected');
    }

    // Render detailed property view
    renderPropertyDetails(property) {
        const totalInvestment = property.price + property.estimatedRehab;
        const downPayment = property.price * 0.2;
        const loanAmount = property.price * 0.8;
        const monthlyPayment = this.calculateMortgagePayment(loanAmount, 0.07, 30);
        const estimatedCashFlow = property.monthlyRent * 0.7 - monthlyPayment;
        
        return `
            <div class="property-details-card">
                <h3>Selected Property</h3>
                <div class="property-summary">
                    <h4>${property.address}</h4>
                    <p>${property.city}, ${property.state} ${property.zip}</p>
                </div>
                <div class="details-grid">
                    <div class="detail-item">
                        <label>Purchase Price</label>
                        <span>${this.formatCurrency(property.price)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Estimated Rehab</label>
                        <span>${this.formatCurrency(property.estimatedRehab)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Total Investment</label>
                        <span><strong>${this.formatCurrency(totalInvestment)}</strong></span>
                    </div>
                    <div class="detail-item">
                        <label>Down Payment (20%)</label>
                        <span>${this.formatCurrency(downPayment)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Monthly Rent</label>
                        <span>${this.formatCurrency(property.monthlyRent)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Est. Cash Flow</label>
                        <span class="${estimatedCashFlow >= 0 ? 'positive' : 'negative'}">
                            <strong>${this.formatCurrency(estimatedCashFlow)}/mo</strong>
                        </span>
                    </div>
                </div>
                
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="propertySelector.addToSimulation()">
                        <i class="fas fa-plus"></i> Add to Timeline
                    </button>
                    <button class="btn btn-outline" onclick="propertySelector.viewOnZillow('${property.address}')">
                        <i class="fas fa-external-link-alt"></i> View on Zillow
                    </button>
                </div>
            </div>
        `;
    }

    // Add selected property to simulation
    addToSimulation() {
        if (!this.selectedProperty) {
            alert('Please select a property first');
            return;
        }
        
        // Populate the form fields in the modal
        document.getElementById('newPropertyAddress').value = this.selectedProperty.address;
        document.getElementById('newPurchasePrice').value = this.selectedProperty.price;
        document.getElementById('newRehabCost').value = this.selectedProperty.estimatedRehab;
        document.getElementById('newMonthlyRent').value = this.selectedProperty.monthlyRent;
        
        // Trigger the add property function
        if (window.addPropertyToSimulation) {
            window.addPropertyToSimulation();
        }
    }

    // Apply filters
    applyFilters() {
        const filters = {
            search: document.getElementById('propSearch').value,
            maxPrice: parseFloat(document.getElementById('maxPrice').value) || null,
            minRent: parseFloat(document.getElementById('minRent').value) || null
        };
        
        this.filterProperties(filters);
        document.getElementById('propertyList').innerHTML = this.renderPropertyList();
    }

    // Attach event listeners
    attachEventListeners() {
        // Enter key on search
        const searchInput = document.getElementById('propSearch');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.applyFilters();
            });
        }
    }

    // View property on Zillow
    viewOnZillow(address) {
        const searchQuery = encodeURIComponent(`${address} Detroit MI`);
        window.open(`https://www.zillow.com/homes/${searchQuery}_rb/`, '_blank');
    }

    // Calculate mortgage payment
    calculateMortgagePayment(principal, rate, years) {
        const monthlyRate = rate / 12;
        const numPayments = years * 12;
        
        if (monthlyRate === 0) return principal / numPayments;
        
        const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                       (Math.pow(1 + monthlyRate, numPayments) - 1);
        
        return Math.round(payment);
    }

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
}

// Create global instance
window.propertySelector = new PropertySelector();

// Add styles for property selector
const style = document.createElement('style');
style.textContent = `
    .property-selector {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        height: 100%;
        min-height: 500px;
    }

    .selector-filters {
        padding: 1rem;
        background: var(--bg-color);
        border-radius: 4px;
    }

    .filter-row {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .search-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }

    .filter-input {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--card-bg);
        color: var(--text-primary);
    }

    .property-list {
        overflow-y: auto;
        max-height: 300px;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 0.5rem;
    }

    .property-item {
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .property-item:hover {
        border-color: var(--primary-color);
        transform: translateY(-1px);
    }

    .property-item.selected {
        border-color: var(--primary-color);
        background: rgba(33, 150, 243, 0.1);
    }

    .property-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .property-item-header h4 {
        margin: 0;
        font-size: 1rem;
        color: var(--text-primary);
    }

    .property-price {
        font-weight: 600;
        color: var(--primary-color);
    }

    .property-item-details {
        display: flex;
        gap: 1rem;
        font-size: 0.85rem;
        color: var(--text-secondary);
        margin-bottom: 0.75rem;
    }

    .property-item-metrics {
        display: flex;
        gap: 1.5rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--border-color);
    }

    .property-item-metrics .metric {
        display: flex;
        flex-direction: column;
    }

    .property-item-metrics .metric-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
    }

    .property-item-metrics .metric-value {
        font-weight: 600;
        color: var(--text-primary);
    }

    .property-details-card {
        background: var(--bg-color);
        border: 2px solid var(--primary-color);
        border-radius: 8px;
        padding: 1.5rem;
        margin-top: 1rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .property-details-card h3 {
        margin: 0 0 1rem 0;
        color: var(--text-primary);
    }

    .property-summary {
        background: var(--card-bg);
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1rem;
    }

    .property-summary h4 {
        margin: 0 0 0.25rem 0;
        color: var(--primary-color);
    }

    .property-summary p {
        margin: 0;
        color: var(--text-secondary);
    }

    .details-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .detail-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .detail-item label {
        font-size: 0.85rem;
        color: var(--text-secondary);
    }

    .detail-item span {
        font-weight: 500;
        color: var(--text-primary);
    }

    .action-buttons {
        display: flex;
        gap: 0.5rem;
    }

    .no-results {
        text-align: center;
        color: var(--text-secondary);
        padding: 2rem;
    }

    /* Consistent with property finder styles */
    .property-owner-info,
    .property-sale-info {
        font-size: 0.85rem;
        color: var(--text-secondary);
        margin-bottom: 0.5rem;
    }

    .owner-label,
    .sale-label {
        font-weight: 500;
        margin-right: 0.5rem;
    }

    .status-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 500;
        margin-right: 0.5rem;
    }

    .status-badge.tax-current {
        background: rgba(76, 175, 80, 0.1);
        color: #4CAF50;
    }

    .status-badge.tax-exempt {
        background: rgba(255, 152, 0, 0.1);
        color: #FF9800;
    }

    .metric-value.positive {
        color: #4CAF50;
        font-weight: 700;
    }

    .metric-value.negative {
        color: #f44336;
    }
`;
document.head.appendChild(style);