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
    console.log("Selected text for memory:", info.selectionText);
    
    try {
      // Send the selected text to the backend API
      const response = await fetch('http://localhost:3000/api/messages', {
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
        chrome.tabs.sendMessage(tab.id, {
          type: 'SHOW_MEMORY_FEEDBACK',
          message: 'Text added to memory successfully!',
          type: 'success'
        });
      } else {
        const errorData = await response.json();
        chrome.tabs.sendMessage(tab.id, {
          type: 'SHOW_MEMORY_FEEDBACK',
          message: 'Error adding to memory: ' + (errorData.error || 'Unknown error'),
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error adding text to memory:', error);
      chrome.tabs.sendMessage(tab.id, {
        type: 'SHOW_MEMORY_FEEDBACK',
        message: 'Error adding to memory: ' + error.message,
        type: 'error'
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
