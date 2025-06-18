/**
 * Strategy Generator for Portfolio Simulator V3
 * Creates investment strategies based on parsed goals
 */

class StrategyGenerator {
    constructor() {
        // Default assumptions for Detroit market
        this.assumptions = {
            // Property assumptions
            avgPropertyPrice: 65000,
            priceRange: { min: 45000, max: 85000 },
            avgMonthlyRent: 1300,
            rentRange: { min: 1000, max: 1600 },
            monthlyExpenses: 350,
            
            // Financial assumptions
            rentalDownPayment: 0.20,
            flipDownPayment: 0.15,
            rentalInterestRate: 0.07,
            flipInterestRate: 0.10,
            loanTermYears: 30,
            
            // Strategy assumptions
            avgFlipProfit: 32500,
            flipDuration: 6, // months
            brrrDuration: 6, // months to refinance
            brrrCashOutPercent: 0.70,
            rentalSetupTime: 1, // month
            
            // Market assumptions
            appreciationRate: 0.03, // 3% annually
            rentGrowthRate: 0.02, // 2% annually
            vacancyRate: 0.05,
            managementFee: 0.08
        };
    }

    /**
     * Generate multiple strategy options
     */
    async generateMultipleStrategies(parsedGoal) {
        const strategies = [];
        
        // Generate three different approaches
        const approaches = ['conservative', 'balanced', 'aggressive'];
        
        for (const approach of approaches) {
            try {
                const strategy = await this.generateStrategy(parsedGoal, approach);
                strategies.push(strategy);
            } catch (error) {
                console.error(`Failed to generate ${approach} strategy:`, error);
            }
        }
        
        // Ensure we have at least one strategy
        if (strategies.length === 0) {
            strategies.push(this.generateFallbackStrategy(parsedGoal));
        }
        
        return strategies;
    }

    /**
     * Generate a single strategy
     */
    async generateStrategy(parsedGoal, approach = 'balanced') {
        const strategy = {
            approach: approach,
            timeline: [],
            monthsToGoal: 0,
            propertyCount: 0,
            totalInvestment: 0,
            finalMonthlyIncome: 0,
            feasibility: true,
            description: '',
            metrics: {}
        };

        // Initialize simulation state
        const state = {
            currentMonth: 0,
            cashAvailable: parsedGoal.startingCapital,
            monthlyIncome: 0,
            monthlyContributions: parsedGoal.monthlyContributions,
            properties: [],
            activeFlips: [],
            totalInvested: 0
        };

        // Generate strategy based on approach
        switch (approach) {
            case 'conservative':
                this.generateConservativeStrategy(strategy, state, parsedGoal);
                break;
            case 'aggressive':
                this.generateAggressiveStrategy(strategy, state, parsedGoal);
                break;
            default:
                this.generateBalancedStrategy(strategy, state, parsedGoal);
        }

        // Calculate final metrics
        this.calculateStrategyMetrics(strategy, state, parsedGoal);

        return strategy;
    }

    /**
     * Generate conservative strategy (rental-focused)
     */
    generateConservativeStrategy(strategy, state, goal) {
        strategy.description = 'Focus on steady rental acquisitions with minimal risk. Build wealth slowly but surely.';
        
        let iterations = 0;
        const MAX_ITERATIONS = 100; // Prevent infinite loops
        
        while (state.monthlyIncome < goal.targetMonthlyIncome && 
               state.currentMonth < goal.timeHorizon && 
               iterations < MAX_ITERATIONS) {
            iterations++;
            
            // Check if we can afford a rental
            const downPayment = this.assumptions.avgPropertyPrice * this.assumptions.rentalDownPayment;
            const closingCosts = this.assumptions.avgPropertyPrice * 0.03;
            const totalCashNeeded = downPayment + closingCosts;
            
            if (state.cashAvailable >= totalCashNeeded) {
                // Buy a rental property
                this.addRentalPurchase(strategy, state, state.currentMonth);
            } else {
                // Wait and accumulate funds
                const monthsToWait = this.calculateWaitTime(state, totalCashNeeded);
                if (monthsToWait > 0 && monthsToWait < 120 && state.currentMonth + monthsToWait <= goal.timeHorizon) {
                    state.currentMonth += monthsToWait;
                    state.cashAvailable += monthsToWait * (state.monthlyIncome + state.monthlyContributions);
                } else {
                    // Can't reach goal in time
                    break;
                }
            }
        }
        
        if (iterations >= MAX_ITERATIONS) {
            console.warn('Conservative strategy generation hit iteration limit');
        }
    }

