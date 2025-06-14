-- Supabase Schema for Detroit Parcel Data
-- Run this in the Supabase SQL Editor to create the table

-- Drop table if exists (for clean setup)
DROP TABLE IF EXISTS parcels CASCADE;

-- Create the parcels table
CREATE TABLE parcels (
    id BIGSERIAL PRIMARY KEY,
    -- Identifiers
    parcel_id VARCHAR(50) UNIQUE,
    address VARCHAR(200) NOT NULL,
    zip_code VARCHAR(10),
    
    -- Owner Information
    owner_name1 VARCHAR(200),
    owner_name2 VARCHAR(200),
    owner_full_name VARCHAR(400),
    owner_mailing_address VARCHAR(200),
    owner_mailing_city VARCHAR(100),
    owner_mailing_state VARCHAR(50),
    owner_mailing_zip VARCHAR(10),
    owner_full_mailing_address VARCHAR(500),
    
    -- Property Details
    property_class VARCHAR(10),
    property_class_description VARCHAR(200),
    year_built INTEGER,
    building_style VARCHAR(100),
    building_count INTEGER,
    total_floor_area INTEGER,
    
    -- Tax Information
    tax_status VARCHAR(100),
    tax_status_description VARCHAR(200),
    assessed_value DECIMAL(12, 2),
    previous_assessed_value DECIMAL(12, 2),
    taxable_value DECIMAL(12, 2),
    previous_taxable_value DECIMAL(12, 2),
    
    -- Location Information
    neighborhood VARCHAR(200),
    ward INTEGER,
    council_district INTEGER,
    
    -- Lot Information
    total_square_footage INTEGER,
    total_acreage DECIMAL(10, 4),
    frontage DECIMAL(10, 2),
    depth DECIMAL(10, 2),
    
    -- Sale Information
    sale_date DATE,
    sale_price DECIMAL(12, 2),
    
    -- Additional Fields
    legal_description TEXT,
    street_number VARCHAR(20),
    street_prefix VARCHAR(10),
    street_name VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast searching
CREATE INDEX idx_parcels_address ON parcels(UPPER(address));
CREATE INDEX idx_parcels_owner_full_name ON parcels(UPPER(owner_full_name));
CREATE INDEX idx_parcels_owner_mailing_address ON parcels(UPPER(owner_full_mailing_address));
CREATE INDEX idx_parcels_neighborhood ON parcels(UPPER(neighborhood));
CREATE INDEX idx_parcels_zip_code ON parcels(zip_code);
CREATE INDEX idx_parcels_parcel_id ON parcels(parcel_id);
CREATE INDEX idx_parcels_assessed_value ON parcels(assessed_value);
CREATE INDEX idx_parcels_sale_price ON parcels(sale_price);
CREATE INDEX idx_parcels_year_built ON parcels(year_built);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_parcels_updated_at BEFORE UPDATE ON parcels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional but recommended)
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public read access
CREATE POLICY "Allow public read access" ON parcels
    FOR SELECT USING (true);

-- Create a view for simplified property searches
CREATE OR REPLACE VIEW property_search AS
SELECT 
    id,
    parcel_id,
    address,
    zip_code,
    owner_full_name,
    owner_full_mailing_address,
    neighborhood,
    property_class_description,
    year_built,
    total_floor_area,
    assessed_value,
    taxable_value,
    sale_date,
    sale_price,
    total_acreage,
    frontage,
    depth
FROM parcels;