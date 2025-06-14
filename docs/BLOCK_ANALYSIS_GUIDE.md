# Block Analysis & Spatial Data Guide

## Overview
This guide documents how to implement block-level property analysis using Detroit's ArcGIS services and geocoded data to answer questions about neighborhood quality, vacancy rates, and investment potential.

## Key Questions We Can Answer

### 1. Block Performance Metrics
- **Vacancy Rate**: How many properties on the block are vacant?
- **Occupancy Rate**: What percentage of homes are occupied?
- **Recent Sales Activity**: How many properties sold in the last 2 years?
- **Average Assessment Values**: Are properties appreciating?
- **Building Conditions**: Good/Fair/Poor/Condemned ratios

### 2. Location Analysis
- **Distance to Downtown**: How far is the property from downtown Detroit?
- **Distance to Transit**: Proximity to bus stops and transit lines
- **Distance to Schools**: Nearest elementary, middle, and high schools
- **Distance to Services**: Grocery stores, hospitals, police stations

### 3. Investment Indicators
- **Block Score (0-100)**: Composite metric of block health
- **Price Trends**: Are values rising or falling?
- **Rental Demand**: Occupancy rates for rentals
- **Development Activity**: New construction or major renovations

## Implementation

### 1. Get Properties on Block
```javascript
async function getPropertiesOnBlock(referenceAddress, radiusFeet = 500) {
    // Step 1: Geocode the reference address
    const location = await geocodeAddress(referenceAddress);
    if (!location) throw new Error('Could not geocode address');
    
    // Step 2: Create a buffer polygon
    const buffer = createCircleBuffer(location, radiusFeet);
    
    // Step 3: Query parcels within buffer
    const PARCEL_SERVICE = 'https://services2.arcgis.com/qvkbeam7Wirps6zC/arcgis/rest/services/parcel_file_current/FeatureServer/0';
    
    const response = await fetch(`${PARCEL_SERVICE}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            geometry: JSON.stringify(buffer),
            geometryType: 'esriGeometryPolygon',
            spatialRel: 'esriSpatialRelIntersects',
            outFields: [
                'parcel_id',
                'address',
                'property_class',
                'property_class_description',
                'taxpayer_1',
                'amt_assessed_value',
                'amt_taxable_value',
                'sale_date',
                'amt_sale_price',
                'building_style',
                'total_square_footage'
            ].join(','),
            returnGeometry: true,
            f: 'json',
            outSR: 4326
        })
    });
    
    const data = await response.json();
    return data.features || [];
}

