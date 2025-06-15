# Changelog

All notable changes to Framework Real Estate Solutions will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.3.0] - 2025-01-15

### Added
- **Mobile Navigation**: Hamburger menu for all pages with smooth animations
- **BRRRR Calculator**: Fully functional Buy-Rehab-Rent-Refinance-Repeat analysis
  - Calculates refinance at 75% LTV
  - Shows cash back potential
  - Projects new monthly payments and cash flow
- **Enhanced Property Information**:
  - "Not Listed for Sale" badge for database properties
  - Estimated market value (2x assessed value) for non-listed properties
  - Last sale date and price with years owned calculation
  - Zillow integration links for property photos
- **Owner Search Examples**: Format hints like "SMITH, JOHN" or "DETROIT LAND BANK"
- **Tax Status Documentation**: Comprehensive guide on tax status data flow

### Changed
- **Company Logo**: Updated to new Framework branding (IMG_0098.jpg)
- **Property Cards**: Redesigned with more financial metrics visible
- **Tax Status Display**: Now shows "Taxable" or "Tax Exempt" instead of misleading "Tax Delinquent"
- **Mobile Responsiveness**: Improved throughout all pages

### Removed
- **Search by Block**: Removed complex spatial search to simplify interface
- **Mailing Address Search Button**: Removed from property cards for cleaner UI

### Fixed
- Tax status always showing as "delinquent" - now properly displays tax exemption status
- Mobile menu not appearing on smaller screens
- Property images not loading for database entries

## [2.2.0] - 2025-01-14

### Added
- Comprehensive API documentation for Zillow, Supabase, and Detroit ArcGIS
- Block analysis guide for spatial property searches
- Multiple search methods (address, owner, parcel ID, block)
- 6th grade level explanations for financial metrics

### Changed
- Enhanced property finder with tabbed search interface
- Improved financial metric displays on property cards

## [2.1.0] - 2025-01-13

### Added
- Detroit parcel data integration (370,000+ properties)
- Owner portfolio search functionality
- Neighborhood data display
- Tax assessment information

### Changed
- Migrated from static data to dynamic Supabase queries
- Improved search performance with caching

## [2.0.0] - 2025-01-10

### Added
- Professional proforma calculator with multiple investment strategies
- Section 8 rent limits for Detroit
- Export functionality for investment analysis
- Educational tooltips for financial metrics

### Changed
- Complete UI redesign with modern aesthetic
- Improved mobile responsiveness
- Enhanced property card layouts

## [1.0.0] - 2024-12-15

### Added
- Initial release
- Basic property finder functionality
- ROI calculator
- Contact forms
- WhatsApp integration

[Unreleased]: https://github.com/jacobdurrah/FrameworkRealEstateSolutions/compare/v2.3.0...HEAD
[2.3.0]: https://github.com/jacobdurrah/FrameworkRealEstateSolutions/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/jacobdurrah/FrameworkRealEstateSolutions/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/jacobdurrah/FrameworkRealEstateSolutions/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/jacobdurrah/FrameworkRealEstateSolutions/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/jacobdurrah/FrameworkRealEstateSolutions/releases/tag/v1.0.0