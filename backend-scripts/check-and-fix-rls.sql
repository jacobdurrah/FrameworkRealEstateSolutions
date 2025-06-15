-- Check current RLS policies
SELECT * FROM pg_policies WHERE tablename = 'sales_transactions';

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access" ON sales_transactions;
DROP POLICY IF EXISTS "Allow public inserts" ON sales_transactions;
DROP POLICY IF EXISTS "Allow public updates" ON sales_transactions;

-- Recreate policies
CREATE POLICY "Allow public read access" ON sales_transactions
    FOR SELECT USING (true);

CREATE POLICY "Allow public inserts" ON sales_transactions
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "Allow public updates" ON sales_transactions
    FOR UPDATE TO anon
    USING (true)
    WITH CHECK (true);

-- Verify policies are created
SELECT * FROM pg_policies WHERE tablename = 'sales_transactions';