// Helper: Create circle buffer
function createCircleBuffer(center, radiusFeet) {
    const radiusMeters = radiusFeet * 0.3048;
    const earthRadius = 6371000; // meters
    
    const lat = center.lat * Math.PI / 180;
    const lng = center.lng * Math.PI / 180;
    
    const points = [];
    for (let i = 0; i <= 360; i += 10) {
        const bearing = i * Math.PI / 180;
        
        const lat2 = Math.asin(
            Math.sin(lat) * Math.cos(radiusMeters / earthRadius) +
            Math.cos(lat) * Math.sin(radiusMeters / earthRadius) * Math.cos(bearing)
        );
        
        const lng2 = lng + Math.atan2(
            Math.sin(bearing) * Math.sin(radiusMeters / earthRadius) * Math.cos(lat),
            Math.cos(radiusMeters / earthRadius) - Math.sin(lat) * Math.sin(lat2)
        );
        
        points.push([
            lng2 * 180 / Math.PI,
            lat2 * 180 / Math.PI
        ]);
    }
    
    return {
        rings: [points],
        spatialReference: { wkid: 4326 }
    };
}
```

### 2. Analyze Block Characteristics
```javascript
async function analyzeBlockCharacteristics(parcels) {
    const analysis = {
        totalProperties: parcels.length,
        vacantLots: 0,
        occupiedHomes: 0,
        vacantHomes: 0,
        unknownStatus: 0,
        
        // Financial metrics
        totalAssessedValue: 0,
        averageAssessedValue: 0,
        medianAssessedValue: 0,
        
        // Recent activity
        salesLast2Years: 0,
        averageSalePrice: 0,
        
        // Property types
        singleFamily: 0,
        multiFamily: 0,
        commercial: 0,
        other: 0,
        
        // Detailed breakdown
        properties: []
    };
    
    const assessedValues = [];
    const recentSales = [];
    const today = new Date();
    const twoYearsAgo = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
    
    for (const feature of parcels) {
        const props = feature.attributes;
        
        // Classify property type
        const propertyClass = props.property_class;
        if (propertyClass >= 101 && propertyClass <= 199) {
            analysis.singleFamily++;
        } else if (propertyClass >= 201 && propertyClass <= 299) {
            analysis.vacantLots++;
        } else if (propertyClass >= 301 && propertyClass <= 399) {
            analysis.multiFamily++;
        } else if (propertyClass >= 400 && propertyClass <= 499) {
            analysis.commercial++;
        } else {
            analysis.other++;
        }
        
        // Financial data
        if (props.amt_assessed_value) {
            assessedValues.push(props.amt_assessed_value);
            analysis.totalAssessedValue += props.amt_assessed_value;
        }
        
        // Recent sales
        if (props.sale_date) {
            const saleDate = new Date(props.sale_date);
            if (saleDate >= twoYearsAgo) {
                analysis.salesLast2Years++;
                if (props.amt_sale_price) {
                    recentSales.push(props.amt_sale_price);
                }
            }
        }
        
        // Add to detailed list
        analysis.properties.push({
            address: props.address,
            parcelId: props.parcel_id,
            owner: props.taxpayer_1,
            assessedValue: props.amt_assessed_value,
            lastSaleDate: props.sale_date,
            lastSalePrice: props.amt_sale_price,
            propertyClass: props.property_class_description,
            squareFootage: props.total_square_footage,
            coordinates: feature.geometry
        });
    }
    
    // Calculate averages
    if (assessedValues.length > 0) {
        analysis.averageAssessedValue = analysis.totalAssessedValue / assessedValues.length;
        analysis.medianAssessedValue = calculateMedian(assessedValues);
    }
    
    if (recentSales.length > 0) {
        analysis.averageSalePrice = recentSales.reduce((a, b) => a + b, 0) / recentSales.length;
    }
    
    // Estimate occupancy (this would be enhanced with additional data)
    analysis.occupiedHomes = analysis.singleFamily + analysis.multiFamily - analysis.vacantHomes;
    
    return analysis;
}

function calculateMedian(values) {
    if (values.length === 0) return 0;
    const sorted = values.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    return sorted[middle];
}
```

### 3. Calculate Block Score
```javascript
function calculateBlockScore(analysis, distanceToDowntown) {
    let score = 50; // Base score
    
    // Occupancy rate (max 30 points)
    const occupancyRate = analysis.occupiedHomes / (analysis.totalProperties - analysis.vacantLots);
    score += occupancyRate * 30;
    
    // Vacant lot penalty (max -20 points)
    const vacantLotRate = analysis.vacantLots / analysis.totalProperties;
    score -= vacantLotRate * 20;
    
    // Recent sales activity (max 15 points)
    const salesRate = analysis.salesLast2Years / analysis.totalProperties;
    score += Math.min(salesRate * 50, 15); // Cap at 15 points
    
    // Distance to downtown (max 10 points)
    if (distanceToDowntown < 2) score += 10;
    else if (distanceToDowntown < 5) score += 7;
    else if (distanceToDowntown < 10) score += 3;
    
    // Property values trend (max 10 points)
    if (analysis.averageSalePrice > analysis.averageAssessedValue * 1.1) {
        score += 10; // Appreciation
    } else if (analysis.averageSalePrice > analysis.averageAssessedValue * 0.9) {
        score += 5; // Stable
    }
    
    // Property type diversity (max 5 points)
    const diversity = calculateDiversity([
        analysis.singleFamily,
        analysis.multiFamily,
        analysis.commercial
    ]);
    score += diversity * 5;
    
    return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateDiversity(counts) {
    const total = counts.reduce((a, b) => a + b, 0);
    if (total === 0) return 0;
    
    let diversity = 0;
    for (const count of counts) {
        if (count > 0) {
            const p = count / total;
            diversity -= p * Math.log(p);
        }
    }
    
    return diversity / Math.log(counts.length); // Normalize to 0-1
}
```

### 4. Distance Calculations
```javascript
// Calculate distance to downtown Detroit
function calculateDistanceToDowntown(lat, lng) {
    const downtown = { lat: 42.3314, lng: -83.0458 };
    return haversineDistance(lat, lng, downtown.lat, downtown.lng);
}

// Haversine formula for distance between two points
function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 3959; // Earth radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function toRad(deg) {
    return deg * Math.PI / 180;
}

