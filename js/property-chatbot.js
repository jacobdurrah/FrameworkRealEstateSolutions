// Property Chatbot Interface

// Chatbot configuration
const CHATBOT_CONFIG = {
    welcomeMessage: "Hello! I'm your AI property assistant. I can help you find properties in Detroit that match your investment criteria. Try asking me things like:\n\n• Find properties within 1 mile of [address]\n• Show me houses under $100k in zip code 48205\n• What properties sold recently for over $150k?\n• Compare features of 3-bedroom homes in this area",
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4',
    systemPrompt: `You are a real estate investment assistant for Framework Real Estate Solutions. 
    You help users find properties in Detroit that match specific investment criteria.
    When users ask about properties, extract the following information:
    - Location (address, zip code, or area)
    - Price range
    - Property type
    - Number of bedrooms/bathrooms
    - Square footage
    - Status (for sale, sold, etc.)
    - Radius for location-based searches
    
    Format your response with clear parameters that can be used for property searches.
    Always be helpful and suggest alternative searches if the initial one doesn't yield results.`
};

// Initialize chatbot
class PropertyChatbot {
    constructor() {
        this.messages = [];
        this.isTyping = false;
        this.initializeUI();
        this.showWelcomeMessage();
    }

    initializeUI() {
        // Create chat container
        const chatContainer = document.createElement('div');
        chatContainer.id = 'chatbot-container';
        chatContainer.className = 'chatbot-container';
        chatContainer.innerHTML = `
            <div class="chatbot-header">
                <h3>AI Property Assistant</h3>
                <button class="chatbot-close" onclick="toggleChatbot()">×</button>
            </div>
            <div class="chatbot-messages" id="chatbot-messages"></div>
            <div class="chatbot-input-container">
                <div class="chatbot-typing" id="chatbot-typing" style="display: none;">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <form id="chatbot-form" class="chatbot-form">
                    <input type="text" id="chatbot-input" class="chatbot-input" placeholder="Ask about properties..." />
                    <button type="submit" class="chatbot-send">Send</button>
                </form>
            </div>
        `;

        // Create toggle button
        const toggleButton = document.createElement('button');
        toggleButton.id = 'chatbot-toggle';
        toggleButton.className = 'chatbot-toggle';
        toggleButton.innerHTML = '💬 Chat';
        toggleButton.onclick = () => this.toggleChatbot();

        // Add to page
        document.body.appendChild(chatContainer);
        document.body.appendChild(toggleButton);

        // Add event listeners
        document.getElementById('chatbot-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUserMessage();
        });
    }

    showWelcomeMessage() {
        this.addMessage('bot', CHATBOT_CONFIG.welcomeMessage);
    }

    addMessage(sender, text) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${sender}`;
        
        if (sender === 'bot') {
            messageDiv.innerHTML = `<div class="message-content">${this.formatMessage(text)}</div>`;
        } else {
            messageDiv.innerHTML = `<div class="message-content">${text}</div>`;
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        this.messages.push({ role: sender === 'bot' ? 'assistant' : 'user', content: text });
    }

    formatMessage(text) {
        // Convert line breaks to <br> and format lists
        return text
            .replace(/\n/g, '<br>')
            .replace(/• /g, '<br>• ');
    }

    showTyping() {
        document.getElementById('chatbot-typing').style.display = 'flex';
        this.isTyping = true;
    }

    hideTyping() {
        document.getElementById('chatbot-typing').style.display = 'none';
        this.isTyping = false;
    }

    async handleUserMessage() {
        const input = document.getElementById('chatbot-input');
        const userMessage = input.value.trim();
        
        if (!userMessage) return;
        
        // Add user message
        this.addMessage('user', userMessage);
        input.value = '';
        
        // Show typing indicator
        this.showTyping();
        
        try {
            // Parse user intent
            const searchParams = await this.parseUserIntent(userMessage);
            
            if (searchParams) {
                // Execute property search
                const results = await this.searchProperties(searchParams);
                
                // Format and display results
                this.displaySearchResults(results, searchParams);
            } else {
                // Provide helpful response
                this.addMessage('bot', "I couldn't understand your property search criteria. Please try asking about specific locations, price ranges, or property features.");
            }
        } catch (error) {
            console.error('Chatbot error:', error);
            this.addMessage('bot', "I'm having trouble searching for properties right now. Please try again or use the search form above.");
        } finally {
            this.hideTyping();
        }
    }

    async parseUserIntent(message) {
        try {
            // Use backend API for natural language processing
            const baseUrl = window.location.hostname === 'localhost' 
                ? 'http://localhost:3000/api' 
                : '/api';
                
            const response = await fetch(`${baseUrl}/chatbot/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });
            
            if (!response.ok) {
                throw new Error('Failed to parse message');
            }
            
            const data = await response.json();
            return data.parsedQuery || null;
            
        } catch (error) {
            console.error('Failed to parse with backend, using local parsing:', error);
            
            // Fallback to local pattern matching
            const patterns = {
                radius: /within (\d+) mile(?:s)? (?:of|from) (.+?)(?:\s|$)/i,
                zipCode: /(?:zip|zipcode|zip code)\s*(\d{5})/i,
                price: /(?:under|below|less than|max|maximum)\s*\$?(\d+)k?/i,
                minPrice: /(?:over|above|more than|min|minimum)\s*\$?(\d+)k?/i,
                bedrooms: /(\d+)\s*(?:bed|bedroom|br)/i,
                sold: /sold|recent sales|recently sold/i,
                address: /(?:at|near|around)\s+(\d+\s+[A-Za-z\s]+(?:st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive))/i
            };

            const params = {};

            // Extract radius search
            const radiusMatch = message.match(patterns.radius);
            if (radiusMatch) {
                params.radius = radiusMatch[1];
                params.searchAddress = radiusMatch[2];
                params.needsGeocoding = true;
            }

            // Extract zip code
            const zipMatch = message.match(patterns.zipCode);
            if (zipMatch) {
                params.zipCode = zipMatch[1];
                params.location = zipMatch[1];
            }

            // Extract price constraints
            const maxPriceMatch = message.match(patterns.price);
            if (maxPriceMatch) {
                params.maxPrice = maxPriceMatch[1].endsWith('k') ? 
                    parseInt(maxPriceMatch[1]) * 1000 : 
                    parseInt(maxPriceMatch[1]);
            }

            const minPriceMatch = message.match(patterns.minPrice);
            if (minPriceMatch) {
                params.minPrice = minPriceMatch[1].endsWith('k') ? 
                    parseInt(minPriceMatch[1]) * 1000 : 
                    parseInt(minPriceMatch[1]);
            }

            // Extract bedrooms
            const bedroomMatch = message.match(patterns.bedrooms);
            if (bedroomMatch) {
                params.minBeds = bedroomMatch[1];
            }

            // Check if looking for sold properties
            if (patterns.sold.test(message)) {
                params.status_type = 'RecentlySold';
            }

            // Extract specific address
            const addressMatch = message.match(patterns.address);
            if (addressMatch && !params.searchAddress) {
                params.searchAddress = addressMatch[1];
                params.needsGeocoding = true;
            }

            // Default location if none specified
            if (!params.location && !params.zipCode && !params.searchAddress) {
                params.location = 'Detroit, MI';
            }

            return Object.keys(params).length > 0 ? params : null;
        }
    }

    async searchProperties(params) {
        // If we need to geocode an address for radius search
        if (params.needsGeocoding && params.searchAddress) {
            // For now, we'll use the regular search
            // In production, you'd geocode the address to get lat/lng
            params.location = params.searchAddress + ', Detroit, MI';
        }

        // Use the property API to search
        if (window.propertyAPI && window.propertyAPI.isApiConfigured()) {
            try {
                const searchParams = {
                    location: params.location || params.zipCode,
                    status_type: params.status_type || 'ForSale',
                    minPrice: params.minPrice || '50000',
                    maxPrice: params.maxPrice || '100000',
                    beds_min: params.minBeds
                };

                const results = await window.propertyAPI.searchPropertiesWithAPI(searchParams);
                return results || [];
            } catch (error) {
                console.error('API search error:', error);
                return [];
            }
        } else {
            // Use mock data
            return this.getMockResults(params);
        }
    }

    displaySearchResults(results, params) {
        if (!results || results.length === 0) {
            this.addMessage('bot', "I couldn't find any properties matching your criteria. Try adjusting your search parameters or asking about a different area.");
            return;
        }

        let message = `I found ${results.length} properties matching your criteria:\n\n`;
        
        // Display up to 5 results in chat
        results.slice(0, 5).forEach((property, index) => {
            const address = property.address || property.streetAddress || 'Address not available';
            const price = property.price ? `$${property.price.toLocaleString()}` : 'Price not available';
            const beds = property.bedrooms || 'N/A';
            const baths = property.bathrooms || 'N/A';
            const sqft = property.livingArea || property.squareFeet || 'N/A';
            
            message += `${index + 1}. ${address}\n`;
            message += `   Price: ${price} | ${beds} bed, ${baths} bath | ${sqft} sqft\n\n`;
        });

        if (results.length > 5) {
            message += `\n...and ${results.length - 5} more properties.`;
        }

        message += "\n\nWould you like me to search for something else or provide more details about any of these properties?";

        this.addMessage('bot', message);

        // Also update the main property results if on property finder page
        if (document.getElementById('resultsContainer')) {
            this.updateMainResults(results);
        }
    }

    updateMainResults(properties) {
        // Update the main property finder results
        const displayProperties = properties.map(prop => {
            return window.propertyAPI ? 
                window.propertyAPI.formatZillowProperty(prop) : 
                prop;
        });
        
        if (window.displayResults) {
            window.displayResults(displayProperties);
        }
    }

    getMockResults(params) {
        // Return mock data for testing
        return [
            {
                address: "12345 Gratiot Ave",
                city: "Detroit",
                state: "MI",
                price: 75000,
                bedrooms: 3,
                bathrooms: 1,
                squareFeet: 1200
            },
            {
                address: "5678 Van Dyke St",
                city: "Detroit", 
                state: "MI",
                price: 85000,
                bedrooms: 4,
                bathrooms: 2,
                squareFeet: 1400
            }
        ];
    }

    toggleChatbot() {
        const container = document.getElementById('chatbot-container');
        const toggle = document.getElementById('chatbot-toggle');
        
        if (container.classList.contains('open')) {
            container.classList.remove('open');
            toggle.style.display = 'block';
        } else {
            container.classList.add('open');
            toggle.style.display = 'none';
        }
    }
}

// Global function to toggle chatbot
function toggleChatbot() {
    if (window.propertyChatbot) {
        window.propertyChatbot.toggleChatbot();
    }
}

// Initialize chatbot when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.propertyChatbot = new PropertyChatbot();
});