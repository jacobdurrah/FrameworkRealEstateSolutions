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

Table: sales_transactions
Fields:
- grantor or seller_name: The person/entity selling the property (text)
- grantee or buyer_name: The person/entity buying the property (text)
- sale_date: Date of the transaction (date)
- sale_price: Sale amount in USD (numeric)
- property_address or street_address: Property location (text)
- property_city: City name (text)
- property_state: State code (text)
- property_zip: ZIP code (text)
- parcel_id: Unique property identifier (text)
- terms_of_sale: Type of sale/deed (text)
- property_class: Property classification (text)

Important notes:
- IMPORTANT: Check BOTH field variations (e.g., buyer_name OR grantee) because data uses different field names
- Use ILIKE for case-insensitive text matching with % wildcards
- For names, use: (buyer_name ILIKE '%jacob durrah%' OR grantee ILIKE '%jacob durrah%')
- For city searches, use: property_city ILIKE '%detroit%'
- For addresses, check both: (property_address ILIKE '%search%' OR street_address ILIKE '%search%')
- Always include appropriate LIMIT to prevent overwhelming responses
- Return clean, formatted SQL without markdown blocks
- IMPORTANT: Return ONLY the SQL query, no explanations or markdown
- Do NOT include backticks or sql code blocks
- The query must start with SELECT

Examples:
- "What did Jacob Durrah buy?" -> SELECT * FROM sales_transactions WHERE (buyer_name ILIKE '%jacob durrah%' OR grantee ILIKE '%jacob durrah%')
- "Properties sold in 2023" -> SELECT * FROM sales_transactions WHERE EXTRACT(YEAR FROM sale_date) = 2023
- "Cash sales over 100k" -> SELECT * FROM sales_transactions WHERE terms_of_sale ILIKE '%cash%' AND sale_price > 100000
- "Properties in Detroit" -> SELECT * FROM sales_transactions WHERE property_city ILIKE '%detroit%'
- "2404 Pennsylvania" -> SELECT * FROM sales_transactions WHERE (property_address ILIKE '%2404%pennsylvania%' OR street_address ILIKE '%2404%pennsylvania%')`;

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