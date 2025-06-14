// API Configuration
// Copy this file to config.js and add your actual API keys
// IMPORTANT: Never commit config.js to version control!

const API_CONFIG = {
    // RentCast API Configuration
    // Get your key from: https://app.rentcast.io/
    RENTCAST_API_KEY: 'your_rentcast_api_key_here',
    
    // Zillow RapidAPI Configuration (Optional backup)
    // Get your key from: https://rapidapi.com/
    ZILLOW_API_KEY: 'your_zillow_api_key_here'
};

// Export for use in property-api.js
window.API_CONFIG = API_CONFIG;