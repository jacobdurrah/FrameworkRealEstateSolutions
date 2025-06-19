import { createClient } from '@supabase/supabase-js';
import { configureCORS } from '../cors.js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  // Handle CORS (this also handles OPTIONS)
  if (configureCORS(req, res)) return;
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Validate environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get simulation ID from URL
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Simulation ID required' });
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid simulation ID format' });
    }
    
    // Fetch simulation
    const { data: simulation, error } = await supabase
      .from('simulations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !simulation) {
      return res.status(404).json({ error: 'Simulation not found' });
    }
    
    // Check if expired
    if (new Date(simulation.expires_at) < new Date()) {
      return res.status(410).json({ error: 'This simulation has expired' });
    }
    
    // Increment view count
    await supabase
      .from('simulations')
      .update({ view_count: simulation.view_count + 1 })
      .eq('id', id);
    
    // Return simulation data (excluding sensitive fields)
    res.status(200).json({
      id: simulation.id,
      name: simulation.name,
      data: simulation.data,
      version: simulation.version,
      created_at: simulation.created_at,
      expires_at: simulation.expires_at,
      view_count: simulation.view_count + 1
    });
    
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}