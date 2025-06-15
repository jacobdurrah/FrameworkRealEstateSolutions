#!/usr/bin/env python3
"""
Import Sales Transactions from Excel to Supabase

This script reads the "2025 Resi All Transactions.xlsx" file and imports
the data into the sales_transactions table in Supabase.

Requirements:
    pip install pandas openpyxl python-dotenv supabase
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

def clean_name(name):
    """Clean and standardize names"""
    if pd.isna(name):
        return None
    name = str(name).strip().upper()
    # Remove extra spaces
    name = re.sub(r'\s+', ' ', name)
    return name

def clean_address(address):
    """Clean and standardize addresses"""
    if pd.isna(address):
        return None
    address = str(address).strip().upper()
    # Remove extra spaces
    address = re.sub(r'\s+', ' ', address)
    return address

def parse_date(date_value):
    """Parse various date formats"""
    if pd.isna(date_value):
        return None
    try:
        if isinstance(date_value, datetime):
            return date_value.strftime('%Y-%m-%d')
        elif isinstance(date_value, str):
            # Try common date formats
            for fmt in ['%m/%d/%Y', '%Y-%m-%d', '%m-%d-%Y', '%Y/%m/%d']:
                try:
                    return datetime.strptime(date_value, fmt).strftime('%Y-%m-%d')
                except:
                    continue
        return None
    except:
        return None

def parse_price(price_value):
    """Parse price values, removing $ and commas"""
    if pd.isna(price_value):
        return None
    try:
        if isinstance(price_value, (int, float)):
            return float(price_value)
        elif isinstance(price_value, str):
            # Remove $, commas, and spaces
            cleaned = re.sub(r'[\$,\s]', '', price_value)
            return float(cleaned) if cleaned else None
    except:
        return None

def parse_number(value):
    """Parse numeric values"""
    if pd.isna(value):
        return None
    try:
        return int(float(value))
    except:
        return None

def import_sales_transactions():
    """Main import function"""
    print(f"Starting import from {EXCEL_FILE}")
    
    # Check if file exists
    if not os.path.exists(EXCEL_FILE):
        print(f"Error: File not found: {EXCEL_FILE}")
        sys.exit(1)
    
    # Read Excel file
    print("Reading Excel file...")
    try:
        df = pd.read_excel(EXCEL_FILE)
        print(f"Loaded {len(df)} rows from Excel file")
        print(f"Columns found: {list(df.columns)}")
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        sys.exit(1)
    
    # Initialize Supabase client
    print("Connecting to Supabase...")
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Connected to Supabase successfully")
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
        sys.exit(1)
    
    # Process data in batches
    batch_size = 100
    total_imported = 0
    errors = []
    
    # Map Excel columns to database columns
    # Note: Adjust these mappings based on actual Excel column names
    column_mapping = {
        'Property Address': 'property_address',
        'Seller Name': 'seller_name',
        'Buyer Name': 'buyer_name',
        'Sale Date': 'sale_date',
        'Sale Price': 'sale_price',
        'Property Type': 'property_type',
        'Parcel ID': 'parcel_id',
        'Year Built': 'year_built',
        'Square Feet': 'square_feet',
        'Bedrooms': 'bedrooms',
        'Bathrooms': 'bathrooms',
        'Lot Size': 'lot_size',
        'ZIP': 'property_zip',
        'Sale Terms': 'sale_terms'
    }
    
    # Show sample of data to verify column names
    print("\nSample of first row:")
    if len(df) > 0:
        for col in df.columns:
            print(f"  {col}: {df.iloc[0][col]}")
    
    # Process each row
    for i in range(0, len(df), batch_size):
        batch = df.iloc[i:i+batch_size]
        batch_data = []
        
        for _, row in batch.iterrows():
            try:
                # Build record based on available columns
                record = {}
                
                # Required fields
                if 'Property Address' in df.columns:
                    record['property_address'] = clean_address(row.get('Property Address'))
                elif 'Address' in df.columns:
                    record['property_address'] = clean_address(row.get('Address'))
                
                if 'Seller Name' in df.columns:
                    record['seller_name'] = clean_name(row.get('Seller Name'))
                elif 'Seller' in df.columns:
                    record['seller_name'] = clean_name(row.get('Seller'))
                
                if 'Buyer Name' in df.columns:
                    record['buyer_name'] = clean_name(row.get('Buyer Name'))
                elif 'Buyer' in df.columns:
                    record['buyer_name'] = clean_name(row.get('Buyer'))
                
                if 'Sale Date' in df.columns:
                    record['sale_date'] = parse_date(row.get('Sale Date'))
                elif 'Date' in df.columns:
                    record['sale_date'] = parse_date(row.get('Date'))
                
                if 'Sale Price' in df.columns:
                    record['sale_price'] = parse_price(row.get('Sale Price'))
                elif 'Price' in df.columns:
                    record['sale_price'] = parse_price(row.get('Price'))
                
                # Skip if required fields are missing
                if not all([record.get('property_address'), record.get('seller_name'), 
                           record.get('buyer_name'), record.get('sale_date'), 
                           record.get('sale_price')]):
                    continue
                
                # Optional fields
                optional_mappings = {
                    'Property Type': 'property_type',
                    'Type': 'property_type',
                    'Parcel ID': 'parcel_id',
                    'Parcel': 'parcel_id',
                    'Year Built': 'year_built',
                    'Year': 'year_built',
                    'Square Feet': 'square_feet',
                    'Sq Ft': 'square_feet',
                    'Bedrooms': 'bedrooms',
                    'Beds': 'bedrooms',
                    'Bathrooms': 'bathrooms',
                    'Baths': 'bathrooms',
                    'ZIP': 'property_zip',
                    'Zip Code': 'property_zip'
                }
                
                for excel_col, db_col in optional_mappings.items():
                    if excel_col in df.columns:
                        if db_col in ['year_built', 'square_feet', 'bedrooms']:
                            record[db_col] = parse_number(row.get(excel_col))
                        elif db_col == 'bathrooms':
                            val = row.get(excel_col)
                            if pd.notna(val):
                                try:
                                    record[db_col] = float(val)
                                except:
                                    pass
                        else:
                            record[db_col] = str(row.get(excel_col)) if pd.notna(row.get(excel_col)) else None
                
                batch_data.append(record)
                
            except Exception as e:
                errors.append(f"Row {i + _}: {str(e)}")
                continue
        
        # Insert batch into database
        if batch_data:
            try:
                result = supabase.table('sales_transactions').insert(batch_data).execute()
                total_imported += len(batch_data)
                print(f"Imported batch {i//batch_size + 1}: {len(batch_data)} records")
            except Exception as e:
                print(f"Error inserting batch: {e}")
                errors.extend([f"Batch {i//batch_size + 1}: {str(e)}"])
    
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

if __name__ == '__main__':
    import_sales_transactions()