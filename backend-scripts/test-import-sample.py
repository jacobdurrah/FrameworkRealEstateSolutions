#!/usr/bin/env python3
"""
Test import of small sample of Detroit sales data
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

def test_import():
    """Test import with small sample"""
    print(f"Testing import from {CSV_FILE}")
    
    # Read only first 100 rows
    print("Reading first 100 rows...")
    try:
        df = pd.read_csv(CSV_FILE, encoding='utf-8-sig', nrows=100)
        print(f"Loaded {len(df)} rows")
        print(f"Columns: {list(df.columns)}")
    except Exception as e:
        print(f"Error reading CSV: {e}")
        sys.exit(1)
    
    # Initialize Supabase client
    print("\nConnecting to Supabase...")
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Connected successfully")
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
        sys.exit(1)
    
    # Filter for meaningful sales
    df_filtered = df[df['Sale Price'] > 100].copy()
    print(f"\nFiltered to {len(df_filtered)} rows with price > $100")
    
    # Process records
    success_count = 0
    error_count = 0
    
    for idx, row in df_filtered.iterrows():
        try:
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
            if not all([record.get('street_address'), record.get('sale_date'), record.get('sale_price')]):
                print(f"Row {idx}: Missing required fields")
                error_count += 1
                continue
            
            # Skip if no buyer/seller information
            if not (record.get('grantor') or record.get('grantee')):
                print(f"Row {idx}: No buyer/seller info")
                error_count += 1
                continue
            
            # Try to insert
            result = supabase.table('sales_transactions').insert(record).execute()
            success_count += 1
            print(f"Row {idx}: Success - {record['street_address']} - ${record['sale_price']:,.0f}")
            
        except Exception as e:
            error_count += 1
            print(f"Row {idx}: Error - {str(e)}")
    
    print(f"\n{'='*50}")
    print(f"Test completed!")
    print(f"Success: {success_count}")
    print(f"Errors: {error_count}")
    
    # Show some data
    if success_count > 0:
        print("\nQuerying imported data...")
        result = supabase.table('sales_transactions').select('*').order('sale_date', desc=True).limit(5).execute()
        if result.data:
            print("\nRecent sales:")
            for sale in result.data:
                print(f"  - {sale['street_address']}: ${sale['sale_price']:,.0f} on {sale['sale_date']}")

if __name__ == '__main__':
    test_import()