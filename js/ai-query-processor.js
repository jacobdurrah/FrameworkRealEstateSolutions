/**
 * AI Query Processor for Market Analysis
 * Handles natural language to SQL conversion using OpenAI
 */

class AIQueryProcessor {
    constructor() {
        // Use Vercel deployment URL for API
        if (window.location.hostname === 'localhost') {
            this.apiBaseUrl = 'http://localhost:3000/api';
        } else if (window.location.hostname === 'frameworkrealestatesolutions.com') {
            // Production site needs to use Vercel API URL
            this.apiBaseUrl = 'https://framework-20wbysc7e-jacob-durrahs-projects.vercel.app/api';
        } else {
            // For Vercel preview/staging URLs
            this.apiBaseUrl = '/api';
        }
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Process natural language query using AI
     */
    async processQuery(naturalLanguageInput) {
        if (!naturalLanguageInput || naturalLanguageInput.trim().length < 3) {
            throw new Error('Please enter a valid query');
        }

        // Check cache first
        const cacheKey = naturalLanguageInput.toLowerCase().trim();
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            console.log('Using cached SQL for query:', naturalLanguageInput);
            return cached;
        }

        try {
            // Step 1: Generate SQL
            console.log('Generating SQL for:', naturalLanguageInput);
            const sqlResult = await this.generateSQL(naturalLanguageInput);
            
            // Cache the generated SQL
            this.storeInCache(cacheKey, sqlResult);
            
            return sqlResult;
        } catch (error) {
            console.error('AI query processing error:', error);
            throw error;
        }
    }

    /**
     * Generate SQL from natural language
     */
    async generateSQL(prompt) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/market/generate-sql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt })
            });

            // Check if response is HTML (error page)
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('API returned non-JSON response:', contentType);
                
                // Try to get the response text for debugging
                const text = await response.text();
                console.error('Response body:', text.substring(0, 500)); // Log first 500 chars
                
                throw new Error('API returned an HTML error page instead of JSON. This usually means the endpoint is not found or there is a server error.');
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `API error: ${response.status} ${response.statusText}`);
            }

            return response.json();
        } catch (error) {
            console.error('generateSQL error:', error);
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Unable to connect to the API. Please check your internet connection and try again.');
            }
            throw error;
        }
    }

    /**
     * Execute SQL query
     */
    async executeSQL(sql) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/market/execute-sql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sql })
            });

            // Check if response is HTML (error page)
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('API returned non-JSON response:', contentType);
                
                // Try to get the response text for debugging
                const text = await response.text();
                console.error('Response body:', text.substring(0, 500)); // Log first 500 chars
                
                throw new Error('API returned an HTML error page instead of JSON. This usually means the endpoint is not found or there is a server error.');
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `API error: ${response.status} ${response.statusText}`);
            }

            return response.json();
        } catch (error) {
            console.error('executeSQL error:', error);
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Unable to connect to the API. Please check your internet connection and try again.');
            }
            throw error;
        }
    }

    /**
     * Process query end-to-end
     */
    async processAndExecute(naturalLanguageInput) {
        // Generate SQL
        const { sql, explanation } = await this.processQuery(naturalLanguageInput);
        
        // Execute SQL
        const results = await this.executeSQL(sql);
        
        return {
            prompt: naturalLanguageInput,
            sql,
            explanation,
            ...results
        };
    }

    /**
     * Get from cache
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    /**
     * Store in cache
     */
    storeInCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    /**
     * Get query suggestions based on input
     */
    getQuerySuggestions(input) {
        const suggestions = [
            "What properties did [name] buy in [year]?",
            "Show me all sales by [name]",
            "Who bought properties in [zip code]?",
            "List all cash sales above $[amount]",
            "Show properties sold in [month] [year]",
            "Find all flips (bought and sold within 12 months)",
            "Who are the top 10 buyers in [year]?",
            "What's the highest sale price in [zip code]?",
            "Show all properties on [street name]",
            "List buyers who purchased more than [number] properties"
        ];

        if (!input) return suggestions.slice(0, 5);

        // Filter suggestions based on input
        const filtered = suggestions.filter(s => 
            s.toLowerCase().includes(input.toLowerCase()) ||
            input.toLowerCase().split(' ').some(word => s.toLowerCase().includes(word))
        );

        return filtered.length > 0 ? filtered : suggestions.slice(0, 5);
    }

    /**
     * Validate SQL before execution
     */
    validateSQL(sql) {
        const sqlUpper = sql.toUpperCase();
        
        // Check for dangerous operations
        const dangerous = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE'];
        for (const keyword of dangerous) {
            if (sqlUpper.includes(keyword)) {
                return {
                    valid: false,
                    error: `Dangerous operation detected: ${keyword}`
                };
            }
        }

        // Must be SELECT
        if (!sqlUpper.trim().startsWith('SELECT')) {
            return {
                valid: false,
                error: 'Only SELECT queries are allowed'
            };
        }

        return { valid: true };
    }

    /**
     * Format SQL for display
     */
    formatSQL(sql) {
        return sql
            .replace(/SELECT/gi, 'SELECT')
            .replace(/FROM/gi, '\nFROM')
            .replace(/WHERE/gi, '\nWHERE')
            .replace(/AND/gi, '\n  AND')
            .replace(/OR/gi, '\n  OR')
            .replace(/ORDER BY/gi, '\nORDER BY')
            .replace(/LIMIT/gi, '\nLIMIT');
    }
}

// Make available globally
window.AIQueryProcessor = AIQueryProcessor;