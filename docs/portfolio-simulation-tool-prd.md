# Real Estate Portfolio Simulation Tool - Product Requirements Document (PRD)

## Overview

This document outlines the Product Requirements for a Real Estate Portfolio Simulation Tool. The goal of this feature is to enable internal team members (and, eventually, investors) to create a hypothetical real estate investment portfolio and strategy. Users will be able to simulate a series of property investment moves (rentals, flips, refinances, etc.) over time, with the objective of achieving a target monthly passive income. The tool will calculate the investment needed and the time required to reach a specified monthly income, providing a clear roadmap or timeline. This will help visualize a portfolio build-out process step-by-step, ensuring that each phase of investment maintains positive cash flow or at least breaks even.

### Why this tool?

Real estate investing success greatly depends on having a well-defined strategy and timeline. A clear plan acts as a "compass" for investors, helping them stay on track toward their financial goals. By modeling different investment strategies (e.g. buy-and-hold rentals vs. fix-and-flip projects) within a single simulation, the company can illustrate to investors how combining these approaches can accelerate wealth building. Active income strategies like flipping houses generate quick capital that can be reinvested, while passive income assets like rental properties provide steady cash flow to cover expenses and debt.

Industry data supports this combined approach – for example, the median profit on a flipped house in 2024 was about $73,500, providing substantial capital that can be redeployed into rentals or new projects. Meanwhile, rentals offer ongoing income that can service loans and provide stability to the portfolio. This simulation tool will let us demonstrate such strategies dynamically, rather than relying on static spreadsheets or anecdotal advice.

In summary, the Portfolio Simulation Tool will empower the team to generate a strategic investment plan, phase by phase, answering questions like: "If I start with $X, how can I reach $Y per month in income? What properties should I buy, flip, or hold, and in what order? How long will it take?" All of this will be visualized on a timeline dashboard and accompanied by financial metrics at each step.

## Goals and Objectives

### 1. Visualize Investment Strategy
Allow users to create a custom, step-by-step investment plan (a sequence of property acquisitions, flips, refinances, etc.) aimed at achieving a target monthly net income (post-expenses, post-debt service). The plan will be visualized as a timeline with clearly marked phases/milestones.

### 2. Dynamic Simulation
Compute how much capital is required and how much time it will take to reach the user's income goal, under various scenarios. If the user specifies a monthly income goal, the tool should output a feasible sequence of investments to reach it. If the user has a fixed budget or timeframe, the tool can show the attainable monthly income.

### 3. Ensure Positive Cash Flow in Each Phase
Enforce or encourage strategies where each phase is at least cashflow-neutral or positive. For example, if a fix-and-flip project is undertaken, the carrying costs (loan interest, etc.) should be covered by rental income from other properties in the portfolio. This addresses a key concern: not running negative during the growth process.

### 4. Leverage Actual Listings
Integrate with our existing Listings API (Detroit properties database) to source real properties for the simulation. The tool can suggest properties that meet certain criteria (price, rental income, etc.), or allow the user to search and select actual listings to include in their hypothetical portfolio. This makes the simulation realistic and grounded in current market opportunities.

### 5. Interactive Dashboard UI
Provide an interactive dashboard where users can input assumptions, add or remove investment "phases", and immediately see the impact on their timeline and financial outcomes. Key outputs include a timeline visualization of the strategy, summary statistics (total cash invested, total equity, monthly cash flow, etc.), and per-property details. The interface should be intuitive for internal users and presentable to investors.

### 6. Timeline & Milestones
Display a timeline visualization that maps out each phase chronologically (e.g., Phase 1: purchase rental property in Month 0-1; Phase 2: rental income accrues from Month 2 onward; Phase 3: start flip project in Month 6, complete by Month 14; etc.). This helps set clear milestones and lets users track progression toward the goal. The timeline should highlight key events (purchase, rehab complete, tenant occupied, refinance, sale) and the corresponding changes in cash flow or equity.

### 7. Financial Modeling
Internally, implement robust financial calculations for each investment move:
- Calculate purchase and financing needs (down payments, loan amounts) for each property
- Estimate rehab costs and timelines for flips or BRRRR projects
- Estimate rental income and expenses for rental properties (including mortgage payments, taxes, etc.) to derive net monthly cash flow per property
- Account for refinancing (cash-out refinance in a BRRRR scenario) after a certain holding period (e.g., after 6-12 months of ownership) to pull out equity
- Account for property appreciation over time (using assumptions per market or zip code) and rent growth (inflation adjustment) if applicable
- Incorporate seasoning periods where necessary (e.g., assume a property must be held X months before refinance is allowed, in line with typical lender requirements)

### 8. Downloadable Report
Enable users to export the simulation results – for example, generate a PDF report or download containing the timeline chart and a summary of the investment plan. This report can be shared with investors or saved for record-keeping. The output should include the list of properties (or property archetypes) used, the sequence of actions, key assumptions, and the projected financial outcomes.

### 9. Single-User Scope (for now)
Assume a single-user context (one plan at a time, no multi-tenant features needed initially). The focus is on interactive planning rather than collaborative or concurrent use. The architecture should, however, be extensible to multi-user in the future (e.g., each user saving their scenarios).

## Non-Goals

### 1. Live Transaction Execution
This tool will not execute any real trades or affect actual portfolio holdings. It is a planning and simulation tool only. Users will not actually purchase properties through this system; they will only simulate and plan.

### 2. Exact Prediction of Market Conditions
The simulation provides estimates based on user-provided or default assumptions. It is not intended to perfectly predict future market values, interest rate changes, or guarantee investment performance. (However, it will allow adjusting assumptions to model different scenarios).

### 3. Comprehensive Underwriting Tool
While it calculates finances for each property, the tool is not a full underwriting or deal analysis platform for every detail. It uses simplified models (e.g., average expense ratios, standard loan terms) to keep the simulation easy to use. Detailed deal analysis might be handled by separate tools or by exporting the data.

### 4. Multi-City/General Market Support (Phase 1)
Initially we focus on Detroit listings and typical Detroit market assumptions. Adapting the tool for other markets or a nationwide scope is out of scope for the first iteration (though it may be considered later).

### 5. Multi-User Accounts and Sharing
As an internal tool MVP, we are not building features for user account management, scenario sharing between users, real-time collaboration, etc., at this stage.

### 6. Portfolio Tracking of Actual Assets
The initial version handles simulated/hypothetical portfolios. Using this system to input a user's existing real portfolio and track it in real-time (for performance monitoring) is out-of-scope for now. (That is envisioned as a later extension – see Future Enhancements).

