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

  // Add sync button to the target div
  if (window.addSyncButton) {
    window.addSyncButton();
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

  // Inject insight into ChatGPT prompt
  if (message.type === 'START_NEW_CHAT_INJECT_INSIGHT') {
    // Wait for the prompt box to be available
    function tryInject() {
      // Only target .ProseMirror for contenteditable prompt
      const promptBox = document.querySelector('.ProseMirror');
      if (promptBox) {
        const preface = 'Here is a useful memory for this conversation:';
        let current = promptBox.innerText.trim();
        let newText = '';
        if (current.includes(preface)) {
          // If preface already exists, add as new memory with separator
          newText = current + `\n---\n${message.insight}`;
        } else {
          // Add preface and first memory
          newText = (current ? current + '\n\n' : '') + preface + '\n\n---\n' + message.insight;
        }
        promptBox.focus();
        promptBox.innerHTML = '';
        // Convert newlines to <br> tags and insert as HTML to preserve formatting
        const formattedText = newText.replace(/\n/g, '<br>');
        promptBox.innerHTML = formattedText;
        // Move cursor to end
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(promptBox);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        return true;
      }
      return false;
    }
    // Try immediately, then retry a few times if not found
    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(() => {
      if (tryInject() || ++attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 400);
  }
});

// Periodic check to ensure storage button persists
setInterval(() => {
  const footerActions = document.querySelector('div[data-testid="composer-footer-actions"]');
  if (footerActions && !footerActions.querySelector('.memory-chat-view-btn') && window.addStorageButton) {
    window.addStorageButton();
  }
}, 2000);
