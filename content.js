// Main content script - orchestrates all components

// Initialize insight extraction service
async function initializeInsightExtraction() {
  // Wait for insight extraction service to be available
  let attempts = 0;
  while (!window.insightExtractionService && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (window.insightExtractionService) {
    console.log('Insight extraction service initialized');
    
    // Try to initialize with saved API key
    try {
      const result = await new Promise((resolve) => {
        chrome.storage.local.get({ openaiApiKey: '' }, resolve);
      });
      
      if (result.openaiApiKey && result.openaiApiKey.trim()) {
        console.log('Found saved API key, initializing insight extraction service...');
        await window.insightExtractionService.initialize(result.openaiApiKey);
        console.log('Insight extraction service initialized with saved API key');
      } else {
        console.log('No saved API key found. User will need to enter one in settings.');
      }
    } catch (error) {
      console.warn('Failed to initialize insight extraction service with saved API key:', error);
      // Don't throw the error, just log it - the user can still set the key manually
    }
  } else {
    console.warn('Insight extraction service not available');
  }
}

// Initialize advanced semantic search and update existing embeddings
async function initializeAdvancedSemanticSearch() {
  // Wait for advanced semantic search to be available
  let attempts = 0;
  while (!window.advancedSemanticSearch && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (window.advancedSemanticSearch) {
    console.log('Advanced semantic search initialized');
    
    // Wait for the model to load
    try {
      await window.advancedSemanticSearch.loadEmbedder();
      console.log('Advanced semantic search model loaded successfully');
      
      // Update embeddings for existing messages in the background
      if (window.memoryChatIDB && window.memoryChatIDB.updateEmbeddingsForExistingMessages) {
        try {
          const result = await window.memoryChatIDB.updateEmbeddingsForExistingMessages();
          console.log('Updated embeddings for existing messages:', result);
        } catch (error) {
          console.log('No existing messages to update embeddings for or error occurred:', error.message);
        }
      }
    } catch (error) {
      console.warn('Advanced semantic search model failed to load, falling back to basic search:', error);
    }
  } else {
    console.warn('Advanced semantic search not available');
  }
}

// Update observer callback to add buttons and initialize storage
function addLogButtonsAndInitialize() {
  addLogButtons();
  addFolderButtons();
  
  // Always try to add storage button to ensure it persists
  if (window.addStorageButton) {
    window.addStorageButton();
  }
  
  // Initialize storage system if not already done
  if (window.initializeStorageSystem && !document.getElementById('memory-chat-storage')) {
    window.initializeStorageSystem();
  }
}

// Initialize insight extraction service first
setTimeout(initializeInsightExtraction, 500);

// Initialize advanced semantic search after a short delay
setTimeout(initializeAdvancedSemanticSearch, 1000);

const observer = new MutationObserver(addLogButtonsAndInitialize);
observer.observe(document.body, { childList: true, subtree: true });
addLogButtonsAndInitialize();

// Forward log requests to the extension
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'MEMORY_CHAT_LOG') {
    chrome.runtime.sendMessage({ type: 'LOG_MESSAGE', text: event.data.text });
  }
});

// Periodic check to ensure storage button persists
setInterval(() => {
  const footerActions = document.querySelector('div[data-testid="composer-footer-actions"]');
  if (footerActions && !footerActions.querySelector('.memory-chat-view-btn') && window.addStorageButton) {
    window.addStorageButton();
  }
}, 2000); 