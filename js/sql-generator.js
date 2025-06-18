/**
 * SQL Generator for Market Analysis
 * Converts natural language queries to SQL for property sales analysis
 */

class SQLGenerator {
    constructor() {
        // Define query patterns and their SQL templates
        this.queryPatterns = [
            // Top buyers/sellers patterns
            {
                pattern: /top\s+(\d+)?\s*(buyer|investor|purchaser)s?\s*(?:in|during)?\s*(\d{4})?/i,
                handler: this.generateTopBuyersQuery.bind(this)
            },
            {
                pattern: /top\s+(\d+)?\s*(seller|vendor)s?\s*(?:in|during)?\s*(\d{4})?/i,
                handler: this.generateTopSellersQuery.bind(this)
            },
            // Highest sale patterns
            {
                pattern: /(?:who\s+)?sold\s+(?:the\s+)?highest\s+(?:price|property|home)?\s*(?:in|during)?\s*(\d{4})?/i,
                handler: this.generateHighestSaleQuery.bind(this)
            },
            // Flip analysis patterns
            {
                pattern: /flip(?:per)?s?\s+in\s+([^?]+?)(?:\s+with\s+(\d+)%?\s*(?:profit|margin))?/i,
                handler: this.generateFlipAnalysisQuery.bind(this)
            },
            // Property count patterns
            {
                pattern: /(?:who\s+)?owns?\s+(?:the\s+)?most\s+(?:properties|units|homes)?\s*(?:in\s+)?(\d{5})?/i,
                handler: this.generatePropertyCountQuery.bind(this)
            },
            // Average metrics patterns
            {
                pattern: /average\s+(resale\s+)?(?:profit|margin|hold\s+time|price)\s+(?:for\s+)?(?:all\s+)?(?:flips?|properties)?\s*(?:in\s+)?([^?]+)?/i,
                handler: this.generateAverageMetricsQuery.bind(this)
            },
            // Investor strategy patterns
            {
                pattern: /investor\s+strateg(?:y|ies)\s+(?:in\s+)?([^?]+)?/i,
                handler: this.generateInvestorStrategyQuery.bind(this)
            }
        ];

        // Common SQL fragments
        this.sqlFragments = {
            flipFilter: `
                AND EXISTS (
                    SELECT 1 FROM sales_transactions s2
                    WHERE s2.parcel_id = s1.parcel_id
                    AND s2.grantee_name = s1.grantor_name
                    AND s2.sale_date < s1.sale_date
                    AND s2.sale_date >= s1.sale_date - INTERVAL '12 months'
                    AND s2.sale_date >= s1.sale_date - INTERVAL '3 months'
                )`,
            
            validSaleFilter: `
                sale_price > 1000
                AND sale_price < 10000000
                AND (terms_of_sale = 'WARRANTY DEED' OR terms_of_sale LIKE '%CASH%')`,
            
            investorGrouping: `
                CASE 
                    WHEN grantee_name LIKE '%LLC%' OR grantee_name LIKE '%CORP%' 
                        OR grantee_name LIKE '%INC%' OR grantee_name LIKE '%TRUST%'
                    THEN grantee_name
                    ELSE CONCAT(
                        SPLIT_PART(grantee_name, ' ', 1), ' ',
                        SPLIT_PART(grantee_name, ' ', -1)
                    )
                END`
        };
    }

    /**
     * Generate SQL query from natural language input
     */
    generateQuery(naturalLanguageInput) {
        const input = naturalLanguageInput.trim();
        
        // Try each pattern
        for (const { pattern, handler } of this.queryPatterns) {
            const match = input.match(pattern);
            if (match) {
                return handler(match, input);
            }
        }

        // Default to a general search
        return this.generateGeneralSearchQuery(input);
    }

