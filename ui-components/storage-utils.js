// Storage Utility Functions
// Contains helper functions for text processing, similarity calculations, and storage operations

// Create a namespace for Memory Chat utilities
window.MemoryChatUtils = window.MemoryChatUtils || {};

// Get current prompt text from ChatGPT interface
function getPromptText() {
  const prompt = document.querySelector('.ProseMirror');
  return prompt ? prompt.innerText.trim() : '';
}

// Get message text from a message element
function getMessageText(messageElement) {
  const textElements = messageElement.querySelectorAll('[data-message-author-role] + div, .markdown, .whitespace-pre-wrap');
  let text = '';
  textElements.forEach(el => {
    if (el.textContent && el.textContent.trim()) {
      text += el.textContent.trim() + '\n';
    }
  });
  return text.trim();
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

// Create a progress toast with progress bar
function createProgressToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 20px;
    border-radius: 8px;
    color: white;
    font-weight: bold;
    z-index: 10002;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #17a2b8;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    min-width: 300px;
  `;

  const messageDiv = document.createElement('div');
  messageDiv.textContent = message;
  messageDiv.style.marginBottom = '8px';

  const progressContainer = document.createElement('div');
  progressContainer.style.cssText = `
    width: 100%;
    height: 6px;
    background: rgba(255,255,255,0.3);
    border-radius: 3px;
    overflow: hidden;
  `;

  const progressBar = document.createElement('div');
  progressBar.style.cssText = `
    height: 100%;
    background: white;
    width: 0%;
    transition: width 0.3s ease;
  `;

  progressContainer.appendChild(progressBar);
  toast.appendChild(messageDiv);
  toast.appendChild(progressContainer);

  // Store progress bar reference
  toast.progressBar = progressBar;
  toast.messageDiv = messageDiv;

  document.body.appendChild(toast);
  return toast;
}

// Update progress toast
function updateProgressToast(toast, current, total, message) {
  if (toast && toast.progressBar && toast.messageDiv) {
    const percentage = (current / total) * 100;
    toast.progressBar.style.width = `${percentage}%`;
    toast.messageDiv.textContent = message;
  }
}

// Remove progress toast
function removeProgressToast(toast) {
  if (toast && toast.parentNode) {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }
}

// Export functions to the MemoryChatUtils namespace
window.MemoryChatUtils.getPromptText = getPromptText;
window.MemoryChatUtils.getMessageText = getMessageText;
window.MemoryChatUtils.showFeedback = showFeedback;
window.MemoryChatUtils.createProgressToast = createProgressToast;
window.MemoryChatUtils.updateProgressToast = updateProgressToast;
window.MemoryChatUtils.removeProgressToast = removeProgressToast;

// Also export to global scope for backward compatibility (but use namespace as primary)
window.getPromptText = getPromptText;
window.getMessageText = getMessageText;
window.showFeedback = showFeedback;
window.createProgressToast = createProgressToast;
window.updateProgressToast = updateProgressToast;
window.removeProgressToast = removeProgressToast;

// UUID management for user identification
async function getOrCreateUserUUID() {
  return new Promise((resolve, reject) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['userUUID'], function(result) {
        if (result.userUUID) {
          resolve(result.userUUID);
        } else {
          const uuid = generateUUID();
          chrome.storage.local.set({ userUUID: uuid }, function() {
            resolve(uuid);
          });
        }
      });
    } else if (typeof localStorage !== 'undefined') {
      let uuid = localStorage.getItem('userUUID');
      if (uuid) {
        resolve(uuid);
      } else {
        uuid = generateUUID();
        localStorage.setItem('userUUID', uuid);
        resolve(uuid);
      }
    } else {
      reject('No storage available');
    }
  });
}

function generateUUID() {
  // RFC4122 version 4 compliant UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Add all user and assistant messages of the current conversation to memory.
 * This will extract all messages from the DOM with data-message-author-role 'user' or 'assistant',
 * and POST them to the backend one by one, showing progress and feedback.
 */
async function addFullChatToLog() {
  // Select all message elements with a data-message-author-role attribute
  const messages = Array.from(document.querySelectorAll('[data-message-author-role]'));
  // Only keep user and assistant messages
  const filtered = messages.filter(msg => {
    const role = msg.getAttribute('data-message-author-role');
    return role === 'user' || role === 'assistant';
  });
  if (filtered.length === 0) {
    if (window.showFeedback) window.showFeedback('No user or assistant messages found in this conversation.', 'error');
    return;
  }

  // Extract text for each message
  const messageTexts = filtered.map(msg => window.MemoryChatUtils.getMessageText(msg)).filter(Boolean);
  if (messageTexts.length === 0) {
    if (window.showFeedback) window.showFeedback('No message text found in user/assistant messages.', 'error');
    return;
  }

  // Deduplicate messages
  const uniqueMessages = Array.from(new Set(messageTexts));

  // Show progress toast
  const progressToast = window.MemoryChatUtils.createProgressToast('Adding chat messages to memory...');

  let imported = 0, skipped = 0, processed = 0;
  const batchSize = 5;
  const userUUID = await getOrCreateUserUUID();

  async function processBatch(startIdx) {
    if (startIdx >= uniqueMessages.length) {
      window.MemoryChatUtils.updateProgressToast(progressToast, 1, 1, `Done! Imported ${imported}, skipped ${skipped}.`);
      setTimeout(() => window.MemoryChatUtils.removeProgressToast(progressToast), 1200);
      if (window.showFeedback) window.showFeedback(`Added ${imported} new messages, skipped ${skipped} duplicates.`, 'success');
      if (window.renderStorageTab) window.renderStorageTab();
      return;
    }
    const batch = uniqueMessages.slice(startIdx, startIdx + batchSize);
    try {
      const promises = batch.map(async (text) => {
        try {
          const res = await fetch(`${SERVER_CONFIG.BASE_URL}${SERVER_CONFIG.API_ENDPOINTS.MESSAGES}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: text,
              timestamp: Date.now(),
              userUUID: userUUID
            })
          });
          if (res.ok) {
            return { success: true, duplicate: false };
          } else if (res.status === 409) {
            return { success: true, duplicate: true };
          } else {
            return { success: false, error: res.statusText };
          }
        } catch (error) {
          return { success: false, error: error.message };
        }
      });
      const results = await Promise.all(promises);
      results.forEach(result => {
        if (result.success) {
          if (result.duplicate) skipped++;
          else imported++;
        }
      });
      processed += batch.length;
      window.MemoryChatUtils.updateProgressToast(progressToast, processed, uniqueMessages.length, `Processed ${processed} of ${uniqueMessages.length}...`);
      setTimeout(() => processBatch(startIdx + batchSize), 100);
    } catch (err) {
      window.MemoryChatUtils.updateProgressToast(progressToast, 1, 1, 'Error during add: ' + (err && err.message ? err.message : err));
      setTimeout(() => window.MemoryChatUtils.removeProgressToast(progressToast), 2000);
      if (window.showFeedback) window.showFeedback('Error during add: ' + (err && err.message ? err.message : err), 'error');
    }
  }
  processBatch(0);
}

