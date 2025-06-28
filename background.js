chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LOG_MESSAGE') {
    if (window.memoryChatIDB && window.memoryChatIDB.addMessages) {
      window.memoryChatIDB.addMessages([{ text: message.text, timestamp: Date.now() }]);
    }
  } else if (message.type === 'REMOVE_LOG_MESSAGE') {
    if (window.memoryChatIDB && window.memoryChatIDB.removeMessage) {
      // Convert insights array to key string if needed
      const insightsKey = Array.isArray(message.insights) ? message.insights.join('|') : (message.insights || message.text);
      window.memoryChatIDB.removeMessage(insightsKey);
    } else if (window.memoryChatIDB && window.memoryChatIDB.openDB) {
      // Polyfill removeMessage if not present
      window.memoryChatIDB.removeMessage = function(insightsKey) {
        return window.memoryChatIDB.openDB().then(db => {
          return new Promise((resolve, reject) => {
            const tx = db.transaction('chatLogs', 'readwrite');
            const store = tx.objectStore('chatLogs');
            const req = store.delete(insightsKey);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          });
        });
      };
      const insightsKey = Array.isArray(message.insights) ? message.insights.join('|') : (message.insights || message.text);
      window.memoryChatIDB.removeMessage(insightsKey);
    }
  }
}); 