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

IMPORTANT RULES:
1. ALWAYS query sales_transactions table, NOT recent_sales
2. Names are stored as "LASTNAME, FIRSTNAME" (e.g., "DURRAH, JACOB" not "Jacob Durrah")
3. When searching for "FirstName LastName", convert to "LASTNAME, FIRSTNAME"
4. Use ILIKE for case-insensitive text matching with % wildcards
5. For names: buyer_name ILIKE '%lastname%firstname%' OR seller_name ILIKE '%lastname%firstname%'
6. For addresses: property_address ILIKE '%search term%'
7. For city: property_city ILIKE '%detroit%' (but most are Detroit by default)
8. Always include LIMIT 100 to prevent overwhelming responses
9. Return ONLY the SQL query, no explanations or markdown
10. The query must start with SELECT
11. NEVER use CASE statements in GROUP BY clauses - they cause PostgreSQL errors
12. For "most active participants" or "who made the most transactions" queries:
    - Choose to focus on EITHER buyers OR sellers, not both
    - Default to buyers unless specifically asked about sellers
    - DO NOT use UNION queries or subqueries
13. Keep queries simple - avoid UNION, subqueries, or complex JOINs

If you need to join with a parcels table for additional data:
- Use: LEFT JOIN parcels ON sales_transactions.parcel_id = parcels.parcel_id

Examples:
- "What did Jacob Durrah buy?" -> SELECT * FROM sales_transactions WHERE buyer_name ILIKE '%durrah%jacob%' ORDER BY sale_date DESC LIMIT 100
- "Properties sold by John Smith" -> SELECT * FROM sales_transactions WHERE seller_name ILIKE '%smith%john%' ORDER BY sale_date DESC LIMIT 100
- "Sales in 2023" -> SELECT * FROM sales_transactions WHERE EXTRACT(YEAR FROM sale_date) = 2023 ORDER BY sale_date DESC LIMIT 100
- "Cash sales over 100k" -> SELECT * FROM sales_transactions WHERE sale_terms ILIKE '%cash%' AND sale_price > 100000 ORDER BY sale_date DESC LIMIT 100
- "Properties in 48214" -> SELECT * FROM sales_transactions WHERE property_zip = '48214' ORDER BY sale_date DESC LIMIT 100
- "Recent sales" -> SELECT * FROM sales_transactions WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days' ORDER BY sale_date DESC LIMIT 100
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