/**
 * Clear all logs and folders for the current user after confirmation.
 * Calls the backend /api/clear-all endpoint.
*/
async function clearAllLogs() {
  if (!confirm('Are you sure you want to delete ALL your messages and folders? This cannot be undone.')) {
    return;
  }
  const progressToast = window.MemoryChatUtils.createProgressToast('Clearing all logs and folders...');
  try {
    const userUUID = await getOrCreateUserUUID();
    const res = await fetch(`${SERVER_CONFIG.BASE_URL}/api/clear-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userUUID })
    });
    window.MemoryChatUtils.removeProgressToast(progressToast);
    if (res.ok) {
      const data = await res.json();
      if (window.showFeedback) window.showFeedback(`Deleted ${data.deletedMessages} messages and ${data.deletedFolders} folders.`, 'success');
      if (window.renderStorageTab) window.renderStorageTab();
    } else {
      const err = await res.json();
      if (window.showFeedback) window.showFeedback('Failed to clear logs: ' + (err.error || res.statusText), 'error');
    }
  } catch (error) {
    window.MemoryChatUtils.removeProgressToast(progressToast);
    if (window.showFeedback) window.showFeedback('Error clearing logs: ' + error.message, 'error');
  }
}

// Export to namespace and global scope
window.MemoryChatUtils.addFullChatToLog = addFullChatToLog;
window.addFullChatToLog = addFullChatToLog;
window.MemoryChatUtils.clearAllLogs = clearAllLogs;
window.clearAllLogs = clearAllLogs;
