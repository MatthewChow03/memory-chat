// Main content script - orchestrates all components

// Update observer callback to add buttons and initialize storage
function addLogButtonsAndInitialize() {
  addLogButtons();
  addFolderButtons();

  // Add multi-select circles to chat messages
  if (window.addMultiSelectCircles) {
    window.addMultiSelectCircles();
  }

  // Always try to add storage button to ensure it persists
  if (window.addStorageButton) {
    window.addStorageButton();
  }

  // Initialize storage system if not already done
  if (window.initializeStorageSystem && !document.getElementById('memory-chat-storage')) {
    window.initializeStorageSystem();
  }
}

const observer = new MutationObserver(addLogButtonsAndInitialize);
observer.observe(document.body, { childList: true, subtree: true });
addLogButtonsAndInitialize();

// Forward log requests to the extension
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'MEMORY_CHAT_LOG') {
    chrome.runtime.sendMessage({ type: 'LOG_MESSAGE', text: event.data.text });
  }
});

// Handle feedback messages from background script (for context menu actions)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SHOW_MEMORY_FEEDBACK') {
    // Use the existing showFeedback function if available
    if (window.showFeedback) {
      window.showFeedback(message.message, message.type);
    } else if (window.MemoryChatUtils && window.MemoryChatUtils.showFeedback) {
      window.MemoryChatUtils.showFeedback(message.message, message.type);
    } else {
      // Fallback feedback implementation
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
        background: ${message.feedbackType === 'success' ? '#28a745' : '#dc3545'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `;
      feedback.textContent = message.message;
      document.body.appendChild(feedback);

      setTimeout(() => {
        feedback.style.opacity = '0';
        feedback.style.transform = 'translateX(100%)';
        feedback.style.transition = 'opacity 0.3s, transform 0.3s';
        setTimeout(() => feedback.remove(), 300);
      }, 3000);
    }
  }
});

// Periodic check to ensure storage button persists
setInterval(() => {
  const footerActions = document.querySelector('div[data-testid="composer-footer-actions"]');
  if (footerActions && !footerActions.querySelector('.memory-chat-view-btn') && window.addStorageButton) {
    window.addStorageButton();
  }
}, 2000);
