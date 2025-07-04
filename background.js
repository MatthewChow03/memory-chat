// Import server configuration
import './constants.js';
import './utils.js';

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
      const userUUID = await getOrCreateUserUUID();
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
          title: tab.title,
          userUUID
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
  // Handle request to start new chat with insight
  if (message.type === 'START_NEW_CHAT_WITH_INSIGHT') {
    // Get the current active tab and navigate to new chat
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        const tabId = tabs[0].id;
        const currentUrl = tabs[0].url;
        
        // Navigate to new chat (either chatgpt.com or chat.openai.com)
        let newChatUrl;
        if (currentUrl.includes('chatgpt.com')) {
          newChatUrl = 'https://chatgpt.com/';
        } else if (currentUrl.includes('chat.openai.com')) {
          newChatUrl = 'https://chat.openai.com/';
        } else {
          // Default to chatgpt.com if not on a ChatGPT page
          newChatUrl = 'https://chatgpt.com/';
        }
        
        // Navigate to new chat
        chrome.tabs.update(tabId, { url: newChatUrl }, function() {
          // Wait for the page to load, then inject the insight
          function handleTabUpdate(updatedTabId, changeInfo, updatedTab) {
            if (updatedTabId === tabId && changeInfo.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(handleTabUpdate);
              // Wait a bit for the page to fully initialize
              setTimeout(() => {
                chrome.tabs.sendMessage(tabId, {
                  type: 'START_NEW_CHAT_INJECT_INSIGHT',
                  insight: message.insight
                }).catch(error => {
                  console.error('Failed to send message to tab after navigation:', error);
                });
              }, 1500);
            }
          }
          chrome.tabs.onUpdated.addListener(handleTabUpdate);
        });
      }
    });
  }
});
