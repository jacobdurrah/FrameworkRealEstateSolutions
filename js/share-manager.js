/**
 * ShareManager - Handles simulation sharing with database and URL fallback
 * Configured for GitHub Pages + Vercel API architecture
 */

class ShareManager {
    constructor() {
        // Configure API URL based on environment
        if (window.location.hostname === 'localhost') {
            this.apiBaseUrl = 'http://localhost:3000';
        } else if (window.location.hostname === 'frameworkrealestatesolutions.com') {
            // Production: GitHub Pages site using Vercel API
            this.apiBaseUrl = 'https://framework-8jsah7ozp-jacob-durrahs-projects.vercel.app';
        } else {
            // For other environments (Vercel preview, etc)
            this.apiBaseUrl = '';
        }
        
        this.maxUrlLength = 8000; // Browser URL length limit
        this.compressionAvailable = typeof LZString !== 'undefined';
    }

    /**
     * Share a simulation - tries database first, falls back to URL
     */
    async shareSimulation(state = null) {
        // Get current state if not provided
        if (!state) {
            state = this.getCurrentState();
        }

        // Validate state
        if (!this.validateState(state)) {
            throw new Error('Invalid simulation state');
        }

        // Try database save first
        try {
            const dbResult = await this.saveToDatabase(state);
            if (dbResult.success) {
                return {
                    url: dbResult.url,
                    id: dbResult.id,
                    method: 'database'
                };
            }
        } catch (error) {
            console.warn('Database save failed, falling back to URL:', error);
        }

        // Fallback to URL-based sharing
        return this.createUrlShare(state);
    }

    /**
     * Save simulation to database
     */
    async saveToDatabase(state) {
        const response = await fetch(`${this.apiBaseUrl}/api/simulations/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': window.location.origin
            },
            body: JSON.stringify({
                name: state.simulationName || 'Untitled Simulation',
                data: {
                    version: state.version || 'v3',
                    timelineData: state.timelineData || state.timeline,
                    parsedGoal: state.parsedGoal,
                    selectedStrategy: state.selectedStrategy,
                    viewMonth: state.viewMonth || 0,
                    useRealListings: state.useRealListings || false,
                    goalInput: state.goalInput,
                    generatedStrategies: state.generatedStrategies
                }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Database save failed: ${error}`);
        }

        const result = await response.json();
        return {
            success: true,
            id: result.id,
            url: result.url
        };
    }

    /**
     * Create URL-based share
     */
    createUrlShare(state) {
        if (!this.compressionAvailable) {
            throw new Error('LZString compression library not available');
        }

        // Compress state
        const stateJson = JSON.stringify(state);
        const compressed = LZString.compressToEncodedURIComponent(stateJson);
        
        // Generate URL
        const baseUrl = window.location.origin + window.location.pathname;
        const shareUrl = `${baseUrl}?state=${compressed}`;
        
        // Check URL length
        if (shareUrl.length > this.maxUrlLength) {
            throw new Error('Simulation data too large for URL sharing. Please simplify your strategy.');
        }

        return {
            url: shareUrl,
            method: 'url'
        };
    }

    /**
     * Load simulation from ID or URL
     */
    async loadSimulation(idOrUrl) {
        // Check if it's a database ID
        const idMatch = idOrUrl.match(/[?&]id=([a-f0-9-]{36})/);
        if (idMatch) {
            return await this.loadFromDatabase(idMatch[1]);
        }

        // Check if it's a compressed state URL
        const stateMatch = idOrUrl.match(/[?&]state=([^&]+)/);
        if (stateMatch) {
            return this.loadFromUrl(stateMatch[1]);
        }

        // Try to extract ID from current URL
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        const state = urlParams.get('state');

        if (id) {
            return await this.loadFromDatabase(id);
        } else if (state) {
            return this.loadFromUrl(state);
        }

        return null;
    }

    /**
     * Load simulation from database
     */
    async loadFromDatabase(id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/simulations/${id}`, {
                headers: {
                    'Origin': window.location.origin
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load simulation');
            }

            const result = await response.json();
            
            // Add metadata
            result.data.loadedFrom = 'database';
            result.data.simulationId = id;
            result.data.simulationName = result.name;
            
            return result.data;
        } catch (error) {
            console.error('Failed to load from database:', error);
            // Don't throw - let it return null so URL fallback can be tried
            return null;
        }
    }

    /**
     * Load simulation from compressed URL
     */
    loadFromUrl(compressedState) {
        if (!this.compressionAvailable) {
            throw new Error('LZString compression library not available');
        }

        try {
            const stateJson = LZString.decompressFromEncodedURIComponent(compressedState);
            if (!stateJson) {
                throw new Error('Invalid or corrupted share link');
            }

            const state = JSON.parse(stateJson);
            state.loadedFrom = 'url';
            
            return state;
        } catch (error) {
            console.error('Failed to load from URL:', error);
            throw new Error('Invalid share link');
        }
    }

    /**
     * Get current simulation state
     */
    getCurrentState() {
        // This will be overridden by the specific simulator version
        if (typeof serializeV3State === 'function') {
            return serializeV3State();
        }
        
        throw new Error('State serialization not available');
    }

    /**
     * Validate simulation state
     */
    validateState(state) {
        if (!state) return false;
        
        // Check for required fields based on version
        if (state.version === 'v3') {
            return state.timelineData || state.timeline || 
                   (state.parsedGoal && state.selectedStrategy);
        }
        
        // For other versions, just check for timeline
        return !!(state.timelineData || state.timeline);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShareManager;
}