    /**
     * Generate balanced strategy (mix of rentals and flips)
     */
    generateBalancedStrategy(strategy, state, goal) {
        strategy.description = 'Balanced mix of rentals for income and flips for capital growth. Optimal risk-reward ratio.';
        
        let flipCount = 0;
        let iterations = 0;
        const MAX_ITERATIONS = 100; // Prevent infinite loops
        let lastMonth = state.currentMonth;
        
        while (state.monthlyIncome < goal.targetMonthlyIncome && 
               state.currentMonth < goal.timeHorizon && 
               iterations < MAX_ITERATIONS) {
            iterations++;
            
            // Process any scheduled events (like flip completions)
            this.processScheduledEvents(state, state.currentMonth);
            
            const incomeGap = goal.targetMonthlyIncome - state.monthlyIncome;
            const timeRemaining = goal.timeHorizon - state.currentMonth;
            
            // More robust decision logic
            let actionTaken = false;
            
            // First priority: If we have very little cash and time, need to generate capital
            if (state.cashAvailable < 20000 && timeRemaining > 6 && flipCount < 3) {
                if (this.canDoFlip(state)) {
                    this.addFlipProject(strategy, state, state.currentMonth);
                    flipCount++;
                    actionTaken = true;
                }
            }
            
            // Second priority: If we have moderate cash and big income gap, try BRRR
            if (!actionTaken && incomeGap > 3000 && timeRemaining > 8 && state.cashAvailable > 40000) {
                const brrrCost = this.getRandomInRange(65000, 100000); // Total BRRR investment
                if (state.cashAvailable >= brrrCost) {
                    this.addBRRRProject(strategy, state, state.currentMonth);
                    actionTaken = true;
                }
            }
            
            // Default: Try to buy a rental
            if (!actionTaken) {
                const downPayment = this.assumptions.avgPropertyPrice * this.assumptions.rentalDownPayment;
                const closingCosts = this.assumptions.avgPropertyPrice * 0.03;
                const totalCashNeeded = downPayment + closingCosts;
                
                if (state.cashAvailable >= totalCashNeeded) {
                    this.addRentalPurchase(strategy, state, state.currentMonth);
                    actionTaken = true;
                } else {
                    // Wait for funds
                    const monthsToWait = this.calculateWaitTime(state, totalCashNeeded);
                    if (monthsToWait > 0 && monthsToWait < 24 && state.currentMonth + monthsToWait <= goal.timeHorizon) {
                        state.currentMonth += monthsToWait;
                        state.cashAvailable += monthsToWait * (state.monthlyIncome + state.monthlyContributions);
                        
                        // Process scheduled events during wait time
                        for (let m = lastMonth + 1; m <= state.currentMonth; m++) {
                            this.processScheduledEvents(state, m);
                        }
                    } else {
                        // Can't afford anything in reasonable time
                        state.currentMonth++;
                        state.cashAvailable += state.monthlyIncome + state.monthlyContributions;
                        
                        // If we've advanced 6 months without action, break
                        if (state.currentMonth - lastMonth > 6) {
                            console.log('Breaking: No viable actions for 6 months');
                            break;
                        }
                    }
                }
            }
            
            // Update last action month
            if (actionTaken) {
                lastMonth = state.currentMonth;
            }
            
            // Safety check to prevent infinite loops
            if (strategy.timeline.length > 100) break;
        }
        
        if (iterations >= MAX_ITERATIONS) {
            console.warn('Balanced strategy generation hit iteration limit');
        }
    }

