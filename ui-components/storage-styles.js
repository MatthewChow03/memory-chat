// Storage Styles Module
// Handles all CSS injection and styling for the storage UI

// Inject storage UI styles
function injectStorageStyles() {
  if (document.getElementById('memory-chat-storage-style')) return;

  const style = document.createElement('style');
  style.id = 'memory-chat-storage-style';
  style.textContent = `
    /* Light Theme (default) */
    #memory-chat-storage {
      background: white;
      color: #1a1a1a;
    }
    #memory-chat-storage .storage-tab {
      color: #222;
    }
    #memory-chat-storage h3, #memory-chat-storage h4 {
      color: #1a1a1a;
    }
    /* Dark Theme */
    #memory-chat-storage.memory-chat-dark {
      background: #23272f;
      color: #f3f6fa;
      border-color: #2c2f36;
    }
    #memory-chat-storage.memory-chat-dark .storage-tab {
      color: #f3f6fa;
    }
    #memory-chat-storage.memory-chat-dark h3,
    #memory-chat-storage.memory-chat-dark h4 {
      color: #f3f6fa;
    }
    #memory-chat-storage.memory-chat-dark #memory-chat-tabs {
      border-bottom: 1px solid #2c2f36;
    }
    #memory-chat-storage.memory-chat-dark #memory-chat-tab-content {
      background: #23272f;
      color: #f3f6fa;
    }
    #memory-chat-storage.memory-chat-dark .folder-item {
      background: #23272f !important;
      border-color: #2c2f36 !important;
    }
    #memory-chat-storage.memory-chat-dark .folder-option {
      background: #23272f !important;
      border-color: #2c2f36 !important;
      color: #f3f6fa !important;
    }
    #memory-chat-storage.memory-chat-dark .folder-option:hover {
      background: #2c2f36 !important;
    }
    #memory-chat-storage.memory-chat-dark .storage-log-content,
    #memory-chat-storage.memory-chat-dark .folder-message-content {
      color: #f3f6fa;
    }
    #memory-chat-storage.memory-chat-dark button {
      color: #f3f6fa;
    }
    #memory-chat-storage.memory-chat-dark input,
    #memory-chat-storage.memory-chat-dark textarea {
      background: #23272f;
      color: #f3f6fa;
      border-color: #2c2f36;
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
    #memory-chat-storage.memory-chat-dark #memory-chat-tab-content::-webkit-scrollbar {
      background: #23272f;
    }
    #memory-chat-storage.memory-chat-dark #memory-chat-tab-content::-webkit-scrollbar-thumb {
      background: #2c2f36;
    }
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
    #memory-chat-tab-content::-webkit-scrollbar-button:vertical:increment {
      height: 18px !important;
      margin-bottom: 18px !important;
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
