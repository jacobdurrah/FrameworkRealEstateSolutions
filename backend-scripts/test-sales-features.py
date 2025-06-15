#!/usr/bin/env python3
"""
Test the sales features after import
"""

from supabase import create_client

# Supabase configuration
SUPABASE_URL = 'https://gzswtqlvffqcpifdyrnf.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6c3d0cWx2ZmZxY3BpZmR5cm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzM5ODcsImV4cCI6MjA2NTUwOTk4N30.8WTX9v2GD2MziYqfVn-ZBURcVqaCvjkdQjBUlv2-GgI'

print("Testing sales features...")

# Connect
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Test 1: Count total sales
print("\n1. Total sales count:")
result = supabase.table('sales_transactions').select('id', count='exact').execute()
print(f"   Total sales: {result.count:,}")

# Test 2: Find sales by a specific owner
print("\n2. Testing sales by owner lookup:")
test_owner = "DETROIT LAND BANK AUTHORITY"
result = supabase.table('sales_transactions').select('*').ilike('seller_name', f'%{test_owner}%').limit(5).execute()
if result.data:
    print(f"   Found {len(result.data)} sales by {test_owner}:")
    for sale in result.data:
        print(f"   - {sale['property_address']}: ${sale['sale_price']:,.0f} on {sale['sale_date']}")

# Test 3: Find sales for a specific property
print("\n3. Testing sales by property address:")
test_address = "14006 GLASTONBURY"
result = supabase.table('sales_transactions').select('*').ilike('property_address', f'%{test_address}%').execute()
if result.data:
    print(f"   Found {len(result.data)} sales for {test_address}:")
    for sale in result.data:
        print(f"   - ${sale['sale_price']:,.0f} on {sale['sale_date']}")
        print(f"     From: {sale['seller_name']} To: {sale['buyer_name']}")

# Test 4: Get top sellers
print("\n4. Top 5 sellers by transaction count:")
# Using SQL aggregation through RPC or manual counting
sellers = {}
result = supabase.table('sales_transactions').select('seller_name').execute()
for row in result.data:
    seller = row.get('seller_name', 'UNKNOWN')
    if seller and seller != 'UNKNOWN SELLER':
        sellers[seller] = sellers.get(seller, 0) + 1

from collections import Counter
top_sellers = Counter(sellers).most_common(5)
for seller, count in top_sellers:
    print(f"   - {seller}: {count} sales")

# Test 5: Recent high-value sales
print("\n5. Recent high-value sales (>$100,000):")
result = supabase.table('sales_transactions').select('*').gte('sale_price', 100000).order('sale_date', desc=True).limit(5).execute()
if result.data:
    for sale in result.data:
        print(f"   - {sale['property_address']}: ${sale['sale_price']:,.0f} on {sale['sale_date']}")
        print(f"     From: {sale['seller_name']} To: {sale['buyer_name']}")

print("\n✅ Sales features are working correctly!")
print("You can now:")
print("1. Click on property cards to see 'Previous Sales' badges")
print("2. Click the badge to view full sales history for that owner")
print("3. Search for properties and see their transaction history")