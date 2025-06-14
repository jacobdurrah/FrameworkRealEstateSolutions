// Serverless function for property search
// This proxies requests to Zillow API while keeping the API key secure

import { configureCORS } from '../cors.js';

export default async function handler(req, res) {
  // Handle CORS
  if (configureCORS(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      location, 
      status_type = 'ForSale',
      home_type = 'Houses',
      minPrice,
      maxPrice,
      beds_min,
      sqft_min,
      sqft_max,
      sort
    } = req.body;

    // Get API key from environment variable
    const ZILLOW_API_KEY = process.env.ZILLOW_API_KEY;
    
    if (!ZILLOW_API_KEY) {
      console.error('Zillow API key not configured');
      return res.status(500).json({ error: 'API configuration error' });
    }

    // Build query parameters
    const queryParams = new URLSearchParams({
      location: location || 'Detroit, MI',
      status_type,
      home_type,
      ...(minPrice && { minPrice }),
      ...(maxPrice && { maxPrice }),
      ...(beds_min && { beds_min }),
      ...(sqft_min && { sqft_min }),
      ...(sqft_max && { sqft_max }),
      ...(sort && { sort })
    });

    // Make request to Zillow API
    const response = await fetch(
      `https://zillow-com1.p.rapidapi.com/propertyExtendedSearch?${queryParams}`,
      {
        headers: {
          'X-RapidAPI-Key': ZILLOW_API_KEY,
          'X-RapidAPI-Host': 'zillow-com1.p.rapidapi.com'
        }
      }
    );

    if (!response.ok) {
      console.error(`Zillow API error: ${response.status}`);
      
      if (response.status === 403) {
        return res.status(403).json({ 
          error: 'API rate limit exceeded',
          message: 'Please try again later or contact support'
        });
      }
      
      return res.status(response.status).json({ 
        error: `External API error: ${response.status}` 
      });
    }

    const data = await response.json();
    
    // Return the results
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}