    /**
     * Generate aggressive strategy (flip-heavy)
     */
    generateAggressiveStrategy(strategy, state, goal) {
        strategy.description = 'Aggressive flip-focused approach for rapid capital growth. Higher risk but faster results.';
        
        let consecutiveFlips = 0;
        let iterations = 0;
        const MAX_ITERATIONS = 100; // Prevent infinite loops
        
        while (state.monthlyIncome < goal.targetMonthlyIncome && 
               state.currentMonth < goal.timeHorizon && 
               iterations < MAX_ITERATIONS) {
            iterations++;
            // Prioritize flips early on
            if (consecutiveFlips < 3 && this.canDoFlip(state)) {
                this.addFlipProject(strategy, state, state.currentMonth);
                consecutiveFlips++;
            } else {
                // After flips, rapidly acquire rentals with profits
                consecutiveFlips = 0;
                
                // Try to buy multiple rentals if we have the capital
                let rentalsBought = 0;
                while (rentalsBought < 3) {
                    const downPayment = this.assumptions.avgPropertyPrice * this.assumptions.rentalDownPayment;
                    const closingCosts = this.assumptions.avgPropertyPrice * 0.03;
                    const totalCashNeeded = downPayment + closingCosts;
                    
                    if (state.cashAvailable >= totalCashNeeded) {
                        this.addRentalPurchase(strategy, state, state.currentMonth + rentalsBought);
                        rentalsBought++;
                    } else {
                        break;
                    }
                }
                
                if (rentalsBought === 0) {
                    // Wait for next flip opportunity
                    state.currentMonth += 3;
                    state.cashAvailable += 3 * (state.monthlyIncome + state.monthlyContributions);
                }
            }
            
            // Safety check
            if (strategy.timeline.length > 100) break;
        }
        
        if (iterations >= MAX_ITERATIONS) {
            console.warn('Aggressive strategy generation hit iteration limit');
        }
    }

    /**
     * Add rental purchase to timeline
     */
    addRentalPurchase(strategy, state, month) {
        const price = this.getRandomInRange(this.assumptions.priceRange.min, this.assumptions.priceRange.max);
        const rent = this.estimateRent(price);
        const downPayment = price * this.assumptions.rentalDownPayment;
        const loanAmount = price - downPayment;
        const monthlyPayment = this.calculateMortgagePayment(loanAmount, this.assumptions.rentalInterestRate, this.assumptions.loanTermYears);
        const netIncome = rent - monthlyPayment - this.assumptions.monthlyExpenses;
        
        strategy.timeline.push({
            month: month,
            action: 'buy',
            property: `Rental ${state.properties.length + 1}`,
            price: price,
            downPercent: this.assumptions.rentalDownPayment * 100,
            rent: rent,
            monthlyExpenses: this.assumptions.monthlyExpenses,
            rate: this.assumptions.rentalInterestRate * 100,
            term: this.assumptions.loanTermYears,
            payment: monthlyPayment
        });
        
        // Update state
        state.cashAvailable -= (downPayment + price * 0.03); // Including closing costs
        state.monthlyIncome += netIncome;
        state.totalInvested += downPayment;
        state.currentMonth = month + this.assumptions.rentalSetupTime;
        state.properties.push({
            type: 'rental',
            purchaseMonth: month,
            price: price,
            rent: rent,
            netIncome: netIncome
        });
        
        strategy.propertyCount++;
    }

