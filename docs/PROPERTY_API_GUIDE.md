# Property Search API Integration Guide

## Overview
This guide documents how to optimally use the three main property data APIs available in the Framework Real Estate Solutions system: Zillow (via backend proxy), Supabase Parcel Database, and Detroit ArcGIS Services.

## API Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Zillow API    │     │ Supabase Parcel │     │ Detroit ArcGIS  │
│  (via Backend)  │     │    Database     │     │    Services     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                         │
         │ Listings/Prices       │ Owner/Tax Data         │ Spatial/Building
         │                       │                         │
         └───────────────────────┴─────────────────────────┘
                                 │
                          ┌──────┴──────┐
                          │  Property   │
                          │   Finder    │
                          └─────────────┘
```

## 1. Zillow API (Property Listings)

### Purpose
- Current property listings and prices
- Property photos and descriptions
- Estimated values (Zestimate)
- Rental estimates (Rent Zestimate)

### Endpoints
```javascript
// Search properties
POST /api/properties/search
{
  location: "Detroit, MI",
  minPrice: 50000,
  maxPrice: 100000,
  beds_min: 3,
  status_type: "ForSale"
}

// Search by radius
POST /api/properties/radius
{
  lat: 42.3314,
  lng: -83.0458,
  radius: "1",
  minPrice: 50000,
  maxPrice: 100000
}
```

### Optimal Usage
```javascript
// Cache Zillow results for 1 hour (listings change infrequently)
const ZILLOW_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function searchZillowWithCache(params) {
  const cacheKey = `zillow_${JSON.stringify(params)}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < ZILLOW_CACHE_DURATION) {
      return data;
    }
  }
  
  const results = await searchPropertiesZillow(params);
  localStorage.setItem(cacheKey, JSON.stringify({
    data: results,
    timestamp: Date.now()
  }));
  
  return results;
}
```

## 2. Supabase Parcel Database

### Purpose
- Property ownership information
- Tax assessment values
- Parcel IDs and legal descriptions
- Historical sale data
- Neighborhood classifications

### Key Queries
```javascript
// Get parcel by address (street only)
async function getParcelData(fullAddress) {
  // Convert "123 Main St, Detroit, MI 48201" to "123 MAIN"
  const streetAddress = extractStreetAddress(fullAddress);
  return await parcelAPIService.getParcelByAddress(streetAddress);
}

// Batch load parcels (optimal for multiple properties)
async function batchLoadParcels(addresses) {
  const streetAddresses = addresses.map(addr => extractStreetAddress(addr));
  return await parcelAPIService.batchLoadParcels(streetAddresses);
}

// Search by owner
async function findPropertiesByOwner(ownerName) {
  return await parcelAPIService.searchByOwner(ownerName);
}
```

### Optimal Usage
```javascript
// Pre-load parcel data when displaying search results
async function enrichPropertiesWithParcelData(properties) {
  // Extract addresses for batch loading
  const addresses = properties.map(p => p.address);
  
  // Batch load all parcel data in one request
  const parcelDataMap = await batchLoadParcels(addresses);
  
  // Merge parcel data with property data
  return properties.map(property => ({
    ...property,
    parcelData: parcelDataMap[extractStreetAddress(property.address)] || null
  }));
}
```

## 3. Detroit ArcGIS Services

### Purpose
- Geocoded property locations
- Building footprints and status
- Spatial queries (find properties within area)
- Block-level analysis
- Distance calculations

### Endpoints
```javascript
const ARCGIS_BASE = 'https://services2.arcgis.com/qvkbeam7Wirps6zC/ArcGIS/rest/services';

// Parcel features
const PARCEL_SERVICE = `${ARCGIS_BASE}/parcel_file_current/FeatureServer/0`;

// Geocoding service
const GEOCODER = 'https://opengis.detroitmi.gov/opengis/rest/services/BaseUnits/BaseUnitGeocoder/GeocodeServer';
```

### Key Queries

#### 1. Geocode Address
```javascript
async function geocodeAddress(address) {
  const response = await fetch(`${GEOCODER}/findAddressCandidates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      singleLine: address,
      outFields: '*',
      f: 'json'
    })
  });
  
  const data = await response.json();
  if (data.candidates && data.candidates.length > 0) {
    const best = data.candidates[0];
    return {
      lat: best.location.y,
      lng: best.location.x,
      score: best.score,
      address: best.address
    };
  }
  return null;
}
```

#### 2. Find Properties on Block
```javascript
async function getPropertiesOnBlock(parcelId) {
  // First get the target parcel's geometry
  const targetParcel = await getParcelGeometry(parcelId);
  
  // Create a buffer around the parcel (e.g., 500 feet)
  const buffer = createBuffer(targetParcel.geometry, 500);
  
  // Query for all parcels within the buffer
  const response = await fetch(`${PARCEL_SERVICE}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      geometry: JSON.stringify(buffer),
      geometryType: 'esriGeometryPolygon',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'parcel_id,address,property_class,building_status',
      returnGeometry: false,
      f: 'json'
    })
  });
  
  return await response.json();
}
```

#### 3. Calculate Distance to Downtown
```javascript
async function calculateDistanceToDowntown(lat, lng) {
  // Downtown Detroit coordinates
  const downtown = { lat: 42.3314, lng: -83.0458 };
  
  // Haversine formula for distance
  const R = 3959; // Earth radius in miles
  const dLat = toRad(downtown.lat - lat);
  const dLng = toRad(downtown.lng - lng);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat)) * Math.cos(toRad(downtown.lat)) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in miles
}
```

## 4. Optimal Integration Pattern

### Sequential Loading Strategy
```javascript
async function getCompletePropertyData(address) {
  // Step 1: Search Zillow for current listing
  const zillowData = await searchZillowByAddress(address);
  
  // Step 2: Get parcel data from Supabase
  const parcelData = await getParcelData(address);
  
  // Step 3: Geocode if needed
  let coordinates = null;
  if (zillowData?.latitude && zillowData?.longitude) {
    coordinates = { lat: zillowData.latitude, lng: zillowData.longitude };
  } else {
    const geocoded = await geocodeAddress(address);
    coordinates = geocoded ? { lat: geocoded.lat, lng: geocoded.lng } : null;
  }
  
  // Step 4: Get block analysis if coordinates available
  let blockAnalysis = null;
  if (coordinates && parcelData?.parcelId) {
    blockAnalysis = await analyzeBlock(parcelData.parcelId, coordinates);
  }
  
  return {
    listing: zillowData,
    parcel: parcelData,
    location: coordinates,
    blockAnalysis: blockAnalysis
  };
}
```

### Parallel Loading Strategy (Faster)
```javascript
async function getCompletePropertyDataFast(address) {
  // Launch all requests in parallel
  const [zillowData, parcelData, geocoded] = await Promise.all([
    searchZillowByAddress(address).catch(() => null),
    getParcelData(address).catch(() => null),
    geocodeAddress(address).catch(() => null)
  ]);
  
  // Use best available coordinates
  const coordinates = {
    lat: zillowData?.latitude || geocoded?.lat,
    lng: zillowData?.longitude || geocoded?.lng
  };
  
  // Get block analysis if we have coordinates and parcel ID
  let blockAnalysis = null;
  if (coordinates.lat && coordinates.lng && parcelData?.parcelId) {
    blockAnalysis = await analyzeBlock(parcelData.parcelId, coordinates);
  }
  
  return {
    listing: zillowData,
    parcel: parcelData,
    location: coordinates,
    blockAnalysis: blockAnalysis
  };
}
```

## 5. Block Analysis Functions

### Comprehensive Block Analysis
```javascript
async function analyzeBlock(parcelId, coordinates) {
  // Get all properties within 500 feet
  const nearbyProperties = await getPropertiesOnBlock(parcelId);
  
  // Analyze the properties
  const analysis = {
    totalProperties: nearbyProperties.features.length,
    vacantLots: 0,
    occupiedHomes: 0,
    vacantHomes: 0,
    recentSales: 0,
    averageAssessment: 0,
    distanceToDowntown: calculateDistanceToDowntown(coordinates.lat, coordinates.lng)
  };
  
  // Process each property
  let totalAssessment = 0;
  for (const feature of nearbyProperties.features) {
    const props = feature.attributes;
    
    // Count vacant lots (no building)
    if (props.property_class === '201') { // Residential vacant land
      analysis.vacantLots++;
    }
    
    // Count building status
    if (props.building_status === 'Occupied') {
      analysis.occupiedHomes++;
    } else if (props.building_status === 'Vacant') {
      analysis.vacantHomes++;
    }
    
    // Count recent sales (would need sale_date from parcel data)
    // This would require joining with Supabase data
    
    // Sum assessments
    if (props.amt_assessed_value) {
      totalAssessment += props.amt_assessed_value;
    }
  }
  
  // Calculate averages
  if (nearbyProperties.features.length > 0) {
    analysis.averageAssessment = totalAssessment / nearbyProperties.features.length;
  }
  
  // Calculate block score (0-100)
  analysis.blockScore = calculateBlockScore(analysis);
  
  return analysis;
}

function calculateBlockScore(analysis) {
  let score = 50; // Base score
  
  // Positive factors
  score += (analysis.occupiedHomes / analysis.totalProperties) * 30; // Up to +30 for occupancy
  score += Math.max(0, 10 - analysis.distanceToDowntown) * 2; // +2 per mile closer than 10
  
  // Negative factors
  score -= (analysis.vacantLots / analysis.totalProperties) * 20; // Up to -20 for vacant lots
  score -= (analysis.vacantHomes / analysis.totalProperties) * 15; // Up to -15 for vacant homes
  
  return Math.max(0, Math.min(100, Math.round(score)));
}
```

## 6. Caching Strategy

### Multi-Level Cache
```javascript
class PropertyDataCache {
  constructor() {
    this.memory = new Map();
    this.CACHE_DURATIONS = {
      zillow: 60 * 60 * 1000,      // 1 hour
      parcel: 24 * 60 * 60 * 1000, // 24 hours
      geocode: 7 * 24 * 60 * 60 * 1000, // 7 days
      block: 60 * 60 * 1000        // 1 hour
    };
  }
  
  getCacheKey(type, params) {
    return `${type}_${JSON.stringify(params)}`;
  }
  
  get(type, params) {
    const key = this.getCacheKey(type, params);
    const cached = this.memory.get(key);
    
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < this.CACHE_DURATIONS[type]) {
        return cached.data;
      }
      this.memory.delete(key);
    }
    
    // Check localStorage for persistent cache
    const stored = localStorage.getItem(key);
    if (stored) {
      const { data, timestamp } = JSON.parse(stored);
      const age = Date.now() - timestamp;
      if (age < this.CACHE_DURATIONS[type]) {
        // Promote to memory cache
        this.memory.set(key, { data, timestamp });
        return data;
      }
      localStorage.removeItem(key);
    }
    
    return null;
  }
  
  set(type, params, data) {
    const key = this.getCacheKey(type, params);
    const cached = { data, timestamp: Date.now() };
    
    // Store in memory
    this.memory.set(key, cached);
    
    // Store in localStorage (with error handling for quota)
    try {
      localStorage.setItem(key, JSON.stringify(cached));
    } catch (e) {
      console.warn('localStorage quota exceeded, clearing old entries');
      this.clearOldEntries();
    }
  }
  
  clearOldEntries() {
    // Clear entries older than their cache duration
    const now = Date.now();
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.includes('_')) {
        try {
          const { timestamp } = JSON.parse(localStorage.getItem(key));
          const type = key.split('_')[0];
          if (now - timestamp > this.CACHE_DURATIONS[type]) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          // Invalid entry, remove it
          localStorage.removeItem(key);
        }
      }
    }
  }
}

const propertyCache = new PropertyDataCache();
```

## 7. Error Handling and Fallbacks

### Robust API Calls
```javascript
async function apiCallWithFallback(primary, fallback, description) {
  try {
    console.log(`Attempting ${description} via primary source...`);
    const result = await primary();
    if (result) return result;
  } catch (error) {
    console.warn(`Primary ${description} failed:`, error.message);
  }
  
  if (fallback) {
    try {
      console.log(`Attempting ${description} via fallback source...`);
      return await fallback();
    } catch (error) {
      console.error(`Fallback ${description} also failed:`, error.message);
    }
  }
  
  return null;
}

// Example usage
async function getPropertyValue(address) {
  return await apiCallWithFallback(
    // Primary: Get from Zillow
    async () => {
      const zillow = await searchZillowByAddress(address);
      return zillow?.price || zillow?.zestimate;
    },
    // Fallback: Get from parcel data
    async () => {
      const parcel = await getParcelData(address);
      return parcel?.assessedValue;
    },
    'property value lookup'
  );
}
```

## 8. Performance Optimization Tips

1. **Batch Operations**: Always batch multiple property lookups
2. **Parallel Requests**: Use Promise.all() for independent API calls
3. **Progressive Loading**: Load critical data first, enhance with additional data
4. **Debounce Searches**: Implement debouncing for user input
5. **Lazy Loading**: Only load detailed data when user requests it
6. **Background Updates**: Refresh cache in background for frequently accessed data

## 9. Rate Limiting

### API Rate Limits
- **Zillow**: ~100 requests per hour (via backend proxy)
- **Supabase**: ~1000 requests per hour (anon key)
- **ArcGIS**: No hard limit, but be respectful

### Rate Limiter Implementation
```javascript
class RateLimiter {
  constructor(maxRequests, timeWindow) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }
  
  async executeWithLimit(fn) {
    // Remove old requests outside time window
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    // Check if we can make request
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldestRequest);
      console.log(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.executeWithLimit(fn);
    }
    
    // Execute request
    this.requests.push(now);
    return await fn();
  }
}

// Create limiters for each API
const zillowLimiter = new RateLimiter(100, 60 * 60 * 1000); // 100/hour
const supabaseLimiter = new RateLimiter(1000, 60 * 60 * 1000); // 1000/hour
```

## 10. Complete Integration Example

```javascript
// Comprehensive property search with all data sources
async function comprehensivePropertySearch(searchParams) {
  // Step 1: Search Zillow for listings
  const zillowResults = await zillowLimiter.executeWithLimit(() =>
    propertyCache.get('zillow', searchParams) ||
    searchZillowWithCache(searchParams)
  );
  
  // Step 2: Enrich with parcel data
  const enrichedResults = await supabaseLimiter.executeWithLimit(() =>
    enrichPropertiesWithParcelData(zillowResults.results)
  );
  
  // Step 3: Add spatial analysis for top results
  const topResults = enrichedResults.slice(0, 10);
  const withAnalysis = await Promise.all(
    topResults.map(async property => {
      const analysis = propertyCache.get('block', property.parcelData?.parcelId);
      if (!analysis && property.latitude && property.longitude) {
        const newAnalysis = await analyzeBlock(
          property.parcelData?.parcelId,
          { lat: property.latitude, lng: property.longitude }
        );
        propertyCache.set('block', property.parcelData?.parcelId, newAnalysis);
        return { ...property, blockAnalysis: newAnalysis };
      }
      return { ...property, blockAnalysis: analysis };
    })
  );
  
  return {
    results: withAnalysis,
    totalCount: zillowResults.totalCount,
    cached: !!propertyCache.get('zillow', searchParams)
  };
}
```

## Best Practices Summary

1. **Always cache API responses** with appropriate durations
2. **Use batch operations** when dealing with multiple properties
3. **Implement fallbacks** for critical data points
4. **Handle errors gracefully** with user-friendly messages
5. **Respect rate limits** to avoid service interruptions
6. **Load data progressively** for better user experience
7. **Monitor API usage** to optimize costs and performance