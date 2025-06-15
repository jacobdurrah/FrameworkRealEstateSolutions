-- Migration script to update sales_transactions table with new columns

-- First, check if the grantor/grantee columns exist
DO $$ 
BEGIN
    -- Add grantor column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sales_transactions' AND column_name='grantor') THEN
        ALTER TABLE sales_transactions ADD COLUMN grantor VARCHAR(400);
    END IF;
    
    -- Add grantee column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sales_transactions' AND column_name='grantee') THEN
        ALTER TABLE sales_transactions ADD COLUMN grantee VARCHAR(400);
    END IF;
    
    -- Add other missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sales_transactions' AND column_name='sale_number') THEN
        ALTER TABLE sales_transactions ADD COLUMN sale_number INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sales_transactions' AND column_name='street_number') THEN
        ALTER TABLE sales_transactions ADD COLUMN street_number VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sales_transactions' AND column_name='street_prefix') THEN
        ALTER TABLE sales_transactions ADD COLUMN street_prefix VARCHAR(10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sales_transactions' AND column_name='street_name') THEN
        ALTER TABLE sales_transactions ADD COLUMN street_name VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sales_transactions' AND column_name='unit_number') THEN
        ALTER TABLE sales_transactions ADD COLUMN unit_number VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sales_transactions' AND column_name='liber_page') THEN
        ALTER TABLE sales_transactions ADD COLUMN liber_page VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sales_transactions' AND column_name='sale_verification') THEN
        ALTER TABLE sales_transactions ADD COLUMN sale_verification VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sales_transactions' AND column_name='sale_instrument') THEN
        ALTER TABLE sales_transactions ADD COLUMN sale_instrument VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sales_transactions' AND column_name='property_transfer_percentage') THEN
        ALTER TABLE sales_transactions ADD COLUMN property_transfer_percentage DECIMAL(5,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sales_transactions' AND column_name='ecf_neighborhood') THEN
        ALTER TABLE sales_transactions ADD COLUMN ecf_neighborhood VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sales_transactions' AND column_name='x_coordinate') THEN
        ALTER TABLE sales_transactions ADD COLUMN x_coordinate DECIMAL(12,6);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sales_transactions' AND column_name='y_coordinate') THEN
        ALTER TABLE sales_transactions ADD COLUMN y_coordinate DECIMAL(12,6);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sales_transactions' AND column_name='esri_oid') THEN
        ALTER TABLE sales_transactions ADD COLUMN esri_oid INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sales_transactions' AND column_name='data_source') THEN
        ALTER TABLE sales_transactions ADD COLUMN data_source VARCHAR(100) DEFAULT 'Detroit Property Sales Data';
    END IF;
END $$;

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_sales_grantor ON sales_transactions(UPPER(grantor));
CREATE INDEX IF NOT EXISTS idx_sales_grantee ON sales_transactions(UPPER(grantee));
CREATE INDEX IF NOT EXISTS idx_sales_neighborhood ON sales_transactions(UPPER(ecf_neighborhood));

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';

-- Show the updated structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sales_transactions' 
ORDER BY ordinal_position;