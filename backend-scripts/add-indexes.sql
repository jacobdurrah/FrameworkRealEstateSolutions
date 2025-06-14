-- Add missing indexes to improve query performance
-- Run this in Supabase SQL Editor to fix timeout issues

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_parcels_street_number;
DROP INDEX IF EXISTS idx_parcels_street_name;
DROP INDEX IF EXISTS idx_parcels_address_gin;

-- Create new optimized indexes

-- Index for street number (exact match)
CREATE INDEX idx_parcels_street_number ON parcels(street_number);

-- Index for street name (pattern matching)
CREATE INDEX idx_parcels_street_name ON parcels(UPPER(street_name));

-- GIN index for full-text search on address (most efficient for ILIKE queries)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_parcels_address_gin ON parcels USING gin(UPPER(address) gin_trgm_ops);

-- Also create GIN indexes for owner and mailing address searches
CREATE INDEX idx_parcels_owner_gin ON parcels USING gin(UPPER(owner_full_name) gin_trgm_ops);
CREATE INDEX idx_parcels_mailing_gin ON parcels USING gin(UPPER(owner_full_mailing_address) gin_trgm_ops);

-- Analyze the table to update statistics
ANALYZE parcels;

-- Check that indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'parcels' 
ORDER BY indexname;