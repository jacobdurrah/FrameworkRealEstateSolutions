# Portfolio Simulator V3 - Product Requirements Document

## Executive Summary

Portfolio Simulator V3 is an intelligent, goal-based real estate portfolio planning tool that transforms natural language investment objectives into actionable timeline strategies. Building upon the proven calculation engine and UI components of Simulator V2, V3 adds an AI-powered strategy generation layer that automatically creates optimal investment sequences combining fix-and-flip, BRRR (Buy, Rehab, Rent, Refinance, Repeat), and buy-and-hold rental strategies.

## 📘 Product Overview

### Vision
Enable users to describe their real estate investment goals in plain language and receive a comprehensive, timeline-based investment strategy that shows exactly how to achieve those goals using a mix of active and passive real estate investment techniques.

### Key Differentiators
- **Natural Language Interface**: No complex forms or financial jargon required
- **Intelligent Strategy Generation**: AI optimizes the mix of investment types
- **Proven Calculation Engine**: Leverages V2's battle-tested financial logic
- **Visual Timeline Output**: Clear, actionable roadmap to achieve goals
- **Real-World Constraints**: Ensures positive cash flow throughout the journey

## 🎯 Goals and Objectives

### Primary Goals
1. **Simplify Portfolio Planning**: Transform complex multi-strategy planning into a single text prompt
2. **Accelerate Decision Making**: Generate optimal strategies in seconds, not hours
3. **Educate Through Visualization**: Show users how different strategies work together
4. **Maximize Code Reuse**: Build on V2's proven foundation (80%+ code reuse target)

### Success Metrics
- Generate valid strategies in <3 seconds
- Achieve 90%+ feasible plan generation rate
- User satisfaction score >4.5/5
- Reduce portfolio planning time by 75%
- Successfully parse 95%+ of natural language inputs

## 👥 Target Users

### Primary Users
1. **New Investors**: Need guidance on how to start and scale
2. **Portfolio Planners**: Want to model different scenarios quickly
3. **Investment Advisors**: Need to demonstrate strategies to clients
4. **Experienced Investors**: Want to optimize their approach

### User Stories

**Story 1: Goal-Driven Investor**
> "As a new investor with $50K in savings, I want to generate $10K/month in passive income within 3 years, so I need a clear plan showing which properties to buy, flip, or hold and when."

**Story 2: Capital-Constrained Planner**
> "As someone with limited capital ($30K) but good cash flow ($3K/month), I want to know the fastest way to build a rental portfolio without running out of money."

**Story 3: Strategy Optimizer**
> "As an experienced investor, I want to compare different strategy mixes (heavy flip vs heavy rental) to see which reaches my goals faster with less risk."

## 📋 Functional Requirements

### 1. Natural Language Input Processing

#### Input Components
- **Goal Description Text Area**: Multi-line input for comprehensive goal description
- **Smart Parsing Engine**: Extracts key parameters from natural language
- **Validation & Defaults**: Fills missing values with sensible defaults

#### Parsed Parameters
- **Target Monthly Income**: e.g., "$10,000/month"
- **Time Horizon**: e.g., "within 36 months"
- **Starting Capital**: e.g., "I have $50K"
- **Monthly Contributions**: e.g., "can save $2K/month"
- **Strategy Preferences**: e.g., "prefer BRRR over flips"
- **Risk Tolerance**: e.g., "conservative approach"
- **Market Assumptions**: e.g., "assuming 3% appreciation"

#### Example Inputs
```
"Build a portfolio generating $10K/month in 3 years with $50K starting capital"

"I have $30K and can save $2K/month. Want $5K passive income ASAP using BRRR strategy"

"Generate $15K/month within 5 years. Aggressive approach OK. $100K to start."
```

### 2. Strategy Generation Engine

#### Core Algorithm
1. **Goal Analysis**: Determine required portfolio size and composition
2. **Capital Planning**: Map available capital over time
3. **Strategy Selection**: Choose optimal mix of investment types
4. **Timeline Generation**: Create month-by-month action plan
5. **Constraint Validation**: Ensure positive cash flow throughout
6. **Optimization**: Iterate to find fastest/safest path to goal

