// Sales Transaction API Service
// Handles all sales history data operations

class SalesAPIService {
    constructor() {
        this.initialized = false;
        this.client = null;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Initialize with Supabase client
    async init(supabaseUrl, supabaseKey) {
        if (this.initialized) return true;

        try {
            const { createClient } = window.supabase;
            this.client = createClient(supabaseUrl, supabaseKey);
            this.initialized = true;
            console.log('Sales API service initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize Sales API service:', error);
            return false;
        }
    }

    // Check if service is ready
    isReady() {
        return this.initialized && this.client !== null;
    }

    // Get from cache
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    // Store in cache
    storeInCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    // Get all sales by a specific owner/seller
    async getSalesByOwner(ownerName) {
        if (!this.isReady() || !ownerName) return [];

        const normalizedName = ownerName.trim().toUpperCase();
        const cacheKey = `sales:owner:${normalizedName}`;
        
        // Check cache
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const { data, error } = await this.client
                .from('sales_transactions')
                .select('*')
                .ilike('seller_name', `%${normalizedName}%`)
                .order('sale_date', { ascending: false })
                .limit(100);

            if (error) {
                console.error('Error fetching sales by owner:', error);
                return [];
            }

            const results = data || [];
            this.storeInCache(cacheKey, results);
            return results;
        } catch (error) {
            console.error('Error in getSalesByOwner:', error);
            return [];
        }
    }

    // Get sales history for a specific property
    async getSalesByProperty(propertyAddress) {
        if (!this.isReady() || !propertyAddress) return [];

        const normalizedAddress = propertyAddress.trim().toUpperCase();
        const cacheKey = `sales:property:${normalizedAddress}`;
        
        // Check cache
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const { data, error } = await this.client
                .from('sales_transactions')
                .select('*')
                .ilike('property_address', `%${normalizedAddress}%`)
                .order('sale_date', { ascending: false });

            if (error) {
                console.error('Error fetching sales by property:', error);
                return [];
            }

            const results = data || [];
            this.storeInCache(cacheKey, results);
            return results;
        } catch (error) {
            console.error('Error in getSalesByProperty:', error);
            return [];
        }
    }

    // Get owner statistics
    async getOwnerStatistics(ownerName) {
        if (!this.isReady() || !ownerName) return null;

        const normalizedName = ownerName.trim().toUpperCase();
        const cacheKey = `stats:owner:${normalizedName}`;
        
        // Check cache
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            // Get from the seller_statistics view
            const { data, error } = await this.client
                .from('seller_statistics')
                .select('*')
                .eq('seller_name_normalized', normalizedName)
                .single();

            if (error && error.code !== 'PGRST116') { // Not found is ok
                console.error('Error fetching owner statistics:', error);
                return null;
            }

            const result = data || null;
            this.storeInCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error('Error in getOwnerStatistics:', error);
            return null;
        }
    }

    // Get recent sales in an area
    async getRecentSales(limit = 50) {
        if (!this.isReady()) return [];

        const cacheKey = `sales:recent:${limit}`;
        
        // Check cache
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const { data, error } = await this.client
                .from('recent_sales')
                .select('*')
                .limit(limit);

            if (error) {
                console.error('Error fetching recent sales:', error);
                return [];
            }

            const results = data || [];
            this.storeInCache(cacheKey, results);
            return results;
        } catch (error) {
            console.error('Error in getRecentSales:', error);
            return [];
        }
    }

    // Search sales by various criteria
    async searchSales(criteria) {
        if (!this.isReady()) return [];

        try {
            let query = this.client.from('sales_transactions').select('*');

            // Apply filters based on criteria
            if (criteria.sellerName) {
                query = query.ilike('seller_name', `%${criteria.sellerName}%`);
            }
            if (criteria.buyerName) {
                query = query.ilike('buyer_name', `%${criteria.buyerName}%`);
            }
            if (criteria.minPrice) {
                query = query.gte('sale_price', criteria.minPrice);
            }
            if (criteria.maxPrice) {
                query = query.lte('sale_price', criteria.maxPrice);
            }
            if (criteria.startDate) {
                query = query.gte('sale_date', criteria.startDate);
            }
            if (criteria.endDate) {
                query = query.lte('sale_date', criteria.endDate);
            }
            if (criteria.propertyType) {
                query = query.eq('property_type', criteria.propertyType);
            }

            // Order and limit
            query = query.order('sale_date', { ascending: false }).limit(200);

            const { data, error } = await query;

            if (error) {
                console.error('Error searching sales:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error in searchSales:', error);
            return [];
        }
    }

    // Format sale for display
    formatSale(sale) {
        return {
            address: sale.property_address,
            date: new Date(sale.sale_date).toLocaleDateString(),
            price: `$${sale.sale_price.toLocaleString()}`,
            seller: sale.seller_name,
            buyer: sale.buyer_name,
            type: sale.property_type || 'Residential',
            bedrooms: sale.bedrooms || 'N/A',
            bathrooms: sale.bathrooms || 'N/A',
            sqft: sale.square_feet ? `${sale.square_feet.toLocaleString()} sqft` : 'N/A'
        };
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }
}

// Create and export singleton instance
window.salesAPIService = new SalesAPIService();