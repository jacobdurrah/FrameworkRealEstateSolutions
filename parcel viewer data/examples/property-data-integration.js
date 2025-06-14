/**
 * Detroit Property Data Integration Examples
 * 
 * This file demonstrates how to use Detroit's property APIs to fetch
 * comprehensive data about parcels, addresses, and buildings.
 */

// API Endpoints
const API_ENDPOINTS = {
  parcels: 'https://services2.arcgis.com/qvkbeam7Wirps6zC/arcgis/rest/services/parcel_file_current/FeatureServer/0',
  addresses: 'https://services2.arcgis.com/qvkbeam7Wirps6zC/ArcGIS/rest/services/BaseUnitFeatures/FeatureServer/0',
  buildings: 'https://services2.arcgis.com/qvkbeam7Wirps6zC/ArcGIS/rest/services/BaseUnitFeatures/FeatureServer/2',
  streets: 'https://services2.arcgis.com/qvkbeam7Wirps6zC/ArcGIS/rest/services/BaseUnitFeatures/FeatureServer/1',
  geocoder: 'https://opengis.detroitmi.gov/opengis/rest/services/BaseUnits/BaseUnitGeocoder/GeocodeServer'
};

/**
 * Fetch parcel data by parcel ID
 * @param {string} parcelId - The parcel ID to query
 * @returns {Promise<Object>} Parcel GeoJSON feature
 */
async function fetchParcelById(parcelId) {
  const queryUrl = `${API_ENDPOINTS.parcels}/query`;
  const params = new URLSearchParams({
    where: `parcel_id = '${parcelId}'`,
    outFields: '*',
    returnGeometry: true,
    f: 'geojson',
    outSpatialReference: 4326
  });

  try {
    const response = await fetch(`${queryUrl}?${params}`);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features[0];
    }
    throw new Error('Parcel not found');
  } catch (error) {
    console.error('Error fetching parcel:', error);
    throw error;
  }
}

/**
 * Geocode a Detroit address
 * @param {string} address - Address string to geocode
 * @returns {Promise<Object>} Geocoding result with coordinates and metadata
 */
async function geocodeAddress(address) {
  const geocodeUrl = `${API_ENDPOINTS.geocoder}/findAddressCandidates`;
  const params = new URLSearchParams({
    singleLine: address,
    outFields: '*',
    f: 'json'
  });

  try {
    const response = await fetch(`${geocodeUrl}?${params}`);
    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      // Return the best match (highest score)
      return data.candidates[0];
    }
    throw new Error('Address not found');
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw error;
  }
}

/**
 * Fetch all property data for a given address
 * @param {string} address - Address to search for
 * @returns {Promise<Object>} Combined property data
 */
async function fetchPropertyDataByAddress(address) {
  try {
    // Step 1: Geocode the address
    const geocodeResult = await geocodeAddress(address);
    const { x, y } = geocodeResult.location;
    
    // Step 2: Find parcel at this location
    const parcel = await queryFeatureByLocation(API_ENDPOINTS.parcels, x, y);
    
    // Step 3: Find building at this location
    const building = await queryFeatureByLocation(API_ENDPOINTS.buildings, x, y);
    
    // Step 4: Find address point
    const addressPoint = await queryFeatureByLocation(API_ENDPOINTS.addresses, x, y);
    
    return {
      geocodeResult,
      parcel: parcel?.features?.[0],
      building: building?.features?.[0],
      address: addressPoint?.features?.[0],
      coordinates: { lat: y, lng: x }
    };
  } catch (error) {
    console.error('Error fetching property data:', error);
    throw error;
  }
}

/**
 * Query features at a specific location
 * @param {string} serviceUrl - Feature service URL
 * @param {number} x - Longitude
 * @param {number} y - Latitude
 * @returns {Promise<Object>} GeoJSON FeatureCollection
 */
async function queryFeatureByLocation(serviceUrl, x, y) {
  const queryUrl = `${serviceUrl}/query`;
  const point = {
    x: x,
    y: y,
    spatialReference: { wkid: 4326 }
  };
  
  const params = new URLSearchParams({
    geometry: JSON.stringify(point),
    geometryType: 'esriGeometryPoint',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: true,
    f: 'geojson',
    outSpatialReference: 4326
  });

  const response = await fetch(`${queryUrl}?${params}`);
  return response.json();
}

/**
 * Find parcels within a buffer distance of a point
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} bufferDistance - Buffer distance in meters
 * @returns {Promise<Array>} Array of parcel features
 */
async function findParcelsNearLocation(lat, lng, bufferDistance = 100) {
  const queryUrl = `${API_ENDPOINTS.parcels}/query`;
  
  // Create a buffer geometry (simplified circle)
  const params = new URLSearchParams({
    geometry: JSON.stringify({
      x: lng,
      y: lat,
      spatialReference: { wkid: 4326 }
    }),
    geometryType: 'esriGeometryPoint',
    distance: bufferDistance,
    units: 'esriSRUnit_Meter',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: true,
    f: 'geojson',
    outSpatialReference: 4326
  });

  try {
    const response = await fetch(`${queryUrl}?${params}`);
    const data = await response.json();
    return data.features || [];
  } catch (error) {
    console.error('Error finding nearby parcels:', error);
    throw error;
  }
}

