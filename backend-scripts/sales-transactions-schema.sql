-- Sales Transactions Table Schema for Supabase
-- This table stores historical property sales data for tracking owner transaction history

-- Drop table if exists (for clean setup)
DROP TABLE IF EXISTS sales_transactions CASCADE;

-- Create the sales transactions table
CREATE TABLE sales_transactions (
    id BIGSERIAL PRIMARY KEY,
    
    -- Property Information
    property_address VARCHAR(200) NOT NULL,
    property_city VARCHAR(100) DEFAULT 'Detroit',
    property_state VARCHAR(2) DEFAULT 'MI',
    property_zip VARCHAR(10),
    parcel_id VARCHAR(50),
    
    -- Transaction Details
    seller_name VARCHAR(400) NOT NULL,
    buyer_name VARCHAR(400) NOT NULL,
    sale_date DATE NOT NULL,
    sale_price DECIMAL(12, 2) NOT NULL,
    
    -- Property Details
    property_type VARCHAR(100),
    year_built INTEGER,
    square_feet INTEGER,
    bedrooms INTEGER,
    bathrooms DECIMAL(3,1),
    lot_size DECIMAL(10,2),
    
    -- Additional Information
    sale_terms VARCHAR(200), -- Cash, Conventional, FHA, etc.
    property_use VARCHAR(100), -- Residential, Investment, etc.
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    data_source VARCHAR(100) DEFAULT '2025 Resi All Transactions'
);

-- Create indexes for fast searching
CREATE INDEX idx_sales_seller_name ON sales_transactions(UPPER(seller_name));
CREATE INDEX idx_sales_buyer_name ON sales_transactions(UPPER(buyer_name));
CREATE INDEX idx_sales_property_address ON sales_transactions(UPPER(property_address));
CREATE INDEX idx_sales_sale_date ON sales_transactions(sale_date DESC);
CREATE INDEX idx_sales_parcel_id ON sales_transactions(parcel_id);
CREATE INDEX idx_sales_price_range ON sales_transactions(sale_price);

-- Create compound indexes for common queries
CREATE INDEX idx_sales_seller_date ON sales_transactions(UPPER(seller_name), sale_date DESC);
CREATE INDEX idx_sales_buyer_date ON sales_transactions(UPPER(buyer_name), sale_date DESC);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_sales_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_sales_transactions_updated_at BEFORE UPDATE ON sales_transactions
    FOR EACH ROW EXECUTE FUNCTION update_sales_updated_at_column();

-- Enable Row Level Security
ALTER TABLE sales_transactions ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public read access
CREATE POLICY "Allow public read access" ON sales_transactions
    FOR SELECT USING (true);

-- Create views for common queries

-- View for seller statistics
CREATE OR REPLACE VIEW seller_statistics AS
SELECT 
    UPPER(seller_name) as seller_name_normalized,
    COUNT(*) as total_sales,
    SUM(sale_price) as total_sales_value,
    AVG(sale_price) as avg_sale_price,
    MIN(sale_date) as first_sale_date,
    MAX(sale_date) as last_sale_date,
    COUNT(DISTINCT EXTRACT(YEAR FROM sale_date)) as years_active
FROM sales_transactions
GROUP BY UPPER(seller_name);

-- View for recent sales
CREATE OR REPLACE VIEW recent_sales AS
SELECT 
    property_address,
    seller_name,
    buyer_name,
    sale_date,
    sale_price,
    bedrooms,
    bathrooms,
    square_feet
FROM sales_transactions
WHERE sale_date >= CURRENT_DATE - INTERVAL '1 year'
ORDER BY sale_date DESC;

-- Grant permissions
GRANT SELECT ON sales_transactions TO anon;
GRANT SELECT ON seller_statistics TO anon;
GRANT SELECT ON recent_sales TO anon;