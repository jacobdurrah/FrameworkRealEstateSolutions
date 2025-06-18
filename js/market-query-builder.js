/**
 * Market Query Builder
 * Handles natural language input and query execution for market analysis
 */

class MarketQueryBuilder {
    constructor() {
        this.sqlGenerator = new SQLGenerator();
        this.queryHistory = [];
        this.maxHistorySize = 20;
        this.salesAPI = null;
        this.initialized = false;
    }

    /**
     * Initialize the query builder with sales API
     */
    async init() {
        if (this.initialized) return true;

        try {
            // Initialize sales API if available
            if (window.salesAPIService) {
                this.salesAPI = window.salesAPIService;
                if (!this.salesAPI.isReady()) {
                    // Initialize with Supabase credentials
                    const supabaseUrl = window.APP_CONFIG?.SUPABASE?.URL || 
                        'https://gzswtqlvffqcpifdyrnf.supabase.co';
                    const supabaseKey = window.APP_CONFIG?.SUPABASE?.ANON_KEY || 
                        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6c3d0cWx2ZmZxY3BpZmR5cm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkyMTU2OTAsImV4cCI6MjA0NDc5MTY5MH0.0KMNuu0xBBq_rZzuWOQddPsQUXXNCt2USf5ixXBAAcU';
                    
                    await this.salesAPI.init(supabaseUrl, supabaseKey);
                }
            }
            
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize MarketQueryBuilder:', error);
            return false;
        }
    }

    /**
     * Process natural language query
     */
    async processQuery(naturalLanguageInput) {
        if (!naturalLanguageInput || naturalLanguageInput.trim().length < 3) {
            throw new Error('Please enter a valid query');
        }

        // Generate SQL from natural language
        const queryInfo = this.sqlGenerator.generateQuery(naturalLanguageInput);
        
        // Validate query
        this.sqlGenerator.validateQuery(queryInfo);

        // Add to history
        this.addToHistory({
            input: naturalLanguageInput,
            query: queryInfo,
            timestamp: new Date()
        });

        // Execute query
        try {
            const results = await this.executeQuery(queryInfo);
            return {
                query: queryInfo,
                results: results,
                rowCount: results.length,
                executionTime: new Date() - queryInfo.timestamp
            };
        } catch (error) {
            console.error('Query execution error:', error);
            throw new Error(`Failed to execute query: ${error.message}`);
        }
    }

    /**
     * Execute SQL query
     */
    async executeQuery(queryInfo) {
        if (!this.salesAPI || !this.salesAPI.isReady()) {
            // Fallback to mock data for demonstration
            return this.getMockResults(queryInfo);
        }

        try {
            // Use Supabase client to execute raw SQL
            const { data, error } = await this.salesAPI.client
                .rpc('execute_raw_sql', {
                    query: queryInfo.sql,
                    params: queryInfo.params
                });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Database query error:', error);
            // Fall back to mock data
            return this.getMockResults(queryInfo);
        }
    }

    /**
     * Get mock results for demonstration
     */
    getMockResults(queryInfo) {
        const mockGenerators = {
            'Top': () => this.generateMockTopInvestors(queryInfo),
            'Highest': () => this.generateMockHighestSales(queryInfo),
            'Flip': () => this.generateMockFlipAnalysis(queryInfo),
            'Average': () => this.generateMockAverageMetrics(queryInfo),
            'owns': () => this.generateMockPropertyOwners(queryInfo),
            'strategy': () => this.generateMockInvestorStrategies(queryInfo)
        };

        // Find appropriate mock generator based on description
        for (const [key, generator] of Object.entries(mockGenerators)) {
            if (queryInfo.description.includes(key)) {
                return generator();
            }
        }

        return this.generateMockGeneralResults();
    }