## Target Users / Audience

### 1. Internal Investment Team
The primary users are our internal team members (investment analysts, portfolio managers, and sales reps who work with investors). They will use the tool to model strategies for our company's portfolio growth or to demonstrate scenarios to potential investors. For example, an analyst can create a scenario to show how an investor's $50k could be leveraged into a $10k/month passive income over 2-3 years using our strategy and Detroit properties.

### 2. Company Leadership
Executives and strategists might use the simulation to plan the company's own portfolio trajectory (e.g., planning how many acquisitions and flips are needed to reach a certain revenue by next year).

### 3. Investors (Presentation setting)
While not a publicly accessible tool yet, the output (dashboard or report) will be presentable to investors. For instance, during meetings, an advisor can tweak assumptions live and visually demonstrate outcomes. This helps investors understand the long-term plan and milestones of their partnership with us. It makes abstract concepts tangible – showing that a well-planned strategy can mitigate risk and improve focus.

### 4. (Future) External Users
Eventually, we may open this up to investors or clients as a self-service planning tool. That future audience would be individuals interested in planning their real estate investment journey who may input their own data. (This is noted for context but not targeted in the first iteration.)

## User Stories and Use Cases

### Story 1: Planning Passive Income Goal
**"As an investment advisor, I want to input a target of $10,000 per month passive income and see a recommended plan of property investments and flips that could achieve that, so that I can communicate to the investor how we will reach their income goal."**

**Success Criteria:** After entering the $10k goal (and any initial capital available, say $20k), the system outputs a sequence: e.g., purchase 2 rental properties to reach $2k/mo, then use that cash flow to support 1 flip yielding $40k profit, then reinvest profit into 3 more rentals, etc., eventually reaching ~$10k/mo. The advisor can show this timeline, and adjust parameters if needed (e.g., what if the investor had $30k to start, or wanted to reach $15k/mo?).

### Story 2: Utilizing Limited Capital
**"As a new portfolio manager with $20,000 initial cash, I want to know how I can grow this into a sustainable portfolio with maximum monthly income in 2 years, without needing additional cash injections, so that I can invest strategically and not run out of money."**

**Success Criteria:** The tool might suggest starting with a low-cost rental (using $20k as down payment) that yields, say, $300/mo net. Then it shows that accumulating that $300/mo for a year plus the initial unused cash could fund a small flip's carrying costs. The flip profit is then used to buy two more rentals, and so on. The timeline would illustrate that by month 24, perhaps the monthly income has grown to e.g. $1,500/mo. (If the goal isn't reached, the tool shows how far you get, or suggests adding capital or time.)

### Story 3: Choosing Strategy Path
**"As a user, I want to experiment with different strategy paths – for example, what if I do only buy-and-hold rentals vs. a mix of rentals and flips – so that I can compare the outcomes in terms of time and capital required."**

**Success Criteria:** The interface allows the user to create one scenario that might involve only buying rentals (reinvesting cash flow) and another scenario involving an aggressive flip-and-reinvest approach. They can see side by side (or in separate runs) that the flip approach reaches the income goal faster but involves more transactions, whereas the pure rental approach is slower but steadier. For instance, referencing investment advice: purely passive investing with small cash may take decades, whereas active income (flips) can accelerate growth. The tool should make this trade-off clear by simulation.

### Story 4: Ensuring Cashflow Covers Debt
**"As a user planning a flip in the portfolio, I want the tool to warn me or prevent me if I don't have enough rental income to cover the flip's loan payments, so that I maintain a positive cash flow and avoid out-of-pocket losses during the project."**

**Success Criteria:** If the user tries to schedule a flip (with, say, a $100k hard money loan at 10% interest) but their current portfolio's rental income is only $500/mo (while the flip's interest would be ~$833/mo), the system might flag this: e.g., "Insufficient cash flow to cover ~$833/mo holding cost for this flip – consider adding a rental first or injecting cash." The user can then adjust (maybe do another rental first). The simulation engine must check cash flow constraints before allowing certain actions.

### Story 5: Viewing Portfolio Metrics Over Time
**"As an internal analyst, I want to see how my cash reserves, equity, and monthly income change at each phase of the plan, so I can understand the financial health of the portfolio throughout the timeline."**

**Success Criteria:** The dashboard should display a "portfolio piggy bank" or funding bucket that updates as time progresses. For each phase on the timeline, the user can view:
- Cash on hand (liquid reserves available for next investments)
- Total equity locked in properties (which could be tapped via refinance or sale)
- Monthly net income from rentals
- Any ongoing project expenses

For example, at Phase 1 end: cash might be nearly $0 (after buying a property), equity $20k, income $500/mo. Phase 2 (after a few months of rental income): cash $3k (saved from income), equity maybe grown via appreciation, etc. This running snapshot helps identify when the user has enough accumulated cash or equity to move to the next investment.

### Story 6: Exporting the Plan
**"As a portfolio manager, after crafting a strategy with the tool, I want to export a report of the plan with all assumptions and results, so that I can review it offline with my team or present it to the investor as part of our proposal."**

**Success Criteria:** The user can click an export/download button. The system generates a PDF or document that includes the timeline graphic, a table of phases (with dates and actions), and summary financials (e.g., "After 24 months: 5 properties, $10,200/mo income, $X equity, total cash invested $Y"). All key assumptions (like interest rate used, average property appreciation, rent growth, tax rate, etc.) should be listed for context. The report should be formatted cleanly for external consumption (branded if needed).

## Functional Requirements

### 1. Simulation Setup & Input Parameters

#### Initial Scenario Input
The user can start a new simulation by entering basic parameters:
- **Target Monthly Income:** The desired passive net income per month (e.g., $10,000). This is the primary goal the simulation will work towards. If the user does not have a specific target, they can leave this blank and instead focus on growing as much as possible with given capital in a timeframe.
- **Initial Cash Available:** The amount of liquid cash to start with (e.g., $20,000). This dictates what investments are feasible at the start.
- **Time Horizon (Optional):** The user may specify a maximum timeline for the simulation (e.g., "plan for 24 months"). If not specified, the simulation can just continue until the target income is reached, or until it becomes impractical to continue (e.g., no funds and no progress).
- **Strategy Constraints (Optional):** User preferences like max leverage (debt usage) or preferred strategy mix. For instance, a user might indicate "I prefer mostly rental acquisitions and minimal flipping" or vice versa. (If not provided, the tool can default to an optimized mix).
- **Market/Area Selection:** Defaults to Detroit (since we have listings there). In future, could allow other markets or "All". For now, assume Detroit.

