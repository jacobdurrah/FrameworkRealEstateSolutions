# Tax Status Data Flow Documentation

## Overview
This document explains how property tax status is determined and displayed in the Framework Real Estate Solutions application.

## Data Source: Detroit Parcel CSV

The tax status information comes from the Detroit parcel data CSV file with the following relevant columns:
- **Column 21**: `Tax Status` - Contains values like "TAXABLE", "EXEMPT (211.7GG)", etc.
- **Column 22**: `Tax Status Description` - Contains descriptions like "TAXABLE", "PROPERTY HELD BY LAND BANK", etc.

### Common Tax Status Values
1. **TAXABLE** - Property is subject to property taxes
2. **EXEMPT (211.7GG)** - Property held by Land Bank Fast Track Authority
3. **EXEMPT (211.7N)** - Non-profit theater
4. **EXEMPT (211.7W)** - Agricultural society property
5. **EXEMPT (211.7S)** - Houses of public worship
6. **EXEMPT (211.7M)** - County property
7. **EXEMPT (211.7O)** - Non-profit charitable institution
8. **EXEMPT (125.1415A)** - Housing project exemption

## Data Import Process

### 1. CSV to Database (upload-parcel-data.js)
The upload script maps CSV columns to database fields:
```javascript
tax_status: row['Tax Status'],
tax_status_description: row['Tax Status Description'],
```

### 2. Database Schema (schema.sql)
The database stores tax status in two columns:
```sql
tax_status VARCHAR(100),
tax_status_description VARCHAR(200),
```

## Data Retrieval and Display

### 1. Backend API (parcel-api.js)
The parcel API transforms database records to include tax status:
```javascript
transformParcelData(dbRecord) {
    return {
        // ... other fields
        taxStatus: dbRecord.tax_status || dbRecord.tax_status_description || null,
        // ... other fields
    };
}
```

### 2. Frontend Display (property-finder.js)
The property cards display tax status badges based on the value:
```javascript
${parcelInfo.taxStatus ? 
    (parcelInfo.taxStatus === 'TAXABLE' ? 
        '<span class="status-badge tax-current">Taxable</span>' : 
        '<span class="status-badge tax-exempt">Tax Exempt</span>') 
    : ''}
```

## Important Notes

### Tax Delinquency vs Tax Status
- The current data **does not** indicate tax delinquency (whether taxes are paid or overdue)
- The data only indicates whether a property is **taxable** or **exempt** from taxes
- True tax delinquency information would need to come from:
  - Detroit Treasurer's Office
  - Wayne County Treasurer
  - Separate delinquency records

### Property Status Display
The system also displays property condition status:
- **Improved** - Properties with structures (RESIDENTIAL-IMPROVED, COMMERCIAL-IMPROVED)
- **Vacant** - Properties without structures (RESIDENTIAL-VACANT, COMMERCIAL-VACANT)

## Future Enhancements

To add true tax delinquency status:

1. **Integrate with Tax Delinquency API**
   - Detroit or Wayne County may provide APIs for delinquent tax data
   - Would need to match by parcel ID or address

2. **Add Delinquency Fields to Database**
   ```sql
   ALTER TABLE parcels ADD COLUMN tax_delinquent BOOLEAN DEFAULT FALSE;
   ALTER TABLE parcels ADD COLUMN tax_amount_owed DECIMAL(12, 2);
   ALTER TABLE parcels ADD COLUMN tax_years_delinquent INTEGER;
   ```

3. **Update Display Logic**
   ```javascript
   // Future implementation
   if (parcelInfo.taxDelinquent) {
       badge = '<span class="status-badge tax-delinquent">Tax Delinquent</span>';
   } else if (parcelInfo.taxStatus === 'TAXABLE') {
       badge = '<span class="status-badge tax-current">Taxes Current</span>';
   } else {
       badge = '<span class="status-badge tax-exempt">Tax Exempt</span>';
   }
   ```

## Troubleshooting

If all properties show the same tax status:
1. Check that the CSV import included tax_status fields
2. Verify the database has tax_status data: 
   ```sql
   SELECT DISTINCT tax_status, COUNT(*) FROM parcels GROUP BY tax_status;
   ```
3. Check that parcel-api.js includes taxStatus in transformParcelData
4. Verify frontend receives taxStatus in parcelInfo object

## Data Quality Notes
- Some records may have empty tax_status fields
- Tax exempt properties have various exemption codes that indicate the reason
- The tax_status_description provides human-readable explanations