# Portfolio Simulator V2 - User Guide

## Overview
Portfolio Simulator V2 is an Excel-like real estate investment tool that helps you model complex investment strategies including Fix-and-Flip, BRRR (Buy, Rehab, Rent, Refinance, Repeat), and traditional buy-and-hold investments.

## Getting Started

### Basic Steps
1. **Add Event**: Click "Add Event" to create a new timeline entry
2. **Set Month**: Enter the month number (0 = today, 12 = 1 year from now)
3. **Choose Action**: Select Buy, Sell, Refinance, or Wait
4. **Enter Details**: Fill in property address, price, and financial details
5. **View Summary**: Check the Portfolio Summary for real-time calculations

### Key Features
- **Timeline-based modeling**: Plan events months or years in advance
- **Real-time calculations**: See impact of each change immediately
- **Time projections**: View portfolio value at any future point
- **Cash tracking**: Monitor rental income and sales proceeds separately
- **Auto-save**: Changes saved automatically every 5 seconds

## Investment Strategies

### 🔨 Fix-and-Flip Strategy

#### Step 1: Initial Purchase
- Add a "Buy" event at month 0
- Enter **Total Project Cost** (Purchase Price + Rehab Budget) as the price
- Set down payment to 10-20% of total project cost
- Set monthly expenses (loan interest, utilities, insurance)
- Set rent to $0 during rehab period

#### Step 2: Hold Period
- The property will incur expenses during rehab
- No rental income during this period
- Track your carrying costs

#### Step 3: Sale
- Add a "Sell" event at month 6 (or your planned sale date)
- Enter the After Repair Value (ARV) as sale price
- Check "Cash from Sales" to see your profit
- View "Total Cash on Hand" for available capital

**💡 Pro Tip**: Use the time projection feature (set "View at month" to your sale month) to see total returns including appreciation and carrying costs.

### 🔄 BRRR Strategy
*Buy, Rehab, Rent, Refinance, Repeat*

#### Step 1: Initial Purchase & Rehab
- Follow Fix-and-Flip steps 1-2
- Use total project cost as purchase price
- Plan for 4-6 month rehab period

#### Step 2: Refinance (Simulated)
- Add "Sell" event at month 6 with ARV price
- Immediately add new "Buy" event at same month
- Enter same property address and ARV as new purchase price
- Set 20-25% down payment (standard refinance terms)
- Enter market rent for the property
- Add realistic monthly expenses

#### Step 3: Hold & Repeat
- Property now shows rental income
- Track "Total Cash on Hand" to see available capital
- Use cash from refinance for next BRRR deal
- Repeat process with new properties

**💡 Pro Tip**: The "sell then rebuy" method simulates a cash-out refinance by showing you pulling equity out while keeping the property.

### 🏠 Traditional Buy & Hold

#### Purchase
- Add "Buy" event with property details
- Enter purchase price and down payment %
- Set loan terms (rate and term in years)
- Enter expected monthly rent
- Set monthly expenses (maintenance, insurance, taxes, HOA)

#### Analysis Metrics
- **Net Cash Flow**: Should be positive for good investments
- **Cash-on-Cash Return**: Target 8%+ (Good), 12%+ (Excellent)
- **Equity Growth**: Monitor through time projections
- **Total Return**: Appreciation + Cash Flow + Loan Paydown

## Advanced Features

### 📊 Time-Based Projections
- Use "View at month" input to see future portfolio values
- Properties automatically appreciate at 3% annually
- See accumulated rental income over time
- Track total interest paid on all loans
- Monitor equity growth across portfolio

### 💰 Cash Tracking
- **Rental Income**: Net rent collected after all expenses and loan payments
- **Cash from Sales**: Proceeds from property sales minus loan payoffs
- **Total Cash on Hand**: Combined available capital for new investments

### 📁 Data Management
- **Save**: Store simulation with custom name
- **Load**: Retrieve previously saved simulations
- **Export**: Download complete data as JSON file
- **New Simulation**: Start fresh (prompts to save current)

## Common Scenarios

### House Hacking
1. Buy property with low down payment (3-5%)
2. Set rent = income from other units/rooms
3. Set expenses = your portion after tenant contributions
4. Track your effective living cost and wealth building

### Refinance Existing Property
1. Add "Refinance" event at current month
2. Select the property to refinance
3. Update interest rate and term to new loan terms
4. System automatically updates monthly payment

### Partnership Deals
1. Enter only your portion of down payment
2. Set rent to your ownership percentage of total rent
3. Set expenses to your share of total expenses
4. Track your actual returns based on investment

### Portfolio Scaling
1. Start with first property
2. Use time projections to see when you'll have capital for next deal
3. Add future purchases at projected months
4. Model entire portfolio growth over 5-10 years

## Tips & Best Practices

### Accurate Modeling
- **Include ALL expenses**: Insurance, taxes, maintenance, HOA, utilities, property management
- **Conservative estimates**: Overestimate expenses, underestimate income
- **Vacancy factor**: Reduce rent by 5-10% to account for vacancies
- **Maintenance reserves**: Budget 5-10% of rent for maintenance
- **Capital expenditures**: Set aside funds for major repairs

### Strategic Planning
- **Timeline accuracy**: Set realistic months for each event
- **Market research**: Use actual comps for ARV estimates
- **Financing options**: Model different loan scenarios
- **Exit strategies**: Plan multiple exit options
- **Stress testing**: Model worst-case scenarios

### Using the Tool Effectively
1. **Start simple**: Model one property completely before adding more
2. **Save versions**: Create different simulations for different strategies
3. **Regular updates**: Adjust projections based on actual performance
4. **Compare strategies**: Run parallel simulations to compare options
5. **Long-term view**: Use 5-10 year projections for strategic planning

## Troubleshooting

### Common Issues
- **Calculations not updating?** 
  - Click out of input field (blur) to trigger update
  - Refresh summary with the refresh button
  
- **Can't sell property?** 
  - Property address must match exactly
  - Property must exist in an earlier buy event
  
- **Wrong loan payment?** 
  - Verify loan amount = Price - Down Payment
  - Check interest rate is annual (not monthly)
  - Confirm term is in years
  
- **Missing cash flow?** 
  - Ensure rent is entered
  - Verify expenses are included
  - Check that property has been purchased
  
- **Time projections seem off?** 
  - Confirm event months are set correctly
  - Remember month 0 = today
  - Check all events are in chronological order

### Data Validation
- Months should be sequential or make logical sense
- Sale price should generally be ≥ purchase price
- Down payment typically 3-25% for residential
- Interest rates typically 3-8% for investment properties
- Expenses usually 30-50% of rental income

## Keyboard Shortcuts
- **Tab**: Move to next field
- **Enter**: Confirm input and update calculations
- **Click outside field**: Trigger calculation update

## Support
For additional help or to report issues:
- Check the in-app help (? button)
- Review formula explanations (Formulas button)
- Visit [Framework Real Estate Solutions](https://frameworkrealestatesolutions.com)