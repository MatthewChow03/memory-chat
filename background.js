chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LOG_MESSAGE') {
    if (window.memoryChatIDB && window.memoryChatIDB.addMessages) {
      window.memoryChatIDB.addMessages([{ text: message.text, timestamp: Date.now() }]);
    }
  } else if (message.type === 'REMOVE_LOG_MESSAGE') {
    if (window.memoryChatIDB && window.memoryChatIDB.removeMessage) {
      window.memoryChatIDB.removeMessage(message.text);
    } else if (window.memoryChatIDB && window.memoryChatIDB.openDB) {
      // Polyfill removeMessage if not present
      window.memoryChatIDB.removeMessage = function(text) {
        return window.memoryChatIDB.openDB().then(db => {
          return new Promise((resolve, reject) => {
            const tx = db.transaction('chatLogs', 'readwrite');
            const store = tx.objectStore('chatLogs');
            const req = store.delete(text);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          });
        });
      };
      window.memoryChatIDB.removeMessage(message.text);
    }
  }
}); 