    /**
     * Generate top buyers query
     */
    generateTopBuyersQuery(match, input) {
        const limit = match[1] || 10;
        const year = match[3] || new Date().getFullYear();
        
        return {
            sql: `
                WITH buyer_stats AS (
                    SELECT 
                        ${this.sqlFragments.investorGrouping} as investor_name,
                        COUNT(DISTINCT parcel_id) as properties_bought,
                        SUM(sale_price) as total_invested,
                        AVG(sale_price) as avg_price,
                        MIN(sale_date) as first_purchase,
                        MAX(sale_date) as last_purchase
                    FROM sales_transactions
                    WHERE ${this.sqlFragments.validSaleFilter}
                        AND EXTRACT(YEAR FROM sale_date) = $1
                    GROUP BY investor_name
                )
                SELECT 
                    investor_name,
                    properties_bought,
                    total_invested,
                    ROUND(avg_price::numeric, 2) as avg_price,
                    first_purchase,
                    last_purchase,
                    EXTRACT(DAY FROM last_purchase - first_purchase) as days_active
                FROM buyer_stats
                ORDER BY properties_bought DESC
                LIMIT $2
            `,
            params: [year, limit],
            description: `Top ${limit} property buyers in ${year}`
        };
    }

    /**
     * Generate top sellers query
     */
    generateTopSellersQuery(match, input) {
        const limit = match[1] || 10;
        const year = match[3] || new Date().getFullYear();
        
        return {
            sql: `
                WITH seller_stats AS (
                    SELECT 
                        CASE 
                            WHEN grantor_name LIKE '%LLC%' OR grantor_name LIKE '%CORP%' 
                            THEN grantor_name
                            ELSE CONCAT(
                                SPLIT_PART(grantor_name, ' ', 1), ' ',
                                SPLIT_PART(grantor_name, ' ', -1)
                            )
                        END as seller_name,
                        COUNT(DISTINCT parcel_id) as properties_sold,
                        SUM(sale_price) as total_revenue,
                        AVG(sale_price) as avg_sale_price
                    FROM sales_transactions
                    WHERE ${this.sqlFragments.validSaleFilter}
                        AND EXTRACT(YEAR FROM sale_date) = $1
                    GROUP BY seller_name
                )
                SELECT * FROM seller_stats
                ORDER BY properties_sold DESC
                LIMIT $2
            `,
            params: [year, limit],
            description: `Top ${limit} property sellers in ${year}`
        };
    }

    /**
     * Generate highest sale query
     */
    generateHighestSaleQuery(match, input) {
        const year = match[1] || new Date().getFullYear();
        
        return {
            sql: `
                SELECT 
                    grantor_name as seller,
                    grantee_name as buyer,
                    property_address,
                    sale_price,
                    sale_date,
                    property_class,
                    CONCAT(
                        'https://www.google.com/maps/search/',
                        REPLACE(property_address, ' ', '+'),
                        '+Detroit+MI'
                    ) as map_link
                FROM sales_transactions
                WHERE ${this.sqlFragments.validSaleFilter}
                    AND EXTRACT(YEAR FROM sale_date) = $1
                ORDER BY sale_price DESC
                LIMIT 10
            `,
            params: [year],
            description: `Highest property sales in ${year}`
        };
    }

    /**
     * Generate flip analysis query
     */
    generateFlipAnalysisQuery(match, input) {
        const location = match[1]?.trim() || 'Detroit';
        const minProfit = match[2] ? parseInt(match[2]) : 0;
        
        return {
            sql: `
                WITH flips AS (
                    SELECT 
                        s1.grantor_name as flipper,
                        s1.property_address,
                        s1.sale_price as sale_price,
                        s2.sale_price as purchase_price,
                        (s1.sale_price - s2.sale_price) as gross_profit,
                        ROUND(((s1.sale_price - s2.sale_price) / s2.sale_price * 100)::numeric, 2) as profit_margin,
                        s1.sale_date as sold_date,
                        s2.sale_date as bought_date,
                        EXTRACT(DAY FROM s1.sale_date - s2.sale_date) as hold_days
                    FROM sales_transactions s1
                    INNER JOIN sales_transactions s2 ON 
                        s1.parcel_id = s2.parcel_id
                        AND s2.grantee_name = s1.grantor_name
                        AND s2.sale_date < s1.sale_date
                        AND s2.sale_date >= s1.sale_date - INTERVAL '12 months'
                    WHERE s1.${this.sqlFragments.validSaleFilter}
                        AND s2.${this.sqlFragments.validSaleFilter}
                        ${location.toLowerCase() !== 'detroit' ? 
                            `AND (s1.property_address ILIKE $1 OR s1.neighborhood ILIKE $1)` : ''}
                )
                SELECT * FROM flips
                WHERE gross_profit > 0
                    ${minProfit > 0 ? `AND profit_margin >= $2` : ''}
                ORDER BY profit_margin DESC
                LIMIT 50
            `,
            params: location.toLowerCase() !== 'detroit' ? 
                (minProfit > 0 ? [`%${location}%`, minProfit] : [`%${location}%`]) :
                (minProfit > 0 ? [minProfit] : []),
            description: `Flip analysis for ${location}${minProfit > 0 ? ` with ${minProfit}%+ profit` : ''}`
        };
    }

