#!/usr/bin/env python3
"""
Import sales data using only basic fields that exist in current schema
"""

import os
import sys
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
import re

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://gzswtqlvffqcpifdyrnf.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6c3d0cWx2ZmZxY3BpZmR5cm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzM5ODcsImV4cCI6MjA2NTUwOTk4N30.8WTX9v2GD2MziYqfVn-ZBURcVqaCvjkdQjBUlv2-GgI')

# File path
CSV_FILE = '../docs/Property_Sales_Detroit_-4801866508954663892.csv'

def clean_text(text):
    """Clean and standardize text fields"""
    if pd.isna(text):
        return None
    text = str(text).strip()
    text = re.sub(r'\s+', ' ', text)
    return text if text else None

def parse_date(date_value):
    """Parse date from format in CSV"""
    if pd.isna(date_value):
        return None
    try:
        date_str = str(date_value).split(' ')[0]
        return datetime.strptime(date_str, '%m/%d/%Y').strftime('%Y-%m-%d')
    except:
        return None

def parse_number(value, is_float=False):
    """Parse numeric values"""
    if pd.isna(value):
        return None
    try:
        if is_float:
            return float(value)
        else:
            return int(float(value))
    except:
        return None

def main():
    """Import using basic fields"""
    print(f"Starting basic import from {CSV_FILE}")
    
    # Check file
    if not os.path.exists(CSV_FILE):
        print(f"Error: File not found: {CSV_FILE}")
        sys.exit(1)
    
    # Initialize Supabase
    print("Connecting to Supabase...")
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Connected successfully")
    except Exception as e:
        print(f"Connection error: {e}")
        sys.exit(1)
    
    # Read CSV
    print("\nReading CSV file...")
    try:
        # Read first 1000 rows to test
        df = pd.read_csv(CSV_FILE, encoding='utf-8-sig', nrows=1000)
        print(f"Loaded {len(df)} rows for testing")
        
        # Filter meaningful sales
        df_filtered = df[df['Sale Price'] > 1000].copy()
        print(f"Filtered to {len(df_filtered)} rows with price > $1000")
        
    except Exception as e:
        print(f"Error reading CSV: {e}")
        sys.exit(1)
    
    # Process records
    batch_size = 50
    total_imported = 0
    errors = []
    
    for i in range(0, len(df_filtered), batch_size):
        batch = df_filtered.iloc[i:i+batch_size]
        batch_data = []
        
        for _, row in batch.iterrows():
            # Use only basic fields that we know exist
            record = {
                'property_address': clean_text(row.get('Street Address')),
                'sale_date': parse_date(row.get('Sale Date')),
                'sale_price': parse_number(row.get('Sale Price'), is_float=True),
                'parcel_id': clean_text(row.get('Parcel Number')),
                'sale_terms': clean_text(row.get('Terms of Sale')),
                'property_class_code': clean_text(row.get('Property Class Code')),
                'seller_name': clean_text(row.get('Grantor')) or 'UNKNOWN',
                'buyer_name': clean_text(row.get('Grantee')) or 'UNKNOWN'
            }
            
            # Skip if missing required fields
            if not all([record['property_address'], record['sale_date'], record['sale_price']]):
                continue
                
            batch_data.append(record)
        
        # Insert batch
        if batch_data:
            try:
                result = supabase.table('sales_transactions').insert(batch_data).execute()
                total_imported += len(batch_data)
                print(f"Batch {i//batch_size + 1}: Imported {len(batch_data)} records")
            except Exception as e:
                errors.append(f"Batch {i//batch_size + 1}: {str(e)}")
                print(f"Error in batch {i//batch_size + 1}: {str(e)[:100]}")
    
    # Summary
    print(f"\n{'='*50}")
    print(f"Test import completed!")
    print(f"Total imported: {total_imported}")
    print(f"Total errors: {len(errors)}")
    
    if errors:
        print("\nFirst 5 errors:")
        for err in errors[:5]:
            print(f"  - {err}")
    
    # Verify data
    if total_imported > 0:
        print("\nVerifying imported data...")
        try:
            result = supabase.table('sales_transactions').select('*').order('sale_date', desc=True).limit(5).execute()
            if result.data:
                print("\nRecent sales:")
                for sale in result.data:
                    print(f"  - {sale['property_address']}: ${sale['sale_price']:,.0f}")
                    print(f"    From: {sale.get('seller_name', 'Unknown')} To: {sale.get('buyer_name', 'Unknown')}")
        except Exception as e:
            print(f"Error verifying: {e}")

if __name__ == '__main__':
    main()