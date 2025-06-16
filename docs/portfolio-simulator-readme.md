# Portfolio Simulator - User Guide

## Overview

The Portfolio Simulator is a powerful timeline-based tool for planning real estate investment strategies. It allows you to:
- Set income goals and visualize your path to achieve them
- Add properties with different investment strategies (Buy & Hold, BRRRR, Fix & Flip)
- See portfolio snapshots at key time points
- Track cash flow and equity growth over time
- Save and load different scenarios
- Export your plans for sharing

## Timeline Card System

The simulator uses a visual timeline with two types of cards:

### 📊 Snapshot Cards
Show your portfolio state at specific time points:
- Cash reserves
- Number and types of properties
- Monthly income
- Total equity
- Progress toward goal

### 🏠 Acquisition Cards
Represent property purchases with:
- Property details and price
- Investment strategy
- Financing information
- Impact on cash flow

## Visual Timeline Example

```
Month 0        Month 3         Month 6         Month 9         Month 12
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│📊 Start  │──→│🏠 Buy #1 │──→│📊 Update │──→│🏠 Buy #2 │──→│📊 1 Year │
│          │   │          │   │          │   │          │   │          │
│Cash: 50k │   │442       │   │Cash: 28k │   │556       │   │Cash: 15k │
│Props: 0  │   │Chandler  │   │Props: 1  │   │Melbourne │   │Props: 2  │
│Income: 0 │   │$65k      │   │Inc: $420 │   │$72k      │   │Inc: $980 │
│          │   │Buy&Hold  │   │Equity:14k│   │BRRRR     │   │Eq: $38k  │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

## Getting Started

### 1. Access the Tool
Navigate to the Portfolio Simulator from the main navigation menu or go directly to `/portfolio-simulator.html`

### 2. Set Your Goals
- **Target Monthly Income**: Your desired passive income goal (e.g., $10,000)
- **Initial Capital**: How much money you have to start (e.g., $50,000)
- **Simulation Name**: Give your plan a memorable name

### 3. Build Your Timeline
- Start with Month 0 showing your initial capital
- Click the "+" button to add properties or time snapshots
- Watch how each acquisition affects your metrics
- The timeline automatically shows your progress toward your goal

## Adding Properties

### Method 1: Search Real Detroit Properties
1. Click "Add Property" in the header
2. Use the "Search Properties" tab
3. Enter a Detroit address (e.g., "123 Main St") or max price
4. Click "Search Detroit Properties" to find real parcel data
5. Select a property from the results
6. Review the financial details including:
   - Owner information
   - Last sale price and date
   - Tax status
   - Assessed value
7. Click "Add to Simulation"

### Method 2: Use Sample Properties
1. Click "Add Property" in the header
2. Use the "Search Properties" tab
3. Click "Load Sample Properties" for demo data
4. Filter by price, rent, or address
5. Select and add properties to your simulation

### Method 3: Manual Entry
1. Click "Add Property" in the header
2. Switch to the "Manual Entry" tab
3. Enter property details:
   - Address
   - Purchase price
   - Rehab cost
   - Expected monthly rent
   - Down payment percentage
   - Month to purchase
4. Click "Add to Simulation"

## Understanding the Dashboard

### Metrics
- **Current Monthly Income**: Your projected passive income at the end of the simulation
- **Total Properties**: Number of properties in your portfolio
- **Total Equity**: Combined equity across all properties
- **ROI**: Return on your initial investment

### Timeline Visualization
The timeline shows:
- Green line: Your monthly cash flow over time
- Red dashed line: Your target income goal
- Colored dots: Investment actions (blue=buy, orange=sell, purple=refinance)

### Investment Phases
Each phase shows:
- When it occurs (month number)
- What action to take
- Property details
- Financial impact

## Saving Your Work

### Save Progress
1. Your email will be requested once (stored locally)
2. Click "Save Progress" to save the current simulation
3. The simulation auto-saves when you make changes

### Load Previous Work
- Saved simulations appear in the sidebar
- Click any simulation to load it
- The URL updates with your simulation ID for bookmarking

## Exporting Results

Click "Export" to download a CSV file containing:
- Monthly cash flow projections
- Property counts
- Income and expense breakdowns
- Equity and debt totals
- ROI calculations

## Tips for Success

### Start Conservative
- Begin with properties requiring minimal rehab
- Focus on positive cash flow from day one
- Build reserves before taking bigger risks

### Use the Timeline
- Space out purchases to maintain cash reserves
- Plan refinances after 6-12 months of ownership
- Consider flips to generate capital for more rentals

### Monitor Cash Flow
- Ensure each phase maintains positive cash flow
- Keep 3-6 months of expenses in reserve
- Account for vacancy and maintenance

## Financial Assumptions

The simulator uses these Detroit-specific defaults:
- Property tax: 0.8% of assessed value annually
- Insurance: 0.4% of property value annually
- Maintenance: 1% of property value annually
- Vacancy rate: 8%
- Property management: 8% of rental income
- Closing costs: 3% of purchase price
- Annual appreciation: 3%
- Annual rent growth: 2%
- Mortgage rate: 7% (30-year term)

## Troubleshooting

### Simulation Won't Save
- Check your internet connection
- Ensure you've entered a valid email
- Try refreshing the page and loading again

### Properties Not Showing
- The property selector uses mock data for testing
- Real property integration coming soon
- Use manual entry for specific properties

### Calculations Seem Wrong
- Review the financial assumptions above
- Check your input values
- Remember all calculations are estimates

## Future Features

Coming soon:
- Strategy templates (BRRRR, Fix & Flip, Buy & Hold)
- Real property data integration
- PDF report generation
- Side-by-side scenario comparison
- Market-specific assumptions
- Team collaboration features