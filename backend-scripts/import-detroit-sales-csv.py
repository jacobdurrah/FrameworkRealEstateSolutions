#!/usr/bin/env python3
"""
Import Detroit Property Sales Data from CSV

This script imports comprehensive sales data from the Detroit Property Sales CSV file
including grantor/grantee (seller/buyer) information, sale details, and property classifications.
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
    # Remove extra spaces
    text = re.sub(r'\s+', ' ', text)
    return text if text else None

def parse_date(date_value):
    """Parse various date formats"""
    if pd.isna(date_value):
        return None
    try:
        # Try common date formats
        for fmt in ['%m/%d/%Y %I:%M:%S %p', '%m/%d/%Y', '%Y-%m-%d']:
            try:
                return datetime.strptime(str(date_value).split(' ')[0], fmt).strftime('%Y-%m-%d')
            except:
                continue
        return None
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

def import_sales_data():
    """Main import function"""
    print(f"Starting import from {CSV_FILE}")
    
    # Check if file exists
    if not os.path.exists(CSV_FILE):
        print(f"Error: File not found: {CSV_FILE}")
        sys.exit(1)
    
    # Read CSV file
    print("Reading CSV file...")
    try:
        # Read with encoding that handles special characters and specify dtypes
        dtype_spec = {
            'Sales ID': 'Int64',
            'Sale Price': 'float64',
            'Sale Number': 'Int64',
            'Property Transfer Percentage': 'float64',
            'ESRI_OID': 'Int64',
            'x': 'float64',
            'y': 'float64'
        }
        df = pd.read_csv(CSV_FILE, encoding='utf-8-sig', dtype=dtype_spec, low_memory=False)
        print(f"Loaded {len(df)} rows from CSV file")
        print(f"Columns found: {list(df.columns)}")
        
        # Show sample of data
        print("\nSample of first row:")
        if len(df) > 0:
            for col in df.columns:
                print(f"  {col}: {df.iloc[0][col]}")
                
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        sys.exit(1)
    
    # Initialize Supabase client
    print("\nConnecting to Supabase...")
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Connected to Supabase successfully")
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
        sys.exit(1)
    
    # Process data in batches
    batch_size = 50  # Smaller batch size for better progress tracking
    total_imported = 0
    errors = []
    
    # Filter for meaningful sales (price > $100)
    print(f"\nFiltering for sales with price > $100...")
    df_filtered = df[df['Sale Price'] > 100].copy()
    print(f"Filtered to {len(df_filtered)} rows")
    
    # Show estimated time
    total_batches = (len(df_filtered) + batch_size - 1) // batch_size
    print(f"Will process {total_batches} batches of {batch_size} records each")
    
    # Process each batch
    for i in range(0, len(df_filtered), batch_size):
        batch = df_filtered.iloc[i:i+batch_size]
        batch_data = []
        
        for _, row in batch.iterrows():
            try:
                # Build record from CSV columns
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
                    'grantor': clean_text(row.get('Grantor')),  # Seller
                    'grantee': clean_text(row.get('Grantee')),  # Buyer
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
                
                # Skip if required fields are missing
                if not all([record.get('street_address'), record.get('sale_date'), 
                           record.get('sale_price')]):
                    continue
                
                # Skip if no buyer/seller information
                if not (record.get('grantor') or record.get('grantee')):
                    continue
                    
                batch_data.append(record)
                
            except Exception as e:
                errors.append(f"Row {i + _}: {str(e)}")
                continue
        
        # Insert batch into database
        if batch_data:
            try:
                result = supabase.table('sales_transactions').insert(batch_data).execute()
                total_imported += len(batch_data)
                batch_num = i//batch_size + 1
                progress = (batch_num / total_batches) * 100
                print(f"Batch {batch_num}/{total_batches} ({progress:.1f}%): Imported {len(batch_data)} records. Total: {total_imported}")
            except Exception as e:
                print(f"Error inserting batch {i//batch_size + 1}: {e}")
                errors.append(f"Batch {i//batch_size + 1}: {str(e)}")
                
                # Try inserting records individually if batch fails
                for record in batch_data:
                    try:
                        supabase.table('sales_transactions').insert(record).execute()
                        total_imported += 1
                    except Exception as e2:
                        errors.append(f"Individual record error: {str(e2)}")
    
    # Summary
    print(f"\n{'='*50}")
    print(f"Import completed!")
    print(f"Total records imported: {total_imported}")
    print(f"Total errors: {len(errors)}")
    
    if errors:
        print(f"\nFirst 10 errors:")
        for error in errors[:10]:
            print(f"  - {error}")
        
        # Save all errors to file
        with open('import_errors.log', 'w') as f:
            f.write('\n'.join(errors))
        print(f"\nAll errors saved to import_errors.log")
    
    # Show some statistics
    if total_imported > 0:
        print(f"\nRunning some queries to verify data...")
        
        # Get top sellers
        try:
            result = supabase.table('seller_statistics').select('*').order('total_sales', desc=True).limit(5).execute()
            if result.data:
                print("\nTop 5 Sellers by Number of Sales:")
                for seller in result.data:
                    print(f"  - {seller['seller_name_normalized']}: {seller['total_sales']} sales, ${seller['total_sales_value']:,.0f} total")
        except:
            pass
            
        # Get recent sales
        try:
            result = supabase.table('recent_sales').select('*').limit(5).execute()
            if result.data:
                print("\nMost Recent Sales:")
                for sale in result.data:
                    print(f"  - {sale['street_address']}: ${sale['sale_price']:,.0f} on {sale['sale_date']}")
        except:
            pass

if __name__ == '__main__':
    import_sales_data()