// Storage Styles Module
// Handles all CSS injection and styling for the storage UI

// Inject storage UI styles
function injectStorageStyles() {
  if (document.getElementById('memory-chat-storage-style')) return;
  
  const style = document.createElement('style');
  style.id = 'memory-chat-storage-style';
  style.textContent = `
    .storage-log-content.clamped {
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: pre-line;
      max-height: 5.6em;
    }
    .storage-log-content.expanded {
      display: block;
      max-height: none;
      overflow: visible;
    }
    .folder-message-content.clamped {
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: pre-line;
      max-height: 5.6em;
    }
    .folder-message-content.expanded {
      display: block;
      max-height: none;
      overflow: visible;
    }
    /* Custom scrollbar for storage UI */
    #memory-chat-tab-content::-webkit-scrollbar {
      width: 12px;
      background: #f4f6fa;
      border-radius: 8px;
    }
    #memory-chat-tab-content::-webkit-scrollbar-thumb {
      background: #e1e5e9;
      border-radius: 8px;
    }
    #memory-chat-tab-content::-webkit-scrollbar-button:vertical:increment {
      height: 18px !important;
      margin-bottom: 18px !important; /* Move up the bottom arrow */
    }
    #memory-chat-tab-content::-webkit-scrollbar-button:vertical:decrement {
      height: 18px !important;
      margin-top: 2px !important;
    }
    #memory-chat-tab-content::-webkit-scrollbar-corner {
      background: transparent;
    }
  `;
  document.head.appendChild(style);
}

// Export function for use in other modules
window.injectStorageStyles = injectStorageStyles; 