#### Assumptions
A set of default financial assumptions will be loaded (with ability for user to adjust in an "Advanced Settings" panel):
- Interest rates for mortgages (e.g., 7% for rental loans, 10% for flip loans as a default)
- Loan terms (e.g., 30-year amortization for rental mortgages, interest-only for flip loan)
- Down payment percentages (e.g., 20% for rentals, 10% for flips hard money)
- Closing cost estimates (maybe 3% of purchase price)
- Rental expense ratio or property management fee (e.g., 8% of rent, plus maintenance reserve etc., to calculate net income)
- Vacancy rate assumption (e.g., 5% vacancy)
- Recovery Rate / BRRRR assumption: The user description suggests "after ~4 months you can recover ~50% of invested value because you buy ~20% under market and add value via rehab." We will generalize this: assume that if a property is bought undervalue and rehabbed (BRRRR strategy), on refinancing the user can pull out up to 50% of the initial cash invested (this depends on ARV and loan limits). This will be part of the BRRRR calculation logic.
- Appreciation rate (default 0% or a modest number like 3% annual) and Rent growth (default maybe 2% annual) – these can be set to 0 for simplicity in MVP, but are available to adjust.
- Inflation (if we inflate expenses or rent, possibly integrated with rent growth)
- Seasoning period for refinance (default 6 months from purchase)

#### Data Sources
The system will fetch necessary data for calculations:
- Property listings (from Listings API) when needed to get actual property prices, estimated rents, etc.
- (If available) rent estimates for a given property or area (else, could use a rule of thumb like rent = 1% of price for Detroit, or allow user input)
- If needed, zip-code based appreciation rates (from an internal dataset). But in MVP, might just use a single rate or user input.

### 2. Phased Investment Actions

At the core of the simulation is the concept of discrete phases or steps. In each phase, the user (or system) will take one major action. The available action types and their logic:

#### Buy Rental Property (Buy & Hold)
Purchase a property to rent out (could involve minor or cosmetic rehab, but primarily a buy-and-hold).

**Inputs/Selection:** The user can specify criteria (e.g., "3 bed/1 bath up to $100k needing light rehab") and either have the system suggest a property or manually choose one via an integrated search. We will leverage the existing Listing API to find Detroit properties that match criteria (price range, maybe filter by neighborhood or condition).

**Integration:** The tool can open a "Deal Finder" interface (either within the tool or linking to our existing internal deal finder) to browse listings. Once a listing is selected, its details (listing price, address, beds, baths, etc.) are pulled in. The user can further input expected rent (if not auto-provided) and any rehab cost if it's a light fixer.

**Financial Calc:**
- Determine purchase price (could be negotiated price equal to or slightly below listing – for simplicity, assume purchase at list price)
- Down payment = purchase price * 20% (default, configurable)
- Loan = 80% of purchase price (if financed; user could also choose all-cash purchase toggle)
- Closing costs = e.g. 3% of purchase (paid out of cash)
- If rehab is needed (cosmetic), user inputs cost (taken from cash reserves)
- Cash required for this phase = down payment + closing + rehab (if any). This will be deducted from the current cash reserves (the "bucket")

**Timeline:** Assume it takes e.g. 1 month to close and an additional 1-2 months if rehab before a tenant is in place. We will model simply that rental income starts after a setup period (e.g., 1 month if no rehab, 3 months if rehab needed).

After that period, the property generates monthly rental income. Net income = Rent – (mortgage payment + property expenses). The net income contributes to the portfolio's cashflow.

**Equity:** Upon purchase, equity in the property = initial down payment + any immediate "equity gain" if bought under market. (For example, if listing $100k but value after cosmetic fixes is $120k, then instant equity gain $20k. The tool can allow user to input an estimated "market value/ARV" separate from purchase price to capture this gain).

The property's value may appreciate over time at the assumed rate, increasing equity. Mortgage principal will also reduce slowly if amortized (though maybe negligible short-term).

The user can see this property listed in their "portfolio" with its stats (value, loan, equity, rent, cashflow).

#### Buy Fix-and-Flip Project
Purchase a property with the intent to renovate and sell for profit (instead of holding as rental).

**Inputs/Selection:** Similar to above, user can specify "flip" criteria (e.g., "distressed homes under $80k, ARV ~$130k"). The system can suggest deals (perhaps through an internal list of undervalued listings or just by price and needing rehab). The user picks a property or enters a hypothetical project.

**Financial Calc:**
- Purchase financing: likely use a Hard Money Loan or similar short-term financing. Assumptions: down payment 10%, interest-only loan at ~10-12% interest. Rehab costs can often be financed into the loan or require some cash – for simplicity, assume the loan covers purchase minus down payment, and may cover rehab or the user pays rehab cash. We can allow a parameter "Rehab financed? Y/N". Possibly assume rehab is also financed by the hard money up to a certain LTV.
- Cash required = 10% down of purchase + closing costs + (if rehab not financed, then rehab cash)
- Timeline: e.g., 6 months rehab + 2 months to sell = 8 months total hold (user can adjust this per project)
- During hold, monthly holding cost = interest on loan + taxes/utilities (could approximate)
- Cash flow impact: This is negative cash flow if not offset. The simulation must ensure that the portfolio's other income or cash reserves cover this. The monthly interest can be subtracted from monthly cash reserves. (If we enforce "no negative cashflow" rule, the user should have enough rental income per month to equal/exceed this interest.)

**Sale:** At the end of the phase, the property is sold. Sale price = ARV (after repair value) assumption. Profit = Sale price – (purchase price + rehab cost + holding costs + selling costs). That profit is realized as a lump sum cash infusion to the portfolio's cash reserves at that time. For example, if flip yields $40k profit, that $40k gets added to the cash bucket.

The loan is paid off from sale proceeds, and the property is removed from the portfolio (no ongoing income or equity after sale).

Flip profit can dramatically increase the cash available to invest in more rentals (this is the "active income to fuel passive investments" concept).

#### BRRRR (Buy, Rehab, Rent, Refinance, Repeat)
This is a combination of the above strategies on one property – buy a distressed property, fix it up, rent it out, then refinance to pull out equity, and keep it as a rental.

We can treat this as a special case: The user buys a property that needs significant rehab but intends to hold it.