    /**
     * Add flip project to timeline
     */
    addFlipProject(strategy, state, month) {
        const purchasePrice = this.getRandomInRange(40000, 70000);
        const rehabCost = this.getRandomInRange(25000, 40000);
        const totalCost = purchasePrice + rehabCost;
        const arvPrice = totalCost + this.assumptions.avgFlipProfit;
        const downPayment = purchasePrice * this.assumptions.flipDownPayment;
        const loanAmount = purchasePrice - downPayment;
        const monthlyInterest = loanAmount * (this.assumptions.flipInterestRate / 12);
        
        // Buy event
        strategy.timeline.push({
            month: month,
            action: 'buy',
            property: `Flip ${state.activeFlips.length + 1}`,
            price: purchasePrice,
            downPercent: this.assumptions.flipDownPayment * 100,
            rent: 0,
            monthlyExpenses: monthlyInterest,
            rate: this.assumptions.flipInterestRate * 100,
            term: 1, // Interest-only
            payment: monthlyInterest
        });
        
        // Sell event
        strategy.timeline.push({
            month: month + this.assumptions.flipDuration,
            action: 'sell',
            property: `Flip ${state.activeFlips.length + 1}`,
            price: arvPrice
        });
        
        // Update state
        state.cashAvailable -= (downPayment + rehabCost + purchasePrice * 0.03);
        state.monthlyIncome -= monthlyInterest; // Flip holding costs
        state.totalInvested += downPayment + rehabCost;
        state.activeFlips.push({
            startMonth: month,
            endMonth: month + this.assumptions.flipDuration
        });
        
        // Schedule cash infusion from flip - handle it properly when the flip sells
        // Store flip details for later processing
        const flipEndMonth = month + this.assumptions.flipDuration;
        state.scheduledEvents = state.scheduledEvents || [];
        state.scheduledEvents.push({
            month: flipEndMonth,
            type: 'flip_complete',
            cashInflow: this.assumptions.avgFlipProfit + loanAmount, // Profit + loan payoff
            monthlyIncomeAdjustment: monthlyInterest // Remove holding cost
        });
        
        state.currentMonth = month + 1;
    }

    /**
     * Add BRRR project to timeline
     */
    addBRRRProject(strategy, state, month) {
        const purchasePrice = this.getRandomInRange(45000, 65000);
        const rehabCost = this.getRandomInRange(20000, 35000);
        const totalInvested = purchasePrice + rehabCost;
        const arvPrice = totalInvested * 1.3; // 30% value add
        const rent = this.estimateRent(arvPrice);
        
        // Initial purchase (cash or hard money)
        strategy.timeline.push({
            month: month,
            action: 'buy',
            property: `BRRR ${state.properties.length + 1}`,
            price: totalInvested,
            downPercent: 100, // All cash initially
            rent: 0, // No rent during rehab
            monthlyExpenses: 0,
            rate: 0,
            term: 0,
            payment: 0
        });
        
        // Refinance (simulated as sell then rebuy)
        const refinanceMonth = month + this.assumptions.brrrDuration;
        const cashOut = arvPrice * this.assumptions.brrrCashOutPercent;
        const newLoanAmount = cashOut;
        const monthlyPayment = this.calculateMortgagePayment(newLoanAmount, this.assumptions.rentalInterestRate, this.assumptions.loanTermYears);
        
        // Sell at ARV
        strategy.timeline.push({
            month: refinanceMonth,
            action: 'sell',
            property: `BRRR ${state.properties.length + 1}`,
            price: arvPrice
        });
        
        // Buy back with new financing
        strategy.timeline.push({
            month: refinanceMonth,
            action: 'buy',
            property: `BRRR ${state.properties.length + 1} (Refi)`,
            price: arvPrice,
            downPercent: (1 - this.assumptions.brrrCashOutPercent) * 100,
            rent: rent,
            monthlyExpenses: this.assumptions.monthlyExpenses,
            rate: this.assumptions.rentalInterestRate * 100,
            term: this.assumptions.loanTermYears,
            payment: monthlyPayment
        });
        
        // Update state
        state.cashAvailable -= totalInvested;
        state.totalInvested += totalInvested;
        
        // After refinance
        state.cashAvailable += cashOut;
        state.monthlyIncome += (rent - monthlyPayment - this.assumptions.monthlyExpenses);
        state.currentMonth = refinanceMonth + 1;
        state.properties.push({
            type: 'brrr',
            purchaseMonth: month,
            price: arvPrice,
            rent: rent,
            netIncome: rent - monthlyPayment - this.assumptions.monthlyExpenses
        });
        
        strategy.propertyCount++;
    }

    /**
     * Check if flip is feasible
     */
    canDoFlip(state) {
        // More realistic flip requirements
        const purchasePrice = 50000; // Typical flip purchase
        const downPayment = purchasePrice * this.assumptions.flipDownPayment; // 15%
        const rehabCost = 30000; // Average rehab
        const closingCosts = purchasePrice * 0.03;
        const minCashNeeded = downPayment + rehabCost + closingCosts + 5000; // Plus buffer
        
        return state.cashAvailable >= minCashNeeded;
    }

