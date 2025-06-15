// Parcel API Service
// Handles Detroit parcel data queries via Supabase

class ParcelAPIService {
    constructor() {
        this.supabaseUrl = null;
        this.supabaseKey = null;
        this.client = null;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.initialized = false;
    }

    // Initialize with Supabase credentials
    async init(url, anonKey) {
        if (!url || !anonKey) {
            console.warn('Parcel API: Missing Supabase credentials');
            return false;
        }

        try {
            // Dynamically import Supabase client
            const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
            
            this.supabaseUrl = url;
            this.supabaseKey = anonKey;
            this.client = createClient(url, anonKey);
            this.initialized = true;
            
            console.log('Parcel API initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Parcel API:', error);
            return false;
        }
    }

    // Check if service is ready
    isReady() {
        return this.initialized && this.client !== null;
    }

    // Get from cache if available
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

    // Clear old cache entries
    clearOldCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.cacheTimeout) {
                this.cache.delete(key);
            }
        }
    }

    // Normalize address for matching
    normalizeAddress(address) {
        return (address || '')
            .toUpperCase()
            .replace(/\./g, '')
            .replace(/,/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Get parcel data by address
    async getParcelByAddress(address) {
        if (!this.isReady()) return null;

        const normalizedAddress = this.normalizeAddress(address);
        const cacheKey = `address:${normalizedAddress}`;
        
        // Check cache
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            // Use exact match first for better performance
            let { data, error } = await this.client
                .from('parcels')
                .select('*')
                .eq('address', normalizedAddress)
                .limit(1)
                .maybeSingle();

            // If no exact match, try with ILIKE
            if (!data && !error) {
                const result = await this.client
                    .from('parcels')
                    .select('*')
                    .ilike('address', `${normalizedAddress}%`)
                    .limit(1)
                    .maybeSingle();
                
                data = result.data;
                error = result.error;
            }

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('Error fetching parcel by address:', error);
                return null;
            }

            const result = data ? this.transformParcelData(data) : null;
            this.storeInCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error('Error in getParcelByAddress:', error);
            return null;
        }
    }

    // Search properties by owner name
    async searchByOwner(ownerName) {
        if (!this.isReady() || !ownerName) return [];

        const cacheKey = `owner:${ownerName.toLowerCase()}`;
        
        // Check cache
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const { data, error } = await this.client
                .from('parcels')
                .select('*')
                .ilike('owner_full_name', `%${ownerName}%`)
                .limit(100);

            if (error) {
                console.error('Error searching by owner:', error);
                return [];
            }

            const results = (data || []).map(p => this.transformParcelData(p));
            this.storeInCache(cacheKey, results);
            return results;
        } catch (error) {
            console.error('Error in searchByOwner:', error);
            return [];
        }
    }

    // Search properties by mailing address
    async searchByMailingAddress(mailingAddress) {
        if (!this.isReady() || !mailingAddress) return [];

        const cacheKey = `mailing:${mailingAddress.toLowerCase()}`;
        
        // Check cache
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const { data, error } = await this.client
                .from('parcels')
                .select('*')
                .ilike('owner_full_mailing_address', `%${mailingAddress}%`)
                .limit(100);

            if (error) {
                console.error('Error searching by mailing address:', error);
                return [];
            }

            const results = (data || []).map(p => this.transformParcelData(p));
            this.storeInCache(cacheKey, results);
            return results;
        } catch (error) {
            console.error('Error in searchByMailingAddress:', error);
            return [];
        }
    }

    // Search properties by neighborhood
    async searchByNeighborhood(neighborhood) {
        if (!this.isReady() || !neighborhood) return [];

        const cacheKey = `neighborhood:${neighborhood.toLowerCase()}`;
        
        // Check cache
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const { data, error } = await this.client
                .from('parcels')
                .select('*')
                .ilike('neighborhood', `%${neighborhood}%`)
                .limit(200);

            if (error) {
                console.error('Error searching by neighborhood:', error);
                return [];
            }

            const results = (data || []).map(p => this.transformParcelData(p));
            this.storeInCache(cacheKey, results);
            return results;
        } catch (error) {
            console.error('Error in searchByNeighborhood:', error);
            return [];
        }
    }

    // Transform database record to frontend format
    transformParcelData(dbRecord) {
        return {
            address: dbRecord.address,
            zipCode: dbRecord.zip_code,
            parcelId: dbRecord.parcel_id,
            owner: {
                name1: dbRecord.owner_name1,
                name2: dbRecord.owner_name2,
                fullName: dbRecord.owner_full_name || '',
                mailingAddress: dbRecord.owner_mailing_address,
                mailingCity: dbRecord.owner_mailing_city,
                mailingState: dbRecord.owner_mailing_state,
                mailingZip: dbRecord.owner_mailing_zip,
                fullMailingAddress: dbRecord.owner_full_mailing_address || ''
            },
            propertyClass: dbRecord.property_class_description,
            yearBuilt: dbRecord.year_built,
            buildingStyle: dbRecord.building_style,
            totalFloorArea: dbRecord.total_floor_area,
            assessedValue: dbRecord.assessed_value || 0,
            taxableValue: dbRecord.taxable_value || 0,
            taxStatus: dbRecord.tax_status || dbRecord.tax_status_description || null,
            neighborhood: dbRecord.neighborhood,
            ward: dbRecord.ward,
            councilDistrict: dbRecord.council_district,
            totalAcreage: dbRecord.total_acreage,
            lastSale: {
                date: dbRecord.sale_date,
                price: dbRecord.sale_price || 0
            },
            lotSize: {
                frontage: dbRecord.frontage,
                depth: dbRecord.depth
            },
            legalDescription: dbRecord.legal_description
        };
    }

    // Batch load parcel data for multiple addresses
    async batchLoadParcels(addresses) {
        console.group('batchLoadParcels');
        console.log('Input addresses:', addresses);
        console.log('Service ready:', this.isReady());
        
        if (!this.isReady() || !addresses || addresses.length === 0) {
            console.log('Returning empty - service not ready or no addresses');
            console.groupEnd();
            return {};
        }

        const results = {};
        
        // Check cache first
        const uncachedAddresses = [];
        for (const address of addresses) {
            const normalizedAddress = this.normalizeAddress(address);
            const cached = this.getFromCache(`address:${normalizedAddress}`);
            if (cached) {
                console.log(`Found in cache: ${address}`);
                results[address] = cached;
            } else {
                uncachedAddresses.push(address);
            }
        }

        console.log('Uncached addresses:', uncachedAddresses);

        // Load uncached addresses
        if (uncachedAddresses.length > 0) {
            try {
                // Query for all addresses at once using OR conditions
                const normalizedAddresses = uncachedAddresses.map(addr => this.normalizeAddress(addr));
                console.log('Normalized addresses for query:', normalizedAddresses);
                
                // Use in() operator for multiple values instead of or with eq
                const { data, error } = await this.client
                    .from('parcels')
                    .select('*')
                    .in('address', normalizedAddresses);

                console.log('Query result - error:', error);
                console.log('Query result - data count:', data?.length || 0);
                
                if (!error && data) {
                    console.log('Processing', data.length, 'parcels from database');
                    
                    // Process results
                    for (const parcel of data) {
                        const transformed = this.transformParcelData(parcel);
                        const originalAddress = uncachedAddresses.find(addr => 
                            this.normalizeAddress(addr) === this.normalizeAddress(parcel.address)
                        );
                        if (originalAddress) {
                            console.log(`Matched parcel for ${originalAddress}:`, parcel.owner_full_name);
                            results[originalAddress] = transformed;
                            this.storeInCache(`address:${this.normalizeAddress(originalAddress)}`, transformed);
                        } else {
                            console.log(`No match found for parcel address: ${parcel.address}`);
                        }
                    }
                } else if (error) {
                    console.error('Supabase query error:', error);
                }
            } catch (error) {
                console.error('Error in batch load:', error);
            }
        }

        console.log('Final results:', Object.keys(results));
        console.groupEnd();
        return results;
    }

    // Get statistics about the data
    async getStats() {
        if (!this.isReady()) return null;

        try {
            const { count, error } = await this.client
                .from('parcels')
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.error('Error getting stats:', error);
                return null;
            }

            return {
                totalParcels: count || 0,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error in getStats:', error);
            return null;
        }
    }
}

// Create and export singleton instance
window.parcelAPIService = new ParcelAPIService();

// Auto-initialize if config is available
if (window.APP_CONFIG && window.APP_CONFIG.SUPABASE_URL && window.APP_CONFIG.SUPABASE_ANON_KEY) {
    window.parcelAPIService.init(
        window.APP_CONFIG.SUPABASE_URL,
        window.APP_CONFIG.SUPABASE_ANON_KEY
    );
}