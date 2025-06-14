# Detroit Property Data Priority Guide

This guide explains which data fields are most important for property purchasing decisions and how to structure them in order of importance.

## Data Priority Levels

### 🔴 Critical Information (Must Have)
These fields are essential for any property purchasing decision:

1. **Property Identification**
   - `address` - Full property address
   - `parcel_id` - Unique parcel identifier

2. **Financial Assessment**
   - `amt_taxable_value` - Current taxable value
   - `amt_assessed_value` - Current assessed value
   - `tax_status_description` - Tax payment status (Current/Delinquent)

3. **Property Classification**
   - `property_class` & `property_class_description` - Type of property (Residential, Commercial, etc.)
   - `zoning_district` - Zoning designation (affects allowed uses)

### 🟡 High Priority (Very Important)
These fields significantly impact purchasing decisions:

1. **Ownership Information**
   - `taxpayer_1` - Current owner name
   - `taxpayer_address`, `taxpayer_city`, `taxpayer_state`, `taxpayer_zip_code` - Owner's mailing address
   - `sale_date` - Date of last sale
   - `amt_sale_price` - Last sale price

2. **Property Usage**
   - `use_code` & `use_code_description` - Current property use
   - `pct_pre_claimed` - Principal Residence Exemption percentage

### 🟢 Medium Priority (Good to Know)
These fields provide valuable context:

1. **Physical Characteristics**
   - `total_acreage` - Lot size in acres
   - `total_square_footage` - Total square footage
   - `depth` & `frontage` - Lot dimensions
   - `building_status` - Condition of structures
   - `building_style` - Architectural style

2. **Special Designations**
   - `local_historic_district` - Historic preservation status
   - `nez` - Neighborhood Enterprise Zone status

### 🔵 Lower Priority (Additional Context)
These fields are useful for specific situations:

1. **Legal Information**
   - `legal_description` - Full legal property description

2. **Building Details**
   - Additional structural information
   - Year built (if available)

## Decision-Making Framework

### 1. Initial Screening Criteria
Use these fields to quickly filter properties:
```javascript
{
  taxStatus: "Current", // Avoid tax delinquent properties
  propertyClass: ["101", "102", "201"], // Residential classes
  zoning: ["R1", "R2", "R3"], // Residential zoning
  minSquareFootage: 5000, // Minimum lot size
  maxTaxableValue: 100000 // Budget constraint
}
```

### 2. Value Assessment Formula
Calculate property value score:
```javascript
function calculateValueScore(property) {
  const factors = {
    pricePerSqFt: property.amt_assessed_value / property.total_square_footage,
    taxBurden: property.amt_taxable_value * 0.02, // Estimated annual tax
    lastSaleAppreciation: (property.amt_assessed_value - property.amt_sale_price) / property.amt_sale_price,
    ownershipDuration: daysSince(property.sale_date)
  };
  
  // Lower price per sq ft = higher score
  // Lower tax burden = higher score
  // Positive appreciation = higher score
  // Longer ownership = more stable
  
  return calculateWeightedScore(factors);
}
```

### 3. Risk Assessment Flags
Identify potential issues:

**🚩 Red Flags:**
- Tax status: "Delinquent"
- Property class: "336" (Improved real property tax reverted)
- Building status: "Condemned" or "Dangerous"
- Zoning mismatches with intended use

**⚠️ Yellow Flags:**
- Recent sale (< 1 year ago)
- Significant price increases (> 50% in 2 years)
- NEZ expiring soon
- Historic district (renovation restrictions)

**✅ Green Flags:**
- Tax status: "Current"
- Long-term ownership (> 5 years)
- Stable assessed values
- Appropriate zoning for intended use

## API Response Structure Example

Structure your API responses with data organized by priority:

```javascript
{
  "summary": {
    "address": "123 Main St, Detroit, MI 48201",
    "parcelId": "01234567",
    "quickScore": 85,
    "recommendation": "Good Investment Opportunity"
  },
  
  "critical": {
    "financial": {
      "taxableValue": 45000,
      "assessedValue": 50000,
      "taxStatus": "Current"
    },
    "classification": {
      "propertyClass": "101 - Residential",
      "zoning": "R2"
    }
  },
  
  "important": {
    "ownership": {
      "currentOwner": "John Doe",
      "lastSale": {
        "date": "2019-05-15",
        "price": 35000
      }
    },
    "usage": {
      "currentUse": "Single Family Residential",
      "preExemption": 100
    }
  },
  
  "additional": {
    "physical": {
      "lotSize": 0.25,
      "squareFootage": 10890,
      "dimensions": "90 x 121"
    },
    "special": {
      "historicDistrict": null,
      "nez": false
    }
  },
  
  "analysis": {
    "strengths": [
      "Current on taxes",
      "Stable ownership",
      "Appropriate zoning"
    ],
    "concerns": [
      "No recent sales comparables",
      "Unknown building condition"
    ],
    "marketContext": {
      "neighborhoodTrend": "Improving",
      "comparableProperties": 3
    }
  },
  
  "actions": {
    "viewInParcelViewer": "https://detroit.maps.arcgis.com/...",
    "requestInspection": true,
    "checkPermits": true
  }
}
```

## Integration Best Practices

1. **Cache Frequently Accessed Data**
   - Property details change infrequently
   - Cache for 24-48 hours
   - Invalidate on known update events

2. **Batch Requests**
   - When analyzing multiple properties
   - Use spatial queries for neighborhood analysis
   - Limit to 100 properties per request

3. **Progressive Loading**
   - Load critical data first
   - Fetch additional details on demand
   - Use loading states for better UX

4. **Error Handling**
   - Gracefully handle missing data
   - Provide fallback values
   - Log API errors for monitoring

## Decision Support Matrix

| Factor | Weight | Good | Fair | Poor |
|--------|--------|------|------|------|
| Tax Status | 25% | Current | < 1 year behind | > 1 year behind |
| Price/SqFt | 20% | < $10 | $10-$20 | > $20 |
| Zoning Match | 20% | Perfect match | Compatible | Incompatible |
| Ownership Duration | 15% | > 5 years | 2-5 years | < 2 years |
| Building Condition | 10% | Good/Excellent | Fair | Poor/Condemned |
| Location Score | 10% | A-rated area | B-rated area | C/D-rated area |

## Sample Decision Algorithm

```javascript
function shouldConsiderProperty(property) {
  // Immediate disqualifiers
  if (property.taxStatus === 'Delinquent' && property.yearsDelinquent > 2) {
    return { consider: false, reason: 'Severe tax delinquency' };
  }
  
  if (property.buildingStatus === 'Condemned') {
    return { consider: false, reason: 'Condemned structure' };
  }
  
  // Score calculation
  const score = calculatePropertyScore(property);
  
  if (score >= 70) {
    return { consider: true, score, tier: 'A' };
  } else if (score >= 50) {
    return { consider: true, score, tier: 'B', caution: 'Requires careful evaluation' };
  } else {
    return { consider: false, score, reason: 'Score too low' };
  }
}
```

This prioritization framework helps users make informed decisions by presenting the most critical information first while maintaining access to comprehensive property details.