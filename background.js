// Import server configuration
importScripts('constants.js');

// Create context menu on extension installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addToMemory",
    title: "Add to Memory Chat",
    contexts: ["selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "addToMemory" && info.selectionText) {
    
    try {
      // Send the selected text to the backend API
      const response = await fetch(`${SERVER_CONFIG.BASE_URL}${SERVER_CONFIG.API_ENDPOINTS.MESSAGES}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: info.selectionText,
          timestamp: Date.now(),
          source: tab.url,
          title: tab.title
        })
      });

      if (response.ok) {
        // Show success feedback in the active tab
        await chrome.tabs.sendMessage(tab.id, {
          type: 'SHOW_MEMORY_FEEDBACK',
          message: 'Text added to memory successfully!',
          feedbackType: 'success'
        });
      } else {
        const errorData = await response.json();
        await chrome.tabs.sendMessage(tab.id, {
          type: 'SHOW_MEMORY_FEEDBACK',
          message: 'Error adding to memory: ' + (errorData.error || 'Unknown error'),
          feedbackType: 'error'
        });
      }
    } catch (error) {
      console.error('Error adding text to memory:', error);
      await chrome.tabs.sendMessage(tab.id, {
        type: 'SHOW_MEMORY_FEEDBACK',
        message: 'Error adding to memory: ' + error.message,
        feedbackType: 'error'
      });
    }
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LOG_MESSAGE') {
    if (window.memoryChatIDB && window.memoryChatIDB.addMessages) {
      window.memoryChatIDB.addMessages([{ text: message.text, timestamp: Date.now() }]);
    }
  }
});
