// Main content script - orchestrates all components

// Load all UI components in the correct order
function loadUIComponents() {
  // Load utility functions first (needed by other modules)
  const utilsScript = document.createElement('script');
  utilsScript.src = chrome.runtime.getURL('ui-components/storage-utils.js');
  document.head.appendChild(utilsScript);
  
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

const observer = new MutationObserver(addLogButtonsAndInitialize);
observer.observe(document.body, { childList: true, subtree: true });
addLogButtonsAndInitialize();

// Forward log requests to the extension
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'MEMORY_CHAT_LOG') {
    chrome.runtime.sendMessage({ type: 'LOG_MESSAGE', text: event.data.text });
  }
}); 