#### Strategy Components

**Buy-and-Hold Rentals**
- Provide steady monthly income
- Build long-term equity
- Lower risk, slower growth
- Typical: $1,200-1,400/month income per property

**Fix-and-Flip Projects**
- Generate quick capital ($25K-40K profit)
- Fund down payments for rentals
- Higher risk, active management
- 6-month typical timeline

**BRRR Properties**
- Combine benefits of both strategies
- Recycle capital through refinancing
- 70% cash-out refinance after stabilization
- 6-month seasoning period

#### Constraint Management
- Maintain positive monthly cash flow
- Ensure adequate reserves for contingencies
- Respect financing limits (LTV ratios)
- Account for seasonal timing
- Consider market capacity

### 3. User Interface Components

#### Goal Input Section
```
+----------------------------------------------------------+
| 🧠 Describe Your Real Estate Investment Goal              |
| ┌────────────────────────────────────────────────────┐  |
| │ Build a portfolio that generates $10K/month        │  |
| │ within 36 months. Use mix of flips, BRRR, and     │  |
| │ rentals. I have $50K cash and can add $2K/month.  │  |
| │                                                    │  |
| │ [Examples ▼]                                       │  |
| └────────────────────────────────────────────────────┘  |
|                                                          |
| [🚀 Generate Strategy]  [⚙️ Adjust Assumptions]          |
+----------------------------------------------------------+
```

#### Strategy Options Panel
```
+----------------------------------------------------------+
| 📊 Strategy Approach:                                     |
| ( ) Conservative (Rental-focused, lower risk)             |
| (•) Balanced (Mix of strategies)                          |
| ( ) Aggressive (Flip-heavy, faster growth)                |
| ( ) Custom (Adjust parameters below)                      |
+----------------------------------------------------------+
```

#### Assumptions Override Panel
```
+----------------------------------------------------------+
| ⚙️ Assumptions (Click to adjust)                          |
| ┌────────────────────────────────────────────────────┐  |
| │ Property Prices: $50K - $80K      [----■----]      │  |
| │ Rental Income: $1,200 - $1,400    [-----■---]      │  |
| │ Monthly Expenses: $350/property    [---■-----]      │  |
| │ Flip Profit: $25K - $40K          [----■----]      │  |
| │ BRRR Cash-Out: 70% of ARV         [------■--]      │  |
| │ Interest Rate: 7%                  [----■----]      │  |
| │ Down Payment: 20%                  [--■------]      │  |
| └────────────────────────────────────────────────────┘  |
+----------------------------------------------------------+
```

### 4. Output Components (Reusing V2)

All output components will be identical to V2:
- **Timeline Table**: Month-by-month events
- **Portfolio Summary**: Key metrics and totals
- **Property List**: Individual property details
- **Cash Flow Charts**: Visual income progression
- **Equity Growth**: Wealth accumulation over time

### 5. Integration Requirements

#### V2 Component Reuse
- Use existing `timelineData` structure
- Leverage `portfolioState` management
- Reuse all calculator classes
- Maintain same event types (Buy, Sell)
- Keep identical UI components

#### New V3 Components
- Goal parser module
- Strategy generator engine
- Natural language processor
- Strategy explanation generator
- Assumption override interface

## 🏗️ Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Goal Input  │  │Strategy Panel│  │ V2 Components │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘  │
└─────────┼─────────────────┼──────────────────┼──────────┘
          │                 │                  │
┌─────────▼─────────────────▼──────────────────▼──────────┐
│                    V3 Logic Layer                        │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Goal Parser │  │Strategy Gen  │  │  Validator    │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘  │
└─────────┼─────────────────┼──────────────────┼──────────┘
          │                 │                  │
