// Frontend constants configuration
const SERVER_CONFIG = {
    // Base URL for the backend server
    BASE_URL: 'http://localhost:3000',
    
    // API endpoints
    API_ENDPOINTS: {
        MESSAGES: '/api/messages',
        FOLDERS: '/api/folders',
        SEARCH: '/api/search',
        HEALTH: '/health'
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SERVER_CONFIG;
}