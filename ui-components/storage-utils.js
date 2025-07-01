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
window.MemoryChatUtils.cosineSimilarity = cosineSimilarity;
window.MemoryChatUtils.showFeedback = showFeedback;
window.MemoryChatUtils.createProgressToast = createProgressToast;
window.MemoryChatUtils.updateProgressToast = updateProgressToast;
window.MemoryChatUtils.removeProgressToast = removeProgressToast;

// Also export to global scope for backward compatibility (but use namespace as primary)
window.getPromptText = getPromptText;
window.getMessageText = getMessageText;
window.cosineSimilarity = cosineSimilarity;
window.showFeedback = showFeedback;
window.createProgressToast = createProgressToast;
window.updateProgressToast = updateProgressToast;
window.removeProgressToast = removeProgressToast; 