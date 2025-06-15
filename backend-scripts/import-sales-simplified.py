#!/usr/bin/env python3
"""
Simplified import for Detroit sales data - handles schema issues
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
    """Parse various date formats"""
    if pd.isna(date_value):
        return None
    try:
        # Handle the specific format in this CSV
        date_str = str(date_value).split(' ')[0]  # Get just the date part
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

def import_sales_batch(df_batch, supabase, batch_num, total_batches):
    """Import a batch of sales records"""
    records = []
    
    for _, row in df_batch.iterrows():
        # Build a simplified record without ecf_neighborhood for now
        record = {
            'sales_id': parse_number(row.get('Sales ID')),
            'parcel_number': clean_text(row.get('Parcel Number')),
            'street_address': clean_text(row.get('Street Address')),
            'sale_date': parse_date(row.get('Sale Date')),
            'sale_price': parse_number(row.get('Sale Price'), is_float=True),
            'grantor': clean_text(row.get('Grantor')),  # Seller
            'grantee': clean_text(row.get('Grantee')),  # Buyer
            'terms_of_sale': clean_text(row.get('Terms of Sale')),
            'property_class_code': clean_text(row.get('Property Class Code'))
        }
        
        # Only include records with required fields
        if all([record.get('street_address'), record.get('sale_date'), 
                record.get('sale_price'), (record.get('grantor') or record.get('grantee'))]):
            records.append(record)
    
    if records:
        try:
            result = supabase.table('sales_transactions').insert(records).execute()
            progress = (batch_num / total_batches) * 100
            print(f"Batch {batch_num}/{total_batches} ({progress:.1f}%): Imported {len(records)} records")
            return len(records), 0
        except Exception as e:
            print(f"Batch {batch_num} error: {str(e)[:100]}")
            return 0, len(records)
    
    return 0, 0

def main():
    """Main import function"""
    print(f"Starting import from {CSV_FILE}")
    
    # Check file exists
    if not os.path.exists(CSV_FILE):
        print(f"Error: File not found: {CSV_FILE}")
        sys.exit(1)
    
    # Initialize Supabase
    print("Connecting to Supabase...")
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Test connection
        result = supabase.table('sales_transactions').select('id').limit(1).execute()
        print("Connected successfully")
    except Exception as e:
        print(f"Connection error: {e}")
        sys.exit(1)
    
    # Read CSV in chunks to handle large file
    print("\nReading CSV file...")
    chunk_size = 5000
    batch_size = 50
    total_imported = 0
    total_errors = 0
    chunk_num = 0
    
    try:
        # Count total rows first
        total_rows = sum(1 for line in open(CSV_FILE)) - 1
        print(f"Total rows in file: {total_rows:,}")
        
        # Process chunks
        for chunk in pd.read_csv(CSV_FILE, encoding='utf-8-sig', chunksize=chunk_size):
            chunk_num += 1
            print(f"\nProcessing chunk {chunk_num} (rows {(chunk_num-1)*chunk_size + 1} to {chunk_num*chunk_size})...")
            
            # Filter for meaningful sales
            chunk_filtered = chunk[chunk['Sale Price'] > 100].copy()
            
            if len(chunk_filtered) == 0:
                continue
            
            # Process in smaller batches
            total_batches = (len(chunk_filtered) + batch_size - 1) // batch_size
            
            for i in range(0, len(chunk_filtered), batch_size):
                batch = chunk_filtered.iloc[i:i+batch_size]
                batch_num = (i // batch_size) + 1
                
                imported, errors = import_sales_batch(batch, supabase, batch_num, total_batches)
                total_imported += imported
                total_errors += errors
                
                # Rate limiting
                time.sleep(0.1)
            
            print(f"Chunk {chunk_num} complete. Total imported so far: {total_imported:,}")
            
    except Exception as e:
        print(f"Error processing file: {e}")
    
    # Summary
    print(f"\n{'='*60}")
    print(f"Import completed!")
    print(f"Total records imported: {total_imported:,}")
    print(f"Total errors: {total_errors:,}")
    
    # Verify data
    if total_imported > 0:
        print("\nVerifying data...")
        try:
            # Count total records
            count_result = supabase.table('sales_transactions').select('id', count='exact').execute()
            print(f"Total records in database: {count_result.count:,}")
            
            # Show recent sales
            recent = supabase.table('sales_transactions').select('*').order('sale_date', desc=True).limit(5).execute()
            if recent.data:
                print("\nMost recent sales:")
                for sale in recent.data:
                    seller = sale.get('grantor', 'Unknown')
                    buyer = sale.get('grantee', 'Unknown')
                    print(f"  - {sale['street_address']}: ${sale['sale_price']:,.0f} on {sale['sale_date']}")
                    print(f"    From: {seller} To: {buyer}")
        except Exception as e:
            print(f"Error verifying data: {e}")

if __name__ == '__main__':
    main()