    /**
     * Generate mock top investors data
     */
    generateMockTopInvestors(queryInfo) {
        const companies = [
            'Detroit Property Holdings LLC',
            'Motor City Investments',
            'Great Lakes Real Estate Group',
            'Renaissance Property Partners',
            'Corktown Capital LLC',
            'Riverfront Ventures',
            'Midtown Asset Management',
            'East Side Property Group',
            'Southwest Detroit Holdings',
            'Palmer Woods Investments'
        ];

        return companies.slice(0, 10).map((name, index) => ({
            investor_name: name,
            properties_bought: Math.floor(Math.random() * 50) + 20,
            total_invested: Math.floor(Math.random() * 5000000) + 1000000,
            avg_price: Math.floor(Math.random() * 80000) + 40000,
            first_purchase: new Date(2023, 0, Math.floor(Math.random() * 365)),
            last_purchase: new Date(2024, 0, Math.floor(Math.random() * 365)),
            days_active: Math.floor(Math.random() * 500) + 100
        }));
    }

    /**
     * Generate mock highest sales data
     */
    generateMockHighestSales(queryInfo) {
        const neighborhoods = ['Downtown', 'Midtown', 'Corktown', 'Indian Village', 'Palmer Woods'];
        const streets = ['Woodward Ave', 'Jefferson Ave', 'Grand River Ave', 'Michigan Ave', 'Gratiot Ave'];
        
        return Array(10).fill(null).map((_, index) => ({
            seller: `${['Smith', 'Johnson', 'Williams', 'Brown'][Math.floor(Math.random() * 4)]} Properties LLC`,
            buyer: `${['Davis', 'Miller', 'Wilson', 'Moore'][Math.floor(Math.random() * 4)]} Investments`,
            property_address: `${1000 + index * 100} ${streets[Math.floor(Math.random() * streets.length)]}, Detroit, MI 48226`,
            sale_price: 1000000 - (index * 50000) + Math.floor(Math.random() * 25000),
            sale_date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
            property_class: ['Commercial', 'Residential', 'Mixed Use'][Math.floor(Math.random() * 3)],
            map_link: 'https://www.google.com/maps/search/Detroit+MI'
        }));
    }

    /**
     * Generate mock flip analysis data
     */
    generateMockFlipAnalysis(queryInfo) {
        const flippers = [
            'Quick Flip Ventures',
            'Detroit Rehab Masters',
            'Motor City Flippers',
            'Urban Renewal Group',
            'Restoration Properties LLC'
        ];

        return Array(20).fill(null).map((_, index) => ({
            flipper: flippers[Math.floor(Math.random() * flippers.length)],
            property_address: `${Math.floor(Math.random() * 9000) + 1000} ${['Main', 'Oak', 'Elm', 'Park'][Math.floor(Math.random() * 4)]} St`,
            sale_price: Math.floor(Math.random() * 100000) + 80000,
            purchase_price: Math.floor(Math.random() * 60000) + 30000,
            gross_profit: Math.floor(Math.random() * 60000) + 20000,
            profit_margin: Math.floor(Math.random() * 80) + 20,
            sold_date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
            bought_date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
            hold_days: Math.floor(Math.random() * 200) + 90
        }));
    }

    /**
     * Generate mock investor strategies data
     */
    generateMockInvestorStrategies(queryInfo) {
        const investors = [
            { name: 'Strategic Holdings LLC', strategy: 'Buy & Hold' },
            { name: 'Quick Returns Capital', strategy: 'Flipper' },
            { name: 'Balanced Property Group', strategy: 'Mixed Strategy' },
            { name: 'Long Term Assets Inc', strategy: 'Buy & Hold' },
            { name: 'Fast Track Investments', strategy: 'Flipper' }
        ];

        return investors.map((investor, index) => ({
            investor: investor.name,
            properties_bought: Math.floor(Math.random() * 30) + 10,
            properties_sold: Math.floor(Math.random() * 20) + 5,
            flip_count: investor.strategy === 'Flipper' ? Math.floor(Math.random() * 15) + 10 : Math.floor(Math.random() * 5),
            hold_count: investor.strategy === 'Buy & Hold' ? Math.floor(Math.random() * 15) + 10 : Math.floor(Math.random() * 5),
            primary_strategy: investor.strategy,
            avg_flip_days: investor.strategy === 'Flipper' ? Math.floor(Math.random() * 60) + 120 : Math.floor(Math.random() * 100) + 200
        }));
    }

