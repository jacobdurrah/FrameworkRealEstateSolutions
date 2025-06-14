// Serverless function for searching properties by coordinates and radius

import { configureCORS } from '../cors.js';

export default async function handler(req, res) {
  // Handle CORS
  if (configureCORS(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      lat,
      lng,
      radius = '1', // default 1 mile
      status_type = 'ForSale',
      home_type = 'Houses',
      minPrice,
      maxPrice
    } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Missing coordinates',
        message: 'Latitude and longitude are required' 
      });
    }

    // Get API key from environment variable
    const ZILLOW_API_KEY = process.env.ZILLOW_API_KEY;
    
    if (!ZILLOW_API_KEY) {
      console.error('Zillow API key not configured');
      return res.status(500).json({ error: 'API configuration error' });
    }

    // Build query parameters
    const queryParams = new URLSearchParams({
      lat,
      lng,
      radius,
      status_type,
      home_type,
      ...(minPrice && { minPrice }),
      ...(maxPrice && { maxPrice })
    });

    // Make request to Zillow API
    const response = await fetch(
      `https://zillow-com1.p.rapidapi.com/propertyByCoordinates?${queryParams}`,
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
          message: 'Please try again later'
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
    console.error('Radius search API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}