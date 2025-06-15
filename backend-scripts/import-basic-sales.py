#!/usr/bin/env python3
"""
Import Basic Sales Data and Link to Parcel Owners

This script:
1. Imports basic sales transactions from Excel
2. Links them to parcel data to get owner names
3. Creates a more complete sales history
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
EXCEL_FILE = '../docs/2025 Resi All Transactions.xlsx'

def clean_address(address):
    """Clean and standardize addresses"""
    if pd.isna(address):
        return None
    address = str(address).strip().upper()
    address = re.sub(r'\s+', ' ', address)
    return address

def parse_date(date_value):
    """Parse various date formats"""
    if pd.isna(date_value):
        return None
    try:
        if isinstance(date_value, datetime):
            return date_value.strftime('%Y-%m-%d')
        return None
    except:
        return None

def parse_price(price_value):
    """Parse price values"""
    if pd.isna(price_value):
        return None
    try:
        return float(price_value)
    except:
        return None

def link_sales_to_owners():
    """Link sales data to parcel owners"""
    print("\nLinking sales to parcel owners...")
    
    # Initialize Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Get all sales without proper owner names
    sales_response = supabase.table('sales_transactions').select('*').eq('seller_name', 'PROPERTY TRANSFER').execute()
    sales = sales_response.data
    
    print(f"Found {len(sales)} sales to link with owners")
    
    updated_count = 0
    for sale in sales:
        try:
            # Look up parcel by address
            address = sale['property_address']
            parcel_response = supabase.table('parcels').select('*').ilike('address', f"{address}%").limit(1).execute()
            
            if parcel_response.data and len(parcel_response.data) > 0:
                parcel = parcel_response.data[0]
                
                # Update the sale with owner information
                update_data = {
                    'seller_name': parcel.get('owner_full_name', 'UNKNOWN OWNER'),
                    'buyer_name': 'BUYER - ' + sale['sale_date'][:4],  # Use year as placeholder
                    'year_built': parcel.get('year_built'),
                    'square_feet': parcel.get('total_floor_area'),
                    'property_zip': parcel.get('zip_code')
                }
                
                # Update the record
                supabase.table('sales_transactions').update(update_data).eq('id', sale['id']).execute()
                updated_count += 1
                
                if updated_count % 100 == 0:
                    print(f"Updated {updated_count} records...")
                    
        except Exception as e:
            print(f"Error updating sale {sale['id']}: {e}")
            continue
    
    print(f"\nTotal sales linked to owners: {updated_count}")

def import_basic_sales():
    """Import basic sales data"""
    print(f"Starting import from {EXCEL_FILE}")
    
    # Check if file exists
    if not os.path.exists(EXCEL_FILE):
        print(f"Error: File not found: {EXCEL_FILE}")
        sys.exit(1)
    
    # Read Excel file
    print("Reading Excel file...")
    try:
        df = pd.read_excel(EXCEL_FILE)
        print(f"Loaded {len(df)} rows")
        
        # Filter for real sales (price >= $1000)
        df = df[df['Sale Price'] >= 1000]
        print(f"Filtered to {len(df)} rows with sale price >= $1000")
        
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        sys.exit(1)
    
    # Initialize Supabase client
    print("Connecting to Supabase...")
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Connected successfully")
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
        sys.exit(1)
    
    # Import in batches
    batch_size = 100
    total_imported = 0
    
    for i in range(0, len(df), batch_size):
        batch = df.iloc[i:i+batch_size]
        batch_data = []
        
        for _, row in batch.iterrows():
            try:
                record = {
                    'property_address': clean_address(row.get('Street Address')),
                    'seller_name': 'PROPERTY TRANSFER',  # Will be updated later
                    'buyer_name': 'NEW OWNER',  # Will be updated later
                    'sale_date': parse_date(row.get('Sale Date')),
                    'sale_price': parse_price(row.get('Sale Price')),
                    'parcel_id': str(row.get('Parcel Number')),
                    'sale_terms': str(row.get('Terms of Sale')) if pd.notna(row.get('Terms of Sale')) else None
                }
                
                # Skip if missing required fields
                if not all([record['property_address'], record['sale_date'], record['sale_price']]):
                    continue
                
                batch_data.append(record)
                
            except Exception as e:
                print(f"Error processing row: {e}")
                continue
        
        # Insert batch
        if batch_data:
            try:
                supabase.table('sales_transactions').insert(batch_data).execute()
                total_imported += len(batch_data)
                print(f"Imported batch {i//batch_size + 1}: {len(batch_data)} records")
            except Exception as e:
                print(f"Error inserting batch: {e}")
    
    print(f"\nTotal records imported: {total_imported}")
    return total_imported

if __name__ == '__main__':
    # First import the basic sales
    imported_count = import_basic_sales()
    
    # Then link to owners if we imported any records
    if imported_count > 0:
        link_sales_to_owners()
    
    print("\nImport process completed!")