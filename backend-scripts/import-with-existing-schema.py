#!/usr/bin/env python3
"""
Import sales data using the existing schema column names
"""

import os
import sys
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
import re
import time

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
    """Parse date from CSV format"""
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

def process_batch(df_batch):
    """Process a batch of records using existing schema"""
    records = []
    
    for _, row in df_batch.iterrows():
        # Map to existing schema columns
        record = {
            'property_address': clean_text(row.get('Street Address')),
            'seller_name': clean_text(row.get('Grantor')) or 'UNKNOWN SELLER',
            'buyer_name': clean_text(row.get('Grantee')) or 'UNKNOWN BUYER',
            'sale_date': parse_date(row.get('Sale Date')),
            'sale_price': parse_number(row.get('Sale Price'), is_float=True),
            'parcel_id': clean_text(row.get('Parcel Number')),
            'sale_terms': clean_text(row.get('Terms of Sale'))
        }
        
        # Only include records with required fields
        if all([record.get('property_address'), record.get('sale_date'), 
                record.get('sale_price') and record.get('sale_price') > 100]):
            records.append(record)
    
    return records

def main():
    """Main import function"""
    print(f"Starting import from {CSV_FILE}")
    print("Using existing schema column names...")
    start_time = time.time()
    
    # Check file
    if not os.path.exists(CSV_FILE):
        print(f"Error: File not found: {CSV_FILE}")
        sys.exit(1)
    
    # Initialize Supabase
    print("\nConnecting to Supabase...")
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # First, let's check what columns actually exist
        print("Checking existing schema...")
        try:
            result = supabase.table('sales_transactions').select('*').limit(1).execute()
            if result.data and len(result.data) > 0:
                print(f"Existing columns: {list(result.data[0].keys())}")
            else:
                print("Table is empty, will attempt insert...")
        except Exception as e:
            print(f"Error checking schema: {e}")
            
    except Exception as e:
        print(f"Connection error: {e}")
        sys.exit(1)
    
    # Process file in chunks
    print("\nProcessing CSV file...")
    chunk_size = 5000
    batch_size = 100
    total_imported = 0
    total_errors = 0
    chunk_num = 0
    
    try:
        # Process first chunk as a test
        print("Testing with first chunk...")
        
        for chunk in pd.read_csv(CSV_FILE, encoding='utf-8-sig', chunksize=chunk_size, low_memory=False):
            chunk_num += 1
            
            # Filter for meaningful sales
            chunk_filtered = chunk[chunk['Sale Price'] > 100]
            
            if len(chunk_filtered) == 0:
                continue
            
            print(f"\nChunk {chunk_num}: Processing {len(chunk_filtered)} valid sales...")
            
            # Process in batches
            for i in range(0, len(chunk_filtered), batch_size):
                batch = chunk_filtered.iloc[i:i+batch_size]
                records = process_batch(batch)
                
                if records:
                    try:
                        result = supabase.table('sales_transactions').insert(records).execute()
                        total_imported += len(records)
                        print(f"  Batch {(i//batch_size)+1}: Imported {len(records)} records. Total: {total_imported}")
                        
                    except Exception as e:
                        total_errors += len(records)
                        error_msg = str(e)
                        if 'schema cache' in error_msg:
                            print(f"\nSchema cache error detected!")
                            print("The Supabase schema cache needs to be refreshed.")
                            print("\nPlease:")
                            print("1. Go to your Supabase dashboard")
                            print("2. Run in SQL Editor: NOTIFY pgrst, 'reload schema';")
                            print("3. Wait 30 seconds")
                            print("4. Run this script again")
                            sys.exit(1)
                        else:
                            print(f"  Batch error: {error_msg[:100]}")
                
                # Rate limiting
                time.sleep(0.1)
            
            # Only process first chunk for testing
            if chunk_num >= 1:
                print("\nTest chunk processed. Stopping here for testing.")
                break
                
    except Exception as e:
        print(f"\nError processing file: {e}")
    
    # Summary
    elapsed_time = time.time() - start_time
    print(f"\n{'='*60}")
    print(f"Test import completed in {elapsed_time:.1f} seconds!")
    print(f"Records imported: {total_imported}")
    print(f"Errors: {total_errors}")
    
    # Verify data
    if total_imported > 0:
        print("\nVerifying imported data...")
        try:
            result = supabase.table('sales_transactions').select('*').limit(5).execute()
            if result.data:
                print("\nSample of imported sales:")
                for sale in result.data:
                    print(f"  - {sale.get('property_address', 'Unknown')}: ${sale.get('sale_price', 0):,.0f}")
                    print(f"    From: {sale.get('seller_name', 'Unknown')} To: {sale.get('buyer_name', 'Unknown')}")
        except Exception as e:
            print(f"Error verifying: {e}")
            
        print("\nIf test was successful, modify this script to remove the chunk limit and run full import.")
    else:
        print("\nNo records imported. Check the error messages above.")

if __name__ == '__main__':
    main()