// Main content script - orchestrates all components

// Listen for storage changes to update the storage UI
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.chatLogs) {
    const storageUI = document.getElementById('memory-chat-storage');
    if (storageUI && storageUI.style.display !== 'none') {
      loadAndDisplayLogs();
    }
  }
});

// Update observer callback to also add the clear button and storage button
function addLogButtonsAndClear() {
  addLogButtons();
  addFolderButtons();
  addStorageButton();
  createStorageUI();
}

const observer = new MutationObserver(addLogButtonsAndClear);
observer.observe(document.body, { childList: true, subtree: true });
addLogButtonsAndClear();

// Forward log requests to the extension
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'MEMORY_CHAT_LOG') {
    chrome.runtime.sendMessage({ type: 'LOG_MESSAGE', text: event.data.text });
  }
}); 