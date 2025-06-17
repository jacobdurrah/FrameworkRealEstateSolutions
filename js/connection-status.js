// Connection Status Indicator Component
// Shows the current connection status to Supabase

class ConnectionStatusIndicator {
    constructor() {
        this.statusElement = null;
        this.currentStatus = 'unknown';
        this.init();
    }
    
    init() {
        // Create status element
        this.createStatusElement();
        
        // Listen for status updates
        window.addEventListener('simulationApiStatus', (event) => {
            this.updateStatus(event.detail.status, event.detail.message);
        });
        
        // Check connection periodically
        this.startConnectionMonitor();
    }
    
    createStatusElement() {
        // Create container
        const container = document.createElement('div');
        container.id = 'connection-status';
        container.className = 'connection-status';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 10px 15px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.95);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            z-index: 9999;
            transition: all 0.3s ease;
            cursor: pointer;
        `;
        
        // Create status indicator
        const indicator = document.createElement('div');
        indicator.className = 'status-indicator';
        indicator.style.cssText = `
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #ccc;
            animation: pulse 2s infinite;
        `;
        
        // Create status text
        const text = document.createElement('span');
        text.className = 'status-text';
        text.textContent = 'Checking connection...';
        
        // Create retry button (hidden by default)
        const retryBtn = document.createElement('button');
        retryBtn.className = 'retry-btn';
        retryBtn.textContent = 'Retry';
        retryBtn.style.cssText = `
            padding: 4px 8px;
            border: none;
            border-radius: 4px;
            background: var(--primary-color, #007bff);
            color: white;
            cursor: pointer;
            font-size: 12px;
            display: none;
        `;
        retryBtn.onclick = () => this.retry();
        
        container.appendChild(indicator);
        container.appendChild(text);
        container.appendChild(retryBtn);
        
        // Add click to dismiss when connected
        container.onclick = () => {
            if (this.currentStatus === 'connected') {
                container.style.display = 'none';
                setTimeout(() => {
                    container.style.display = 'flex';
                }, 5000);
            }
        };
        
        document.body.appendChild(container);
        this.statusElement = container;
        
        // Add styles
        this.addStyles();
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
            
            .connection-status.connected {
                background: rgba(40, 167, 69, 0.1);
                border: 1px solid rgba(40, 167, 69, 0.3);
            }
            
            .connection-status.connected .status-indicator {
                background: #28a745;
                animation: none;
            }
            
            .connection-status.error {
                background: rgba(220, 53, 69, 0.1);
                border: 1px solid rgba(220, 53, 69, 0.3);
            }
            
            .connection-status.error .status-indicator {
                background: #dc3545;
                animation: pulse 1s infinite;
            }
            
            .connection-status.connecting {
                background: rgba(255, 193, 7, 0.1);
                border: 1px solid rgba(255, 193, 7, 0.3);
            }
            
            .connection-status.connecting .status-indicator {
                background: #ffc107;
                animation: pulse 1s infinite;
            }
            
            @media (max-width: 768px) {
                .connection-status {
                    bottom: 10px;
                    right: 10px;
                    font-size: 12px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    updateStatus(status, message = '') {
        this.currentStatus = status;
        const indicator = this.statusElement.querySelector('.status-indicator');
        const text = this.statusElement.querySelector('.status-text');
        const retryBtn = this.statusElement.querySelector('.retry-btn');
        
        // Update classes
        this.statusElement.className = `connection-status ${status}`;
        
        // Update text
        switch (status) {
            case 'connected':
                text.textContent = 'Connected';
                retryBtn.style.display = 'none';
                // Auto-hide after 3 seconds when connected
                setTimeout(() => {
                    if (this.currentStatus === 'connected') {
                        this.statusElement.style.opacity = '0.3';
                    }
                }, 3000);
                break;
            case 'error':
                text.textContent = message || 'Connection failed';
                retryBtn.style.display = 'block';
                this.statusElement.style.opacity = '1';
                break;
            case 'connecting':
                text.textContent = 'Reconnecting...';
                retryBtn.style.display = 'none';
                this.statusElement.style.opacity = '1';
                break;
            default:
                text.textContent = 'Checking connection...';
                retryBtn.style.display = 'none';
                this.statusElement.style.opacity = '1';
        }
    }
    
    async retry() {
        this.updateStatus('connecting');
        
        // Try to reinitialize the API
        if (window.simulationAPI) {
            const success = await window.simulationAPI.init(
                window.APP_CONFIG?.SUPABASE_URL,
                window.APP_CONFIG?.SUPABASE_ANON_KEY
            );
            
            if (!success) {
                this.updateStatus('error', 'Failed to reconnect');
            }
        }
    }
    
    startConnectionMonitor() {
        // Check connection every 30 seconds
        setInterval(async () => {
            if (this.currentStatus === 'connected' && window.simulationAPI?.client) {
                try {
                    // Simple ping to check connection
                    const { error } = await window.simulationAPI.client
                        .from('simulations')
                        .select('count')
                        .limit(1);
                    
                    if (error) throw error;
                } catch (error) {
                    console.warn('Connection check failed:', error);
                    this.updateStatus('error', 'Connection lost');
                }
            }
        }, 30000);
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    window.connectionStatus = new ConnectionStatusIndicator();
});