// Find nearest amenities
async function findNearestAmenities(lat, lng) {
    // This would query various feature services for:
    // - Schools
    // - Transit stops
    // - Grocery stores
    // - Parks
    // - Police/Fire stations
    
    const amenities = {
        nearestSchool: { name: null, distance: null },
        nearestTransit: { name: null, distance: null },
        nearestGrocery: { name: null, distance: null },
        nearestPark: { name: null, distance: null }
    };
    
    // Example: Query schools within 1 mile
    // Implementation would use actual Detroit data services
    
    return amenities;
}
```

### 5. Generate Block Report
```javascript
async function generateBlockReport(address, radius = 500) {
    try {
        // Get all properties on block
        const parcels = await getPropertiesOnBlock(address, radius);
        
        // Analyze characteristics
        const analysis = await analyzeBlockCharacteristics(parcels);
        
        // Get location of reference property
        const location = await geocodeAddress(address);
        const distanceToDowntown = calculateDistanceToDowntown(location.lat, location.lng);
        
        // Calculate block score
        const blockScore = calculateBlockScore(analysis, distanceToDowntown);
        
        // Find amenities
        const amenities = await findNearestAmenities(location.lat, location.lng);
        
        // Generate report
        const report = {
            summary: {
                address: address,
                searchRadius: radius,
                blockScore: blockScore,
                grade: getGradeFromScore(blockScore),
                totalProperties: analysis.totalProperties
            },
            
            metrics: {
                occupancy: {
                    occupied: analysis.occupiedHomes,
                    vacant: analysis.vacantHomes,
                    vacantLots: analysis.vacantLots,
                    occupancyRate: ((analysis.occupiedHomes / (analysis.totalProperties - analysis.vacantLots)) * 100).toFixed(1) + '%'
                },
                
                financial: {
                    averageAssessedValue: analysis.averageAssessedValue,
                    medianAssessedValue: analysis.medianAssessedValue,
                    recentSales: analysis.salesLast2Years,
                    averageSalePrice: analysis.averageSalePrice
                },
                
                propertyTypes: {
                    singleFamily: analysis.singleFamily,
                    multiFamily: analysis.multiFamily,
                    commercial: analysis.commercial,
                    vacantLand: analysis.vacantLots
                },
                
                location: {
                    distanceToDowntown: distanceToDowntown.toFixed(1) + ' miles',
                    neighborhood: 'TBD', // Would come from parcel data
                    ward: 'TBD',
                    councilDistrict: 'TBD'
                }
            },
            
            insights: generateInsights(analysis, blockScore, distanceToDowntown),
            
            recommendations: generateRecommendations(analysis, blockScore),
            
            detailedProperties: analysis.properties
        };
        
        return report;
        
    } catch (error) {
        console.error('Error generating block report:', error);
        throw error;
    }
}

function getGradeFromScore(score) {
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'F';
}

function generateInsights(analysis, score, distance) {
    const insights = [];
    
    // Occupancy insights
    const occupancyRate = analysis.occupiedHomes / (analysis.totalProperties - analysis.vacantLots);
    if (occupancyRate > 0.8) {
        insights.push('✅ High occupancy rate indicates stable neighborhood');
    } else if (occupancyRate < 0.5) {
        insights.push('⚠️ Low occupancy may indicate declining area');
    }
    
    // Vacant lot insights
    const vacantLotRate = analysis.vacantLots / analysis.totalProperties;
    if (vacantLotRate > 0.3) {
        insights.push('⚠️ High number of vacant lots may affect property values');
    } else if (vacantLotRate < 0.1) {
        insights.push('✅ Few vacant lots suggests established neighborhood');
    }
    
    // Sales activity
    if (analysis.salesLast2Years > 5) {
        insights.push('✅ Active real estate market with recent sales');
    } else if (analysis.salesLast2Years === 0) {
        insights.push('⚠️ No recent sales may indicate low demand');
    }
    
    // Distance insights
    if (distance < 3) {
        insights.push('✅ Close to downtown - good for rental demand');
    } else if (distance > 10) {
        insights.push('📍 Far from downtown - verify local amenities');
    }
    
    return insights;
}

