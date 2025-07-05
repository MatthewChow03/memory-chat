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
    /* Sidebar styles */
    #memory-chat-sidebar {
      background: #181a20;
      color: #b2f7ef;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 60px;
      max-width: 120px;
      width: 80px;
      height: 100%;
      border-right: 1.5px solid #23272f;
      z-index: 1;
    }
    #memory-chat-sidebar .sidebar-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 12px 0 8px 0;
      border-radius: 10px;
      margin-bottom: 4px;
      font-size: 18px;
      color: #b2f7ef;
      background: none;
      transition: background 0.15s, color 0.15s;
    }
    #memory-chat-sidebar .sidebar-btn.active,
    #memory-chat-sidebar .sidebar-btn:hover {
      background: #23272f;
      color: #b2f7ef;
    }
    #memory-chat-sidebar .sidebar-icon {
      font-size: 22px;
      margin-bottom: 2px;
    }
    #memory-chat-sidebar .sidebar-label {
      font-size: 12px;
      color: #b2b8c2;
      margin-top: 2px;
      letter-spacing: 0.01em;
    }
    #memory-chat-sidebar .sidebar-btn.active .sidebar-label {
      color: #b2f7ef;
      font-weight: bold;
    }
    /* Main area styles */
    #memory-chat-main {
      background: #23272f;
      color: #f3f6fa;
      display: flex;
      flex-direction: column;
      height: 100%;
      min-width: 0;
      width: 100%;
    }
    #memory-chat-storage.memory-chat-dark #memory-chat-main {
      background: #23272f;
      color: #f3f6fa;
    }
    #memory-chat-storage:not(.memory-chat-dark) #memory-chat-main {
      background: #f8f9fa;
      color: #1a1a1a;
    }
    /* In-content tabs */
    .search-tabs {
      border-bottom: 1.5px solid #2c2f36;
      margin-bottom: 0;
    }
    .search-tab-btn {
      background: none;
      border: none;
      font-size: 16px;
      font-weight: bold;
      color: #888;
      padding: 8px 20px;
      border-radius: 8px 8px 0 0;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .search-tab-btn.active,
    .search-tab-btn:focus,
    .search-tab-btn:hover {
      background: #23272f;
      color: #b2f7ef;
    }
    /* Search bar */
    .search-bar-container input {
      background: #181a20;
      color: #f3f6fa;
      border: 1px solid #2c2f36;
      border-radius: 8px;
      font-size: 15px;
      padding: 12px 16px;
      width: 100%;
      outline: none;
      transition: border 0.15s;
    }
    .search-bar-container input:focus {
      border: 1.5px solid #b2f7ef;
    }
    /* Bulk actions */
    .bulk-actions button {
      font-size: 15px;
      font-weight: bold;
      border: none;
      border-radius: 24px;
      padding: 10px 32px;
      margin: 0 4px;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .bulk-actions #add-to-prompt-btn {
      background: #b2f7ef;
      color: #222;
    }
    .bulk-actions #deselect-all-btn {
      background: #23272f;
      color: #b2f7ef;
    }
    .bulk-actions #add-to-prompt-btn:hover {
      background: #c2f7cb;
    }
    .bulk-actions #deselect-all-btn:hover {
      background: #181a20;
    }
    /* Responsive layout */
    @media (max-width: 700px) {
      #memory-chat-storage {
        width: 100vw !important;
        height: 100vh !important;
        min-width: 0 !important;
        min-height: 0 !important;
        border-radius: 0 !important;
      }
      #memory-chat-sidebar {
        min-width: 48px;
        width: 48px;
        padding: 8px 0;
      }
      #memory-chat-main {
        padding: 0;
      }
      .search-header, #search-results-container {
        padding: 12px !important;
      }
    }
  `;
  document.head.appendChild(style);
}

// Export function for use in other modules
window.injectStorageStyles = injectStorageStyles;
