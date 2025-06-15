-- Fix Row Level Security for sales_transactions table
-- Allow anonymous users to insert data for imports

-- Create a policy to allow inserts
CREATE POLICY "Allow public inserts" ON sales_transactions
    FOR INSERT TO anon
    WITH CHECK (true);

-- Create a policy to allow updates (for the linking process)
CREATE POLICY "Allow public updates" ON sales_transactions
    FOR UPDATE TO anon
    USING (true)
    WITH CHECK (true);

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'sales_transactions';