**The initial phase looks like a flip in terms of financing (maybe a short-term rehab loan or cash purchase):**
- Possibly assume initial purchase with cash or a short-term loan, then later refinance into a long-term mortgage
- Cash required: down payment and rehab (similar to flip)
- No rental income until rehab completed and a tenant is placed (say rehab 4-6 months)

**After rehab, property is rented (generating cash flow).**

**At that point or a bit later (e.g., after 6 months of stable rent – seasoning), the user refinances at the new appraised value.** Typically, a lender might give 75% of new value. The refinance pays off the short loan and ideally returns most of the investor's initial cash. For example: purchased $50k + $20k rehab = $70k cost, new value $100k, a 75% LTV refinance = $75k new loan. That gives back ~$5k (minus closing costs) to the investor and leaves them with a rental with little cash left in.

**Our logic:** on refinance, calculate new loan = min(new value * 75%, stabilized value minus some equity buffer). The cash out = new loan - remaining old loan balance. That cash is added back to the cash reserves.

The property now has a long-term mortgage (with a set interest rate and amortization) and remains in the portfolio as a rental producing income.

**The Repeat part** simply means the investor can use the cash pulled out to invest in the next deal, which our simulation inherently supports by updating the cash reserves.

The BRRRR process essentially allows reusing the same capital to acquire multiple properties over time. Our tool should highlight that advantage (e.g., label properties that had successful BRRRR with how much cash is still tied vs pulled out).

If the user does not explicitly choose a "BRRRR" action, they could achieve the same by doing a flip and then buying a rental – however, BRRRR is a more integrated approach. We may implement it either as a single combined action or as separate actions (buy rehab as flip, then a "refinance & hold" action).

#### Refinance Property
The user can choose to refinance an existing rental property in their portfolio to pull out equity for further investment.
- This action would be available once a property has some accrued equity (through either appreciation or initial under-market purchase or loan paydown)
- The user selects which property to refi and chooses how much to refi (up to some LTV, e.g., 75% of current value)
- Cash out = new loan - old loan payoff, which goes to cash reserves. Monthly mortgage payment for that property will increase (reducing its net cash flow)
- This is useful if the user is short on cash but has a lot of equity in properties and is willing to trade monthly cash flow for upfront cash
- The tool should update that property's stats (new loan amount, new payment, new equity). It should also reflect the reduced cash flow (which might affect the ability to fund flips)
- Note: Seasoning can be considered – e.g., only allow refinance if property held > X months. We can enforce that in the timeline logic.

