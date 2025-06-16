-- Add loan tracking and enhanced property status to Portfolio Simulation schema

-- Add new columns to simulation_phases table for loan tracking
ALTER TABLE simulation_phases ADD COLUMN IF NOT EXISTS loan_type VARCHAR(50); -- conventional, hard-money, private
ALTER TABLE simulation_phases ADD COLUMN IF NOT EXISTS interest_rate DECIMAL(5,3);
ALTER TABLE simulation_phases ADD COLUMN IF NOT EXISTS loan_term_months INTEGER;
ALTER TABLE simulation_phases ADD COLUMN IF NOT EXISTS closing_costs DECIMAL(12,2);
ALTER TABLE simulation_phases ADD COLUMN IF NOT EXISTS points DECIMAL(5,2);

-- Add property status tracking
ALTER TABLE simulation_properties ADD COLUMN IF NOT EXISTS property_status VARCHAR(50) DEFAULT 'active'; -- active, sold, refinanced
ALTER TABLE simulation_properties ADD COLUMN IF NOT EXISTS strategy VARCHAR(50); -- buy-hold, brrrr, flip
ALTER TABLE simulation_properties ADD COLUMN IF NOT EXISTS rehab_months INTEGER DEFAULT 0;
ALTER TABLE simulation_properties ADD COLUMN IF NOT EXISTS sale_date TIMESTAMPTZ;
ALTER TABLE simulation_properties ADD COLUMN IF NOT EXISTS sale_price DECIMAL(12,2);

-- Create loans table for tracking all loans
CREATE TABLE IF NOT EXISTS simulation_loans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
    property_id UUID REFERENCES simulation_properties(id) ON DELETE CASCADE,
    loan_type VARCHAR(50) NOT NULL, -- mortgage, heloc, private, hard-money
    loan_amount DECIMAL(12,2) NOT NULL,
    interest_rate DECIMAL(5,3) NOT NULL,
    term_months INTEGER NOT NULL,
    origination_date TIMESTAMPTZ NOT NULL,
    monthly_payment DECIMAL(12,2) NOT NULL,
    closing_costs DECIMAL(12,2) DEFAULT 0,
    points DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active', -- active, paid, refinanced
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add rent accumulation tracking to projections
ALTER TABLE simulation_projections ADD COLUMN IF NOT EXISTS accumulated_rent DECIMAL(12,2) DEFAULT 0;
ALTER TABLE simulation_projections ADD COLUMN IF NOT EXISTS property_breakdown JSONB; -- {hold: 2, brrrr_active: 1, flip_active: 1, sold: 2}

-- Create index for loans
CREATE INDEX IF NOT EXISTS idx_loans_simulation_id ON simulation_loans(simulation_id);
CREATE INDEX IF NOT EXISTS idx_loans_property_id ON simulation_loans(property_id);

-- Enable RLS for loans table
ALTER TABLE simulation_loans ENABLE ROW LEVEL SECURITY;

-- Create policy for loans
CREATE POLICY "loans_public_access" ON simulation_loans
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON simulation_loans TO anon;

-- Add comments for documentation
COMMENT ON COLUMN simulation_phases.loan_type IS 'Type of loan: conventional, hard-money, private';
COMMENT ON COLUMN simulation_phases.interest_rate IS 'Annual interest rate as decimal (e.g., 0.07 for 7%)';
COMMENT ON COLUMN simulation_phases.closing_costs IS 'Total closing costs including title, appraisal, etc.';
COMMENT ON COLUMN simulation_phases.points IS 'Loan origination points';
COMMENT ON COLUMN simulation_properties.property_status IS 'Current status: active, sold, refinanced';
COMMENT ON COLUMN simulation_properties.strategy IS 'Investment strategy: buy-hold, brrrr, flip';
COMMENT ON COLUMN simulation_projections.accumulated_rent IS 'Total rent collected minus expenses up to this month';
COMMENT ON COLUMN simulation_projections.property_breakdown IS 'JSON breakdown of properties by status';