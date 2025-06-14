// Production configuration
const CONFIG = {
    // Backend API configuration
    API: {
        // Your Vercel deployment URL
        PRODUCTION_URL: 'https://framework-realestate-6md8apv3o-jacob-durrahs-projects.vercel.app/api',
        DEVELOPMENT_URL: 'http://localhost:3000/api',
        
        // Determine which URL to use
        getBaseUrl() {
            const isDevelopment = window.location.hostname === 'localhost' || 
                                window.location.hostname === '127.0.0.1';
            return isDevelopment ? this.DEVELOPMENT_URL : this.PRODUCTION_URL;
        }
    },
    
    // Feature flags
    FEATURES: {
        USE_MOCK_DATA_FALLBACK: true,
        ENABLE_CHATBOT: true,
        SHOW_API_STATUS: true
    },
    
    // Business rules
    INVESTMENT_CRITERIA: {
        MIN_PRICE: 50000,
        MAX_PRICE: 100000,
        MAX_REHAB_COST: 10000,
        TARGET_LOCATION: 'Detroit, MI'
    }
};

// Export for use in other scripts
window.APP_CONFIG = CONFIG;