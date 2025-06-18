import { configureCORS } from '../cors.js';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Handle CORS
  if (configureCORS(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sql } = req.body;

  if (!sql || sql.trim().length === 0) {
    return res.status(400).json({ error: 'No SQL query provided' });
  }

  // Validate SQL again for safety
  const sqlUpper = sql.toUpperCase();
  const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE', 'EXEC', 'EXECUTE'];
  
  for (const keyword of dangerousKeywords) {
    if (sqlUpper.includes(keyword)) {
      return res.status(400).json({ 
        error: `Dangerous SQL keyword detected: ${keyword}. Only SELECT queries are allowed.` 
      });
    }
  }

  if (!sqlUpper.trim().startsWith('SELECT')) {
    return res.status(400).json({ 
      error: 'Only SELECT queries are allowed.' 
    });
  }

  // Check for Supabase credentials
  const supabaseUrl = process.env.SUPABASE_URL || 'https://gzswtqlvffqcpifdyrnf.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 
                      process.env.SUPABASE_ANON_KEY || 
                      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6c3d0cWx2ZmZxY3BpZmR5cm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzM5ODcsImV4cCI6MjA2NTUwOTk4N30.8WTX9v2GD2MziYqfVn-ZBURcVqaCvjkdQjBUlv2-GgI';

  if (!supabaseKey) {
    return res.status(500).json({ error: 'Supabase credentials not configured' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Since Supabase doesn't support raw SQL execution via RPC by default,
    // we'll need to parse the SQL and use the query builder
    // For now, we'll return a message about this limitation
    
    // Check if the SQL is simple enough to convert
    if (sqlUpper.includes('JOIN') || sqlUpper.includes('UNION') || sqlUpper.includes('SUBQUERY')) {
      return res.status(400).json({ 
        error: 'Complex SQL queries with JOINs or subqueries are not supported yet. Please simplify your query.',
        suggestion: 'Try asking for data from a single perspective, like "Show all purchases by John Smith" or "List properties sold in 2023"'
      });
    }

    // For this implementation, we'll need to manually parse and execute common patterns
    // This is a simplified version - in production you might want a proper SQL parser
    
    // Extract table name (should be sales_transactions)
    const tableMatch = sql.match(/FROM\s+(\w+)/i);
    if (!tableMatch || tableMatch[1].toLowerCase() !== 'sales_transactions') {
      return res.status(400).json({ 
        error: 'Only queries from sales_transactions table are supported' 
      });
    }

    // Start building Supabase query
    let query = supabase.from('sales_transactions').select('*');

    // Extract WHERE conditions (simplified parsing)
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i);
    if (whereMatch) {
      const conditions = whereMatch[1];
      
      // Parse common conditions (this is simplified - real implementation would need proper parsing)
      // Handle ILIKE conditions
      const ilikeMatches = conditions.matchAll(/(\w+)\s+ILIKE\s+'([^']+)'/gi);
      for (const match of ilikeMatches) {
        const [, field, value] = match;
        query = query.ilike(field, value);
      }
      
      // Handle equality conditions
      const equalMatches = conditions.matchAll(/(\w+)\s*=\s*'([^']+)'/gi);
      for (const match of equalMatches) {
        const [, field, value] = match;
        query = query.eq(field, value);
      }
      
      // Handle numeric comparisons
      const gtMatches = conditions.matchAll(/(\w+)\s*>\s*(\d+)/gi);
      for (const match of gtMatches) {
        const [, field, value] = match;
        query = query.gt(field, parseInt(value));
      }
      
      // Handle date comparisons
      const dateGteMatches = conditions.matchAll(/(\w+)\s*>=\s*'([^']+)'/gi);
      for (const match of dateGteMatches) {
        const [, field, value] = match;
        if (field.toLowerCase().includes('date')) {
          query = query.gte(field, value);
        }
      }
      
      const dateLteMatches = conditions.matchAll(/(\w+)\s*<=\s*'([^']+)'/gi);
      for (const match of dateLteMatches) {
        const [, field, value] = match;
        if (field.toLowerCase().includes('date')) {
          query = query.lte(field, value);
        }
      }
    }

    // Extract ORDER BY
    const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
    if (orderMatch) {
      const [, field, direction] = orderMatch;
      query = query.order(field, { ascending: direction !== 'DESC' });
    }

    // Extract LIMIT
    const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      query = query.limit(parseInt(limitMatch[1]));
    } else {
      query = query.limit(100); // Default limit
    }

    // Execute query
    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ 
        error: 'Database query failed',
        details: error.message,
        suggestion: 'Try simplifying your query or using the pre-built query patterns'
      });
    }

    // Return results with metadata
    res.status(200).json({ 
      data: data || [],
      rowCount: data?.length || 0,
      sql: sql,
      executionTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('SQL execution error:', error);
    res.status(500).json({ 
      error: 'Failed to execute query',
      details: error.message 
    });
  }
}