┌─────────▼─────────────────▼──────────────────▼──────────┐
│                 V2 Calculation Engine                    │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │Timeline Mgmt│  │Financial Calc│  │Portfolio State│  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### File Structure
```
/portfolio-simulator-v3.html         # Main V3 page
/js/
  ├── portfolio-simulator-v3.js      # V3 main logic
  ├── strategy-generator.js          # Strategy generation engine
  ├── goal-parser.js                 # Natural language parsing
  └── portfolio-simulator-v2.js      # Reused V2 engine
/docs/
  └── specs/
      └── simulator_v3_prd.md        # This document
```

### Key Classes and Modules

#### GoalParser
```javascript
class GoalParser {
  parse(naturalLanguageInput) {
    return {
      targetMonthlyIncome: number,
      timeHorizon: number,
      startingCapital: number,
      monthlyContributions: number,
      strategyPreference: string,
      constraints: object
    };
  }
}
```

#### StrategyGenerator
```javascript
class StrategyGenerator {
  generate(parsedGoal, assumptions) {
    return {
      timeline: TimelineEvent[],
      feasibility: boolean,
      alternativeStrategies: Strategy[],
      explanation: string
    };
  }
}
```

## 📊 Default Assumptions

### Market Assumptions (Detroit Focus)
- **Property Purchase Range**: $50,000 - $80,000
- **Monthly Rent Range**: $1,200 - $1,400
- **Property Appreciation**: 3% annually
- **Rent Growth**: 2% annually
- **Market Vacancy Rate**: 5%

### Financial Assumptions
- **Rental Property Down Payment**: 20%
- **Flip Project Down Payment**: 10-15%
- **Rental Mortgage Rate**: 7% (30-year)
- **Flip Financing Rate**: 10-12% (interest-only)
- **Monthly Property Expenses**: $350 (taxes, insurance, maintenance)
- **Property Management**: 8% of rent

### Strategy Assumptions
- **Flip Timeline**: 6 months (4 rehab + 2 selling)
- **Flip Profit Range**: $25,000 - $40,000
- **BRRR Timeline**: 6 months to refinance
- **BRRR Cash-Out**: 70% of ARV
- **Rental Setup Time**: 1 month
- **Minimum Cash Reserve**: $5,000

## 🚀 Implementation Phases

### Phase 1: Foundation & Static Demo (Week 1-2)

**Objectives**
- Set up V3 page structure
- Implement basic goal parsing
- Create simple strategy generation
- Integrate with V2 components

**Deliverables**
1. `portfolio-simulator-v3.html` with goal input UI
2. `goal-parser.js` with basic NLP parsing
3. `strategy-generator.js` with rule-based logic
4. Working demo with static strategies

**Key Tasks**
- [ ] Copy V2 template and create V3 page
- [ ] Design and implement goal input section
- [ ] Build natural language parser for common patterns
- [ ] Create basic strategy generation rules
- [ ] Wire up to V2 timeline and calculation engine
- [ ] Add loading states and basic error handling

### Phase 2: Dynamic Strategy Engine (Week 3-4)

**Objectives**
- Enhance strategy generation intelligence
- Add multiple strategy variations
- Implement constraint validation
- Create feedback mechanisms

**Deliverables**
1. Enhanced strategy generator with optimization
2. Multiple strategy approach options
3. Constraint validation system
4. Strategy explanation generator

**Key Tasks**
- [ ] Implement strategy optimization algorithm
- [ ] Add conservative/balanced/aggressive modes
- [ ] Build cash flow constraint validator
- [ ] Create strategy comparison logic
- [ ] Add explanation text generation
- [ ] Implement feasibility checking

### Phase 3: Enhanced Features (Week 5-6)

**Objectives**
- Add assumption customization
- Implement strategy comparison
- Create export functionality
- Add advanced scenarios

**Deliverables**
1. Assumption override panel with sliders
2. Side-by-side strategy comparison
3. PDF export functionality
4. Risk analysis features

**Key Tasks**
- [ ] Build assumption adjustment UI
- [ ] Create real-time recalculation
- [ ] Implement strategy comparison view
- [ ] Add PDF report generation
- [ ] Build risk scenario modeling
- [ ] Create help documentation

### Phase 4: Integration & Polish (Week 7-8)

