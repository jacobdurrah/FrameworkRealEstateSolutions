// Production configuration
const CONFIG = {
    // Backend API configuration
    API: {
        // Your Vercel deployment URL
        PRODUCTION_URL: 'https://framework-42ai4upwu-jacob-durrahs-projects.vercel.app/api',
        DEVELOPMENT_URL: 'http://localhost:3000/api',
        
        // Determine which URL to use
        getBaseUrl() {
            const isDevelopment = window.location.hostname === 'localhost' || 
                                window.location.hostname === '127.0.0.1';
            return isDevelopment ? this.DEVELOPMENT_URL : this.PRODUCTION_URL;
        }
    },
    
    // Supabase configuration for parcel data
    // These are public keys safe to expose
    SUPABASE_URL: 'https://gzswtqlvffqcpifdyrnf.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6c3d0cWx2ZmZxY3BpZmR5cm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzM5ODcsImV4cCI6MjA2NTUwOTk4N30.8WTX9v2GD2MziYqfVn-ZBURcVqaCvjkdQjBUlv2-GgI',
    
    // Feature flags
    FEATURES: {
        USE_MOCK_DATA_FALLBACK: true,
        ENABLE_CHATBOT: true,
        SHOW_API_STATUS: true,
        ENABLE_PARCEL_DATA: true // Supabase is now configured
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