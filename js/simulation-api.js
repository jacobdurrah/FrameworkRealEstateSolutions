// Portfolio Simulation API Service
// Handles all simulation data operations with Supabase

class SimulationAPIService {
    constructor() {
        this.initialized = false;
        this.client = null;
        this.connectionStatus = 'disconnected';
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryDelay = 1000; // Start with 1 second
    }

    // Initialize with Supabase client
    async init(supabaseUrl, supabaseKey) {
        if (this.initialized && this.connectionStatus === 'connected') return true;

        try {
            const { createClient } = window.supabase;
            this.client = createClient(supabaseUrl, supabaseKey, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true
                },
                realtime: {
                    params: {
                        eventsPerSecond: 10
                    }
                }
            });
            
            // Test the connection
            const { error } = await this.client.from('simulations').select('count').limit(1);
            if (error) throw error;
            
            this.initialized = true;
            this.connectionStatus = 'connected';
            this.retryCount = 0;
            console.log('Simulation API service initialized and connected');
            this.notifyConnectionStatus('connected');
            return true;
        } catch (error) {
            console.error('Failed to initialize Simulation API service:', error);
            this.connectionStatus = 'error';
            this.notifyConnectionStatus('error', error.message);
            return false;
        }
    }

    // Retry operation with exponential backoff
    async retryOperation(operation) {
        let lastError;
        
        for (let i = 0; i <= this.maxRetries; i++) {
            try {
                // Check connection before attempting operation
                if (!this.initialized || this.connectionStatus !== 'connected') {
                    await this.init(window.APP_CONFIG?.SUPABASE_URL, window.APP_CONFIG?.SUPABASE_ANON_KEY);
                }
                
                const result = await operation();
                this.retryCount = 0; // Reset on success
                return result;
            } catch (error) {
                lastError = error;
                console.warn(`Operation failed (attempt ${i + 1}/${this.maxRetries + 1}):`, error);
                
                if (i < this.maxRetries) {
                    const delay = this.retryDelay * Math.pow(2, i); // Exponential backoff
                    console.log(`Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }
    
    // Notify UI about connection status
    notifyConnectionStatus(status, message = '') {
        const event = new CustomEvent('simulationApiStatus', {
            detail: { status, message, timestamp: new Date() }
        });
        window.dispatchEvent(event);
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

        try {
            const { data: result, error } = await this.retryOperation(async () => {
                return await this.client
                    .from('simulations')
                    .insert([simulation])
                    .select()
                    .single();
            });

            if (error) {
                console.error('Error creating simulation:', error);
                return { error };
            }

            return { data: result };
        } catch (error) {
            console.error('Failed to create simulation after retries, using offline mode:', error);
            
            // Fallback to offline storage
            if (window.offlineStorage) {
                const offlineId = `offline_sim_${Date.now()}`;
                const offlineSimulation = {
                    ...simulation,
                    id: offlineId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                
                window.offlineStorage.saveSimulation(offlineId, offlineSimulation);
                window.offlineStorage.markForSync('simulation', offlineSimulation);
                
                this.notifyConnectionStatus('offline', 'Simulation saved offline. Will sync when connection returns.');
                return { data: offlineSimulation };
            }
            
            return { error: { message: 'Connection failed. Please check your internet connection and try again.' } };
        }
    }

    // Get all simulations for current user
    async getUserSimulations() {
        const userEmail = this.getUserEmail();
        if (!userEmail) return [];

        try {
            const { data, error } = await this.retryOperation(async () => {
                return await this.client
                    .from('simulations')
                    .select('*')
                    .eq('user_email', userEmail)
                    .order('updated_at', { ascending: false });
            });

            if (error) {
                console.error('Error fetching simulations:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Failed to fetch simulations after retries:', error);
            this.notifyConnectionStatus('error', 'Failed to load simulations');
            return [];
        }
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
        // Ensure we have at least one field to update
        if (!updates || Object.keys(updates).length === 0) {
            console.warn('No fields to update, adding updated_at timestamp');
            updates = { updated_at: new Date().toISOString() };
        }

        const { data, error } = await this.client
            .from('simulations')
            .update(updates)
            .eq('id', simulationId)
            .select()
            .single();

        if (error) {
            console.error('Error updating simulation:', error);
            console.error('Simulation ID:', simulationId);
            console.error('Updates:', updates);
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
            // Loan fields will be stored in notes until schema is updated
            // loan_type: phaseData.loanType,
            // interest_rate: phaseData.interestRate,
            // loan_term_months: phaseData.loanTermMonths,
            // closing_costs: phaseData.closingCosts,
            // points: phaseData.points
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
            total_properties: projectionData.total_properties || 0,
            rental_income: projectionData.rental_income || 0,
            total_expenses: projectionData.total_expenses || 0,
            mortgage_payments: projectionData.mortgage_payments || 0,
            net_cashflow: projectionData.net_cashflow || 0,
            cash_reserves: projectionData.cash_reserves || 0,
            total_equity: projectionData.total_equity || 0,
            total_debt: projectionData.total_debt || 0,
            roi_percentage: projectionData.roi_percentage || 0,
            properties_data: projectionData.properties_data || {}
            // New fields will be included in properties_data until schema is updated
            // accumulated_rent: projectionData.accumulated_rent || 0,
            // property_breakdown: projectionData.property_breakdown || {}
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
        // Update the simulation's updated_at timestamp
        await this.updateSimulation(simulationId, {
            updated_at: new Date().toISOString()
        });
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