// Storage Utility Functions
// Contains helper functions for text processing, similarity calculations, and storage operations

// Get current prompt text from ChatGPT interface
function getPromptText() {
  const prompt = document.querySelector('.ProseMirror');
  return prompt ? prompt.innerText.trim() : '';
}

// Get message text from a message element
function getMessageText(messageElement) {
  const textElements = messageElement.querySelectorAll('[data-message-author-role] + div, .markdown');
  let text = '';
  textElements.forEach(el => {
    if (el.textContent && el.textContent.trim()) {
      text += el.textContent.trim() + '\n';
    }
  });
  return text.trim();
}

// Calculate cosine similarity between two texts
function cosineSimilarity(text1, text2, allTexts = []) {
  // Simple TF-IDF based similarity
  const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  // Create vocabulary from all texts
  const vocab = new Set();
  [text1, text2, ...allTexts].forEach(text => {
    text.toLowerCase().split(/\s+/).filter(w => w.length > 2).forEach(word => vocab.add(word));
  });
  
  // Calculate TF-IDF vectors
  const vector1 = Array.from(vocab).map(word => {
    const tf = words1.filter(w => w === word).length / words1.length;
    const idf = Math.log(allTexts.length / (allTexts.filter(text => 
      text.toLowerCase().includes(word)).length + 1));
    return tf * idf;
  });
  
  const vector2 = Array.from(vocab).map(word => {
    const tf = words2.filter(w => w === word).length / words2.length;
    const idf = Math.log(allTexts.length / (allTexts.filter(text => 
      text.toLowerCase().includes(word)).length + 1));
    return tf * idf;
  });
  
  // Calculate cosine similarity
  const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  return dotProduct / (magnitude1 * magnitude2);
}

// Add message to storage
function addMessageToStorage(text) {
  chrome.storage.local.get({ chatLogs: [] }, (result) => {
    let chatLogs = result.chatLogs;
    if (!chatLogs.some(log => log.text === text)) {
      chatLogs.push({ text, timestamp: Date.now() });
      chrome.storage.local.set({ chatLogs }, () => {
        // Update UI if storage UI is open
        if (window.renderStorageTab) {
          window.renderStorageTab();
        }
      });
    }
  });
}

// Remove message from storage
function removeMessageFromStorage(text) {
  chrome.storage.local.get({ chatLogs: [] }, (result) => {
    let chatLogs = result.chatLogs;
    chatLogs = chatLogs.filter(log => log.text !== text);
    chrome.storage.local.set({ chatLogs }, () => {
      // Update UI if storage UI is open
      if (window.renderStorageTab) {
        window.renderStorageTab();
      }
    });
  });
}

// Add message to folder
function addMessageToFolder(folderName, messageText, messageElement) {
  chrome.storage.local.get({ folders: {}, chatLogs: [] }, (result) => {
    const folders = result.folders;
    const chatLogs = result.chatLogs;
    
    if (!folders[folderName]) {
      folders[folderName] = [];
    }
    
    const timestamp = Date.now();
    
    // Check if message already exists in folder
    if (!folders[folderName].some(item => item.text === messageText)) {
      folders[folderName].push({ text: messageText, timestamp: timestamp });
      
      // Also add to general log if not already there
      if (!chatLogs.some(log => log.text === messageText)) {
        chatLogs.push({ text: messageText, timestamp: timestamp });
      }
      
      chrome.storage.local.set({ folders: folders, chatLogs: chatLogs }, () => {
        // Update the log button state to show "Remove from Log"
        if (messageElement) {
          const logBtn = messageElement.querySelector('.memory-chat-log-btn');
          if (logBtn) {
            logBtn.textContent = 'Remove from Log';
            logBtn.style.background = '#f7b2b2';
            logBtn.style.color = '#222';
          }
        }
        
        // Show success feedback
        showFeedback('Message added to folder and log!', 'success');
      });
    } else {
      showFeedback('Message already in folder', 'info');
    }
  });
}

// Show feedback message
function showFeedback(message, type) {
  const feedback = document.createElement('div');
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-weight: bold;
    z-index: 10002;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: ${type === 'success' ? '#28a745' : '#17a2b8'};
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  feedback.textContent = message;
  
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.style.opacity = '0';
    feedback.style.transform = 'translateX(100%)';
    feedback.style.transition = 'opacity 0.3s, transform 0.3s';
    setTimeout(() => feedback.remove(), 300);
  }, 2000);
}

// Clear all logs and folders
function clearAllLogs() {
  chrome.storage.local.set({ chatLogs: [], folders: {} }, () => {
    document.querySelectorAll('.memory-chat-log-btn').forEach(b => {
      b.textContent = 'Add to Log';
      b.style.background = 'linear-gradient(90deg, #b2f7ef 0%, #c2f7cb 100%)';
      b.style.color = '#222';
    });
    if (window.renderStorageTab) {
      window.renderStorageTab();
    }
  });
}

// Add full chat to log
function addFullChatToLog() {
  const messages = Array.from(document.querySelectorAll('[data-message-author-role]'));
  const texts = messages.map(msg => getMessageText(msg));
  chrome.storage.local.get({ chatLogs: [] }, (result) => {
    let chatLogs = result.chatLogs;
    let added = false;
    texts.forEach(text => {
      if (!chatLogs.some(log => log.text === text)) {
        chatLogs.push({ text, timestamp: Date.now() });
        added = true;
      }
    });
    chrome.storage.local.set({ chatLogs }, () => {
      document.querySelectorAll('.memory-chat-log-btn').forEach(b => {
        b.textContent = 'Remove from Log';
        b.style.background = '#f7b2b2';
        b.style.color = '#222';
      });
      if (window.renderStorageTab) {
        window.renderStorageTab();
      }
    });
  });
}

// Export functions for use in other modules
window.getPromptText = getPromptText;
window.getMessageText = getMessageText;
window.cosineSimilarity = cosineSimilarity;
window.addMessageToStorage = addMessageToStorage;
window.removeMessageFromStorage = removeMessageFromStorage;
window.addMessageToFolder = addMessageToFolder;
window.showFeedback = showFeedback;
window.clearAllLogs = clearAllLogs;
window.addFullChatToLog = addFullChatToLog; 