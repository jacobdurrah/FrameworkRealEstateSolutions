/**
 * Health check endpoint for debugging API issues
 * Returns JSON with environment and configuration info
 */

import { configureCORS } from '../cors.js';

export default function handler(req, res) {
    // Handle CORS
    if (configureCORS(req, res)) return;
    
    // Always return JSON
    res.setHeader('Content-Type', 'application/json');
    
    // Return health status and debug info
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            env: process.env.NODE_ENV || 'production',
            vercel: process.env.VERCEL ? 'true' : 'false'
        },
        request: {
            method: req.method,
            url: req.url,
            headers: {
                'content-type': req.headers['content-type'],
                'user-agent': req.headers['user-agent'],
                origin: req.headers.origin,
                host: req.headers.host
            }
        },
        api: {
            anthropicKeySet: !!process.env.ANTHROPIC_API_KEY,
            supabaseUrlSet: !!process.env.SUPABASE_URL,
            supabaseKeySet: !!process.env.SUPABASE_KEY
        },
        endpoints: [
            '/api/debug/health (this endpoint)',
            '/api/market/generate-sql',
            '/api/market/execute-sql',
            '/api/portfolio/calculate'
        ]
    });
}