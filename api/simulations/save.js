import { createClient } from '@supabase/supabase-js';
import { configureCORS } from '../cors.js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  // Handle CORS (this also handles OPTIONS)
  if (configureCORS(req, res)) return;
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Validate environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    const { name, data } = req.body;
    
    // Validate input
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid simulation data' });
    }
    
    // Validate data structure
    if (!data.version || !data.timelineData || !Array.isArray(data.timelineData)) {
      return res.status(400).json({ error: 'Invalid simulation data structure' });
    }
    
    // Limit data size (max 1MB)
    const dataSize = JSON.stringify(data).length;
    if (dataSize > 1024 * 1024) {
      return res.status(400).json({ error: 'Simulation data too large (max 1MB)' });
    }
    
    // Get client IP for rate limiting
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Check rate limit (10 saves per minute per IP)
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { count } = await supabase
      .from('simulations')
      .select('id', { count: 'exact', head: true })
      .eq('client_ip', clientIp)
      .gte('created_at', oneMinuteAgo);
      
    if (count >= 10) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again in a minute.' });
    }
    
    // Save to database
    const { data: simulation, error } = await supabase
      .from('simulations')
      .insert({
        name: name || 'Untitled Simulation',
        data: data,
        version: data.version || 'v3',
        client_ip: clientIp
      })
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to save simulation' });
    }
    
    // Generate share URL
    const baseUrl = req.headers.origin || 'https://frameworkrealestatesolutions.com';
    const shareUrl = `${baseUrl}/portfolio-simulator-v3.html?id=${simulation.id}`;
    
    // Return success response (excluding sensitive fields)
    res.status(200).json({
      id: simulation.id,
      url: shareUrl,
      created_at: simulation.created_at,
      expires_at: simulation.expires_at
    });
    
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}