    /**
     * Generate property count query
     */
    generatePropertyCountQuery(match, input) {
        const zipCode = match[1];
        
        return {
            sql: `
                WITH current_owners AS (
                    SELECT DISTINCT ON (parcel_id)
                        grantee_name as owner,
                        parcel_id,
                        property_address,
                        sale_date,
                        sale_price
                    FROM sales_transactions
                    WHERE ${this.sqlFragments.validSaleFilter}
                        ${zipCode ? `AND property_address LIKE '%${zipCode}%'` : ''}
                    ORDER BY parcel_id, sale_date DESC
                )
                SELECT 
                    ${this.sqlFragments.investorGrouping.replace('grantee_name', 'owner')} as investor,
                    COUNT(DISTINCT parcel_id) as property_count,
                    SUM(sale_price) as total_value,
                    ROUND(AVG(sale_price)::numeric, 2) as avg_property_value,
                    STRING_AGG(DISTINCT 
                        SUBSTRING(property_address FROM '.+ (\d{5})$'), 
                        ', ' ORDER BY SUBSTRING(property_address FROM '.+ (\d{5})$')
                    ) as zip_codes
                FROM current_owners
                GROUP BY investor
                ORDER BY property_count DESC
                LIMIT 20
            `,
            params: [],
            description: `Top property owners${zipCode ? ` in ZIP ${zipCode}` : ''}`
        };
    }

    /**
     * Generate average metrics query
     */
    generateAverageMetricsQuery(match, input) {
        const metric = match[1] ? 'profit' : 'hold_time';
        const location = match[2]?.trim();
        
        if (metric === 'profit') {
            return this.generateAverageProfitQuery(location);
        } else {
            return this.generateAverageHoldTimeQuery(location);
        }
    }

    /**
     * Generate average profit query
     */
    generateAverageProfitQuery(location) {
        return {
            sql: `
                WITH flip_profits AS (
                    SELECT 
                        s1.neighborhood,
                        (s1.sale_price - s2.sale_price) as profit,
                        ROUND(((s1.sale_price - s2.sale_price) / s2.sale_price * 100)::numeric, 2) as margin
                    FROM sales_transactions s1
                    INNER JOIN sales_transactions s2 ON 
                        s1.parcel_id = s2.parcel_id
                        AND s2.grantee_name = s1.grantor_name
                        AND s2.sale_date < s1.sale_date
                        AND s2.sale_date >= s1.sale_date - INTERVAL '12 months'
                    WHERE s1.${this.sqlFragments.validSaleFilter}
                        AND s2.${this.sqlFragments.validSaleFilter}
                        ${location ? `AND s1.neighborhood ILIKE $1` : ''}
                )
                SELECT 
                    ${location ? `'${location}' as area,` : 'neighborhood,'}
                    COUNT(*) as flip_count,
                    ROUND(AVG(profit)::numeric, 2) as avg_profit,
                    ROUND(AVG(margin)::numeric, 2) as avg_margin_pct,
                    ROUND(MIN(profit)::numeric, 2) as min_profit,
                    ROUND(MAX(profit)::numeric, 2) as max_profit
                FROM flip_profits
                WHERE profit > 0
                ${!location ? 'GROUP BY neighborhood' : ''}
                ORDER BY ${location ? 'flip_count DESC' : 'avg_profit DESC'}
                LIMIT 20
            `,
            params: location ? [`%${location}%`] : [],
            description: `Average flip profits${location ? ` in ${location}` : ' by neighborhood'}`
        };
    }

