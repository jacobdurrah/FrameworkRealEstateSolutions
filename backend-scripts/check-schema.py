#\!/usr/bin/env python3
from supabase import create_client

# Supabase configuration
SUPABASE_URL = 'https://gzswtqlvffqcpifdyrnf.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6c3d0cWx2ZmZxY3BpZmR5cm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzM5ODcsImV4cCI6MjA2NTUwOTk4N30.8WTX9v2GD2MziYqfVn-ZBURcVqaCvjkdQjBUlv2-GgI'

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Try to query the table
print("Testing sales_transactions table...")
try:
    result = supabase.table('sales_transactions').select('*').limit(1).execute()
    if result.data:
        print(f"Table exists with columns: {list(result.data[0].keys())}")
    else:
        print("Table exists but is empty")
except Exception as e:
    print(f"Error: {e}")
