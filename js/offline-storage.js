// Offline Storage Handler
// Provides local storage fallback when Supabase is unavailable

class OfflineStorage {
    constructor() {
        this.storageKey = 'portfolio_simulator_offline';
        this.pendingSyncKey = 'portfolio_simulator_pending_sync';
    }
    
    // Check if we're in offline mode
    isOffline() {
        return !navigator.onLine || window.simulationAPI?.connectionStatus === 'error';
    }
    
    // Save simulation data locally
    saveSimulation(simulationId, data) {
        try {
            const offline = this.getOfflineData();
            offline.simulations[simulationId] = {
                ...data,
                lastUpdated: new Date().toISOString(),
                isOffline: true
            };
            this.setOfflineData(offline);
            return true;
        } catch (error) {
            console.error('Failed to save offline:', error);
            return false;
        }
    }
    
    // Save phase data locally
    savePhase(simulationId, phase) {
        try {
            const offline = this.getOfflineData();
            if (!offline.phases[simulationId]) {
                offline.phases[simulationId] = [];
            }
            
            // Add or update phase
            const existingIndex = offline.phases[simulationId].findIndex(p => p.id === phase.id);
            if (existingIndex >= 0) {
                offline.phases[simulationId][existingIndex] = phase;
            } else {
                offline.phases[simulationId].push(phase);
            }
            
            // Mark for sync
            this.markForSync('phase', phase);
            
            this.setOfflineData(offline);
            return true;
        } catch (error) {
            console.error('Failed to save phase offline:', error);
            return false;
        }
    }
    
    // Get simulation from local storage
    getSimulation(simulationId) {
        const offline = this.getOfflineData();
        return offline.simulations[simulationId] || null;
    }
    
    // Get phases from local storage
    getPhases(simulationId) {
        const offline = this.getOfflineData();
        return offline.phases[simulationId] || [];
    }
    
    // Get all offline simulations
    getAllSimulations(userEmail) {
        const offline = this.getOfflineData();
        return Object.values(offline.simulations)
            .filter(sim => sim.user_email === userEmail)
            .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    }
    
    // Mark item for sync when connection returns
    markForSync(type, data) {
        try {
            const pending = this.getPendingSync();
            const item = {
                id: `${type}_${Date.now()}_${Math.random()}`,
                type,
                data,
                timestamp: new Date().toISOString(),
                attempts: 0
            };
            pending.push(item);
            localStorage.setItem(this.pendingSyncKey, JSON.stringify(pending));
        } catch (error) {
            console.error('Failed to mark for sync:', error);
        }
    }
    
    // Get items pending sync
    getPendingSync() {
        try {
            const data = localStorage.getItem(this.pendingSyncKey);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }
    
    // Sync offline data when connection returns
    async syncOfflineData() {
        if (!window.simulationAPI || this.isOffline()) {
            return { success: false, message: 'Cannot sync while offline' };
        }
        
        const pending = this.getPendingSync();
        const results = { success: 0, failed: 0, errors: [] };
        
        for (const item of pending) {
            try {
                item.attempts++;
                
                switch (item.type) {
                    case 'simulation':
                        const simResult = await window.simulationAPI.createSimulation(item.data);
                        if (!simResult.error) {
                            // Update local ID mapping
                            this.updateLocalId(item.data.id, simResult.data.id);
                            results.success++;
                        } else {
                            throw simResult.error;
                        }
                        break;
                        
                    case 'phase':
                        const phaseResult = await window.simulationAPI.addPhase(
                            item.data.simulation_id,
                            item.data
                        );
                        if (!phaseResult.error) {
                            results.success++;
                        } else {
                            throw phaseResult.error;
                        }
                        break;
                }
                
                // Remove from pending if successful
                this.removePendingItem(item.id);
                
            } catch (error) {
                results.failed++;
                results.errors.push({ item, error });
                
                // Keep in pending for retry if not too many attempts
                if (item.attempts >= 3) {
                    this.removePendingItem(item.id);
                }
            }
        }
        
        // Clean up synced data from offline storage
        if (results.success > 0) {
            this.cleanupSyncedData();
        }
        
        return results;
    }
    
    // Update local ID references after successful sync
    updateLocalId(oldId, newId) {
        const offline = this.getOfflineData();
        
        // Update simulation ID
        if (offline.simulations[oldId]) {
            offline.simulations[newId] = offline.simulations[oldId];
            offline.simulations[newId].id = newId;
            delete offline.simulations[oldId];
        }
        
        // Update phases simulation_id
        if (offline.phases[oldId]) {
            offline.phases[newId] = offline.phases[oldId].map(phase => ({
                ...phase,
                simulation_id: newId
            }));
            delete offline.phases[oldId];
        }
        
        this.setOfflineData(offline);
    }
    
    // Remove item from pending sync
    removePendingItem(itemId) {
        const pending = this.getPendingSync();
        const filtered = pending.filter(item => item.id !== itemId);
        localStorage.setItem(this.pendingSyncKey, JSON.stringify(filtered));
    }
    
    // Clean up synced data
    cleanupSyncedData() {
        const offline = this.getOfflineData();
        
        // Remove simulations that have been synced
        Object.keys(offline.simulations).forEach(id => {
            if (!offline.simulations[id].isOffline) {
                delete offline.simulations[id];
            }
        });
        
        this.setOfflineData(offline);
    }
    
    // Get offline data structure
    getOfflineData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : { simulations: {}, phases: {} };
        } catch {
            return { simulations: {}, phases: {} };
        }
    }
    
    // Set offline data
    setOfflineData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save offline data:', error);
            // Try to clear old data if storage is full
            if (error.name === 'QuotaExceededError') {
                this.clearOldData();
                localStorage.setItem(this.storageKey, JSON.stringify(data));
            }
        }
    }
    
    // Clear old offline data to free up space
    clearOldData() {
        const offline = this.getOfflineData();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days old
        
        // Remove old simulations
        Object.keys(offline.simulations).forEach(id => {
            const sim = offline.simulations[id];
            if (new Date(sim.lastUpdated) < cutoffDate) {
                delete offline.simulations[id];
                delete offline.phases[id];
            }
        });
        
        this.setOfflineData(offline);
    }
    
    // Get storage usage info
    getStorageInfo() {
        const offline = JSON.stringify(this.getOfflineData());
        const pending = JSON.stringify(this.getPendingSync());
        
        return {
            offlineSize: offline.length,
            pendingSize: pending.length,
            totalSize: offline.length + pending.length,
            simulationCount: Object.keys(this.getOfflineData().simulations).length,
            pendingCount: this.getPendingSync().length
        };
    }
}

// Create global instance
window.offlineStorage = new OfflineStorage();

// Listen for online/offline events
window.addEventListener('online', async () => {
    console.log('Connection restored, attempting to sync offline data...');
    const results = await window.offlineStorage.syncOfflineData();
    console.log('Sync results:', results);
});

window.addEventListener('offline', () => {
    console.log('Connection lost, switching to offline mode');
    window.connectionStatus?.updateStatus('error', 'Offline mode');
});