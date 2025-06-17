# Excel Export Tests Documentation

## Overview

The Excel export functionality allows users to export their real estate portfolio simulations to CSV files with Excel formulas. This document describes the comprehensive test suite for this feature.

## Test Structure

### Unit Tests (`tests/excel-export.test.js`)

The unit tests cover all methods in the `ExcelExporter` class:

#### 1. Constructor Tests
- Verifies proper initialization with default worksheet name

#### 2. Sheet Creation Tests

**Summary Sheet (`createSummarySheet`)**
- Creates simulation overview with key metrics
- Includes Excel formulas for ROI, Cash-on-Cash return, and Cap Rate

**Timeline Sheet (`createTimelineSheet`)**
- Generates complete transaction timeline with all phases
- Includes formulas for:
  - Down payment calculations (`=E3*F3/100`)
  - Loan amounts (`=E3-G3`)
  - Monthly payments using PMT function
  - Net and cumulative cash flow
  - ROI percentage
- Adds summary totals row with SUM formulas

**Properties Sheet (`createPropertiesSheet`)**
- Lists all properties with current values
- Calculates appreciation, annual rent, NOI
- Includes Cap Rate and Cash-on-Cash return formulas

**Cash Flow Sheet (`createCashFlowSheet`)**
- Monthly projections for 60 months
- Expense calculations as percentage of rent
- Cumulative cash flow tracking

**ROI Analysis Sheet (`createROISheet`)**
- Overall portfolio performance metrics
- Annualized return calculations
- Break-even analysis

#### 3. Utility Method Tests

**CSV Conversion (`convertToCSV`)**
- Preserves Excel formulas by quoting them
- Handles special characters and commas in data
- Maintains proper CSV formatting

**Phase Data Extraction (`extractPhaseData`)**
- Extracts property information from phase objects
- Parses JSON notes for additional metadata
- Provides sensible defaults for missing data

**Mortgage Calculations (`calculateMonthlyMortgage`)**
- Generates PMT formula strings for Excel
- Handles properties with no mortgage

#### 4. Export Functionality Tests

**File Download (`exportToExcel`)**
- Triggers browser download with correct filename
- Filename format: `portfolio_[SimulationName]_[YYYY-MM-DD].csv`
- Creates proper Blob object with CSV content

#### 5. Edge Case Tests
- Empty phases array handling
- Missing state manager data
- Special characters in property addresses
- Null/undefined value handling

### E2E Tests (`tests/e2e/excel-export.spec.js`)

The E2E tests verify the complete user workflow:

1. **Modal Display** - Export options modal appears with all format choices
2. **Basic Export** - Downloads CSV file with success notification
3. **Formula Verification** - Exported file contains correct Excel formulas
4. **Empty Simulation** - Handles export with no data gracefully
5. **Multiple Properties** - Exports complex portfolios correctly
6. **Special Characters** - Properly escapes quotes and commas
7. **Date Formatting** - Uses DATE() formulas for timeline
8. **Summary Totals** - Includes totals row with SUM formulas
9. **Offline Mode** - Works without network connection
10. **Filename Format** - Preserves simulation name in download
11. **Concurrent Exports** - Handles multiple simultaneous exports

## Running the Tests

### Unit Tests
```bash
npm test excel-export.test.js
```

### E2E Tests
```bash
npm run test:e2e -- tests/e2e/excel-export.spec.js
```

### All Excel Export Tests
```bash
npm test excel-export.test.js && npm run test:e2e -- tests/e2e/excel-export.spec.js --project=chromium
```

## Test Coverage

The test suite achieves comprehensive coverage:

- **Code Coverage**: All public methods tested
- **Formula Coverage**: All Excel formula types verified
- **Edge Cases**: Special characters, empty data, null values
- **User Workflows**: Complete export scenarios
- **Browser Compatibility**: Tests run on Chrome, Firefox, Safari, and mobile browsers

## Key Excel Formulas Tested

1. **Financial Calculations**
   - `PMT()` - Monthly payment calculations
   - `POWER()` - Annualized return calculations

2. **Basic Operations**
   - `SUM()` - Totaling columns
   - `IF()` - Conditional logic
   - Mathematical operations (`+`, `-`, `*`, `/`)

3. **Date Functions**
   - `DATE()` - Timeline date generation

4. **Cell References**
   - Relative references (e.g., `E3`)
   - Range references (e.g., `E2:E10`)
   - Cross-row references (e.g., `N3+O2`)

## Mock Strategy

The unit tests use careful mocking to test the Excel export functionality without requiring a real browser environment:

- `document` and `window` objects mocked
- `Blob` constructor mocked to track file creation
- `URL.createObjectURL` mocked to return test URLs
- DOM manipulation methods mocked to verify download trigger

## Continuous Integration

The tests are designed to run in CI/CD pipelines:
- No external dependencies required
- Mock all browser APIs
- Deterministic test data
- Fast execution time (~1 second for unit tests)

## Future Enhancements

Potential areas for test expansion:
1. Performance tests for large datasets (1000+ properties)
2. Formula complexity validation
3. Excel compatibility verification
4. Internationalization testing
5. Accessibility testing for export UI