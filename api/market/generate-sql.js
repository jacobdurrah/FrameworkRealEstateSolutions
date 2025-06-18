import { configureCORS } from '../cors.js';

export default async function handler(req, res) {
  // Handle CORS
  if (configureCORS(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  if (!prompt || prompt.trim().length < 3) {
    return res.status(400).json({ error: 'Please provide a valid query' });
  }

  // Check for Anthropic API key
  const anthropicKey = process.env.ANTHROPIC_API_KEY || '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';
  if (!anthropicKey) {
    return res.status(500).json({ error: 'Anthropic API key not configured' });
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
- parcel_id: Unique property identifier (text)
- terms_of_sale: Type of sale/deed (text)
- property_class: Property classification (text)

Important notes:
- Some records use grantor/grantee, others use seller_name/buyer_name
- Use ILIKE for case-insensitive text matching
- Always use both field variations with OR conditions
- For names, use partial matching with % wildcards
- Limit results to prevent overwhelming responses
- Return clean, formatted SQL without markdown blocks

Examples:
- "What did John Smith buy?" -> Search buyer_name and grantee for John Smith
- "Properties sold in 2023" -> Filter by sale_date year
- "Cash sales over 100k" -> Filter by terms_of_sale and sale_price`;

    const aiResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      system: systemPrompt,
      messages: [
        { role: "user", content: `Convert this request to SQL: "${prompt}"` }
      ],
      temperature: 0.1, // Lower temperature for more consistent SQL
      max_tokens: 500
    });

    const generatedSQL = aiResponse.content[0].text.trim();

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
    
    if (error.message?.includes('API key') || error.message?.includes('api_key')) {
      return res.status(500).json({ error: 'Anthropic API key is invalid or not configured' });
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