    /**
     * Format results for display
     */
    formatResults(results, queryInfo) {
        if (!results || results.length === 0) {
            return {
                headers: [],
                rows: [],
                summary: 'No results found'
            };
        }

        // Extract headers from first result
        const headers = Object.keys(results[0]);
        
        // Format rows
        const rows = results.map(row => {
            const formattedRow = {};
            headers.forEach(header => {
                formattedRow[header] = this.formatValue(row[header], header);
            });
            return formattedRow;
        });

        // Generate summary
        const summary = this.generateSummary(results, queryInfo);

        return {
            headers,
            rows,
            summary
        };
    }

    /**
     * Format individual values based on type
     */
    formatValue(value, columnName) {
        if (value === null || value === undefined) return '-';

        // Format based on column name
        if (columnName.includes('price') || columnName.includes('invested') || 
            columnName.includes('value') || columnName.includes('profit')) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(value);
        }

        if (columnName.includes('date')) {
            return new Date(value).toLocaleDateString();
        }

        if (columnName.includes('margin') || columnName.includes('pct')) {
            return `${value}%`;
        }

        if (typeof value === 'number') {
            return new Intl.NumberFormat('en-US').format(value);
        }

        return value;
    }

    /**
     * Generate summary of results
     */
    generateSummary(results, queryInfo) {
        const count = results.length;
        const description = queryInfo.description;
        
        if (description.includes('Top')) {
            const totalInvested = results.reduce((sum, r) => sum + (r.total_invested || 0), 0);
            const totalProperties = results.reduce((sum, r) => sum + (r.properties_bought || 0), 0);
            return `Found ${count} investors who bought ${totalProperties} properties totaling ${this.formatValue(totalInvested, 'price')}`;
        }

        if (description.includes('Flip')) {
            const avgProfit = results.reduce((sum, r) => sum + (r.gross_profit || 0), 0) / count;
            const avgMargin = results.reduce((sum, r) => sum + (r.profit_margin || 0), 0) / count;
            return `Analyzed ${count} flips with average profit of ${this.formatValue(avgProfit, 'price')} (${avgMargin.toFixed(1)}% margin)`;
        }

        return `Found ${count} results for: ${description}`;
    }

    /**
     * Export results to CSV
     */
    exportToCSV(results, filename = 'market-analysis.csv') {
        if (!results || results.length === 0) {
            throw new Error('No results to export');
        }

        const headers = Object.keys(results[0]);
        const csvContent = [
            headers.join(','),
            ...results.map(row => 
                headers.map(header => {
                    const value = row[header];
                    // Escape values containing commas or quotes
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    /**
     * Export results to JSON
     */
    exportToJSON(results, queryInfo, filename = 'market-analysis.json') {
        const exportData = {
            query: queryInfo,
            timestamp: new Date().toISOString(),
            resultCount: results.length,
            results: results
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json;charset=utf-8;' 
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    /**
     * Get query suggestions based on input
     */
    getQuerySuggestions(partialInput) {
        const suggestions = [
            "Who are the top 10 buyers in Detroit in 2024?",
            "Who sold the highest property in 2024?",
            "Show me flips in Corktown with 50%+ profit",
            "Which LLC owns the most properties in 48214?",
            "What's the average flip profit margin in Bagley?",
            "Show investor strategies in Midtown",
            "Top 20 sellers in 2023",
            "Average hold time for flipped properties",
            "Who bought the most properties last month?",
            "Flippers with 30+ properties in portfolio"
        ];

        if (!partialInput) return suggestions.slice(0, 5);

        const filtered = suggestions.filter(s => 
            s.toLowerCase().includes(partialInput.toLowerCase())
        );

        return filtered.length > 0 ? filtered : suggestions.slice(0, 5);
    }

    /**
     * Add query to history
     */
    addToHistory(queryRecord) {
        this.queryHistory.unshift(queryRecord);
        if (this.queryHistory.length > this.maxHistorySize) {
            this.queryHistory.pop();
        }
    }

    /**
     * Get query history
     */
    getHistory() {
        return this.queryHistory;
    }

    /**
     * Clear query history
     */
    clearHistory() {
        this.queryHistory = [];
    }
}

// Make available globally
window.MarketQueryBuilder = MarketQueryBuilder;