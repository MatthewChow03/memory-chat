// Context menu handler for all websites
// This script handles feedback messages from the background script when users add text to memory via context menu

// Handle feedback messages from background script (for context menu actions)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SHOW_MEMORY_FEEDBACK') {
    // Create and show feedback notification
    const feedback = document.createElement('div');
    feedback.id = 'memory-chat-feedback';
    feedback.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      padding: 12px 20px !important;
      border-radius: 8px !important;
      color: white !important;
      font-weight: bold !important;
      z-index: 999999 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      background: ${message.feedbackType === 'success' ? '#28a745' : '#dc3545'} !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
      max-width: 300px !important;
      word-wrap: break-word !important;
      opacity: 1 !important;
      transform: translateX(0) !important;
      transition: opacity 0.3s ease, transform 0.3s ease !important;
      pointer-events: none !important;
    `;
    feedback.textContent = message.message;
    
    // Remove any existing feedback notifications
    const existingFeedback = document.getElementById('memory-chat-feedback');
    if (existingFeedback) {
      existingFeedback.remove();
    }
    
    document.body.appendChild(feedback);

    // Animate out after 3 seconds
    setTimeout(() => {
      feedback.style.opacity = '0';
      feedback.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.parentNode.removeChild(feedback);
        }
      }, 300);
    }, 3000);
  }
});
