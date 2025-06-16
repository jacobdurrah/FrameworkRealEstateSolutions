-- Update closing costs assumption for portfolio simulator
-- This updates the default closing cost assumption to 3% of purchase price

-- Add a comment to document the assumption
COMMENT ON TABLE simulation_phases IS 'Phases in a real estate portfolio simulation. Default closing costs assumption is 3% of purchase price.';

-- Note: The application will calculate closing costs as:
-- closing_costs = purchase_price * 0.03
-- This covers typical costs including:
-- - Title insurance
-- - Appraisal fees
-- - Inspection costs
-- - Attorney fees
-- - Recording fees
-- - Transfer taxes (varies by location)