**Objectives**
- Connect to real property data
- Polish UI/UX
- Comprehensive testing
- Performance optimization

**Deliverables**
1. Property data integration
2. Polished, responsive UI
3. Comprehensive test suite
4. Deployed V3 simulator

**Key Tasks**
- [ ] Integrate with property listings API
- [ ] Add loading animations and transitions
- [ ] Implement comprehensive error handling
- [ ] Create unit and integration tests
- [ ] Optimize performance for quick generation
- [ ] Deploy and monitor initial usage

## 📈 Success Metrics & KPIs

### Performance Metrics
- **Generation Speed**: <3 seconds for standard strategies
- **Parse Success Rate**: >95% of natural language inputs
- **Strategy Feasibility**: >90% of generated strategies achievable
- **Code Reuse**: >80% from V2 components

### User Experience Metrics
- **Time to First Strategy**: <1 minute from landing
- **User Satisfaction**: >4.5/5 rating
- **Completion Rate**: >80% of started simulations
- **Return Usage**: >60% of users create multiple scenarios

### Business Impact Metrics
- **Planning Time Reduction**: 75% faster than manual
- **Strategy Diversity**: Average 3+ strategies per user
- **Goal Achievement Rate**: Simulated strategies achieve goals
- **Adoption Rate**: 50% of advisors using within 3 months

## 🔒 Security & Privacy Considerations

### Data Handling
- No personal financial data stored
- Scenarios saved anonymously
- Secure API communication
- Input validation to prevent injection

### Access Control
- Authentication required for full features
- Rate limiting on API calls
- Audit logging for compliance
- Role-based access for advisors

## 🚦 Risks & Mitigation

### Technical Risks
1. **NLP Parsing Accuracy**
   - Mitigation: Extensive test cases, fallback forms
2. **Strategy Generation Complexity**
   - Mitigation: Start simple, iterate based on feedback
3. **Performance at Scale**
   - Mitigation: Caching, efficient algorithms

### Business Risks
1. **User Adoption**
   - Mitigation: Intuitive UI, comprehensive examples
2. **Unrealistic Expectations**
   - Mitigation: Clear disclaimers, conservative defaults
3. **Market Changes**
   - Mitigation: Adjustable assumptions, regular updates

## 📅 Timeline & Milestones

### Week 1-2: Foundation
- Goal parsing implemented
- Basic strategy generation working
- V2 integration complete

### Week 3-4: Intelligence
- Advanced strategies available
- Constraint validation active
- Multiple approaches possible

### Week 5-6: Enhancement
- Customization features live
- Export functionality ready
- Comparison tools built

### Week 7-8: Polish
- Full feature set complete
- Testing comprehensive
- Ready for deployment

## 🎉 Future Enhancements

### Version 3.1
- Machine learning optimization
- Historical data integration
- Multi-market support
- Tax optimization strategies

### Version 3.2
- Collaborative planning
- Real-time market data
- Automated deal finding
- Portfolio tracking integration

### Version 4.0
- Full AI assistant
- Voice input support
- Predictive analytics
- Automated execution

## 📝 Appendix

### Example Strategies

**Conservative Approach**
```
Month 1-3: Acquire 2 rental properties ($30K capital)
Month 4-12: Accumulate rental income
Month 13: Acquire 3rd rental
Month 14-24: Continue acquiring rentals
Result: $4,500/month by month 24
```

**Aggressive Approach**
```
Month 1: Start flip project ($15K)
Month 7: Complete flip (+$35K profit)
Month 8-9: Acquire 3 rentals with profit
Month 10: Start BRRR project
Month 16: Refinance BRRR, start next flip
Result: $6,000/month by month 24
```

**Balanced Approach**
```
Month 1: Buy first rental
Month 3: Start flip project
Month 9: Use flip profit for 2 more rentals
Month 12: BRRR property
Month 18: Refinance and expand
Result: $5,200/month by month 24
```

---

*This PRD represents the complete specification for Portfolio Simulator V3. It builds upon the proven foundation of V2 while adding intelligent, goal-based strategy generation to make real estate portfolio planning accessible to everyone.*