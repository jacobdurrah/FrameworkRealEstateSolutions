# Portfolio Simulator V3 - Quick Test Checklist

## Pre-Test Setup
- [ ] Open browser console to check for errors
- [ ] Clear browser cache if testing updates
- [ ] Have test data ready (goals, queries)

## 1. Basic V3 Functionality (portfolio-simulator-v3.html)

### Goal Input
- [ ] Navigate to portfolio-simulator-v3.html
- [ ] Enter goal: "I want $10K/month within 36 months. I have $50K to start and can save $2K/month."
- [ ] Click "Generate Strategy" or press Enter
- [ ] Verify parsed goal displays correctly
- [ ] Check that 3 strategy cards appear

### Strategy Selection
- [ ] Click "Conservative" strategy card
- [ ] Verify timeline populates with buy events
- [ ] Click "Balanced" strategy card
- [ ] Verify timeline updates with mix of buys/sells
- [ ] Click "Aggressive" strategy card
- [ ] Verify timeline shows flip-heavy approach

### Real Listings Toggle
- [ ] Toggle "Use Real Listings" switch ON
- [ ] Wait for loading to complete
- [ ] Verify some properties show real addresses
- [ ] Check that Zillow links work (open in new tab)
- [ ] Toggle OFF and verify generic names return

### Example Queries
- [ ] Click each example query chip
- [ ] Verify goal text updates
- [ ] Verify strategy generates successfully

## 2. Market Analysis Tool (market-analysis.html)

### Basic Queries
- [ ] Navigate to market-analysis.html
- [ ] Enter: "Show me the top 10 buyers"
- [ ] Click "Run Analysis"
- [ ] Verify results table appears
- [ ] Check row count matches query

### Export Functions
- [ ] With results displayed, click "Export CSV"
- [ ] Verify CSV downloads with correct data
- [ ] Click "Export JSON"
- [ ] Verify JSON downloads with query metadata

### Query Suggestions
- [ ] Click suggestion chips
- [ ] Verify each runs successfully
- [ ] Check variety of result formats

### Query History
- [ ] Run 3-4 different queries
- [ ] Verify history updates after each
- [ ] Click history item to re-run query

## 3. Integration Tests

### V2 Compatibility
- [ ] After V3 generates timeline, manually edit a row
- [ ] Verify calculations update correctly
- [ ] Add new manual row
- [ ] Delete a V3-generated row
- [ ] Check financial projections remain accurate

### Navigation
- [ ] From index.html, verify V3 link works
- [ ] From index.html, verify Market Analysis link works
- [ ] Check all back navigation works

### Error Handling
- [ ] Enter gibberish goal text
- [ ] Verify error message appears
- [ ] Enter invalid market query
- [ ] Verify appropriate error handling
- [ ] Test with network disconnected (for API calls)

## 4. Visual/UX Tests

### Responsive Design
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] Verify all elements remain usable

### Loading States
- [ ] Check loading spinner appears during generation
- [ ] Verify loading messages are descriptive
- [ ] Ensure no UI freezing during operations

### Styling Consistency
- [ ] Compare V3 styling with V2
- [ ] Check dark mode if applicable
- [ ] Verify hover states work
- [ ] Check focus states for accessibility

## 5. Performance Tests

### Speed Tests
- [ ] Goal parsing: Should be instant (<100ms)
- [ ] Strategy generation: Should complete <1s
- [ ] Market queries: Should complete <5s

### Memory Usage
- [ ] Generate multiple strategies
- [ ] Monitor browser memory usage
- [ ] Verify no memory leaks

## 6. Console Checks
- [ ] No JavaScript errors in console
- [ ] No 404s for resources
- [ ] No CORS errors
- [ ] No deprecation warnings

## Test Results Summary

**Date**: _______________
**Tester**: _______________
**Environment**: [ ] Local [ ] Live

**Overall Status**: [ ] PASS [ ] FAIL

**Issues Found**:
1. _________________________________
2. _________________________________
3. _________________________________

**Notes**:
_____________________________________
_____________________________________
_____________________________________