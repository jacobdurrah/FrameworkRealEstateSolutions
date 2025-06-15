-- Updated Sales Transactions Table Schema for Comprehensive Detroit Sales Data
-- Drop existing table and recreate with new schema

-- Drop dependent views first
DROP VIEW IF EXISTS seller_statistics CASCADE;
DROP VIEW IF EXISTS recent_sales CASCADE;

-- Drop table if exists
DROP TABLE IF EXISTS sales_transactions CASCADE;

-- Create the updated sales transactions table
CREATE TABLE sales_transactions (
    id BIGSERIAL PRIMARY KEY,
    
    -- Sales Identifiers
    sales_id INTEGER UNIQUE,
    parcel_number VARCHAR(50),
    sale_number INTEGER,
    
    -- Property Address Information
    street_address VARCHAR(200) NOT NULL,
    street_number VARCHAR(20),
    street_prefix VARCHAR(10),
    street_name VARCHAR(100),
    unit_number VARCHAR(20),
    
    -- Transaction Details
    sale_date DATE NOT NULL,
    sale_price DECIMAL(12, 2) NOT NULL,
    grantor VARCHAR(400), -- Seller
    grantee VARCHAR(400), -- Buyer
    
    -- Legal Information
    liber_page VARCHAR(100),
    terms_of_sale VARCHAR(200),
    sale_verification VARCHAR(100),
    sale_instrument VARCHAR(100),
    property_transfer_percentage DECIMAL(5,2),
    
    -- Property Classification
    property_class_code VARCHAR(50),
    ecf_neighborhood VARCHAR(100),
    
    -- Location Data
    x_coordinate DECIMAL(12,6),
    y_coordinate DECIMAL(12,6),
    esri_oid INTEGER,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    data_source VARCHAR(100) DEFAULT 'Detroit Property Sales Data'
);

-- Create indexes for fast searching
CREATE INDEX idx_sales_sales_id ON sales_transactions(sales_id);
CREATE INDEX idx_sales_parcel_number ON sales_transactions(parcel_number);
CREATE INDEX idx_sales_street_address ON sales_transactions(UPPER(street_address));
CREATE INDEX idx_sales_grantor ON sales_transactions(UPPER(grantor));
CREATE INDEX idx_sales_grantee ON sales_transactions(UPPER(grantee));
CREATE INDEX idx_sales_sale_date ON sales_transactions(sale_date DESC);
CREATE INDEX idx_sales_sale_price ON sales_transactions(sale_price);
CREATE INDEX idx_sales_neighborhood ON sales_transactions(UPPER(ecf_neighborhood));

-- Create compound indexes for common queries
CREATE INDEX idx_sales_grantor_date ON sales_transactions(UPPER(grantor), sale_date DESC);
CREATE INDEX idx_sales_grantee_date ON sales_transactions(UPPER(grantee), sale_date DESC);

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

-- Create policies
-- Allow public read access
CREATE POLICY "Allow public read access" ON sales_transactions
    FOR SELECT USING (true);

-- Allow public inserts (for imports)
CREATE POLICY "Allow public inserts" ON sales_transactions
    FOR INSERT TO anon
    WITH CHECK (true);

-- Allow public updates (for data enrichment)
CREATE POLICY "Allow public updates" ON sales_transactions
    FOR UPDATE TO anon
    USING (true)
    WITH CHECK (true);

-- Create updated views for common queries

-- View for seller statistics (using grantor as seller)
CREATE OR REPLACE VIEW seller_statistics AS
SELECT 
    UPPER(grantor) as seller_name_normalized,
    COUNT(*) as total_sales,
    SUM(sale_price) as total_sales_value,
    AVG(sale_price) as avg_sale_price,
    MIN(sale_date) as first_sale_date,
    MAX(sale_date) as last_sale_date,
    COUNT(DISTINCT EXTRACT(YEAR FROM sale_date)) as years_active,
    COUNT(DISTINCT ecf_neighborhood) as neighborhoods_sold_in
FROM sales_transactions
WHERE grantor IS NOT NULL 
  AND grantor != ''
  AND sale_price > 0
GROUP BY UPPER(grantor);

-- View for buyer statistics (using grantee as buyer)
CREATE OR REPLACE VIEW buyer_statistics AS
SELECT 
    UPPER(grantee) as buyer_name_normalized,
    COUNT(*) as total_purchases,
    SUM(sale_price) as total_purchase_value,
    AVG(sale_price) as avg_purchase_price,
    MIN(sale_date) as first_purchase_date,
    MAX(sale_date) as last_purchase_date,
    COUNT(DISTINCT EXTRACT(YEAR FROM sale_date)) as years_active,
    COUNT(DISTINCT ecf_neighborhood) as neighborhoods_bought_in
FROM sales_transactions
WHERE grantee IS NOT NULL 
  AND grantee != ''
  AND sale_price > 0
GROUP BY UPPER(grantee);

-- View for recent sales
CREATE OR REPLACE VIEW recent_sales AS
SELECT 
    sales_id,
    street_address,
    grantor as seller_name,
    grantee as buyer_name,
    sale_date,
    sale_price,
    ecf_neighborhood,
    property_class_code,
    terms_of_sale
FROM sales_transactions
WHERE sale_date >= CURRENT_DATE - INTERVAL '1 year'
  AND sale_price > 0
ORDER BY sale_date DESC;

-- View for neighborhood statistics
CREATE OR REPLACE VIEW neighborhood_statistics AS
SELECT 
    ecf_neighborhood,
    COUNT(*) as total_sales,
    AVG(sale_price) as avg_sale_price,
    MIN(sale_price) as min_sale_price,
    MAX(sale_price) as max_sale_price,
    COUNT(DISTINCT DATE_TRUNC('month', sale_date)) as months_with_sales,
    AVG(CASE WHEN sale_date >= CURRENT_DATE - INTERVAL '1 year' THEN sale_price END) as avg_price_last_year
FROM sales_transactions
WHERE sale_price > 0
  AND ecf_neighborhood IS NOT NULL
GROUP BY ecf_neighborhood;

-- Grant permissions
GRANT SELECT ON sales_transactions TO anon;
GRANT SELECT ON seller_statistics TO anon;
GRANT SELECT ON buyer_statistics TO anon;
GRANT SELECT ON recent_sales TO anon;
GRANT SELECT ON neighborhood_statistics TO anon;