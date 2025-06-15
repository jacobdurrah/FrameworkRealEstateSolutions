-- Refresh schema cache and verify table structure

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sales_transactions'
ORDER BY ordinal_position;

-- Check row count
SELECT COUNT(*) as total_rows FROM sales_transactions;

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'sales_transactions';