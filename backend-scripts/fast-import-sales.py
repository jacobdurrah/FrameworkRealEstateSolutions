#!/usr/bin/env python3
"""
Fast import for Detroit sales data with better progress tracking
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
    """Process a batch of records"""
    records = []
    
    for _, row in df_batch.iterrows():
        record = {
            'sales_id': parse_number(row.get('Sales ID')),
            'parcel_number': clean_text(row.get('Parcel Number')),
            'sale_number': parse_number(row.get('Sale Number')),
            'street_address': clean_text(row.get('Street Address')),
            'street_number': clean_text(row.get('Street Number')),
            'street_prefix': clean_text(row.get('Street Prefix')),
            'street_name': clean_text(row.get('Street Name')),
            'unit_number': clean_text(row.get('Unit Number')),
            'sale_date': parse_date(row.get('Sale Date')),
            'sale_price': parse_number(row.get('Sale Price'), is_float=True),
            'grantor': clean_text(row.get('Grantor')),
            'grantee': clean_text(row.get('Grantee')),
            'liber_page': clean_text(row.get('Liber Page')),
            'terms_of_sale': clean_text(row.get('Terms of Sale')),
            'sale_verification': clean_text(row.get('Sale Verification')),
            'sale_instrument': clean_text(row.get('Sale Instrument')),
            'property_transfer_percentage': parse_number(row.get('Property Transfer Percentage'), is_float=True),
            'property_class_code': clean_text(row.get('Property Class Code')),
            'ecf_neighborhood': clean_text(row.get('ECF Neighborhood')),
            'x_coordinate': parse_number(row.get('x'), is_float=True),
            'y_coordinate': parse_number(row.get('y'), is_float=True),
            'esri_oid': parse_number(row.get('ESRI_OID'))
        }
        
        # Only include records with required fields
        if all([record.get('street_address'), record.get('sale_date'), 
                record.get('sale_price'), (record.get('grantor') or record.get('grantee'))]):
            records.append(record)
    
    return records

def main():
    """Main import function"""
    print(f"Starting fast import from {CSV_FILE}")
    start_time = time.time()
    
    # Check file
    if not os.path.exists(CSV_FILE):
        print(f"Error: File not found: {CSV_FILE}")
        sys.exit(1)
    
    # Initialize Supabase
    print("Connecting to Supabase...")
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Test connection and check if we can insert
        test_record = {
            'street_address': 'TEST IMPORT',
            'sale_date': '2024-01-01',
            'sale_price': 1.0,
            'grantor': 'TEST'
        }
        
        try:
            result = supabase.table('sales_transactions').insert(test_record).execute()
            # Delete test record
            supabase.table('sales_transactions').delete().eq('street_address', 'TEST IMPORT').execute()
            print("Connection successful, RLS policies are working!")
        except Exception as e:
            print(f"RLS policy error: {e}")
            print("\nPlease run check-and-fix-rls.sql in Supabase first!")
            sys.exit(1)
            
    except Exception as e:
        print(f"Connection error: {e}")
        sys.exit(1)
    
    # Process file in chunks
    print("\nProcessing CSV file...")
    chunk_size = 10000  # Larger chunks for faster processing
    batch_size = 500    # Larger batches for fewer API calls
    total_imported = 0
    total_errors = 0
    chunk_num = 0
    
    try:
        # Get total rows
        print("Counting total rows...")
        total_rows = sum(1 for line in open(CSV_FILE)) - 1
        print(f"Total rows in file: {total_rows:,}")
        
        # Process chunks
        for chunk in pd.read_csv(CSV_FILE, encoding='utf-8-sig', chunksize=chunk_size, low_memory=False):
            chunk_num += 1
            chunk_start = (chunk_num - 1) * chunk_size + 1
            chunk_end = min(chunk_num * chunk_size, total_rows)
            
            # Filter for meaningful sales
            chunk_filtered = chunk[chunk['Sale Price'] > 100]
            
            if len(chunk_filtered) == 0:
                print(f"Chunk {chunk_num}: No valid sales")
                continue
            
            print(f"\nChunk {chunk_num} (rows {chunk_start:,}-{chunk_end:,}): Processing {len(chunk_filtered):,} valid sales...")
            
            # Process in batches
            for i in range(0, len(chunk_filtered), batch_size):
                batch = chunk_filtered.iloc[i:i+batch_size]
                records = process_batch(batch)
                
                if records:
                    try:
                        result = supabase.table('sales_transactions').insert(records).execute()
                        total_imported += len(records)
                        
                        # Show progress
                        overall_progress = (chunk_start + i) / total_rows * 100
                        elapsed = time.time() - start_time
                        rate = total_imported / elapsed if elapsed > 0 else 0
                        eta = (total_rows - (chunk_start + i)) / rate / 60 if rate > 0 else 0
                        
                        print(f"  Progress: {overall_progress:.1f}% | Imported: {total_imported:,} | Rate: {rate:.0f}/sec | ETA: {eta:.1f} min")
                        
                    except Exception as e:
                        total_errors += len(records)
                        print(f"  Batch error: {str(e)[:100]}")
                
                # Small delay to avoid rate limits
                time.sleep(0.05)
        
    except Exception as e:
        print(f"\nError processing file: {e}")
    
    # Summary
    elapsed_time = time.time() - start_time
    print(f"\n{'='*60}")
    print(f"Import completed in {elapsed_time/60:.1f} minutes!")
    print(f"Total records imported: {total_imported:,}")
    print(f"Total errors: {total_errors:,}")
    print(f"Average rate: {total_imported/elapsed_time:.0f} records/sec")
    
    # Verify data
    if total_imported > 0:
        print("\nVerifying imported data...")
        try:
            # Count total
            count_result = supabase.table('sales_transactions').select('id', count='exact').execute()
            print(f"Total records in database: {count_result.count:,}")
            
            # Show sample
            recent = supabase.table('sales_transactions').select('*').order('sale_date', desc=True).limit(5).execute()
            if recent.data:
                print("\nSample of imported sales:")
                for sale in recent.data:
                    print(f"  - {sale['street_address']}: ${sale['sale_price']:,.0f}")
                    print(f"    Seller: {sale.get('grantor', 'Unknown')}")
                    print(f"    Buyer: {sale.get('grantee', 'Unknown')}")
                    print(f"    Date: {sale['sale_date']}")
                    print()
        except Exception as e:
            print(f"Error verifying: {e}")

if __name__ == '__main__':
    main()