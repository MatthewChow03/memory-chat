// Context menu handler for all websites
// This script handles feedback messages from the background script when users add text to memory via context menu

// Handle feedback messages from background script (for context menu actions)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SHOW_MEMORY_FEEDBACK') {
    // Create and show feedback notification
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
      background: ${message.type === 'success' ? '#28a745' : '#dc3545'};
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      max-width: 300px;
      word-wrap: break-word;
    `;
    feedback.textContent = message.message;
    document.body.appendChild(feedback);

    // Animate out after 3 seconds
    setTimeout(() => {
      feedback.style.opacity = '0';
      feedback.style.transform = 'translateX(100%)';
      feedback.style.transition = 'opacity 0.3s, transform 0.3s';
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.parentNode.removeChild(feedback);
        }
      }, 300);
    }, 3000);
  }
}); 