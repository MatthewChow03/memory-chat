// Main content script - orchestrates all components

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