function generateRecommendations(analysis, score) {
    const recommendations = [];
    
    if (score >= 70) {
        recommendations.push('🟢 Good investment area - proceed with standard due diligence');
    } else if (score >= 50) {
        recommendations.push('🟡 Moderate area - investigate specific block conditions');
        recommendations.push('🟡 Consider lower offers to account for area risk');
    } else {
        recommendations.push('🔴 High-risk area - extensive due diligence required');
        recommendations.push('🔴 Verify all utilities and city services');
    }
    
    // Specific recommendations
    if (analysis.vacantLots > 5) {
        recommendations.push('💡 Many vacant lots - potential for future development');
    }
    
    if (analysis.commercial > 0) {
        recommendations.push('💡 Mixed-use area - verify zoning for intended use');
    }
    
    return recommendations;
}
```

## Usage Example

```javascript
// In property-finder.js, enhance the block search
async function performBlockAnalysis(propertyAddress) {
    showLoading('Analyzing neighborhood...');
    
    try {
        const report = await generateBlockReport(propertyAddress, 500);
        
        // Display report in UI
        displayBlockAnalysisModal(report);
        
        // Add to property card
        updatePropertyCardWithBlockScore(propertyAddress, report.summary.blockScore);
        
    } catch (error) {
        console.error('Block analysis failed:', error);
        alert('Unable to analyze neighborhood. Please try again.');
    } finally {
        hideLoading();
    }
}

// Display block analysis in modal
function displayBlockAnalysisModal(report) {
    const modalContent = `
        <div class="block-analysis-report">
            <h2>Neighborhood Analysis: ${report.summary.address}</h2>
            
            <div class="block-score-display">
                <div class="score-circle ${getScoreClass(report.summary.blockScore)}">
                    <span class="score-number">${report.summary.blockScore}</span>
                    <span class="score-grade">${report.summary.grade}</span>
                </div>
                <p>Neighborhood Score</p>
            </div>
            
            <div class="metrics-grid">
                <div class="metric-card">
                    <h4>Occupancy</h4>
                    <p class="metric-main">${report.metrics.occupancy.occupancyRate}</p>
                    <p class="metric-detail">${report.metrics.occupancy.occupied} occupied of ${report.summary.totalProperties}</p>
                </div>
                
                <div class="metric-card">
                    <h4>Recent Activity</h4>
                    <p class="metric-main">${report.metrics.financial.recentSales}</p>
                    <p class="metric-detail">Sales in last 2 years</p>
                </div>
                
                <div class="metric-card">
                    <h4>Distance to Downtown</h4>
                    <p class="metric-main">${report.metrics.location.distanceToDowntown}</p>
                    <p class="metric-detail">Drive time varies</p>
                </div>
                
                <div class="metric-card">
                    <h4>Avg Assessment</h4>
                    <p class="metric-main">$${report.metrics.financial.averageAssessedValue.toLocaleString()}</p>
                    <p class="metric-detail">Neighborhood average</p>
                </div>
            </div>
            
            <div class="insights-section">
                <h3>Key Insights</h3>
                <ul>
                    ${report.insights.map(insight => `<li>${insight}</li>`).join('')}
                </ul>
            </div>
            
            <div class="recommendations-section">
                <h3>Recommendations</h3>
                <ul>
                    ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
            
            <button onclick="viewDetailedProperties()" class="btn btn-secondary">
                View All ${report.summary.totalProperties} Properties
            </button>
        </div>
    `;
    
    showModal('Block Analysis', modalContent);
}

function getScoreClass(score) {
    if (score >= 85) return 'score-excellent';
    if (score >= 70) return 'score-good';
    if (score >= 55) return 'score-fair';
    if (score >= 40) return 'score-poor';
    return 'score-very-poor';
}
```

## Future Enhancements

1. **Crime Data Integration**: Add crime statistics by connecting to Detroit Police data
2. **School Ratings**: Integrate GreatSchools API for school quality metrics
3. **Development Tracking**: Monitor building permits and new construction
4. **Historical Trends**: Show 5-year trends for values and occupancy
5. **Predictive Modeling**: Use ML to predict future block performance
6. **Photo Integration**: Street view and aerial imagery for visual assessment
7. **Comparative Analysis**: Compare blocks across the city
8. **Investment Hotspots**: Identify emerging neighborhoods

## API Rate Limiting and Caching

```javascript
// Cache block analyses to reduce API calls
const blockAnalysisCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

async function getCachedBlockAnalysis(address, radius) {
    const cacheKey = `${address}_${radius}`;
    const cached = blockAnalysisCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    
    const analysis = await generateBlockReport(address, radius);
    blockAnalysisCache.set(cacheKey, {
        data: analysis,
        timestamp: Date.now()
    });
    
    return analysis;
}
```

This comprehensive block analysis system provides investors with deep insights into neighborhood quality and investment potential, helping them make more informed decisions.