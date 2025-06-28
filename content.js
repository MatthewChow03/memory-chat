// Main content script - orchestrates all components

// Load all UI components in the correct order
function loadUIComponents() {
  // Load utility functions first (needed by other modules)
  const utilsScript = document.createElement('script');
  utilsScript.src = chrome.runtime.getURL('utils.js');
  document.head.appendChild(utilsScript);
  
  // Load basic semantic search as fallback
  const basicSemanticSearchScript = document.createElement('script');
  basicSemanticSearchScript.src = chrome.runtime.getURL('ui-components/semantic-search.js');
  document.head.appendChild(basicSemanticSearchScript);
  
  // Load advanced semantic search module
  const advancedSemanticSearchScript = document.createElement('script');
  advancedSemanticSearchScript.src = chrome.runtime.getURL('ui-components/advanced-semantic-search.js');
  document.head.appendChild(advancedSemanticSearchScript);
  
  // Load IndexedDB utilities
  const idbScript = document.createElement('script');
  idbScript.src = chrome.runtime.getURL('ui-components/idb-utils.js');
  document.head.appendChild(idbScript);
  
  // Load storage utilities
  const storageUtilsScript = document.createElement('script');
  storageUtilsScript.src = chrome.runtime.getURL('ui-components/storage-utils.js');
  document.head.appendChild(storageUtilsScript);
  
  // Load styles
  const stylesScript = document.createElement('script');
  stylesScript.src = chrome.runtime.getURL('ui-components/storage-styles.js');
  document.head.appendChild(stylesScript);
  
  // Load cards module
  const cardsScript = document.createElement('script');
  cardsScript.src = chrome.runtime.getURL('ui-components/storage-cards.js');
  document.head.appendChild(cardsScript);
  
  // Load folders module
  const foldersScript = document.createElement('script');
  foldersScript.src = chrome.runtime.getURL('ui-components/storage-folders.js');
  document.head.appendChild(foldersScript);
  
  // Load tabs module
  const tabsScript = document.createElement('script');
  tabsScript.src = chrome.runtime.getURL('ui-components/storage-tabs.js');
  document.head.appendChild(tabsScript);
  
  // Load UI module
  const uiScript = document.createElement('script');
  uiScript.src = chrome.runtime.getURL('ui-components/storage-ui.js');
  document.head.appendChild(uiScript);
  
  // Load coordinator last
  const coordinatorScript = document.createElement('script');
  coordinatorScript.src = chrome.runtime.getURL('ui-components/storage-button.js');
  document.head.appendChild(coordinatorScript);
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
  
  // Initialize storage system if not already done
  if (window.initializeStorageSystem && !document.getElementById('memory-chat-storage')) {
    window.initializeStorageSystem();
  }
}

// Load UI components and set up observers
loadUIComponents();

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