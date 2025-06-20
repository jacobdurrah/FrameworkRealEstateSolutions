# Portfolio Simulator V2 - Feature Documentation

## Version: 2.0.0-pre-ai
**Date**: December 20, 2024
**Status**: Stable baseline before AI upgrade

## Core Features

### 1. Strategy Generation (Rule-Based)
- **Three Strategy Types**:
  - Conservative: Focus on steady rental acquisitions
  - Balanced: Mix of rentals and flips
  - Aggressive: Flip-heavy approach for rapid capital growth
- **Fixed Assumptions**:
  - Average property price: $65,000
  - Average rent: $1,300/month
  - Monthly expenses: $350/unit
  - Flip profit: $32,500
  - BRRR duration: 6 months

### 2. Goal Parser
- **Supported Patterns**:
  - Monthly income targets (e.g., "$10K/month")
  - Time horizons (months/years)
  - Starting capital
  - Monthly contributions
  - Strategy preferences
  - Rent/expense specifications
- **Default Values**:
  - Target income: $10,000/month
  - Timeline: 36 months
  - Starting capital: $50,000

### 3. Property Matching with Zillow
- **Real Listings Integration**:
  - Matches simulated properties with actual Detroit listings
  - Provides Zillow links for each property
  - Shows full property addresses
- **Property Types Supported**:
  - Rental properties
  - Flip properties
  - BRRR properties

### 4. Timeline Visualization
- **Modern Table Design**:
  - Responsive layout with scroll indicators
  - Mobile-optimized view
  - Smooth scrolling between sections
- **Editable Fields**:
  - Property details
  - Purchase prices
  - Down payment percentages
  - Interest rates
  - Loan terms
  - Monthly rent
  - Monthly expenses

### 5. Financial Calculations
- **Automatic Calculations**:
  - Down payment amounts
  - Loan amounts
  - Monthly mortgage payments
  - Net monthly income
  - Running cash balance
  - Total portfolio income
- **Summary Statistics**:
  - Total properties
  - Monthly income achieved
  - Total investment
  - Time to goal

### 6. Save/Load Functionality
- **Local Storage**:
  - Save current portfolio state
  - Load previous sessions
  - Multiple save slots
- **Export Options**:
  - Export timeline to CSV
  - Print-friendly view
  - Share portfolio link

### 7. UI/UX Features
- **Responsive Design**:
  - Mobile-friendly layout
  - Touch-optimized controls
  - Adaptive table columns
- **Help System**:
  - Tooltips on hover
  - Collapsible help sections
  - Example queries
- **Visual Feedback**:
  - Loading states
  - Error messages
  - Success indicators

## Technical Architecture

### Frontend Components
- `portfolio-simulator-v3.js` - Main application logic
- `strategy-generator.js` - Rule-based strategy engine
- `goal-parser.js` - Natural language parsing
- `listings-matcher.js` - Zillow integration
- `timeline-renderer-enhanced.js` - Table rendering
- `property-api.js` - API communication

### Backend Services
- Property search API
- Listings database
- Market data integration

### Styling
- `timeline-table-modern.css` - Modern table styles
- Mobile-responsive design
- CSS variables for theming

## Known Limitations
1. Fixed market assumptions (Detroit-specific)
2. Limited strategy flexibility
3. No AI-powered recommendations
4. Basic goal understanding
5. No multi-phase strategies
6. Limited explanation of decisions

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Metrics
- Strategy generation: < 1 second
- Property matching: 3-5 seconds
- Page load: < 2 seconds
- Mobile performance score: 85+

This documentation represents the stable state before implementing AI enhancements.