#### Sell Property
The user can also sell an existing rental property (e.g., to cash out completely if it's not needed or to reallocate funds).
- Selling converts equity to cash (minus selling costs like 6% agent fees, etc.). If the property had appreciated, the user realizes that gain
- The portfolio loses that property's rental income. This might be done if, for instance, the user has exceeded their income goal and wants to liquidate, or if they want to trade up to a bigger property
- For our goal-driven simulation, selling might not be a primary strategy unless needed, but the option is there for completeness or future use (like 1031 exchanges, etc., though we won't model tax specifics now).

#### Wait (Do Nothing) for X months
This action means taking no new investment, just letting time pass to accumulate rental income or allow projects to complete or seasoning to lapse.
- The user (or system) may insert a waiting period if the strategy requires it. For example, after acquiring rentals, they might wait 6 months to build up enough cash from rental income to fund the next down payment
- During a wait phase, cash reserves will increase by the amount of net rental income each month (and possibly decrease by any ongoing project costs)
- Property values may appreciate during this time if that setting is on
- This helps simulate realistic pacing (not every investment happens immediately one after another; sometimes one must wait to gather funds)
- The UI might allow adding a "Wait" phase explicitly, or the system might auto-calc that "next action can occur in X months once funds available," effectively inserting a wait

### 3. Simulation Logic & Constraints

#### Sequential Phases with Time
The simulation should proceed in chronological order. Phase 1 might start at month 0 (initial purchase), then phase 2 at whatever month phase 1 completes or when resources allow. The timeline advances accordingly.

We need to manage overlapping: it is possible in real life to do overlapping investments (e.g., start a second project while first flip is still ongoing, if you have enough cashflow). Our simulation could allow overlap if cash and cashflow suffice, but to keep it clear we might default to sequential phases for simplicity in MVP.

However, rental income from phase 1 will be flowing during phase 2 in many cases (since rentals persist). So while phases are plotted discretely, the cash flow calculation must consider ongoing effects of prior phases.

#### Cash Flow Constraint
As noted, implement a rule or at least a warning system to ensure the portfolio's net cash flow is non-negative at all times (unless user explicitly overrides).

Concretely, sum up monthly rental income from all held properties minus monthly costs of any active flip projects (interest, etc.) minus any other debts = net cash flow. This should ideally ≥ 0. If it's negative, the system flags it as unsustainable beyond however many months cash reserves can cover.

The user can counter a negative cashflow by either: injecting more cash (see next), adding a rental to boost income, refinancing to reduce payments, or simply acknowledging they will burn some cash temporarily (the tool could allow it but highlight how long before cash runs out).

#### Additional Cash Injection
The user may have the option at any point to add more cash into the simulation (e.g., "investor adds $10,000 more in Month 12"). This could model external funding or new savings.

The tool should allow adding a "cash injection" event (just increase cash reserves at that point). This is useful if the simulation shows they're slightly short of reaching the goal; an investor might decide to put in a bit more to accelerate the plan.

Similarly, the user could decide to remove cash (like take profits out personally) but that's likely out-of-scope for now (since we assume reinvestment).

#### Goal Check
The simulation can run until the target monthly income is achieved (or exceeded). At that point, it can flag success: e.g., "Goal of $10,000/mo achieved in Month 18 with X properties." The user can choose to stop there.

Alternatively, if a time horizon was set, it stops at the end of that period and shows "By Month 24, you achieved $Y/mo (out of $10k target)."

This informs whether more time or money is needed. (The tool might even compute how much more initial capital would have been needed to hit the goal in that timeframe, as a side analysis.)

#### Reuse of Existing Services
The simulation logic, while custom, will reuse existing APIs wherever possible:
- Listing search & retrieval (so we don't duplicate data storage of properties)
- Perhaps an existing mortgage calculator or financial utility service (if one exists in the codebase) for payment calculations
- If there's a service for pro forma generation (e.g., computing ROI, cash-on-cash, etc. for a single property), we might leverage it to validate our calculations for each property

#### Data Persistence
For MVP, we can keep the simulation in memory (especially if single user, or just re-computed each time). However, it's useful to allow saving a scenario:
- Possibly save to a database the list of phases and their details, under a scenario name
- This would allow users to revisit or tweak a saved plan later. It's not strictly required for the first version, but should be considered if not too complex, since internal users may want to build a library of common scenarios (like a "$50k to $5k/mo" template).

#### Accuracy and Realism
The calculations should be approximately accurate and based on sound investment principles:
- Ensure that the rental income calculations cover typical expenses and realistic net yields. For example, a Detroit 3-bed might rent $1,200/mo, expenses+mortgage might be $800, net $400. The tool should not assume 100% of rent is profit.
- The strategy produced should roughly align with real-world feasible deals (the integration with actual listings helps this)
- The timeline durations for rehab, rental placement, refinance, etc., should be realistic defaults (which user can adjust for a specific deal if needed)

#### Error Handling & Guidance
If the user tries to do something impossible (e.g., invest more money than available, or refinance above property value, etc.), the tool should prevent it or show an error message explaining the issue.

Additionally, provide guidance messages for optimal strategy. Example: "Consider purchasing another rental to increase cash flow before undertaking a flip" if the user's cash flow is low, or "At this point, you have significant equity in Property A. Refinancing it could fund your next purchase." Such hints can make the tool feel intelligent and educate the user. (These can be simple rule-based suggestions.)

#### Milestone Labeling
Mark key milestones such as:
- When cumulative monthly income first exceeds $1,000, $5,000, etc., up to the goal
- When the initial cash has been fully recovered (i.e., through BRRRR or flip profits you now have as much or more cash on hand than you started, essentially "infinite return" point)
- When a property is paid off (unlikely in short horizon unless user did cash purchase)

These milestones can be annotated on the timeline or shown as highlights in the report.

### 4. Data Integration Details

#### Listings API
Use the existing microservice that provides property listings in Detroit. Likely endpoints to use:
- `GET /listings?city=Detroit&filters...` for search. Filters can include price range, #beds, perhaps a flag for fixer-upper (if available; if not, we might use keywords or assume lower price implies need for rehab)
- `GET /listings/{id}` for detailed info on a selected property (price, taxes, maybe an estimated rent if available, etc.)

#### Deal Finder UI
If there is already a UI component for searching deals, we can integrate it via an iframe or a modal within our tool. Alternatively, we implement a simplified search dropdown: e.g., user enters criteria and we fetch top 5 matching listings for them to pick.

#### Property Data Required
At minimum: Price, Address/Zip (for region), Property Type and size (beds, baths), perhaps Square Footage, Listing description (to gauge condition).

#### Rent Estimate
If we have a service or dataset for market rents (e.g., from an internal analysis or third-party like Zillow Rent Zestimate), integrate that. If not, ask user to input expected rent based on their knowledge or provide an average (the tool can suggest "similar 3-bed homes rent for ~$1200 in that area").

#### Financial Rates
We may maintain a config file or service for current interest rates and lending terms (this could be updated as market changes). For MVP, hardcode or config:
- Rental mortgage rate 7% (30y)
- Flip loan rate 10% (interest-only)

These could be updated periodically by an admin or via an API if one exists for current rates.

#### Inflation/Market Data
If we simulate beyond a year, adjusting rents annually by inflation (say 2-3%) could be included. We can keep it simple first (no inflation by default), but allow toggling it.

Similarly, appreciation by zip code: If we have historical or projected appreciation rates by neighborhood, we could incorporate it to show equity growth. For example, an SFH in a popular Detroit neighborhood might appreciate 5%/year (just as context, but we should base on data if possible).

This is a secondary detail; main focus is on active strategy rather than passive appreciation, but including it makes the projections more optimistic and realistic.

#### Tax considerations
The simulation is after taxes (as the prompt says "after taxes and expenses and debt service"). To simplify, we assume any net income target is net of property expenses, but before personal income tax. We won't simulate personal income tax on rental income or capital gains tax on flips, as that complicates things and can be noted as an external factor. "After taxes" in prompt likely meant after property taxes and costs, not investor's income tax.

We will however include property taxes in expenses (via an estimate or from listing data if available).

#### Portfolio Representation
Internally, represent the portfolio as a collection of property objects (each with attributes: current value, loan, equity, rent, mortgage pmt, etc.) and ongoing project objects (flips in progress with time remaining, cost, etc.), plus global variables like cash balance and total income. The simulation engine will update this state as each phase is applied.

#### Timeline Data
We will produce a structured timeline data (list of events with start month, end month, description, etc.). This can feed the UI for visualization and also be used in the report.

### 5. User Interface & Experience

#### Layout
The tool will be a web-based interactive page. Key sections of the UI:

**Configuration Panel (top or side):** where the user inputs the initial parameters (goal, cash, assumptions toggles). Some inputs are entered once at start, others might be adjusted as the scenario evolves.

**Main Workspace:**

**On the left (or top area), the Timeline Visualization will be displayed.** This could be a horizontal timeline (e.g., with the x-axis as time in months/years). Each phase is represented as a labeled block or icon on the timeline. For example, a house icon for a purchase, a hammer icon for rehab period, a tenant icon for rental phase, dollar sign for sale, etc. Alternatively, a Gantt-chart style bar for each property could be stacked (but since sequential, a single line timeline might suffice).

The timeline should clearly show the duration of each action and any overlaps. It should have markers for the current monthly income at various points (perhaps a graph line overlay showing income over time).

We will use a visualization library (e.g., D3.js, vis-timeline, or a specialized Gantt library) to render this interactively. The user could potentially slide or click on items to see details.

**On the right (or bottom area), a Phase Details / Portfolio Dashboard view.** This could be tabbed or a two-section view:
- **Phase Details:** When a timeline phase is selected or when stepping through, show details of that phase (e.g., "Phase 2: Fix-and-Flip 123 Main St – Purchased Month 6 for $90k, Rehab $60k, Sold Month 14 for $150k, Profit $30k"). Show the cash in/out in that phase.
- **Portfolio Dashboard:** A summary at the current point in time (or at end of simulation). This includes:
  - Total Properties Owned
  - Total Monthly Net Income (rentals minus any ongoing costs)
  - Total Equity across properties
  - Cash Reserves available
  - Possibly other metrics like Debt-to-Income ratio or Return on Investment, but those are nice-to-have

Possibly allow a slider or playhead on the timeline to move through time and watch these metrics change dynamically.

A graphical element for the "piggy bank" could be included, e.g., an icon or chart showing cash reserves growth.

#### Action Buttons
The interface will guide the user through adding phases. We can implement this as a step-by-step wizard or a manual add:
- A "+ Add Phase" button that when clicked offers a menu of actions (Add Rental, Add Flip, Add BRRRR, Refinance, Wait, etc.). If the user selects one, a form or dialog appears to input details for that action.
- Alternatively, a sequential wizard might be easier for novices: The tool could initially suggest "Phase 1 options" (given your $20k and no income, best is to buy a rental around $100k). It might list a couple of property examples. The user picks one and confirms Phase 1. Then timeline appears. Then a "Next Phase" button appears, etc. This guided approach helps ensure they follow a logical path.

We should accommodate both user-driven planning and an AI/algorithm suggestion mode (even if rudimentary rule-based suggestions).

#### Messages/Alerts
Integrate messages for warnings (like insufficient cash flow, etc. as discussed). These could appear as toast notifications or inline text in the phase dialog.

#### Timeline Interaction
Users should be able to:
- Hover over a phase to see a tooltip with summary info
- Click a phase to select it, which then displays detailed info and perhaps allows editing or deleting that phase (except maybe not editing past phases if it would affect all subsequent, though we could allow backtracking by recalculating forward)
- Drag phases on the timeline to adjust timing (this might be advanced; initially, phases start as soon as possible by default. Manual adjustment of start times could allow scheduling overlap or delays, but we might implement that later)

#### Visual Design
Since this is internal but also to show investors, it should be clean and professional. Use clear icons and maybe color coding:
- e.g., Green for rental acquisitions (income-producing phases)
- Blue for flips (capital gain phases)
- Orange for rehab periods
- Purple for refinances
- Gray for waiting periods

The timeline could have segments colored accordingly.

Also possibly use a timeline "roadmap" style graphic with icons and arrows if we want a more infographic look, but an actual scalable timeline is preferred for accuracy.

#### Downloadable Output
Provide an Export function:

Could be a button "Download Plan" that generates a PDF of the current scenario. This should include:
- A snapshot image of the timeline (we can programmatically render or screenshot the timeline component)
- Tables: e.g., Phase Table (Phase #, Timeframe, Action, Key Details, Cash In/Out, New Income, etc.), and Final Portfolio Summary
- List of assumptions used
- Possibly the user's name or scenario name and date

Ensure citations or data sources for any numbers (if we present e.g. "rent assumed $1200 based on market avg"). Because internal/investors might ask, we should be ready to justify numbers, but likely that would be done verbally. Still, showing assumptions explicitly is good.

#### Interactivity Considerations
The dashboard should update in real-time or near-real-time as user adds phases. E.g., after adding a rental, the cashflow and cash reserves displayed should reflect that immediately.

This likely means a lot of front-end logic or a quick API call to recompute simulation on the backend and return updated state.

Given an AI agent might generate code, a clear state model and API design will help (see Tech section).

#### Accessibility
Since the target is internal, accessibility is less formal, but we should use clear language and avoid overly tiny text. The timeline visualization should be readable (perhaps allow zooming in/out of timeline if it grows long).

#### Example Workflow (for clarity)

1. User opens the tool. Inputs target $10k/mo, initial cash $20k.
2. The tool suggests Phase 1: "Buy a Rental Property around $100k" (based on $20k down payment being 20%). The user clicks "Find Deals" for rentals. A modal shows top matching Detroit listings (3 bed/1 bath around $100k).
3. User selects one (123 Maple St, $95k, expected rent $1,200). They adjust rehab cost to $5k (needs minor work) and click "Add Phase".
4. Phase 1 appears on timeline (Month 0-1: purchase/rehab, then rental from Month 2 onward). Dashboard now shows: Cash used ~$24k (down payment+costs), monthly income $1,200 rent – expenses = say $300 net, cash reserves now perhaps ~$20k-$24k = -$4k (if we allowed negative initial? Actually they had 20k, spent ~24k, so they'd be -4k – not allowed, so maybe the tool would have suggested a cheaper property or more cash injection; but assuming it fit in 20k, maybe price was 80k).
5. Phase 2: The user clicks "Next Phase". The system sees they have $0 cash left and $300/mo income. It might suggest "Wait X months to accumulate funds or add more cash." If $300/mo, to accumulate say $6k for next deal, wait 20 months – too slow. Alternatively, suggest "Add another $10k capital or consider a flip using the rental income to cover loan."
6. User decides to do a Flip next. Tool says "Make sure rental income covers flip interest ~$500/mo". $300 is short, but maybe user injects $5k to cover interest or takes a small risk. They choose a flip (Phase 2: buy flip for $50k, rehab $50k, ARV $120k). Down payment $5k + closing, rehab mostly loan-financed. Monthly interest ~$800. Rental income $300, so net -$500/mo. They see a warning. They proceed but also add a "cash reserve buffer" of e.g. $5,000 injection to cover that $500 for 10 months.
7. Timeline: Phase 2 starts at Month 3 (they didn't wait long). Flip runs Month 3-10, sells at Month 10 for $120k, profit say $15k net (just example). At sale, cash +$15k.
8. Now Phase 3: Cash ~ $15k plus whatever accumulated from rental ($300×10mo = $3k minus flip deficit $500×8mo = -$4k, roughly net $14k). They can now buy another rental with ~$14k (maybe a cheaper one or with higher leverage). And so on...
9. The final timeline might have 5-6 phases culminating in reaching ~$10k/mo after a couple of cycles.
10. The user hits Download, gets a report of all this to discuss with the investor.

### 6. Downloadable Reports & Output

As mentioned, the output format will primarily be an interactive dashboard on screen, and secondarily a PDF/slide export for offline use.

The interactive dashboard fulfills the need for dynamic exploration. The timeline visualization combined with live metrics allows quick iteration on strategy.

The timeline visualization is crucial for communicating the plan. It's effectively illustrating the investment roadmap with time-based milestones. This addresses the user's requirement of a timeline output.

The PDF report (or even a CSV for data nerds) should be generated server-side for accuracy (ensuring all calculations are finalized) and include:
- Title (Scenario name, date)
- Key assumptions (interest rates, etc.)
- A summary narrative of the plan (we can auto-generate text like "Starting with $X, the plan reaches $Y/mo in Z months through the following steps...")
- Table of phases (with columns: Phase #, Start Date, End Date, Action, Properties involved, Cash In/Out, Monthly Income after phase)
- Possibly a chart or timeline image. If embedding the exact interactive timeline is not feasible, maybe a simplified Gantt chart or at least a sequence diagram. We can consider using an HTML-to-PDF library that can render the timeline component.

Note: Because this is an internal tool, the exact formatting of the report can be iterated with feedback, but at minimum it must be readable and logically organized so that someone who didn't operate the tool can understand the strategy. The report may be used as part of investor proposal documentation.

## Technical Implementation and Architecture

### System Architecture

We will adopt a microservice architecture consistent with our existing system. The main components for this feature will be:

#### Portfolio Simulator Service (new)
A backend service responsible for running the simulation logic. It can be built as a Python or Node.js service (depending on team expertise; Python might be suitable for heavy calculations, Node for consistency with existing APIs). This service would expose endpoints such as:
- `POST /simulate` – accept a JSON payload describing the scenario inputs (initial cash, target, list of phases/actions if user is feeding it, or perhaps logic to auto-generate if not provided). It returns the full simulation results: timeline events, financial projections, etc.
- `POST /simulate/next-step` (optional) – given current state and a proposed next action, return updated state (this could help incremental builds of the plan)
- `GET /scenarios/{id}` – fetch a saved scenario
- `POST /scenarios` – save a scenario

The service will likely contain the financial formulas for mortgages, cash flow, etc. It may reuse a library or our existing code for mortgage calculation (to get monthly payment from principal, rate, term).

This service would integrate with the Listing API by making HTTP calls to fetch property data when needed (or the front-end could do that and pass it in).

#### Listing Service (existing)
Already provides property data. We just integrate as described.

#### Frontend Application (existing web portal or new module)
We'll likely implement the UI as part of our internal admin/investor web app. This could be a React front-end (since much interactivity is needed) or an Angular/Vue depending on existing stack.

If an AI agent is coding, likely it'll produce some front-end code. We should specify to use modern frameworks (React with TypeScript would be ideal for maintainability).

The front-end will handle user interactions and visualizations, calling the Simulator service for heavy lifting as needed.

It also can call the Listing API directly (maybe through a BFF - backend-for-frontend - but not strictly needed).

#### Authentication/Authorization
Since internal, we can rely on existing auth (maybe an internal SSO). No special public auth needed. But ensure only authorized employees can access this tool.

#### Database
For storing scenarios if needed, use an existing database (we might add a table in our internal DB for saved scenarios, linked to user accounts if applicable). This is not critical for MVP if we treat it as a live planning tool only.

#### Microservice Communication
Use REST or potentially GraphQL if that's in use. REST is fine given simplicity.

### Tech Stack Suggestions (Best Practices)

**Backend:** Python (with Flask/FastAPI) or Node.js (with Express/NestJS) – choose based on what our team and codebase use more. If we have existing financial calc code in Python, that might lean to Python. If our platform is Node-centric, use Node to integrate easily.

**Math/Calc Libraries:**
- Use a reliable library for financial calculations if available (for ex: Python's numpy_financial or custom formulas). Ensure precision for currency (avoid floating point issues by using decimals).

**Frontend:** Likely React. We can use a UI component library (like Material UI or Ant Design) for forms and layout. For timeline visualization:
- Consider libraries like Vis.js Timeline, Recharts (for a custom chart), or D3.js for full control. A Gantt chart library (e.g., react-google-charts Gantt or DevExtreme React Gantt) could also be repurposed for timeline of events.
- We also might incorporate small chart widgets: e.g., a line chart for cash over time, or bar chart for income growth.

**State Management:** The React app can manage scenario state using a state management tool (Context or Redux) if it gets complex. Given likely a lot of interdependent data (properties, cash, etc.), a well-structured state model is needed.

**PDF Generation:** Use a server-side approach like Puppeteer (headless Chrome) to render the page or a specific template as PDF. Or use a library like ReportLab (if Python) or PDFKit. We may also simply structure an HTML with CSS that's print-friendly and let users print to PDF from browser as a quick solution (ensuring the layout converts nicely to print).

**Performance:**
- The calculations are not very heavy (a few dozen time steps at most, and simple arithmetic). So performance should be fine. We should ensure the simulate endpoint responds within e.g. < 2 seconds for a scenario of, say, 24 months and 10 phases. That's easily achievable.
- The heavier part might be loading lots of listings when searching. To manage that, we can limit results (e.g., fetch top 5 by some criteria rather than hundreds).
- Also, memory footprint is small (just storing scenario data), so a single service instance can handle many requests.

**Scaling:** Not a big concern for internal use (a few users). But using microservice means we can horizontally scale if needed.

**Testing:** We will create test cases for:
- Financial calculations (e.g., verify that mortgage payment calc is accurate, flip profit logic yields expected outcomes)
- Scenario flows (simulate a known scenario and verify the outputs)
- API integration (mock listing API responses to ensure we handle them)

**Logging & Monitoring:** The simulator should log important events, especially if an input leads to an infeasible scenario (to later refine suggestions). Monitor usage to see how often plans reach goals or where users drop off, etc., to improve UX.

## Assumptions & Constraints

### Market and User Knowledge
- The user has basic real estate knowledge. The tool can use industry terms like ARV, LTV, etc., but we will try to also provide hover tooltips or help modals explaining them, since internal users might come from varied backgrounds.
- We assume Detroit market specifics: low entry prices (~$50k-$150k), decent rents, etc. The logic and default values are tuned to that market. If applied elsewhere (e.g., high-cost markets), user would have to adjust assumptions (like down payment or use multi-family etc.). This focus is acceptable for now as Detroit is our main inventory.

### Modeling Simplifications
- All cash flows are modeled on a monthly basis. We will step through time in months for simplicity (not daily).
- We ignore some complexities:
  - Tax and depreciation benefits of rentals – we measure cash flow, not after-tax profit to investor
  - Interest rate changes – assume fixed rates for loans taken
  - Loan approvals – assume if the strategy says refinance or new loan, it's granted (no modeling of credit or lender constraints aside from LTV)
  - Market liquidity – assume you can find a buyer for flips as planned at the ARV price, and properties can be rented within 1 month of listing (no long vacancies in simulation unless user adds a wait)

### Financial Assumptions
- Seasoning assumption: We assume a 6-month seasoning for cash-out refinance (common for many lenders). We will not allow refinance before 6 months of ownership.
- Appreciation assumption: If used, apply annually but step monthly for calculation (approx linear or compound monthly). The user can set to 0 to be conservative.
- Minimum cash safety: Perhaps build in that the plan should not use up all cash – e.g., always leave $X or Y% as reserve for emergencies. But since simulation is controlled, we might not enforce that unless we want to mimic prudent practice. We can leave a small buffer by default (like after each purchase, require $1k left).

### Technical Constraints
- Downloadable means PDF (we assume that is acceptable; if the user meant an Excel export, that could be another format to consider, but since it's visualization heavy, PDF is most likely).
- Time: We currently measure time in relative months (Month 0 = start). We can map that to real calendar dates if needed (e.g., assume start at Jan 2025, then timeline uses actual dates). But relative is fine for strategy purposes.
- Single Active Project at a Time (MVP constraint): Initially, we might constrain that only one rehab/flip can be ongoing at once, to keep calculations straightforward. The user could override by starting two flips overlapping if they really want, but that requires summing two interest costs, etc. We can handle it, but the UI might get complex showing overlapping timeline bars. Possibly for MVP, we encourage sequential actions (with rentals continuing in background).
- User adds phases manually (with suggestions). We are not fully automating an optimal plan generation via AI (which would be a complex optimization problem). The user's input is involved at each step. We rely on rules-of-thumb suggestions but not an algorithm that guarantees the fastest path to goal (though that could be an interesting future improvement – an "Auto-Plan" button).

## Security and Privacy

- This is an internal tool, access restricted to authenticated employees. It will handle financial scenario data but not actual sensitive personal data (aside from possibly an investor's desired goal, etc., which is not highly sensitive).
- Ensure that any data from Listings API (which might include seller info or addresses) is handled per our data policies (likely fine since it's internal data).
- If scenarios are saved, they could potentially include investor names or notes (if user enters any). We should treat saved scenarios as company confidential data, stored securely in our database.
- Calls to external services (if any, e.g., for rent estimates) should be through our secure API gateway.

## Future Enhancements (Post-MVP)

While the current scope focuses on simulation for hypothetical scenarios starting from cash, we envision several extensions:

### 1. Existing Portfolio Import
Allow a user to input or import their current real properties (addresses, current loans, rents, etc.) as a starting point. The tool could then analyze current equity and cashflow and suggest the next best moves (e.g., "You have $50k equity in Property X, consider a cash-out refi to fund another purchase."). This would turn the tool into a portfolio management advisor, not just a blank-slate simulator.

### 2. Multiple Markets / Inventory Integration
Incorporate listings from other cities where the company operates, and adjust assumptions accordingly. Possibly integrate with an MLS feed or our inventory of off-market deals.

### 3. Risk Analysis & Monte Carlo
Add a mode to simulate risks – e.g., what if property values drop 10%, or flip takes longer than expected. Monte Carlo simulation or at least scenario toggles (best case, worst case) could be provided to manage risk (this aligns with the notion of strategy including risk mitigation).

### 4. Improved AI Guidance
Use an AI or advanced algorithm to automatically craft a near-optimal plan to reach the goal given constraints (basically solve for the combination of actions that yields target in minimum time or with minimum capital). This could be complex (an optimization problem with many variables), but even a heuristic approach could help less-experienced users.

### 5. UI Enhancements
- Possibly a comparison mode to put two scenarios side by side (to answer questions like buy-and-hold vs flip strategies)
- More sophisticated visualizations like cumulative cash flow chart, or an interactive map of properties selected
- A timeline that extends beyond just the goal (e.g., shows if income surpasses goal, or how portfolio value grows long-term)

### 6. Loan and Finance Options
Expand to include different financing strategies, like using a line of credit or private investor funds that might have different terms, etc. Also incorporate debt service coverage ratio (DSCR) considerations for rental loans, which might influence how much one can borrow.

### 7. Collaborative Features
If opened to external users, allow sharing the plan with others, or exporting to a spreadsheet model for due diligence.

### 8. Integration with Project Management
Perhaps link to our project management system for flips – if an investor proceeds with a plan, the planned projects could feed into actual execution (this is beyond PRD, but conceptually).

## Success Metrics

(How will we know if this feature is successful?) Since this is an internal tool primarily, success will be measured by qualitative and some quantitative metrics:

### 1. User Adoption
How many team members use the tool when planning or pitching to investors? (e.g., number of scenarios created per week).

### 2. Reduced Planning Time
Anecdotally, the team should be able to create a portfolio plan faster than doing it manually in spreadsheets. If it currently takes say 2 hours to model something in Excel, and with the tool it's 30 minutes with better visuals, that's a win.

### 3. Investor Understanding/Conversion
Feedback from investor meetings – do they find the visualization helpful? Does it increase their confidence in the strategy? Possibly track if deals closed or funds raised after showing simulations (though many factors influence that).

### 4. Accuracy of Projections
Over time, we can back-test some scenarios against reality. If the tool predicted reaching $5k/mo in 1 year with certain actions and the actual portfolio got close, that indicates the assumptions are reasonable. We can adjust the model if we consistently see deviations.

### 5. Bug Rates
Ensure the simulations are logically sound (no cases of negative loan or money creation out of thin air, etc.). Fewer support issues reported by team indicates robustness.

### 6. Scalability for Future
While not externally measured, internally we'll consider success if the tool's architecture supports the future enhancements without major rework (i.e., the microservices and code structure prove to be extensible).

## References

1. **Kiavi Blog – Transitioning Strategies: Fix-and-Flip to Rental Properties (Feb 2024)** – highlights the value of combining flips for quick capital with rentals for steady cash flow and explains the BRRRR strategy for recycling capital.

2. **REtipster – The Fast (and Slow) Roadmap for Real Estate Investors** – emphasizes that active income (flipping, business) is needed to rapidly build capital, which can then be deployed into passive investments for long-term income. This underpins our simulation's mixed-strategy approach.

3. **Easy Street Capital – Fix and Flip vs. Buy and Hold (June 2025)** – provides context on returns and risks: e.g., median flip profit ~$73.5k in 2024, and notes that flips allow quick reinvestment of capital, whereas rentals build wealth steadily and provide ongoing cash flow.

4. **OKMG – Designing a Real Estate Strategy** – stresses the importance of a clear plan with defined objectives and a timeline of investments to reach those goals. Our tool directly facilitates this by letting users set an income objective and mapping out a timeline to achieve it.

5. **Industry practice (BRRRR, etc.)** – general knowledge that the BRRRR method (Buy, Rehab, Rent, Refinance, Repeat) is an effective way to rapidly build a rental portfolio by reusing capital – our simulation incorporates this technique as a key feature.