    /**
     * Calculate wait time to accumulate funds
     */
    calculateWaitTime(state, targetAmount) {
        const monthlyAccumulation = state.monthlyIncome + state.monthlyContributions;
        if (monthlyAccumulation <= 0) return -1; // Can't accumulate
        
        const cashNeeded = targetAmount - state.cashAvailable;
        if (cashNeeded <= 0) return 0; // Already have enough
        
        return Math.ceil(cashNeeded / monthlyAccumulation);
    }

    /**
     * Calculate strategy metrics
     */
    calculateStrategyMetrics(strategy, state, goal) {
        strategy.monthsToGoal = state.currentMonth;
        strategy.totalInvestment = state.totalInvested;
        strategy.finalMonthlyIncome = state.monthlyIncome;
        strategy.feasibility = state.monthlyIncome >= goal.targetMonthlyIncome;
        
        // Additional metrics
        strategy.metrics = {
            totalProperties: state.properties.length,
            rentalProperties: state.properties.filter(p => p.type === 'rental').length,
            flipsCompleted: state.activeFlips.length,
            brrrProperties: state.properties.filter(p => p.type === 'brrr').length,
            averagePropertyPrice: state.properties.length > 0 ? 
                state.properties.reduce((sum, p) => sum + p.price, 0) / state.properties.length : 0,
            totalEquity: this.calculateTotalEquity(state.properties),
            cashOnCashReturn: state.totalInvested > 0 ? 
                (state.monthlyIncome * 12 / state.totalInvested * 100) : 0
        };
    }

    /**
     * Calculate total equity
     */
    calculateTotalEquity(properties) {
        return properties.reduce((total, property) => {
            // Simplified: assume 20% equity on rentals, full equity on completed BRRRs
            if (property.type === 'rental') {
                return total + property.price * 0.20;
            } else if (property.type === 'brrr') {
                return total + property.price * 0.30; // After refinance
            }
            return total;
        }, 0);
    }

    /**
     * Estimate rent based on property price
     */
    estimateRent(propertyPrice) {
        // Detroit market: roughly 1-1.5% of property value per month
        const rentRatio = this.getRandomInRange(0.01, 0.015);
        const baseRent = propertyPrice * rentRatio;
        
        // Ensure within reasonable range
        return Math.max(
            this.assumptions.rentRange.min,
            Math.min(this.assumptions.rentRange.max, baseRent)
        );
    }

    /**
     * Calculate mortgage payment
     */
    calculateMortgagePayment(principal, annualRate, years) {
        if (principal <= 0 || annualRate <= 0) return 0;
        
        const monthlyRate = annualRate / 12;
        const numPayments = years * 12;
        
        const payment = principal * 
            (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
            (Math.pow(1 + monthlyRate, numPayments) - 1);
            
        return Math.round(payment);
    }

    /**
     * Get random value in range
     */
    getRandomInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Process scheduled events (like flip completions)
     */
    processScheduledEvents(state, currentMonth) {
        if (!state.scheduledEvents) return;
        
        const eventsToProcess = state.scheduledEvents.filter(event => event.month === currentMonth);
        
        eventsToProcess.forEach(event => {
            if (event.type === 'flip_complete') {
                state.cashAvailable += event.cashInflow;
                state.monthlyIncome += event.monthlyIncomeAdjustment;
                console.log(`Flip completed at month ${currentMonth}: +$${event.cashInflow} cash`);
            }
        });
        
        // Remove processed events
        state.scheduledEvents = state.scheduledEvents.filter(event => event.month > currentMonth);
    }

    /**
     * Generate fallback strategy
     */
    generateFallbackStrategy(goal) {
        return {
            approach: 'balanced',
            timeline: [],
            monthsToGoal: goal.timeHorizon,
            propertyCount: Math.ceil(goal.targetMonthlyIncome / 400),
            totalInvestment: goal.startingCapital,
            finalMonthlyIncome: 0,
            feasibility: false,
            description: 'Unable to generate optimal strategy. Consider adjusting your goals or increasing capital.',
            metrics: {},
            failureReason: 'Could not find a viable investment path within the given constraints'
        };
    }
}

// Make available globally
window.StrategyGenerator = StrategyGenerator;