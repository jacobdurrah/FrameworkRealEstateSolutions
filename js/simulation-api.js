// Portfolio Simulation API Service
// Handles all simulation data operations with Supabase

class SimulationAPIService {
    constructor() {
        this.initialized = false;
        this.client = null;
    }

    // Initialize with Supabase client
    async init(supabaseUrl, supabaseKey) {
        if (this.initialized) return true;

        try {
            const { createClient } = window.supabase;
            this.client = createClient(supabaseUrl, supabaseKey);
            this.initialized = true;
            console.log('Simulation API service initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize Simulation API service:', error);
            return false;
        }
    }

    // Get user's email from localStorage or prompt
    getUserEmail() {
        let email = localStorage.getItem('simulationUserEmail');
        if (!email) {
            email = prompt('Enter your email to save/load simulations:');
            if (email) {
                localStorage.setItem('simulationUserEmail', email);
            }
        }
        return email;
    }

    // Create a new simulation
    async createSimulation(data) {
        const userEmail = this.getUserEmail();
        if (!userEmail) return { error: 'Email required' };

        const simulation = {
            name: data.name || 'New Simulation',
            description: data.description || '',
            user_email: userEmail,
            target_monthly_income: data.targetMonthlyIncome || 10000,
            initial_capital: data.initialCapital || 50000,
            time_horizon_months: data.timeHorizon || 36,
            strategy_type: data.strategyType || 'balanced'
        };

        const { data: result, error } = await this.client
            .from('simulations')
            .insert([simulation])
            .select()
            .single();

        if (error) {
            console.error('Error creating simulation:', error);
            return { error };
        }

        return { data: result };
    }

    // Get all simulations for current user
    async getUserSimulations() {
        const userEmail = this.getUserEmail();
        if (!userEmail) return [];

        const { data, error } = await this.client
            .from('simulations')
            .select('*')
            .eq('user_email', userEmail)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching simulations:', error);
            return [];
        }

        return data || [];
    }

    // Get a specific simulation with all related data
    async getSimulation(simulationId) {
        const { data: simulation, error: simError } = await this.client
            .from('simulations')
            .select('*')
            .eq('id', simulationId)
            .single();

        if (simError) {
            console.error('Error fetching simulation:', simError);
            return null;
        }

        // Get phases
        const { data: phases } = await this.client
            .from('simulation_phases')
            .select('*')
            .eq('simulation_id', simulationId)
            .order('phase_number');

        // Get projections
        const { data: projections } = await this.client
            .from('simulation_projections')
            .select('*')
            .eq('simulation_id', simulationId)
            .order('month_number');

        // Update last accessed time
        await this.client
            .from('simulations')
            .update({ last_accessed_at: new Date().toISOString() })
            .eq('id', simulationId);

        return {
            ...simulation,
            phases: phases || [],
            projections: projections || []
        };
    }

    // Update simulation basic info
    async updateSimulation(simulationId, updates) {
        const { data, error } = await this.client
            .from('simulations')
            .update(updates)
            .eq('id', simulationId)
            .select()
            .single();

        if (error) {
            console.error('Error updating simulation:', error);
            return { error };
        }

        return { data };
    }

    // Add a phase to simulation
    async addPhase(simulationId, phaseData) {
        const phase = {
            simulation_id: simulationId,
            phase_number: phaseData.phaseNumber,
            month_number: phaseData.monthNumber,
            action_type: phaseData.actionType,
            property_id: phaseData.propertyId,
            property_address: phaseData.propertyAddress,
            purchase_price: phaseData.purchasePrice,
            sale_price: phaseData.salePrice,
            rehab_cost: phaseData.rehabCost,
            down_payment_percent: phaseData.downPaymentPercent || 20,
            loan_amount: phaseData.loanAmount,
            monthly_rental_income: phaseData.monthlyRentalIncome,
            notes: phaseData.notes
        };

        const { data, error } = await this.client
            .from('simulation_phases')
            .insert([phase])
            .select()
            .single();

        if (error) {
            console.error('Error adding phase:', error);
            return { error };
        }

        // Trigger recalculation of projections
        await this.recalculateProjections(simulationId);

        return { data };
    }

    // Update a phase
    async updatePhase(phaseId, updates) {
        const { data, error } = await this.client
            .from('simulation_phases')
            .update(updates)
            .eq('id', phaseId)
            .select()
            .single();

        if (error) {
            console.error('Error updating phase:', error);
            return { error };
        }

        // Get simulation ID and recalculate
        if (data) {
            await this.recalculateProjections(data.simulation_id);
        }

        return { data };
    }

    // Delete a phase
    async deletePhase(phaseId) {
        // First get the phase to know which simulation to recalculate
        const { data: phase } = await this.client
            .from('simulation_phases')
            .select('simulation_id')
            .eq('id', phaseId)
            .single();

        const { error } = await this.client
            .from('simulation_phases')
            .delete()
            .eq('id', phaseId);

        if (error) {
            console.error('Error deleting phase:', error);
            return { error };
        }

        // Recalculate projections
        if (phase) {
            await this.recalculateProjections(phase.simulation_id);
        }

        return { success: true };
    }

    // Save monthly projection data
    async saveProjection(simulationId, monthNumber, projectionData) {
        const projection = {
            simulation_id: simulationId,
            month_number: monthNumber,
            total_properties: projectionData.totalProperties || 0,
            rental_income: projectionData.rentalIncome || 0,
            total_expenses: projectionData.totalExpenses || 0,
            mortgage_payments: projectionData.mortgagePayments || 0,
            net_cashflow: projectionData.netCashflow || 0,
            cash_reserves: projectionData.cashReserves || 0,
            total_equity: projectionData.totalEquity || 0,
            total_debt: projectionData.totalDebt || 0,
            roi_percentage: projectionData.roiPercentage || 0,
            properties_data: projectionData.propertiesData || {}
        };

        const { data, error } = await this.client
            .from('simulation_projections')
            .upsert([projection], {
                onConflict: 'simulation_id,month_number'
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving projection:', error);
            return { error };
        }

        return { data };
    }

    // Recalculate all projections for a simulation
    async recalculateProjections(simulationId) {
        // This will be implemented with the financial calculation engine
        console.log('Recalculating projections for simulation:', simulationId);
        // For now, just update the simulation's updated_at
        await this.updateSimulation(simulationId, {});
    }

    // Delete a simulation
    async deleteSimulation(simulationId) {
        const { error } = await this.client
            .from('simulations')
            .delete()
            .eq('id', simulationId);

        if (error) {
            console.error('Error deleting simulation:', error);
            return { error };
        }

        return { success: true };
    }

    // Get summary statistics for a simulation
    async getSimulationSummary(simulationId) {
        const simulation = await this.getSimulation(simulationId);
        if (!simulation) return null;

        const lastProjection = simulation.projections[simulation.projections.length - 1];
        
        return {
            name: simulation.name,
            targetIncome: simulation.target_monthly_income,
            initialCapital: simulation.initial_capital,
            timeHorizon: simulation.time_horizon_months,
            totalPhases: simulation.phases.length,
            projectedMonthlyIncome: lastProjection?.net_cashflow || 0,
            projectedTotalEquity: lastProjection?.total_equity || 0,
            projectedROI: lastProjection?.roi_percentage || 0,
            goalAchieved: (lastProjection?.net_cashflow || 0) >= simulation.target_monthly_income
        };
    }
}

// Export as singleton
window.SimulationAPIService = SimulationAPIService;