import { configureCORS } from '../cors.js';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Always set CORS headers first
  res.setHeader('Content-Type', 'application/json');
  
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
    // Allow UNION queries but not complex JOINs
    if (sqlUpper.includes('JOIN') && !sqlUpper.includes('UNION')) {
      return res.status(400).json({ 
        error: 'Complex SQL queries with JOINs are not supported yet. Please simplify your query.',
        suggestion: 'Try asking for data from a single perspective, like "Show all purchases by John Smith" or "List properties sold in 2023"'
      });
    }
    
    // For UNION queries or subqueries, we need to use raw SQL execution
    if (sqlUpper.includes('UNION') || sqlUpper.includes('FROM (')) {
      // These complex queries need special handling
      console.log('Complex UNION/subquery detected, needs special handling');
      // For now, return a specific error suggesting simpler queries
      return res.status(400).json({ 
        error: 'This query is too complex for automatic execution. Please try a simpler query.',
        suggestion: 'Instead of "most active participants", try "most active buyers" or "most active sellers" separately.',
        sql: sql
      });
    }

    // For complex queries with OR conditions, we'll use Supabase's raw SQL via RPC
    // First, let's check if the query has OR conditions
    if (sql.toUpperCase().includes(' OR ')) {
      // Use Supabase's raw SQL execution if available
      try {
        // Note: This requires a stored procedure in Supabase
        // For now, we'll handle it with manual parsing
        console.log('Query contains OR conditions, using advanced parsing');
      } catch (err) {
        console.log('Falling back to manual parsing');
      }
    }
    
    // For this implementation, we'll need to manually parse and execute common patterns
    // This is a simplified version - in production you might want a proper SQL parser
    
    // Extract table name (should be sales_transactions)
    const tableMatch = sql.match(/FROM\s+(\w+)/i);
    if (!tableMatch || tableMatch[1].toLowerCase() !== 'sales_transactions') {
      return res.status(400).json({ 
        error: 'Only queries from sales_transactions table are supported',
        receivedTable: tableMatch ? tableMatch[1] : 'none',
        sql: sql
      });
    }

    // Start building Supabase query with automatic parcels join
    // Join parcels table to enrich sales data with property metadata
    let query = supabase.from('sales_transactions').select(`
      *,
      parcels!left (
        address as parcel_address,
        zip_code as parcel_zip_code,
        owner_name1,
        owner_name2,
        owner_full_name,
        owner_mailing_address,
        owner_mailing_city,
        owner_mailing_state,
        owner_mailing_zip,
        owner_full_mailing_address,
        property_class,
        property_class_description,
        year_built as parcel_year_built,
        building_style,
        building_count,
        total_floor_area,
        tax_status,
        tax_status_description,
        assessed_value,
        previous_assessed_value,
        taxable_value,
        previous_taxable_value,
        neighborhood,
        ward,
        council_district,
        total_square_footage,
        total_acreage,
        frontage,
        depth,
        sale_date as parcel_sale_date,
        sale_price as parcel_sale_price,
        legal_description,
        street_number,
        street_prefix,
        street_name
      )
    `);

    // Extract WHERE conditions (simplified parsing)
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i);
    if (whereMatch) {
      let conditions = whereMatch[1];
      
      // Check if we have OR conditions that need special handling
      if (conditions.toUpperCase().includes(' OR ')) {
        // Handle OR conditions for same field with different values (e.g., buyer_name ILIKE '%DURRAH%' OR buyer_name ILIKE '%JACOB%')
        const sameFieldOrPattern = /\((\w+)\s+ILIKE\s+'([^']+)'\s+OR\s+\1\s+ILIKE\s+'([^']+)'\)/i;
        const sameFieldMatch = conditions.match(sameFieldOrPattern);
        if (sameFieldMatch) {
          const [, field, value1, value2] = sameFieldMatch;
          // Use Supabase's or() method for same field with multiple values
          query = query.or(`${field}.ilike.${value1},${field}.ilike.${value2}`);
          
          // Remove this condition from the string
          conditions = conditions.replace(sameFieldOrPattern, '').trim();
        }
        
        // Handle OR conditions for name searches across different fields (buyer/seller)
        const nameOrPattern = /\((buyer_name\s+ILIKE\s+'([^']+)'\s+OR\s+seller_name\s+ILIKE\s+'([^']+)')\)/i;
        const nameOrMatch = conditions.match(nameOrPattern);
        if (nameOrMatch) {
          const searchValue = nameOrMatch[2] || nameOrMatch[3];
          // Use Supabase's or() method
          query = query.or(`buyer_name.ilike.${searchValue},seller_name.ilike.${searchValue}`);
          
          // Remove this condition from the string
          conditions = conditions.replace(nameOrPattern, '').trim();
        }
        
        // Process any remaining conditions that are not OR conditions
        if (conditions && !conditions.match(/^\s*(AND|OR)\s*$/)) {
          // Continue processing remaining conditions below
          console.log('Processing remaining conditions:', conditions);
        }
      } else {
        // No OR conditions, process normally
        // Handle LOWER(field) LIKE conditions
        const lowerLikeMatches = conditions.matchAll(/LOWER\((\w+)\)\s+LIKE\s+'([^']+)'/gi);
        for (const match of lowerLikeMatches) {
          const [, field, value] = match;
          // Supabase doesn't support LOWER() in queries, so use ilike which is case-insensitive
          query = query.ilike(field, value.replace(/%/g, '*'));
        }
        
        // Handle ILIKE conditions
        const ilikeMatches = conditions.matchAll(/(\w+)\s+ILIKE\s+'([^']+)'/gi);
        for (const match of ilikeMatches) {
          const [, field, value] = match;
          query = query.ilike(field, value);
        }
        
        // Handle LIKE conditions (case-sensitive)
        const likeMatches = conditions.matchAll(/(?<!LOWER\()(\w+)\s+LIKE\s+'([^']+)'/gi);
        for (const match of likeMatches) {
          const [, field, value] = match;
          query = query.like(field, value);
        }
        
        // Handle LOWER(field) = conditions
        const lowerEqualMatches = conditions.matchAll(/LOWER\((\w+)\)\s*=\s*'([^']+)'/gi);
        for (const match of lowerEqualMatches) {
          const [, field, value] = match;
          // Use ilike with exact match for case-insensitive equality
          query = query.ilike(field, value);
        }
        
        // Handle regular equality conditions
        const equalMatches = conditions.matchAll(/(?<!LOWER\()(\w+)\s*=\s*'([^']+)'/gi);
        for (const match of equalMatches) {
          const [, field, value] = match;
          query = query.eq(field, value);
        }
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

    // Log the SQL query for debugging
    console.log('Executing SQL:', sql);
    console.log('Parsed conditions:', whereMatch ? whereMatch[1] : 'none');

    // Execute query
    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      
      // Check for specific PostgreSQL errors
      if (error.message && error.message.includes('CASE')) {
        return res.status(400).json({ 
          error: 'Query contains unsupported CASE statement in GROUP BY',
          details: 'PostgreSQL does not support CASE expressions in GROUP BY clauses. Please rephrase your query.',
          sql: sql,
          suggestion: 'Try asking for "most active buyers" or "most active sellers" separately instead of "most active participants"'
        });
      }
      
      return res.status(500).json({ 
        error: 'Database query failed',
        details: error.message,
        sql: sql,
        suggestion: 'Try simplifying your query or using the pre-built query patterns'
      });
    }

    // Log results for debugging
    console.log(`Query returned ${data?.length || 0} rows`);

    // Process data to flatten parcels fields and remove internal metadata
    const processedData = (data || []).map(row => {
      const processedRow = {};
      
      // Copy main sales_transactions fields
      Object.keys(row).forEach(key => {
        if (key === 'parcels' && typeof row[key] === 'object' && row[key] !== null) {
          // Flatten parcels data with prefixed field names
          Object.entries(row[key]).forEach(([parcelKey, parcelValue]) => {
            // Skip internal/metadata fields from parcels
            if (!['created_at', 'updated_at', 'id', 'data_source', 'sync_status'].includes(parcelKey)) {
              processedRow[`parcel_${parcelKey}`] = parcelValue;
            }
          });
        } else {
          // Copy non-parcels fields directly
          processedRow[key] = row[key];
        }
      });
      
      return processedRow;
    });

    // Return results with metadata
    res.status(200).json({ 
      data: processedData,
      rowCount: processedData.length,
      sql: sql,
      executionTime: new Date().toISOString(),
      debug: {
        parsedTable: tableMatch[1],
        parsedConditions: whereMatch ? whereMatch[1] : null,
        resultCount: processedData.length
      }
    });

  } catch (error) {
    console.error('SQL execution error:', error);
    res.status(500).json({ 
      error: 'Failed to execute query',
      details: error.message 
    });
  }
}