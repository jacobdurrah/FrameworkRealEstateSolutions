import { configureCORS } from '../cors.js';

export default async function handler(req, res) {
  // Always set CORS headers first
  res.setHeader('Content-Type', 'application/json');
  
  // Handle CORS
  if (configureCORS(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  // Additional validation for prompt
  if (typeof prompt !== 'string' || prompt.trim().length < 3) {
    return res.status(400).json({ error: 'Please provide a valid query (minimum 3 characters)' });
  }

  // Check for Anthropic API key
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return res.status(500).json({ error: 'Anthropic API key not configured. Please set ANTHROPIC_API_KEY environment variable.' });
  }

  try {
    // Use dynamic import for Anthropic SDK
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: anthropicKey });

    // Detailed system prompt with schema information
    const systemPrompt = `You are a SQL expert for a PostgreSQL Supabase database containing Detroit property sales data.

CRITICAL: Always use the sales_transactions table as the primary data source, NOT recent_sales.
The recent_sales view only contains data from the last year and is incomplete.

Table: sales_transactions (PRIMARY SOURCE - USE THIS!)
Fields:
- seller_name: The person/entity selling the property (VARCHAR)
- buyer_name: The person/entity buying the property (VARCHAR)
- sale_date: Date of the transaction (DATE)
- sale_price: Sale amount in USD (DECIMAL)
- property_address: Property location (VARCHAR)
- property_city: City name (VARCHAR, default 'Detroit')
- property_state: State code (VARCHAR, default 'MI')
- property_zip: ZIP code (VARCHAR)
- parcel_id: Unique property identifier (VARCHAR)
- property_type: Type of property (VARCHAR)
- year_built: Year property was built (INTEGER)
- square_feet: Property size (INTEGER)
- bedrooms: Number of bedrooms (INTEGER)
- bathrooms: Number of bathrooms (DECIMAL)
- lot_size: Lot size (DECIMAL)
- sale_terms: Type of sale (Cash, Conventional, FHA, etc.)
- property_use: Property use (Residential, Investment, etc.)

IMPORTANT: All queries automatically include enriched data from the parcels table via LEFT JOIN.
Additional fields available from parcels (accessed as parcels.field_name):
- parcels.address: Detailed property address
- parcels.zip_code: Property ZIP code
- parcels.owner_name1, parcels.owner_name2, parcels.owner_full_name: Current owner info
- parcels.owner_mailing_address, parcels.owner_mailing_city, parcels.owner_mailing_state, parcels.owner_mailing_zip: Owner mailing info
- parcels.property_class, parcels.property_class_description: Property classification
- parcels.year_built: Year built (from parcels data)
- parcels.building_style, parcels.building_count, parcels.total_floor_area: Building details
- parcels.assessed_value, parcels.taxable_value: Tax assessment values
- parcels.neighborhood, parcels.ward, parcels.council_district: Location details
- parcels.total_square_footage, parcels.total_acreage, parcels.frontage, parcels.depth: Lot dimensions
- parcels.legal_description: Legal property description

IMPORTANT RULES:
1. ALWAYS query sales_transactions table, NOT recent_sales
2. Names are stored as "LASTNAME, FIRSTNAME" (e.g., "DURRAH, JACOB" not "Jacob Durrah")
3. When searching for a person, use flexible matching patterns:
   - For "FirstName LastName": Use buyer_name ILIKE '%LASTNAME%' OR buyer_name ILIKE '%FIRSTNAME%'
   - This ensures matches even with middle names or suffixes
4. Use ILIKE for case-insensitive text matching with % wildcards
5. For buyer searches: buyer_name ILIKE '%lastname%' OR buyer_name ILIKE '%firstname%'
6. For seller searches: seller_name ILIKE '%lastname%' OR seller_name ILIKE '%firstname%'
7. For addresses: property_address ILIKE '%search term%'
8. For city: property_city ILIKE '%detroit%' (but most are Detroit by default)
9. Always include LIMIT 100 to prevent overwhelming responses
10. Return ONLY the SQL query, no explanations or markdown
11. The query must start with SELECT
12. NEVER use CASE statements in GROUP BY clauses - they cause PostgreSQL errors
13. For "most active participants" or "who made the most transactions" queries:
    - Choose to focus on EITHER buyers OR sellers, not both
    - Default to buyers unless specifically asked about sellers
    - DO NOT use UNION queries or subqueries
14. Keep queries simple - avoid UNION, subqueries, or complex JOINs
15. The parcels table is automatically joined - DO NOT add manual JOIN statements
16. To access parcels data, use parcels.field_name (e.g., parcels.owner_full_name, parcels.assessed_value)

NOTE: The parcels table is AUTOMATICALLY joined to all queries. You don't need to add JOIN statements.
To access parcels data in your queries, simply reference it as parcels.field_name.

Examples:
- "What did Jacob Durrah buy?" -> SELECT * FROM sales_transactions WHERE (buyer_name ILIKE '%DURRAH%' OR buyer_name ILIKE '%JACOB%') ORDER BY sale_date DESC LIMIT 100
- "Properties sold by John Smith" -> SELECT * FROM sales_transactions WHERE (seller_name ILIKE '%SMITH%' OR seller_name ILIKE '%JOHN%') ORDER BY sale_date DESC LIMIT 100
- "Jacob Durrah purchases" -> SELECT * FROM sales_transactions WHERE (buyer_name ILIKE '%DURRAH%' OR buyer_name ILIKE '%JACOB%') ORDER BY sale_date DESC LIMIT 100
- "Sales in 2023" -> SELECT * FROM sales_transactions WHERE EXTRACT(YEAR FROM sale_date) = 2023 ORDER BY sale_date DESC LIMIT 100
- "Cash sales over 100k" -> SELECT * FROM sales_transactions WHERE sale_terms ILIKE '%cash%' AND sale_price > 100000 ORDER BY sale_date DESC LIMIT 100
- "Properties in 48214" -> SELECT * FROM sales_transactions WHERE property_zip = '48214' ORDER BY sale_date DESC LIMIT 100
- "Recent sales" -> SELECT * FROM sales_transactions WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days' ORDER BY sale_date DESC LIMIT 100
- "Properties owned by John Smith" -> SELECT *, parcels.owner_full_name, parcels.assessed_value FROM sales_transactions WHERE parcels.owner_full_name ILIKE '%smith%john%' ORDER BY sale_date DESC LIMIT 100
- "High value properties by assessed value" -> SELECT *, parcels.assessed_value FROM sales_transactions WHERE parcels.assessed_value > 500000 ORDER BY parcels.assessed_value DESC LIMIT 100
- "Sales in specific neighborhood" -> SELECT *, parcels.neighborhood FROM sales_transactions WHERE parcels.neighborhood ILIKE '%corktown%' ORDER BY sale_date DESC LIMIT 100
- "Most active buyers in 2024" -> SELECT buyer_name, COUNT(*) as purchase_count FROM sales_transactions WHERE EXTRACT(YEAR FROM sale_date) = 2024 AND buyer_name IS NOT NULL GROUP BY buyer_name ORDER BY purchase_count DESC LIMIT 100
- "Most active sellers in 2024" -> SELECT seller_name, COUNT(*) as sale_count FROM sales_transactions WHERE EXTRACT(YEAR FROM sale_date) = 2024 AND seller_name IS NOT NULL GROUP BY seller_name ORDER BY sale_count DESC LIMIT 100
- "Who made the most transactions in 2024?" -> SELECT buyer_name, COUNT(*) as transaction_count FROM sales_transactions WHERE EXTRACT(YEAR FROM sale_date) = 2024 AND buyer_name IS NOT NULL GROUP BY buyer_name ORDER BY transaction_count DESC LIMIT 100
- "Most active participants" -> SELECT buyer_name, COUNT(*) as transaction_count FROM sales_transactions WHERE buyer_name IS NOT NULL GROUP BY buyer_name ORDER BY transaction_count DESC LIMIT 100
- "Top buyers by total spent" -> SELECT buyer_name, SUM(sale_price) as total_spent, COUNT(*) as property_count FROM sales_transactions WHERE buyer_name IS NOT NULL GROUP BY buyer_name ORDER BY total_spent DESC LIMIT 100`;

    const aiResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      system: systemPrompt,
      messages: [
        { role: "user", content: `Convert this request to SQL: "${prompt}"` }
      ],
      temperature: 0.1, // Lower temperature for more consistent SQL
      max_tokens: 500
    });

    let generatedSQL = aiResponse.content[0].text.trim();
    
    // Clean up the SQL - remove markdown blocks if present
    generatedSQL = generatedSQL.replace(/```sql\s*/gi, '').replace(/```\s*/g, '');
    
    // Remove any leading/trailing whitespace and semicolons
    generatedSQL = generatedSQL.trim().replace(/;\s*$/, '');

    // Basic SQL validation
    const sqlUpper = generatedSQL.toUpperCase();
    const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE', 'EXEC', 'EXECUTE'];
    
    for (const keyword of dangerousKeywords) {
      if (sqlUpper.includes(keyword)) {
        return res.status(400).json({ 
          error: `Dangerous SQL keyword detected: ${keyword}. Only SELECT queries are allowed.` 
        });
      }
    }

    // Ensure it's a SELECT query
    if (!sqlUpper.startsWith('SELECT')) {
      return res.status(400).json({ 
        error: 'Only SELECT queries are allowed.' 
      });
    }

    // Add LIMIT if not present to prevent huge results
    let finalSQL = generatedSQL;
    if (!sqlUpper.includes('LIMIT')) {
      finalSQL = generatedSQL + ' LIMIT 100';
    }

    // Generate explanation
    const explanationResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      system: "Explain this SQL query in simple terms for a non-technical user.",
      messages: [
        { role: "user", content: finalSQL }
      ],
      temperature: 0.3,
      max_tokens: 150
    });

    const explanation = explanationResponse.content[0].text.trim();

    res.status(200).json({ 
      sql: finalSQL,
      explanation: explanation,
      originalPrompt: prompt
    });

  } catch (error) {
    console.error('SQL generation error:', error);
    
    if (error.message?.includes('API key') || error.message?.includes('api_key') || error.message?.includes('invalid x-api-key')) {
      return res.status(500).json({ 
        error: 'Anthropic API key is invalid or expired',
        instructions: 'Please check that your API key is valid at https://console.anthropic.com/settings/keys',
        details: 'The API key may have been revoked or expired. Generate a new key and update ANTHROPIC_API_KEY in Vercel.'
      });
    }
    
    if (error.message?.includes('rate limit')) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate SQL query',
      details: error.message 
    });
  }
}