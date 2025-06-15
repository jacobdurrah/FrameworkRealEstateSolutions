# Framework Real Estate Solutions

A modern real estate investment platform focused on Detroit's affordable housing market, providing comprehensive tools for property analysis and investment decisions.

## 🏠 Overview

Framework Real Estate Solutions helps investors find and analyze properties in Detroit that meet specific investment criteria: acquisition price between $50,000-$100,000 with maximum $10,000 rehabilitation costs. Our platform combines real-time property searches with comprehensive financial analysis tools.

## ✨ Features

### Property Finder with Detroit Parcel Data
- **370,000+ Property Records**: Access comprehensive Detroit parcel data
- **Multiple Search Methods**: 
  - Search by investment criteria (price, beds, property type)
  - Search by specific address
  - Search by owner name (e.g., "SMITH, JOHN" or "LLC")
  - Search by parcel ID
- **Enhanced Property Cards**:
  - Shows if property is listed for sale or not
  - Displays estimated market value (2x assessed) for non-listed properties
  - Last sale date, price, and years owned
  - Tax status (Taxable/Exempt)
  - Property condition (Improved/Vacant)
  - Direct Zillow links for property photos
- **Owner Information**: View property ownership and find owner's portfolio
- **Neighborhood Data**: See property neighborhoods and districts
- **Tax Assessments**: View assessed and taxable values

### Advanced Investment Analysis
- **Professional Proforma Calculator**: 
  - Calculate Cap Rate, Cash on Cash Return, DSCR, ROI, GRM
  - 5-year investment projections with appreciation
  - Educational explanations for each metric (6th grade level)
  - Export analysis as PDF or email reports
- **BRRRR Strategy Calculator**: 
  - Calculate refinance potential at 75% LTV
  - See cash back and money left in deal
  - Project new monthly payments and cash flow
- **Section 8 Rent Limits**: Current HUD payment standards for Detroit
- **Quick ROI Calculator**: Instant investment return calculations

### Modern User Experience
- **Mobile-First Design**: 
  - Responsive hamburger menu navigation
  - Touch-optimized property cards
  - Works perfectly on all devices
- **Professional Branding**: Updated Framework logo and visual identity
- **Real-time Updates**: Property data loads asynchronously for fast browsing
- **WhatsApp Integration**: Direct communication for property inquiries
- **Interactive Chatbot**: AI assistant for property searches and questions

## 🚀 Getting Started

### View Live Site
Visit: https://jacobdurrah.github.io/FrameworkRealEstateSolutions/

### For Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/jacobdurrah/FrameworkRealEstateSolutions.git
   cd FrameworkRealEstateSolutions
   ```

2. **Configure APIs (Optional)**
   - Copy `.env.example` to `.env`
   - Add your API keys for enhanced property data

3. **Run locally**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Or using Node.js
   npx http-server
   ```

4. **Open in browser**
   ```
   http://localhost:8000
   ```

## 📁 Project Structure

```
/
├── index.html              # Homepage
├── property-finder.html    # Property search tool
├── affordable-housing.html # Current listings
├── js/
│   ├── property-finder.js  # Search functionality
│   ├── proforma-calculator.js # Investment calculations
│   ├── parcel-api.js      # Parcel data integration
│   └── app-config.js      # Configuration
├── css/
│   ├── style.css          # Main styles
│   ├── property-finder.css # Property finder styles
│   └── proforma.css       # Calculator styles
├── backend-scripts/       # Data management tools
│   ├── upload-parcel-data.js
│   └── schema.sql
└── docs/
    ├── proforma-formulas.md # Financial formulas documentation
    ├── PROPERTY_API_GUIDE.md # API integration guide
    ├── BLOCK_ANALYSIS_GUIDE.md # Spatial analysis documentation
    └── TAX_STATUS_DATA_FLOW.md # Tax status data explanation
```

## 🔧 Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Database**: Supabase (PostgreSQL) for parcel data
- **Hosting**: GitHub Pages
- **APIs**: Supabase REST API for property data
- **Architecture**: Serverless, API-first design

## 📊 Parcel Data Integration

The platform integrates with Detroit's public parcel data:
- 370,000+ property records
- Real-time API queries with caching
- Indexed searches by address, owner, neighborhood
- Comprehensive property details including ownership, tax values, and sale history

## 🛠️ Advanced Features

### Proforma Analysis Includes:
- Net Operating Income (NOI)
- Cap Rate with market benchmarks
- Cash on Cash Return calculations
- Debt Service Coverage Ratio (DSCR)
- Gross Rent Multiplier (GRM)
- Total Return on Investment (ROI)
- 5-year cash flow projections
- **Investment Strategies**:
  - Buy & Hold with long-term projections
  - BRRRR with refinance calculator
  - Fix & Flip (coming soon)

### Investment Criteria:
- Purchase Price: $50,000 - $100,000
- Max Rehab Cost: $10,000
- Target Location: Detroit neighborhoods
- Property Types: Single-family homes
- Focus: Section 8 rental opportunities

## 📱 Mobile Features

- Hamburger menu navigation for easy mobile access
- Touch-optimized property cards and forms
- Fast loading with lazy data fetching
- Responsive design that adapts to all screen sizes
- Progressive enhancement approach

## 🔒 Security & Privacy

- No sensitive data stored client-side
- Secure API communications
- Public data only (no private information)
- HTTPS enforced on production

## 🤝 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Contact

Framework Real Estate Solutions  
📱 WhatsApp: +1 (313) 451-7107  
🌐 Website: https://jacobdurrah.github.io/FrameworkRealEstateSolutions/

---

## 🆕 Recent Updates (January 2025)

- **Mobile Navigation**: Added hamburger menu for better mobile experience
- **Enhanced Property Cards**: Now show market value estimates, sale history, and years owned
- **BRRRR Calculator**: Fully functional refinance analysis tool
- **Tax Status Display**: Fixed to show actual tax status (Taxable/Exempt)
- **Owner Search**: Added format examples for better user experience
- **Removed Block Search**: Simplified interface by removing complex spatial search

Built with ❤️ for Detroit's housing future