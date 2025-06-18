/**
 * Error handler wrapper for API endpoints
 * Ensures all responses are JSON and handles unexpected errors
 */

export function withErrorHandler(handler) {
    return async (req, res) => {
        try {
            // Ensure response is always JSON
            res.setHeader('Content-Type', 'application/json');
            
            // Call the actual handler
            await handler(req, res);
            
        } catch (error) {
            console.error('API Error:', error);
            
            // Ensure we haven't already sent a response
            if (!res.headersSent) {
                res.setHeader('Content-Type', 'application/json');
                
                // Determine appropriate error response
                if (error.name === 'ValidationError') {
                    res.status(400).json({
                        error: 'Validation Error',
                        details: error.message
                    });
                } else if (error.name === 'UnauthorizedError') {
                    res.status(401).json({
                        error: 'Unauthorized',
                        details: error.message
                    });
                } else if (error.code === 'ECONNREFUSED') {
                    res.status(503).json({
                        error: 'Service Unavailable',
                        details: 'Unable to connect to required services'
                    });
                } else {
                    // Generic error response
                    res.status(500).json({
                        error: 'Internal Server Error',
                        details: process.env.NODE_ENV === 'development' 
                            ? error.message 
                            : 'An unexpected error occurred'
                    });
                }
            }
        }
    };
}

/**
 * Validate request method
 */
export function validateMethod(req, res, allowedMethods) {
    const methods = Array.isArray(allowedMethods) ? allowedMethods : [allowedMethods];
    
    if (!methods.includes(req.method)) {
        res.status(405).json({
            error: 'Method Not Allowed',
            allowed: methods,
            received: req.method
        });
        return false;
    }
    
    return true;
}

/**
 * Validate request body
 */
export function validateBody(req, res, requiredFields) {
    if (!req.body) {
        res.status(400).json({
            error: 'Bad Request',
            details: 'Request body is missing'
        });
        return false;
    }
    
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
        res.status(400).json({
            error: 'Bad Request',
            details: `Missing required fields: ${missingFields.join(', ')}`
        });
        return false;
    }
    
    return true;
}