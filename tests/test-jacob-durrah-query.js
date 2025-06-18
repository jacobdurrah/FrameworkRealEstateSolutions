// Test script to verify Jacob Durrah property query
import fetch from 'node-fetch';

const API_BASE_URL = 'https://framework-detroit-sos2c5xpg-jacobs-projects-1c008b6f.vercel.app';

async function testJacobDurrahQuery() {
  console.log('🔍 Testing Jacob Durrah property search...\n');

  // Test 1: Natural language query
  console.log('Test 1: Natural language query via AI');
  try {
    const aiResponse = await fetch(`${API_BASE_URL}/api/market/generate-sql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'What properties did Jacob Durrah buy in Detroit?' })
    });
    
    const aiResult = await aiResponse.json();
    console.log('Generated SQL:', aiResult.sql);
    console.log('Explanation:', aiResult.explanation);
    
    // Execute the generated SQL
    const execResponse = await fetch(`${API_BASE_URL}/api/market/execute-sql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql: aiResult.sql })
    });
    
    const execResult = await execResponse.json();
    console.log(`Results: ${execResult.rowCount} properties found`);
    
    // Check if 2404 Pennsylvania is in results
    const has2404Pennsylvania = execResult.data?.some(row => 
      row.property_address?.includes('2404') && 
      row.property_address?.includes('PENNSYLVANIA')
    );
    
    console.log(`✅ 2404 Pennsylvania found: ${has2404Pennsylvania ? 'YES' : 'NO'}`);
    
    if (execResult.data && execResult.data.length > 0) {
      console.log('\nSample results:');
      execResult.data.slice(0, 3).forEach(row => {
        console.log(`- ${row.property_address}, Buyer: ${row.buyer_name}, Date: ${row.sale_date}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n---\n');

  // Test 2: Direct SQL queries with different patterns
  console.log('Test 2: Testing different SQL patterns');
  const testQueries = [
    {
      name: 'Pattern 1: LASTNAME, FIRSTNAME',
      sql: "SELECT * FROM sales_transactions WHERE buyer_name ILIKE '%DURRAH%JACOB%' ORDER BY sale_date DESC LIMIT 100"
    },
    {
      name: 'Pattern 2: Just DURRAH',
      sql: "SELECT * FROM sales_transactions WHERE buyer_name ILIKE '%DURRAH%' ORDER BY sale_date DESC LIMIT 100"
    },
    {
      name: 'Pattern 3: Exact match DURRAH, JACOB',
      sql: "SELECT * FROM sales_transactions WHERE buyer_name ILIKE 'DURRAH, JACOB%' ORDER BY sale_date DESC LIMIT 100"
    },
    {
      name: 'Pattern 4: Contains JACOB anywhere',
      sql: "SELECT * FROM sales_transactions WHERE buyer_name ILIKE '%JACOB%' ORDER BY sale_date DESC LIMIT 100"
    }
  ];

  for (const testQuery of testQueries) {
    console.log(`\nTesting: ${testQuery.name}`);
    console.log(`SQL: ${testQuery.sql}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/market/execute-sql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: testQuery.sql })
      });
      
      const result = await response.json();
      
      if (result.error) {
        console.log(`❌ Error: ${result.error}`);
      } else {
        console.log(`✅ Found ${result.rowCount} results`);
        
        // Check for 2404 Pennsylvania
        const has2404 = result.data?.some(row => 
          row.property_address?.includes('2404') && 
          row.property_address?.toUpperCase().includes('PENNSYLVANIA')
        );
        
        console.log(`   2404 Pennsylvania: ${has2404 ? 'FOUND' : 'NOT FOUND'}`);
        
        // Show first few buyer names to understand format
        if (result.data && result.data.length > 0) {
          console.log('   Sample buyer names:');
          const uniqueBuyers = [...new Set(result.data.map(r => r.buyer_name))].slice(0, 5);
          uniqueBuyers.forEach(name => console.log(`   - "${name}"`));
        }
      }
    } catch (error) {
      console.log(`❌ Request error: ${error.message}`);
    }
  }

  console.log('\n---\n');

  // Test 3: Check specific address
  console.log('Test 3: Direct search for 2404 Pennsylvania');
  const addressQuery = "SELECT * FROM sales_transactions WHERE property_address ILIKE '%2404%PENNSYLVANIA%' LIMIT 10";
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/market/execute-sql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql: addressQuery })
    });
    
    const result = await response.json();
    
    if (result.data && result.data.length > 0) {
      console.log(`✅ Found ${result.rowCount} transactions for 2404 Pennsylvania`);
      result.data.forEach(row => {
        console.log(`   Buyer: "${row.buyer_name}", Seller: "${row.seller_name}", Date: ${row.sale_date}`);
      });
    } else {
      console.log('❌ No results found for 2404 Pennsylvania');
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

// Run tests
testJacobDurrahQuery().catch(console.error);