    /**
     * Generate investor strategy analysis query
     */
    generateInvestorStrategyQuery(match, input) {
        const location = match[1]?.trim();
        
        return {
            sql: `
                WITH investor_activity AS (
                    SELECT 
                        ${this.sqlFragments.investorGrouping} as investor,
                        COUNT(DISTINCT CASE WHEN type = 'buy' THEN parcel_id END) as properties_bought,
                        COUNT(DISTINCT CASE WHEN type = 'sell' THEN parcel_id END) as properties_sold,
                        AVG(CASE WHEN type = 'flip' THEN hold_days END) as avg_flip_days,
                        COUNT(CASE WHEN type = 'flip' THEN 1 END) as flip_count,
                        COUNT(CASE WHEN type = 'hold' THEN 1 END) as hold_count
                    FROM (
                        -- Identify buy transactions
                        SELECT 
                            grantee_name, 
                            parcel_id, 
                            'buy' as type,
                            NULL as hold_days
                        FROM sales_transactions
                        WHERE ${this.sqlFragments.validSaleFilter}
                        
                        UNION ALL
                        
                        -- Identify sell transactions and classify as flip or hold
                        SELECT 
                            s1.grantor_name as grantee_name,
                            s1.parcel_id,
                            CASE 
                                WHEN EXISTS (
                                    SELECT 1 FROM sales_transactions s2
                                    WHERE s2.parcel_id = s1.parcel_id
                                    AND s2.grantee_name = s1.grantor_name
                                    AND s2.sale_date < s1.sale_date
                                    AND s2.sale_date >= s1.sale_date - INTERVAL '12 months'
                                ) THEN 'flip'
                                ELSE 'hold'
                            END as type,
                            EXTRACT(DAY FROM s1.sale_date - s2.sale_date) as hold_days
                        FROM sales_transactions s1
                        LEFT JOIN sales_transactions s2 ON 
                            s1.parcel_id = s2.parcel_id
                            AND s2.grantee_name = s1.grantor_name
                            AND s2.sale_date < s1.sale_date
                        WHERE s1.${this.sqlFragments.validSaleFilter}
                    ) t
                    ${location ? `WHERE parcel_id IN (
                        SELECT parcel_id FROM sales_transactions 
                        WHERE property_address ILIKE $1 OR neighborhood ILIKE $1
                    )` : ''}
                    GROUP BY investor
                )
                SELECT 
                    investor,
                    properties_bought,
                    properties_sold,
                    flip_count,
                    hold_count,
                    CASE 
                        WHEN flip_count > hold_count * 2 THEN 'Flipper'
                        WHEN hold_count > flip_count * 2 THEN 'Buy & Hold'
                        WHEN flip_count > 0 AND hold_count > 0 THEN 'Mixed Strategy'
                        ELSE 'Unknown'
                    END as primary_strategy,
                    ROUND(avg_flip_days::numeric, 0) as avg_flip_days
                FROM investor_activity
                WHERE properties_bought > 2
                ORDER BY properties_bought DESC
                LIMIT 50
            `,
            params: location ? [`%${location}%`] : [],
            description: `Investor strategies${location ? ` in ${location}` : ''}`
        };
    }

    /**
     * Generate general search query
     */
    generateGeneralSearchQuery(input) {
        // Extract any recognizable entities
        const yearMatch = input.match(/\b(20\d{2})\b/);
        const year = yearMatch ? yearMatch[1] : new Date().getFullYear();
        
        return {
            sql: `
                SELECT 
                    sale_date,
                    grantor_name as seller,
                    grantee_name as buyer,
                    property_address,
                    sale_price,
                    neighborhood,
                    property_class
                FROM sales_transactions
                WHERE ${this.sqlFragments.validSaleFilter}
                    AND EXTRACT(YEAR FROM sale_date) = $1
                    AND (
                        LOWER(grantor_name) LIKE LOWER($2) OR
                        LOWER(grantee_name) LIKE LOWER($2) OR
                        LOWER(property_address) LIKE LOWER($2) OR
                        LOWER(neighborhood) LIKE LOWER($2)
                    )
                ORDER BY sale_date DESC
                LIMIT 100
            `,
            params: [year, `%${input.replace(/['"]/g, '')}%`],
            description: `General search for "${input}"`
        };
    }

    /**
     * Validate and sanitize SQL query
     */
    validateQuery(query) {
        // Basic SQL injection prevention
        const dangerousPatterns = [
            /;\s*DROP/i,
            /;\s*DELETE/i,
            /;\s*INSERT/i,
            /;\s*UPDATE/i,
            /;\s*CREATE/i,
            /;\s*ALTER/i,
            /--/,
            /\/\*/
        ];

        for (const pattern of dangerousPatterns) {
            if (pattern.test(query.sql)) {
                throw new Error('Invalid query detected');
            }
        }

        return true;
    }
}

// Make available globally
window.SQLGenerator = SQLGenerator;