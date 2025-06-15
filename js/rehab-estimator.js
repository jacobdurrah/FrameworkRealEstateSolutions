// Rehab Estimation System
// Provides realistic rehab cost estimates based on property condition and scope

class RehabEstimator {
    constructor() {
        // Cost per square foot for different rehab levels
        this.costPerSqFt = {
            lightUpdate: 15,      // Paint, deep clean, landscaping
            cosmetic: 35,         // Paint, flooring, fixtures, landscaping
            gutRehab: 75          // Complete renovation including systems
        };

        // Additional costs for specific rooms
        this.roomCosts = {
            lightUpdate: {
                kitchen: 2500,    // Deep clean, new hardware
                bathroom: 1000    // Deep clean, new fixtures
            },
            cosmetic: {
                kitchen: 8000,    // New counters, cabinet refacing, appliances
                bathroom: 4000    // New vanity, fixtures, tile work
            },
            gutRehab: {
                kitchen: 20000,   // Complete renovation
                bathroom: 10000   // Complete renovation
            }
        };

        // Other fixed costs
        this.additionalCosts = {
            lightUpdate: {
                landscaping: 2000,
                cleaning: 500,
                misc: 500
            },
            cosmetic: {
                landscaping: 3500,
                painting: 3000,
                misc: 1500
            },
            gutRehab: {
                roof: 8000,
                hvac: 6000,
                electrical: 5000,
                plumbing: 5000,
                landscaping: 5000,
                misc: 3000
            }
        };
    }

    // Estimate rehab cost based on property details
    estimate(sqft, bedrooms, bathrooms, level = 'cosmetic') {
        // Base cost calculation
        let baseCost = sqft * this.costPerSqFt[level];

        // Add room-specific costs
        // Assume 1 kitchen for all properties
        baseCost += this.roomCosts[level].kitchen;

        // Add bathroom costs
        baseCost += this.roomCosts[level].bathroom * bathrooms;

        // Add additional fixed costs
        Object.values(this.additionalCosts[level]).forEach(cost => {
            baseCost += cost;
        });

        // Round to nearest $500
        return Math.round(baseCost / 500) * 500;
    }

    // Get description of what's included
    getDescription(level) {
        const descriptions = {
            lightUpdate: {
                title: "Light Update",
                description: "Deep clean, fresh paint, and basic landscaping",
                includes: [
                    "Interior and exterior painting",
                    "Professional deep cleaning",
                    "Basic landscaping and curb appeal",
                    "Minor fixture updates",
                    "New kitchen hardware"
                ]
            },
            cosmetic: {
                title: "Cosmetic Rehab",
                description: "Update fixtures, flooring, and finishes throughout",
                includes: [
                    "New flooring (LVP or carpet)",
                    "Complete interior paint",
                    "Kitchen updates (counters, cabinet refacing, appliances)",
                    "Bathroom updates (vanity, fixtures, tile)",
                    "New light fixtures and hardware",
                    "Landscaping and curb appeal"
                ]
            },
            gutRehab: {
                title: "Gut Rehab",
                description: "Complete renovation including all systems",
                includes: [
                    "New roof (if needed)",
                    "HVAC system replacement",
                    "Electrical system update",
                    "Plumbing updates",
                    "Complete kitchen renovation",
                    "Complete bathroom renovation(s)",
                    "All new flooring and finishes",
                    "Structural repairs if needed"
                ]
            }
        };

        return descriptions[level];
    }

    // Get tooltip text for UI
    getTooltip(sqft, bedrooms, bathrooms, level) {
        const cost = this.estimate(sqft, bedrooms, bathrooms, level);
        const desc = this.getDescription(level);
        const perSqFt = this.costPerSqFt[level];

        return `${desc.title}: $${cost.toLocaleString()}\n` +
               `Base: $${perSqFt}/sqft × ${sqft} sqft\n` +
               `Kitchen: $${this.roomCosts[level].kitchen.toLocaleString()}\n` +
               `Bathrooms: ${bathrooms} × $${this.roomCosts[level].bathroom.toLocaleString()}\n` +
               `Additional costs included`;
    }
}

// Section 8 Rent Estimator
class RentEstimator {
    constructor() {
        // Section 8 Fair Market Rents for Detroit (2024 rates)
        this.section8Rates = {
            0: 892,   // Studio
            1: 960,   // 1 BR
            2: 1204,  // 2 BR
            3: 1548,  // 3 BR
            4: 1738,  // 4 BR
            5: 1999   // 5 BR
        };

        // Market rate multiplier (Section 8 often pays slightly above market)
        this.marketMultiplier = 1.1;
    }

    // Estimate rent based on bedrooms and property type
    estimate(bedrooms, propertyType = 'single-family', rentZestimate = null) {
        // If we have a Zillow rent estimate, use it as a baseline
        if (rentZestimate && rentZestimate > 0) {
            return rentZestimate;
        }

        // Use Section 8 rates as baseline
        const baseRent = this.section8Rates[Math.min(bedrooms, 5)] || this.section8Rates[3];

        // Adjust for property type
        let multiplier = 1.0;
        if (propertyType === 'single-family') {
            multiplier = 1.05; // Single family homes command slight premium
        }

        return Math.round(baseRent * multiplier);
    }

    // Get tooltip explaining rent calculation
    getTooltip(bedrooms, rent) {
        const section8Rate = this.section8Rates[Math.min(bedrooms, 5)] || this.section8Rates[3];
        
        return `Estimated Monthly Rent: $${rent.toLocaleString()}\n` +
               `Based on Section 8 FMR for ${bedrooms}BR: $${section8Rate.toLocaleString()}\n` +
               `Adjusted for single-family home premium\n` +
               `Actual rents may vary by neighborhood and condition`;
    }
}

// Export for use in other modules
window.RehabEstimator = RehabEstimator;
window.RentEstimator = RentEstimator;