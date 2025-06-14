/**
 * Backend API Template for Detroit Property Data
 * 
 * This Express.js API aggregates data from multiple Detroit property sources
 * and provides a unified interface with caching and data prioritization.
 */

const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const fetch = require('node-fetch');

const app = express();
const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

// Middleware
app.use(cors());
app.use(express.json());

// Import integration functions (from property-data-integration.js)
const {
  fetchParcelById,
  geocodeAddress,
  fetchPropertyDataByAddress,
  findParcelsNearLocation,
  extractPriorityInformation,
  generateParcelViewerLink
} = require('./property-data-integration');

/**
 * GET /api/property/:parcelId
 * Fetch comprehensive property data by parcel ID
 */
app.get('/api/property/:parcelId', async (req, res) => {
  try {
    const { parcelId } = req.params;
    const cacheKey = `property_${parcelId}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ source: 'cache', data: cached });
    }
    
    // Fetch fresh data
    const parcel = await fetchParcelById(parcelId);
    
    // Get coordinates from parcel geometry
    const coordinates = parcel.geometry.coordinates[0][0][0]; // First point of polygon
    const [lng, lat] = coordinates;
    
    // Fetch related data
    const building = await queryFeatureByLocation(
      'https://services2.arcgis.com/qvkbeam7Wirps6zC/ArcGIS/rest/services/BaseUnitFeatures/FeatureServer/2',
      lng, lat
    );
    
    const propertyData = {
      parcel,
      building: building?.features?.[0],
      coordinates: { lat, lng }
    };
    
    // Extract priority information
    const priorityInfo = extractPriorityInformation(propertyData);
    
    // Cache the result
    cache.set(cacheKey, priorityInfo);
    
    res.json({ source: 'live', data: priorityInfo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/geocode
 * Geocode an address and return property data
 */
app.post('/api/geocode', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }
    
    const cacheKey = `geocode_${address.toLowerCase().replace(/\s+/g, '_')}`;
    
    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ source: 'cache', data: cached });
    }
    
    // Fetch property data
    const propertyData = await fetchPropertyDataByAddress(address);
    const priorityInfo = extractPriorityInformation(propertyData);
    
    // Cache the result
    cache.set(cacheKey, priorityInfo);
    
    res.json({ source: 'live', data: priorityInfo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/properties/nearby
 * Find properties near a location
 */
app.post('/api/properties/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 100 } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    const parcels = await findParcelsNearLocation(lat, lng, radius);
    
    // Sort by distance and extract priority info for each
    const results = parcels.map(parcel => {
      const propertyData = { parcel, coordinates: { lat, lng } };
      return {
        distance: calculateDistance(lat, lng, parcel.geometry),
        ...extractPriorityInformation(propertyData)
      };
    }).sort((a, b) => a.distance - b.distance);
    
    res.json({ count: results.length, properties: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/properties/batch
 * Fetch multiple properties by parcel IDs
 */
app.post('/api/properties/batch', async (req, res) => {
  try {
    const { parcelIds } = req.body;
    
    if (!Array.isArray(parcelIds) || parcelIds.length === 0) {
      return res.status(400).json({ error: 'Array of parcel IDs is required' });
    }
    
    // Limit batch size
    if (parcelIds.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 parcels per request' });
    }
    
    const results = [];
    const uncachedIds = [];
    
    // Check cache for each ID
    for (const id of parcelIds) {
      const cached = cache.get(`property_${id}`);
      if (cached) {
        results.push({ parcelId: id, source: 'cache', data: cached });
      } else {
        uncachedIds.push(id);
      }
    }
    
    // Fetch uncached parcels
    if (uncachedIds.length > 0) {
      const parcels = await fetchMultipleParcels(uncachedIds);
      
      for (const parcel of parcels) {
        const propertyData = { parcel };
        const priorityInfo = extractPriorityInformation(propertyData);
        
        // Cache for future requests
        cache.set(`property_${parcel.properties.parcel_id}`, priorityInfo);
        
        results.push({
          parcelId: parcel.properties.parcel_id,
          source: 'live',
          data: priorityInfo
        });
      }
    }
    
    res.json({ count: results.length, properties: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/property/:parcelId/score
 * Calculate a purchase decision score based on property data
 */
app.get('/api/property/:parcelId/score', async (req, res) => {
  try {
    const { parcelId } = req.params;
    
    // Get property data
    const propertyResponse = await fetch(`http://localhost:3000/api/property/${parcelId}`);
    const { data } = await propertyResponse.json();
    
    // Calculate scores for different factors
    const scores = calculatePropertyScores(data);
    
    res.json({
      parcelId,
      scores,
      overallScore: scores.overall,
      recommendation: getRecommendation(scores.overall)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/cache/stats
 * Get cache statistics
 */
app.get('/api/cache/stats', (req, res) => {
  const keys = cache.keys();
  const stats = {
    totalEntries: keys.length,
    propertyEntries: keys.filter(k => k.startsWith('property_')).length,
    geocodeEntries: keys.filter(k => k.startsWith('geocode_')).length,
    cacheHitRate: cache.getStats()
  };
  
  res.json(stats);
});

/**
 * DELETE /api/cache/clear
 * Clear the cache
 */
app.delete('/api/cache/clear', (req, res) => {
  cache.flushAll();
  res.json({ message: 'Cache cleared successfully' });
});

// Helper functions

/**
 * Calculate distance between point and geometry
 */
function calculateDistance(lat, lng, geometry) {
  // Simplified distance calculation (should use proper geodesic calculation)
  const [geoLng, geoLat] = geometry.coordinates[0][0][0];
  return Math.sqrt(Math.pow(lat - geoLat, 2) + Math.pow(lng - geoLng, 2)) * 111000; // rough meters
}

/**
 * Calculate property scores for purchase decisions
 */
function calculatePropertyScores(propertyData) {
  const scores = {
    value: 0,
    location: 0,
    condition: 0,
    financial: 0,
    overall: 0
  };
  
  // Value score based on price per square foot
  if (propertyData.critical.assessedValue && propertyData.physical.totalSquareFootage) {
    const pricePerSqFt = propertyData.critical.assessedValue / propertyData.physical.totalSquareFootage;
    scores.value = Math.max(0, Math.min(100, 100 - (pricePerSqFt / 2)));
  }
  
  // Location score based on zoning
  const goodZoning = ['R1', 'R2', 'B1', 'B2', 'B3'];
  if (goodZoning.includes(propertyData.critical.zoning)) {
    scores.location = 80;
  } else {
    scores.location = 50;
  }
  
  // Condition score based on building status
  if (propertyData.physical.buildingStatus === 'Good') {
    scores.condition = 90;
  } else if (propertyData.physical.buildingStatus === 'Fair') {
    scores.condition = 60;
  } else {
    scores.condition = 30;
  }
  
  // Financial score based on tax status
  if (propertyData.critical.taxStatus === 'Current') {
    scores.financial = 100;
  } else {
    scores.financial = 40;
  }
  
  // Calculate overall score (weighted average)
  scores.overall = (
    scores.value * 0.3 +
    scores.location * 0.3 +
    scores.condition * 0.25 +
    scores.financial * 0.15
  );
  
  return scores;
}

/**
 * Get recommendation based on score
 */
function getRecommendation(score) {
  if (score >= 80) return 'Highly Recommended';
  if (score >= 60) return 'Good Option';
  if (score >= 40) return 'Consider with Caution';
  return 'Not Recommended';
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Detroit Property API running on port ${PORT}`);
});

module.exports = app;