-- Portfolio Simulation Tool Database Schema
-- Tables for storing simulation scenarios and financial projections

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS simulation_projections CASCADE;
DROP TABLE IF EXISTS simulation_properties CASCADE;
DROP TABLE IF EXISTS simulation_phases CASCADE;
DROP TABLE IF EXISTS simulations CASCADE;

-- Main simulations table
CREATE TABLE simulations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    user_email VARCHAR(255), -- For now, just email to identify users
    target_monthly_income DECIMAL(12,2) NOT NULL,
    initial_capital DECIMAL(12,2) NOT NULL,
    time_horizon_months INTEGER DEFAULT 36, -- Default 3 years
    strategy_type VARCHAR(50) DEFAULT 'balanced', -- conservative, balanced, aggressive
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, completed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investment phases/actions in the simulation
CREATE TABLE simulation_phases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
    phase_number INTEGER NOT NULL,
    month_number INTEGER NOT NULL, -- When this phase starts
    action_type VARCHAR(50) NOT NULL, -- buy, sell, refinance, flip_complete
    property_id UUID,
    property_address VARCHAR(255),
    purchase_price DECIMAL(12,2),
    sale_price DECIMAL(12,2),
    rehab_cost DECIMAL(12,2),
    down_payment_percent DECIMAL(5,2) DEFAULT 20,
    loan_amount DECIMAL(12,2),
    monthly_rental_income DECIMAL(12,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties selected for simulation
CREATE TABLE simulation_properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES simulation_phases(id) ON DELETE CASCADE,
    property_data JSONB NOT NULL, -- Store full property details
    purchase_price DECIMAL(12,2) NOT NULL,
    estimated_value DECIMAL(12,2),
    monthly_rent DECIMAL(12,2),
    monthly_expenses DECIMAL(12,2),
    monthly_mortgage DECIMAL(12,2),
    net_monthly_cashflow DECIMAL(12,2),
    total_investment DECIMAL(12,2), -- Including down payment, rehab, closing costs
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly financial projections
CREATE TABLE simulation_projections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
    month_number INTEGER NOT NULL,
    total_properties INTEGER DEFAULT 0,
    rental_income DECIMAL(12,2) DEFAULT 0,
    total_expenses DECIMAL(12,2) DEFAULT 0,
    mortgage_payments DECIMAL(12,2) DEFAULT 0,
    net_cashflow DECIMAL(12,2) DEFAULT 0,
    cash_reserves DECIMAL(12,2) DEFAULT 0,
    total_equity DECIMAL(12,2) DEFAULT 0,
    total_debt DECIMAL(12,2) DEFAULT 0,
    roi_percentage DECIMAL(5,2),
    properties_data JSONB, -- Snapshot of all properties at this month
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(simulation_id, month_number)
);

-- Create indexes for performance
CREATE INDEX idx_simulations_user_email ON simulations(user_email);
CREATE INDEX idx_simulations_status ON simulations(status);
CREATE INDEX idx_simulations_updated_at ON simulations(updated_at DESC);
CREATE INDEX idx_phases_simulation_id ON simulation_phases(simulation_id);
CREATE INDEX idx_phases_month ON simulation_phases(simulation_id, month_number);
CREATE INDEX idx_properties_simulation_id ON simulation_properties(simulation_id);
CREATE INDEX idx_projections_simulation_month ON simulation_projections(simulation_id, month_number);

-- Enable Row Level Security
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_projections ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (we'll restrict by email later)
CREATE POLICY "simulations_public_access" ON simulations
    FOR ALL USING (true);

CREATE POLICY "phases_public_access" ON simulation_phases
    FOR ALL USING (true);

CREATE POLICY "properties_public_access" ON simulation_properties
    FOR ALL USING (true);

CREATE POLICY "projections_public_access" ON simulation_projections
    FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_simulation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_accessed_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_simulations_updated_at
    BEFORE UPDATE ON simulations
    FOR EACH ROW
    EXECUTE FUNCTION update_simulation_updated_at();

-- Grant permissions
GRANT ALL ON simulations TO anon;
GRANT ALL ON simulation_phases TO anon;
GRANT ALL ON simulation_properties TO anon;
GRANT ALL ON simulation_projections TO anon;

-- Sample data for testing (commented out, uncomment if needed)
/*
INSERT INTO simulations (name, description, user_email, target_monthly_income, initial_capital)
VALUES ('My First Portfolio', 'Testing the simulation tool', 'test@example.com', 10000, 50000);
*/