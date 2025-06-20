# Manual Test Instructions for Property Address Fix

## Test on Portfolio Simulator V2

1. **Navigate to**: https://frameworkrealestatesolutions.com/portfolio-simulator-v2.html

2. **Add timeline events**:
   - Click "Add Event" button (blue button in top right of timeline table)
   - You should see a new row with empty fields
   - In the Property column, you should see an empty text input field

3. **Fill in property names manually**:
   - Type "Rental 1" in the first property field
   - Add more events and name them "Rental 2", "Rental 3", etc.
   - Fill in prices (e.g., 65000, 70000, 75000)

4. **Observe the initial state**:
   - Property fields should show the names you typed
   - No Zillow links should be visible yet

5. **Click "Find Actual Listings"** button (if available)
   - Property fields should update to show: "Rental 1: [actual address]"
   - A blue Zillow link icon should appear next to each property
   - The address should remain visible in the input field

## Test on Portfolio Simulator V3

1. **Navigate to**: https://frameworkrealestatesolutions.com/portfolio-simulator-v3.html

2. **Enter a goal**: 
   - Type: "I want to build a $10,000/month rental portfolio in 5 years"

3. **Click "Generate Strategy"**
   - Wait for the AI to generate a strategy (may take 10-30 seconds)

4. **Click "Apply to Timeline"**
   - The timeline table should populate with events
   - Check if property names like "Rental 1", "Rental 2" appear

5. **Click "Find Actual Listings"**
   - Properties should update to show full addresses
   - Zillow links should appear

## Expected Results

✅ **Before "Find Actual Listings"**:
- Property fields show: "Rental 1", "Rental 2", etc.
- No Zillow links visible

✅ **After "Find Actual Listings"**:
- Property fields show: "Rental 1: 123 Main St, Detroit, MI 48205"
- Blue Zillow link icons appear next to each property
- Clicking the link opens the property on Zillow

❌ **Known Issues to Check**:
- Property field becomes empty after clicking "Find Actual Listings"
- Only the Zillow link icon appears without the address text
- Property names don't show initially