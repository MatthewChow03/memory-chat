chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LOG_MESSAGE') {
    chrome.storage.local.get({ chatLogs: [] }, (result) => {
      let chatLogs = result.chatLogs;
      // Prevent duplicates
      if (!chatLogs.some(log => log.text === message.text)) {
        chatLogs.push({ text: message.text, timestamp: Date.now() });
        chrome.storage.local.set({ chatLogs });
      }
    });
  } else if (message.type === 'REMOVE_LOG_MESSAGE') {
    chrome.storage.local.get({ chatLogs: [] }, (result) => {
      const chatLogs = result.chatLogs.filter(log => log.text !== message.text);
      chrome.storage.local.set({ chatLogs });
    });
  }
}); 