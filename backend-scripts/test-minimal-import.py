#!/usr/bin/env python3
"""
Test with absolute minimal fields
"""

import os
from supabase import create_client, Client
import pandas as pd
from datetime import datetime

# Supabase configuration
SUPABASE_URL = 'https://gzswtqlvffqcpifdyrnf.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6c3d0cWx2ZmZxY3BpZmR5cm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzM5ODcsImV4cCI6MjA2NTUwOTk4N30.8WTX9v2GD2MziYqfVn-ZBURcVqaCvjkdQjBUlv2-GgI'

print("Testing minimal import...")

# Connect
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# First, let's see what columns we can actually insert into
print("\nTrying to get table info...")
try:
    # Try a simple select to see what comes back
    result = supabase.table('sales_transactions').select('*').limit(1).execute()
    if result.data and len(result.data) > 0:
        print(f"Existing columns: {list(result.data[0].keys())}")
    else:
        print("Table is empty, trying a test insert...")
        
        # Try the most basic insert possible
        test_record = {
            'property_address': '123 TEST ST',
            'sale_date': '2024-01-01',
            'sale_price': 50000
        }
        
        try:
            result = supabase.table('sales_transactions').insert(test_record).execute()
            print("Basic insert successful!")
            print(f"Inserted record: {result.data}")
            
            # Now check what columns exist
            result = supabase.table('sales_transactions').select('*').eq('property_address', '123 TEST ST').execute()
            if result.data:
                print(f"Available columns: {list(result.data[0].keys())}")
                
                # Clean up test record
                supabase.table('sales_transactions').delete().eq('property_address', '123 TEST ST').execute()
                print("Cleaned up test record")
        except Exception as e:
            print(f"Basic insert failed: {e}")
            
            # Try with more fields
            test_record2 = {
                'property_address': '123 TEST ST',
                'seller_name': 'TEST SELLER',
                'buyer_name': 'TEST BUYER',
                'sale_date': '2024-01-01',
                'sale_price': 50000,
                'parcel_id': 'TEST123'
            }
            
            try:
                result = supabase.table('sales_transactions').insert(test_record2).execute()
                print("\nExtended insert successful!")
                print(f"Available columns: {list(result.data[0].keys())}")
                
                # Clean up
                supabase.table('sales_transactions').delete().eq('property_address', '123 TEST ST').execute()
            except Exception as e2:
                print(f"Extended insert also failed: {e2}")
                
except Exception as e:
    print(f"Error checking table: {e}")

# Now read a sample from the CSV to import
CSV_FILE = '../docs/Property_Sales_Detroit_-4801866508954663892.csv'
if os.path.exists(CSV_FILE):
    print(f"\nReading sample from CSV...")
    df = pd.read_csv(CSV_FILE, encoding='utf-8-sig', nrows=10)
    print("First row of CSV:")
    for col in df.columns:
        print(f"  {col}: {df.iloc[0][col]}")