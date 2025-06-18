// Test script to verify parcels join functionality
import fetch from 'node-fetch';

const API_BASE_URL = 'https://framework-detroit-sos2c5xpg-jacobs-projects-1c008b6f.vercel.app';

async function testParcelsJoin() {
  console.log('Testing parcels join functionality...\n');

  // Test 1: Basic query to verify parcels data is included
  console.log('Test 1: Basic sales query with parcels data');
  const test1SQL = "SELECT * FROM sales_transactions WHERE buyer_name ILIKE '%smith%' LIMIT 5";
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/market/execute-sql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql: test1SQL })
    });
    
    const result = await response.json();
    
    if (result.data && result.data.length > 0) {
      console.log('✅ Query executed successfully');
      console.log(`Found ${result.data.length} records`);
      
      // Check if parcels data is included
      const firstRecord = result.data[0];
      const hasParcelData = firstRecord.parcels && Object.keys(firstRecord.parcels).length > 0;
      
      if (hasParcelData) {
        console.log('✅ Parcels data is included in results');
        console.log('Sample parcels fields:', Object.keys(firstRecord.parcels).slice(0, 5));
      } else {
        console.log('❌ No parcels data found in results');
      }
    } else {
      console.log('❌ No data returned');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n---\n');

  // Test 2: Query that uses parcels fields
  console.log('Test 2: Query using parcels fields');
  const test2SQL = "SELECT *, parcels.assessed_value FROM sales_transactions WHERE parcels.assessed_value > 100000 LIMIT 5";
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/market/execute-sql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql: test2SQL })
    });
    
    const result = await response.json();
    
    if (result.error) {
      console.log('❌ Query error:', result.error);
    } else if (result.data && result.data.length > 0) {
      console.log('✅ Query with parcels field reference executed successfully');
      console.log(`Found ${result.data.length} records with assessed value > 100k`);
      
      // Show a sample record
      const sample = result.data[0];
      console.log('\nSample record:');
      console.log('- Buyer:', sample.buyer_name);
      console.log('- Sale Price:', sample.sale_price);
      console.log('- Assessed Value:', sample.parcels?.assessed_value || 'N/A');
      console.log('- Owner Name:', sample.parcels?.owner_full_name || 'N/A');
    } else {
      console.log('⚠️ No matching records found');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n---\n');

  // Test 3: Generate SQL with parcels fields
  console.log('Test 3: Generate SQL that uses parcels data');
  const prompt = "Show me properties with assessed value over 500k owned by Smith";
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/market/generate-sql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    
    const result = await response.json();
    
    if (result.sql) {
      console.log('✅ SQL generated successfully');
      console.log('Generated SQL:', result.sql);
      console.log('Uses parcels fields:', result.sql.includes('parcels.') ? 'Yes' : 'No');
    } else {
      console.log('❌ Failed to generate SQL');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Run tests
testParcelsJoin().catch(console.error);