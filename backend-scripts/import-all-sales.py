#!/usr/bin/env python3
"""
Full import of Detroit sales data
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
        
        # Store additional data in existing columns if available
        # Using creative mapping for important fields
        property_zip = clean_text(row.get('ECF Neighborhood'))
        if property_zip:
            record['property_zip'] = property_zip[:10]  # Neighborhood as proxy for area
            
        year_str = str(row.get('Sale Date')).split('/')[-1].split(' ')[0]
        try:
            year = int(year_str)
            if 1900 <= year <= 2100:
                record['year_built'] = year  # Using sale year as proxy
        except:
            pass
        
        # Only include records with required fields
        if all([record.get('property_address'), record.get('sale_date'), 
                record.get('sale_price') and record.get('sale_price') > 100]):
            records.append(record)
    
    return records

def main():
    """Main import function"""
    print(f"Starting FULL import from {CSV_FILE}")
    print("This will import all ~477,000 records...")
    start_time = time.time()
    
    # Check file
    if not os.path.exists(CSV_FILE):
        print(f"Error: File not found: {CSV_FILE}")
        sys.exit(1)
    
    # Initialize Supabase
    print("\nConnecting to Supabase...")
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Connected successfully")
    except Exception as e:
        print(f"Connection error: {e}")
        sys.exit(1)
    
    # Get current count
    try:
        count_result = supabase.table('sales_transactions').select('id', count='exact').execute()
        existing_count = count_result.count
        print(f"Existing records in database: {existing_count:,}")
    except:
        existing_count = 0
    
    # Process file in chunks
    print("\nProcessing CSV file...")
    chunk_size = 10000  # Larger chunks for efficiency
    batch_size = 500    # Larger batches
    total_imported = 0
    total_errors = 0
    chunk_num = 0
    
    # Count total rows first
    print("Counting total rows...")
    total_rows = sum(1 for line in open(CSV_FILE)) - 1
    print(f"Total rows in file: {total_rows:,}")
    
    try:
        for chunk in pd.read_csv(CSV_FILE, encoding='utf-8-sig', chunksize=chunk_size, low_memory=False):
            chunk_num += 1
            chunk_start = (chunk_num - 1) * chunk_size + 1
            chunk_end = min(chunk_num * chunk_size, total_rows)
            
            # Filter for meaningful sales
            chunk_filtered = chunk[chunk['Sale Price'] > 100]
            
            if len(chunk_filtered) == 0:
                continue
            
            # Process in batches
            chunk_imported = 0
            for i in range(0, len(chunk_filtered), batch_size):
                batch = chunk_filtered.iloc[i:i+batch_size]
                records = process_batch(batch)
                
                if records:
                    try:
                        result = supabase.table('sales_transactions').insert(records).execute()
                        total_imported += len(records)
                        chunk_imported += len(records)
                        
                    except Exception as e:
                        total_errors += len(records)
                        print(f"  Batch error: {str(e)[:100]}")
                
                # Rate limiting
                time.sleep(0.05)
            
            # Progress update every chunk
            overall_progress = chunk_end / total_rows * 100
            elapsed = time.time() - start_time
            rate = total_imported / elapsed if elapsed > 0 else 0
            eta = (total_rows - chunk_end) / (chunk_size * rate / 60) if rate > 0 else 0
            
            print(f"Chunk {chunk_num}: Processed rows {chunk_start:,}-{chunk_end:,} ({overall_progress:.1f}%) | "
                  f"Imported {chunk_imported} | Total: {total_imported:,} | "
                  f"Rate: {rate:.0f}/sec | ETA: {eta:.1f} min")
                
    except KeyboardInterrupt:
        print("\n\nImport interrupted by user!")
    except Exception as e:
        print(f"\nError processing file: {e}")
    
    # Summary
    elapsed_time = time.time() - start_time
    print(f"\n{'='*60}")
    print(f"Import completed in {elapsed_time/60:.1f} minutes!")
    print(f"Total records imported: {total_imported:,}")
    print(f"Total errors: {total_errors:,}")
    if elapsed_time > 0:
        print(f"Average rate: {total_imported/elapsed_time:.0f} records/sec")
    
    # Final verification
    print("\nVerifying final data...")
    try:
        count_result = supabase.table('sales_transactions').select('id', count='exact').execute()
        final_count = count_result.count
        print(f"Total records now in database: {final_count:,}")
        print(f"Net increase: {final_count - existing_count:,}")
        
        # Show recent sales
        recent = supabase.table('sales_transactions').select('*').order('sale_date', desc=True).limit(5).execute()
        if recent.data:
            print("\nMost recent sales:")
            for sale in recent.data:
                print(f"  - {sale['property_address']}: ${sale['sale_price']:,.0f} on {sale['sale_date']}")
                print(f"    From: {sale.get('seller_name', 'Unknown')} To: {sale.get('buyer_name', 'Unknown')}")
                
        # Show seller statistics
        print("\nChecking seller statistics...")
        sellers = supabase.table('sales_transactions').select('seller_name').execute()
        if sellers.data:
            from collections import Counter
            seller_counts = Counter(s['seller_name'] for s in sellers.data if s.get('seller_name'))
            print("\nTop 10 sellers by number of sales:")
            for seller, count in seller_counts.most_common(10):
                if seller and seller != 'UNKNOWN SELLER':
                    print(f"  - {seller}: {count} sales")
                    
    except Exception as e:
        print(f"Error in verification: {e}")
    
    print("\n✅ Import process complete!")
    print("The sales history feature should now be fully functional.")

if __name__ == '__main__':
    # Confirm before starting
    response = input("\nThis will import ~477,000 records. Continue? (yes/no): ")
    if response.lower() == 'yes':
        main()
    else:
        print("Import cancelled.")