/**
 * Generate a link to the Detroit Parcel Viewer for a specific parcel
 * @param {string} parcelId - Parcel ID
 * @param {number} lat - Latitude (optional, for centering map)
 * @param {number} lng - Longitude (optional, for centering map)
 * @returns {string} URL to parcel viewer
 */
function generateParcelViewerLink(parcelId, lat, lng) {
  // Base URL for Detroit Parcel Viewer (update with actual URL when available)
  const baseUrl = 'https://detroit.maps.arcgis.com/apps/webappviewer/';
  
  // Construct URL with parcel ID and optional coordinates
  const params = new URLSearchParams({
    parcel: parcelId
  });
  
  if (lat && lng) {
    params.append('center', `${lng},${lat}`);
    params.append('zoom', '18');
  }
  
  return `${baseUrl}?${params}`;
}

/**
 * Batch fetch multiple parcels
 * @param {Array<string>} parcelIds - Array of parcel IDs
 * @returns {Promise<Array>} Array of parcel features
 */
async function fetchMultipleParcels(parcelIds) {
  const queryUrl = `${API_ENDPOINTS.parcels}/query`;
  
  // Build WHERE clause for multiple IDs
  const whereClause = parcelIds.map(id => `parcel_id = '${id}'`).join(' OR ');
  
  const params = new URLSearchParams({
    where: whereClause,
    outFields: '*',
    returnGeometry: true,
    f: 'geojson',
    outSpatialReference: 4326
  });

  try {
    const response = await fetch(`${queryUrl}?${params}`);
    const data = await response.json();
    return data.features || [];
  } catch (error) {
    console.error('Error fetching multiple parcels:', error);
    throw error;
  }
}

/**
 * Extract the most important property information for purchasing decisions
 * @param {Object} propertyData - Combined property data object
 * @returns {Object} Prioritized property information
 */
function extractPriorityInformation(propertyData) {
  const parcel = propertyData.parcel?.properties || {};
  const building = propertyData.building?.properties || {};
  
  return {
    // Critical Information (Top Priority)
    critical: {
      address: parcel.address,
      parcelId: parcel.parcel_id,
      taxableValue: parcel.amt_taxable_value,
      assessedValue: parcel.amt_assessed_value,
      taxStatus: parcel.tax_status_description,
      propertyClass: `${parcel.property_class} - ${parcel.property_class_description}`,
      zoning: parcel.zoning_district
    },
    
    // Ownership Information (High Priority)
    ownership: {
      owner: parcel.taxpayer_1,
      ownerAddress: `${parcel.taxpayer_address}, ${parcel.taxpayer_city}, ${parcel.taxpayer_state} ${parcel.taxpayer_zip_code}`,
      lastSaleDate: parcel.sale_date,
      lastSalePrice: parcel.amt_sale_price
    },
    
    // Physical Characteristics (Medium Priority)
    physical: {
      totalAcreage: parcel.total_acreage,
      totalSquareFootage: parcel.total_square_footage,
      dimensions: `${parcel.depth} x ${parcel.frontage}`,
      buildingStatus: building.status,
      buildingStyle: parcel.building_style
    },
    
    // Additional Information (Lower Priority)
    additional: {
      useCode: `${parcel.use_code} - ${parcel.use_code_description}`,
      historicDistrict: parcel.local_historic_district,
      nez: parcel.nez,
      prePercentage: parcel.pct_pre_claimed,
      legalDescription: parcel.legal_description
    },
    
    // Links and References
    links: {
      parcelViewer: generateParcelViewerLink(
        parcel.parcel_id,
        propertyData.coordinates?.lat,
        propertyData.coordinates?.lng
      )
    }
  };
}

// Example usage
async function example() {
  try {
    // Example 1: Fetch property data by address
    const propertyData = await fetchPropertyDataByAddress('1234 Woodward Ave, Detroit, MI');
    console.log('Property Data:', propertyData);
    
    // Example 2: Extract priority information
    const priorityInfo = extractPriorityInformation(propertyData);
    console.log('Priority Information:', priorityInfo);
    
    // Example 3: Find nearby parcels
    const nearbyParcels = await findParcelsNearLocation(42.3314, -83.0458, 200);
    console.log(`Found ${nearbyParcels.length} parcels within 200m`);
    
    // Example 4: Batch fetch parcels
    const parcels = await fetchMultipleParcels(['01001', '01002', '01003']);
    console.log(`Fetched ${parcels.length} parcels`);
    
  } catch (error) {
    console.error('Example error:', error);
  }
}

// Export functions for use in other modules
module.exports = {
  fetchParcelById,
  geocodeAddress,
  fetchPropertyDataByAddress,
  findParcelsNearLocation,
  fetchMultipleParcels,
  generateParcelViewerLink,
  extractPriorityInformation,
  API_ENDPOINTS
};