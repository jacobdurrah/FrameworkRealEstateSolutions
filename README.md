# Framework Real Estate Solutions

A modern real estate investment platform focused on Detroit's affordable housing market, providing comprehensive tools for property analysis and investment decisions.

## 🏠 Overview

Framework Real Estate Solutions helps investors find and analyze properties in Detroit that meet specific investment criteria: acquisition price between $50,000-$100,000 with maximum $10,000 rehabilitation costs. Our platform combines real-time property searches with comprehensive financial analysis tools.

## ✨ Features

### Property Finder with Detroit Parcel Data
- **370,000+ Property Records**: Access comprehensive Detroit parcel data
- **Smart Search**: Find properties matching investment criteria
- **Owner Information**: View property ownership and mailing addresses
- **Neighborhood Data**: See property neighborhoods and districts
- **Portfolio Discovery**: Find all properties owned by the same owner
- **Tax Assessments**: View assessed and taxable values

### Advanced Investment Analysis
- **Professional Proforma Calculator**: 
  - Calculate Cap Rate, Cash on Cash Return, DSCR, ROI, GRM
  - 5-year investment projections with appreciation
  - Educational explanations for each metric
  - Export analysis as PDF or email reports
- **Section 8 Rent Limits**: Current HUD payment standards for Detroit
- **Quick ROI Calculator**: Instant investment return calculations

### Modern User Experience
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
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
    └── proforma-formulas.md # Financial formulas documentation
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
- Buy & Hold, BRRRR, and Fix & Flip strategies

### Investment Criteria:
- Purchase Price: $50,000 - $100,000
- Max Rehab Cost: $10,000
- Target Location: Detroit neighborhoods
- Property Types: Single-family homes
- Focus: Section 8 rental opportunities

## 📱 Mobile Features

- Touch-optimized interface
- Fast loading with lazy data fetching
- Offline capability for saved analyses
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

Built with ❤️ for Detroit's housing future