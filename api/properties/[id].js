// Serverless function for getting property details by ZPID

import { configureCORS } from '../cors.js';

export default async function handler(req, res) {
  // Handle CORS
  if (configureCORS(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Property ID (zpid) is required' });
    }

    // Get API key from environment variable
    const ZILLOW_API_KEY = process.env.ZILLOW_API_KEY;
    
    if (!ZILLOW_API_KEY) {
      console.error('Zillow API key not configured');
      return res.status(500).json({ error: 'API configuration error' });
    }

    // Make request to Zillow API
    const response = await fetch(
      `https://zillow-com1.p.rapidapi.com/property?zpid=${id}`,
      {
        headers: {
          'X-RapidAPI-Key': ZILLOW_API_KEY,
          'X-RapidAPI-Host': 'zillow-com1.p.rapidapi.com'
        }
      }
    );

    if (!response.ok) {
      console.error(`Zillow API error: ${response.status}`);
      
      if (response.status === 404) {
        return res.status(404).json({ 
          error: 'Property not found',
          message: 'No property found with the given ID'
        });
      }
      
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
    
    // Return the property details
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Property details API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}