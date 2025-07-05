// Storage Tabs Module
// Handles tab management, rendering, and tab-specific content

// Old tab system removed - using sidebar navigation instead

// Old tab system removed - using sidebar navigation instead

// Old relevant tab function removed - using new search system instead

/**
 * Filters out memories that are already included in the prompt text
 * This function checks for text matches between search results and the current prompt
 * 
 * Note: This could be changed from text match to omitting the messages that have had 
 * the plus sign add to prompt button clicked because they shouldn't show up in search 
 * results again. However, that change has many dependencies and the user may edit 
 * the memory after it's been added to the prompt, so text matching is more reliable.
 * 
 * @param {Array} searchResults - Array of search result objects with text/insights properties
 * @param {string} promptText - The current prompt text to check against
 * @returns {Array} Filtered search results excluding those already in the prompt
 */
function filterOutPromptIncludedMemories(searchResults, promptText) {
  if (!promptText || !searchResults || searchResults.length === 0) {
    return searchResults;
  }

  const normalizedPrompt = promptText.toLowerCase().trim();

  return searchResults.filter(result => {
    // Get the memory text - could be in text or insights field
    let memoryText = '';
    if (result.text) {
      memoryText = result.text;
    } else if (result.insights) {
      // Handle both string and array formats for insights
      if (Array.isArray(result.insights)) {
        memoryText = result.insights.join(' ');
      } else {
        memoryText = result.insights;
      }
    }

    if (!memoryText) {
      return true; // Keep results without text
    }

    const normalizedMemory = memoryText.toLowerCase().trim();

    // Check if the memory text is contained within the prompt
    // Use a more sophisticated check to avoid false positives
    const memoryWords = normalizedMemory.split(/\s+/).filter(word => word.length > 3);
    const promptWords = normalizedPrompt.split(/\s+/).filter(word => word.length > 3);

    // If memory has very few words, use exact substring matching
    if (memoryWords.length <= 3) {
      return !normalizedPrompt.includes(normalizedMemory);
    }

    // For longer memories, check if a significant portion of words match
    const matchingWords = memoryWords.filter(word => promptWords.includes(word));
    const matchRatio = matchingWords.length / memoryWords.length;

    // If more than 80% of the memory words are in the prompt, consider it included
    return matchRatio < 0.8;
  });
}

// Old tab functions removed - using new sidebar navigation system instead

// Render folders tab content
async function renderFoldersTab(tabContent) {
  let folders = {};
  try {
    const res = await fetch(`${SERVER_CONFIG.BASE_URL}/api/folders?userUUID=${await getOrCreateUserUUID()}`);
    if (res.ok) {
      folders = await res.json();
    } else {
      tabContent.innerHTML = '<div style="text-align:center;color:#ff6b6b;padding:20px;">Failed to load folders from backend</div>';
      return;
    }
  } catch (error) {
    tabContent.innerHTML = `<div style="text-align:center;color:#ff6b6b;padding:20px;">Error loading folders: ${error.message}</div>`;
    return;
  }
  const storageUI = document.getElementById('memory-chat-storage');
  const isDark = storageUI && storageUI.classList.contains('memory-chat-dark');

  if (folders.length === 0) {
    tabContent.innerHTML = `
      <div style="text-align:center;${isDark ? 'color:#fff;' : 'color:#23272f;'}margin-bottom:20px;">No folders created yet</div>
      <button id="create-folder-btn" style="display:block;margin:0 auto;padding:12px 28px;background:#fff;border:none;border-radius:10px;color:${isDark ? '#23272f' : '#23272f'};font-weight:600;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.08);cursor:pointer;transition:background 0.15s, color 0.15s;">+ Create New Folder</button>
    `;
    const createBtn = tabContent.querySelector('#create-folder-btn');
    createBtn.onclick = async () => {
      const folderName = prompt('Enter folder name:');
      if (folderName && folderName.trim()) {
        const folderDescription = prompt('Enter a description for this folder (optional, 1 line):') || '';
        let autoPopulate = false;
        autoPopulate = confirm('Do you want to auto-populate this folder?');
        try {
          const res = await fetch(`${SERVER_CONFIG.BASE_URL}/api/folders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: folderName.trim(), description: folderDescription.trim(), userUUID: await getOrCreateUserUUID(), autoPopulate })
          });
          if (!res.ok) throw new Error('Failed to create folder');
          renderFoldersTab(tabContent);
        } catch (error) {
          tabContent.innerHTML = `<div style=\\"text-align:center;color:#ff6b6b;padding:20px;\\\">Error creating folder: ${error.message}</div>`;
        }
      }
    };
  } else {
    let foldersHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h4 style="margin:0;${isDark ? 'color:#b2f7ef;' : 'color:#23272f;'}">Your Folders</h4>
        <button id="create-folder-btn" style="padding:10px 24px;background:#fff;border:none;border-radius:10px;color:${isDark ? '#23272f' : '#23272f'};font-weight:600;font-size:15px;box-shadow:0 2px 8px rgba(0,0,0,0.08);cursor:pointer;transition:background 0.15s, color 0.15s;">+ New Folder</button>
      </div>
    `;
    folders.forEach(folder => {
      const messageCount = folder.messageCount || 0;
      const description = (folder.description || '').split('\n')[0]; // 1-line snippet
      foldersHTML += `
        <div class="folder-item" data-folder="${folder.name}" data-folder-id="${folder.folderID}" style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:${isDark ? '#23272f' : '#f8f9fa'};border:1px solid ${isDark ? '#2c2f36' : '#e1e5e9'};border-radius:8px;margin-bottom:8px;cursor:pointer;">
          <div style="flex:1;">
            <div style="font-weight:bold;${isDark ? 'color:#f3f6fa;' : 'color:#1a1a1a;'}">${folder.name}</div>
            <div style="font-size:12px;${isDark ? 'color:#b2b8c2;' : 'color:#888;'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:350px;">${description}</div>
            <div style="font-size:12px;${isDark ? 'color:#b2b8c2;' : 'color:#888;'}">${messageCount} message${messageCount !== 1 ? 's' : ''}</div>
          </div>
          <div class="folder-open-button" style="display:flex;gap:8px;">
            <button class="folder-delete-btn" data-folder="${folder.name}" data-folder-id="${folder.folderID}" style="background:${isDark ? '#3a2323' : '#f7e6e6'};border:none;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;color:${isDark ? '#ffb2b2' : '#d32f2f'};" title="Delete folder">×</button>
          </div>
        </div>
      `;
    });
    tabContent.innerHTML = foldersHTML;
    // Setup folder event handlers
    setupFolderEventHandlers(tabContent, folders);
    // Add create folder event handler
    const createBtn = tabContent.querySelector('#create-folder-btn');
    createBtn.onclick = async () => {
      const folderName = prompt('Enter folder name:');
      if (folderName && folderName.trim()) {
        const folderDescription = prompt('Enter a description for this folder (optional, 1 line):') || '';
        let autoPopulate = false;
        autoPopulate = confirm('Do you want to auto-populate this folder?');
        try {
          const res = await fetch(`${SERVER_CONFIG.BASE_URL}/api/folders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: folderName.trim(), description: folderDescription.trim(), userUUID: await getOrCreateUserUUID(), autoPopulate })
          });
          if (!res.ok) throw new Error('Failed to create folder');
          renderFoldersTab(tabContent);
        } catch (error) {
          tabContent.innerHTML = `<div style=\\"text-align:center;color:#ff6b6b;padding:20px;\\\">Error creating folder: ${error.message}</div>`;
        }
      }
    };
    // Add delete folder event handlers
    tabContent.querySelectorAll('.folder-delete-btn').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const folderId = btn.dataset.folderId;
        const folderName = btn.dataset.folder;
        if (confirm(`Delete folder '${folderName}'? This cannot be undone.`)) {
          try {
            const res = await fetch(`${SERVER_CONFIG.BASE_URL}${SERVER_CONFIG.API_ENDPOINTS.FOLDERS}/delete`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: folderId, userUUID: await getOrCreateUserUUID() })
            });
            if (!res.ok) throw new Error('Failed to delete folder');
            renderFoldersTab(tabContent);
          } catch (error) {
            tabContent.innerHTML = `<div style=\"text-align:center;color:#ff6b6b;padding:20px;\">Error deleting folder: ${error.message}</div>`;
          }
        }
      };
    });
  }
}

// Render settings tab content
function renderSettingsTab(tabContent) {
  // Add theme toggle button (REMOVED, now in sidebar)
  chrome.storage.local.get({ storageTheme: 'light' }, (result) => {
    const isDark = result.storageTheme === 'dark';

    tabContent.innerHTML = `
      <div style="margin-bottom: 24px;">
        <div style="margin-bottom:8px;font-weight:bold;color:${isDark ? '#fff' : '#222'};">Backend Status</div>
        <div style="padding:12px;background:${isDark ? '#2a2e36' : '#f8f9fa'};border-radius:8px;border:1px solid ${isDark ? '#444' : '#ddd'};">
          <div style="font-size:14px;color:${isDark ? '#b2b8c2' : '#666'};">
            <strong>Insight Generation:</strong> Handled by backend server<br>
            <strong>API Key:</strong> Configured on backend (no frontend key needed)<br>
            <strong>Server:</strong> ${SERVER_CONFIG.BASE_URL}
          </div>
        </div>
      </div>
      <button id="clear-logs-btn" style="display:block;margin:0 0 16px 0;padding:10px 28px;background:${isDark ? '#3a3f4b' : '#f7d6b2'};border:none;border-radius:10px;color:${isDark ? '#fff' : '#222'};font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.08);cursor:pointer;font-size:16px;text-align:left;">Clear All Logs</button>
      <button id="add-full-chat-btn" style="display:block;margin:0 0 16px 0;padding:10px 28px;background:${isDark ? '#2e4a3a' : '#b2f7ef'};border:none;border-radius:10px;color:${isDark ? '#fff' : '#222'};font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.08);cursor:pointer;font-size:16px;text-align:left;">Add Full Chat to Log</button>
      <button id="auto-categorize-btn" style="display:block;margin:0 0 16px 0;padding:10px 28px;background:${isDark ? '#2e3a4a' : '#b2c7f7'};border:none;border-radius:10px;color:${isDark ? '#fff' : '#222'};font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.08);cursor:pointer;font-size:16px;text-align:left;">Auto-Categorize Memories</button>
      <div id="auto-categorize-status" style="margin-bottom:16px;font-size:14px;color:${isDark ? '#b2f7ef' : '#007bff'}"></div>
      <div style="margin: 32px 0 16px 0; padding: 16px; background:${isDark ? '#2a2e36' : '#f8f9fa'}; border-radius: 12px; border: 1px solid ${isDark ? '#444a58' : '#e1e5e9'};">
        <div style="margin-bottom: 16px; font-weight: bold; font-size: 18px; color:${isDark ? '#b2b8c2' : '#666'}"></div>
        <div style="padding: 10px 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e1e5e9;">Buttons all functional for testing</div>
        <div style="margin: 24px 0 0 0;">
          <div style="margin-bottom:8px;font-weight:bold;">Import ChatGPT conversations.json</div>
          <label for="import-chatgpt-json" id="import-chatgpt-label" style="display:inline-block;padding:18px 32px;background:${isDark ? '#23272f' : '#f4f6fa'};border-radius:12px;text-align:center;cursor:pointer;font-size:17px;color:${isDark ? '#b2f7ef' : '#007bff'};font-weight:bold;border:1.5px solid ${isDark ? '#b2f7ef' : '#b2c7f7'};transition:background 0.2s;">
            <span id="import-chatgpt-label-text">Select conversations.json file...</span>
            <input type="file" id="import-chatgpt-json" accept="application/json" style="display:none;" />
          </label>
          <div id="import-chatgpt-filename" style="margin-top:8px;font-size:14px;color:${isDark ? '#fff' : '#007bff'}"></div>
          <button id="import-chatgpt-btn" style="margin-top:12px;padding:10px 32px;background:${isDark ? '#555' : '#ccc'};border:none;border-radius:8px;color:${isDark ? '#aaa' : '#666'};font-weight:bold;cursor:pointer;font-size:16px;opacity:0.6;">Import</button>
          <span id="import-chatgpt-status" style="margin-left:12px;font-size:13px;color:${isDark ? '#fff' : '#007bff'}"></span>
          <div id="import-chatgpt-progress-container" style="margin-top:12px;height:18px;width:100%;background:${isDark ? '#23272f' : '#e1e5e9'}">
            <div id="import-chatgpt-progress" style="height:100%;width:0%;background:${isDark ? '#fff' : '#b2c7f7'};transition:width 0.2s;"></div>
          </div>
        </div>
      </div>
    `;

    const clearBtn = tabContent.querySelector('#clear-logs-btn');
    clearBtn.onclick = clearAllLogs;

    const addFullBtn = tabContent.querySelector('#add-full-chat-btn');
    addFullBtn.onclick = addFullChatToLog;

    // Auto-categorize button logic
    const autoCategorizeBtn = tabContent.querySelector('#auto-categorize-btn');
    const statusDiv = tabContent.querySelector('#auto-categorize-status');
    autoCategorizeBtn.onclick = async () => {
      statusDiv.textContent = 'Auto-categorizing...';
      try {
        const userUUID = await getOrCreateUserUUID();
        const res = await fetch(`${SERVER_CONFIG.BASE_URL}/api/auto-categorize-memories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userUUID })
        });
        const data = await res.json();
        if (res.ok) {
          statusDiv.textContent = data.message || 'Auto-categorization complete!';
          if (window.renderStorageTab) window.renderStorageTab();
        } else {
          statusDiv.textContent = data.error || 'Auto-categorization failed.';
        }
      } catch (e) {
        statusDiv.textContent = 'Error: ' + (e && e.message ? e.message : e);
      }
    };

    // (REMOVED theme toggle logic here)

    // Import ChatGPT JSON logic
    let importedMessages = [];
    const fileInput = tabContent.querySelector('#import-chatgpt-json');
    const fileLabel = tabContent.querySelector('#import-chatgpt-label');
    const fileLabelText = tabContent.querySelector('#import-chatgpt-label-text');
    const fileNameDiv = tabContent.querySelector('#import-chatgpt-filename');
    const importBtn = tabContent.querySelector('#import-chatgpt-btn');
    const statusSpan = tabContent.querySelector('#import-chatgpt-status');
    const progressContainer = tabContent.querySelector('#import-chatgpt-progress-container');
    const progressBar = tabContent.querySelector('#import-chatgpt-progress');
    let fileContent = null;

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        fileContent = event.target.result;
        statusSpan.textContent = 'File loaded, ready to import.';
        fileNameDiv.textContent = `Selected: ${file.name}`;
        fileLabelText.textContent = 'File selected!';
      };
      reader.onerror = () => {
        statusSpan.textContent = 'Failed to read file.';
        fileNameDiv.textContent = '';
        fileLabelText.textContent = 'Select conversations.json file...';
      };
      reader.readAsText(file);
    });

    importBtn.onclick = async () => {
      if (!fileContent) {
        statusSpan.textContent = 'Please select a JSON file first.';
        return;
      }

      let json;
      try {
        json = JSON.parse(fileContent);
      } catch (e) {
        statusSpan.textContent = 'Invalid JSON file.';
        return;
      }

      // OpenAI export: conversations.json is an array of conversations
      // Each conversation has a mapping of messages
      let messages = [];
      if (Array.isArray(json)) {
        // Some exports are array of conversations
        json.forEach(convo => {
          if (convo.mapping) {
            Object.values(convo.mapping).forEach(node => {
              if (node.message && node.message.content && Array.isArray(node.message.content.parts)) {
                node.message.content.parts.forEach(part => {
                  if (typeof part === 'string' && part.trim()) {
                    messages.push(part.trim());
                  }
                });
              }
            });
          }
        });
      } else if (json.mapping) {
        // Some exports are a single conversation
        Object.values(json.mapping).forEach(node => {
          if (node.message && node.message.content && Array.isArray(node.message.content.parts)) {
            node.message.content.parts.forEach(part => {
              if (typeof part === 'string' && part.trim()) {
                messages.push(part.trim());
              }
            });
          }
        });
      } else {
        statusSpan.textContent = 'Unrecognized JSON format.';
        return;
      }
      if (messages.length === 0) {
        statusSpan.textContent = 'No messages found in file.';
        return;
      }
      // Deduplicate imported messages
      messages = Array.from(new Set(messages));
      progressContainer.style.display = 'block';
      progressBar.style.width = '0%';
      statusSpan.textContent = `Processing ${messages.length} messages... (This may take several minutes for large imports)`;

      // Process messages in batches
      const batchSize = 10; // Smaller batch size for API calls
      let imported = 0, skipped = 0, processed = 0;

      async function processBatch(startIdx) {
        if (startIdx >= messages.length) {
          progressBar.style.width = '100%';
          statusSpan.textContent = `Imported ${imported} new messages, skipped ${skipped} duplicates.`;
          progressContainer.style.display = 'none';
          if (window.showFeedback) window.showFeedback(`Imported ${imported} new messages, skipped ${skipped} duplicates.`, 'success');
          if (window.renderStorageTab) window.renderStorageTab();
          return;
        }

        const batch = messages.slice(startIdx, startIdx + batchSize);

        try {
          // Process batch in parallel
          const promises = batch.map(async (text) => {
            try {
              const res = await fetch(`${SERVER_CONFIG.BASE_URL}${SERVER_CONFIG.API_ENDPOINTS.MESSAGES}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  text: text,
                  timestamp: Date.now(),
                  userUUID: await getOrCreateUserUUID()
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
              if (result.duplicate) {
                skipped++;
              } else {
                imported++;
              }
            } else {
              console.error('Import error:', result.error);
            }
          });

          processed += batch.length;
          progressBar.style.width = Math.round((processed / messages.length) * 100) + '%';

          // Add small delay between batches to avoid overwhelming the server
          setTimeout(() => processBatch(startIdx + batchSize), 100);

        } catch (err) {
          statusSpan.textContent = 'Error during import: ' + (err && err.message ? err.message : err);
          progressContainer.style.display = 'none';
          if (window.showFeedback) window.showFeedback('Error during import: ' + (err && err.message ? err.message : err), 'error');
        }
      }

      processBatch(0);
    };
  });
}

// Setup folder event handlers
function setupFolderEventHandlers(tabContent, folders) {
  // Folder click to view contents
  tabContent.querySelectorAll('.folder-item').forEach(item => {
    item.onclick = (e) => {
      if (!e.target.classList.contains('folder-open-button') && !e.target.classList.contains('folder-delete-btn')) {
        const folderName = item.dataset.folder;
        const folderId = item.dataset.folderId;
        if (window.viewFolderContents) {
          window.viewFolderContents(folderName, folderId);
        }
      }
    };
  });

  // Folder delete button
  tabContent.querySelectorAll('.folder-delete-btn').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const folderId = btn.dataset.folderId;
      const folderName = btn.dataset.folder;
      if (confirm(`Delete folder '${folderName}'? This cannot be undone.`)) {
        try {
          const res = await fetch(`${SERVER_CONFIG.BASE_URL}${SERVER_CONFIG.API_ENDPOINTS.FOLDERS}/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: folderId, userUUID: await getOrCreateUserUUID() })
          });
          if (!res.ok) throw new Error('Failed to delete folder');
          renderFoldersTab(tabContent);
        } catch (error) {
          tabContent.innerHTML = `<div style=\"text-align:center;color:#ff6b6b;padding:20px;\">Error deleting folder: ${error.message}</div>`;
        }
      }
    };
  });
}

// Sidebar navigation state
if (typeof window.activeSidebarView === 'undefined') {
  window.activeSidebarView = 'search';
}
if (typeof window.activeSearchSubTab === 'undefined') {
  window.activeSearchSubTab = 'memories'; // 'memories' or 'folders'
}

// Set sidebar view and re-render
function setSidebarView(view) {
  window.activeSidebarView = view;
  renderSidebar();
  renderMainContent();
}

// Old search tab function removed - using new sidebar navigation system

// Render sidebar active state
function renderSidebar() {
  const sidebar = document.getElementById('memory-chat-sidebar');
  if (!sidebar) return;
  const buttons = sidebar.querySelectorAll('.sidebar-btn');
  buttons.forEach(btn => {
    if (btn.dataset.view === window.activeSidebarView) {
      btn.classList.add('active');
      btn.style.background = '#23272f';
      btn.style.color = '#b2f7ef';
    } else {
      btn.classList.remove('active');
      btn.style.background = 'none';
      btn.style.color = '#f3f6fa';
    }
  });
}

// Main content rendering based on sidebar view
function renderMainContent() {
  const main = document.getElementById('memory-chat-main');
  if (!main) return;
  const tabContent = main.querySelector('#memory-chat-tab-content');
  if (!tabContent) return;
  tabContent.innerHTML = '';
  if (window.activeSidebarView === 'search') {
    renderSearchView();
  } else if (window.activeSidebarView === 'folders') {
    renderFoldersTab(tabContent);
  } else if (window.activeSidebarView === 'settings') {
    renderSettingsTab(tabContent);
  } else if (window.activeSidebarView === 'account') {
    tabContent.innerHTML = '<div style="text-align:center;color:#888;padding:40px;">Account features coming soon.</div>';
  }
}

// Render the search view with in-content tabs
async function renderSearchView() {
  const main = document.getElementById('memory-chat-main');
  if (!main) return;
  const tabContent = main.querySelector('#memory-chat-tab-content');
  if (!tabContent) return;

  // Determine theme
  const isDark = document.getElementById('memory-chat-storage')?.classList.contains('memory-chat-dark');

  // Helper: get selected count
  function getSelectedCount() {
    return Object.values(window.selectedCards || {}).filter(Boolean).length;
  }

  // SVG search icon
  const svgSearch = `<svg width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6.5" stroke="${isDark ? '#b2f7ef' : '#007bff'}" stroke-width="2"/><line x1="13.5" y1="13.5" x2="17" y2="17" stroke="${isDark ? '#b2f7ef' : '#007bff'}" stroke-width="2" stroke-linecap="round"/></svg>`;

  // Search bar
  const searchBarHTML = `
    <div class="search-bar-container" style="margin:24px 0 0 0;position:relative;">
      <span style="position:absolute;left:16px;top:50%;transform:translateY(-50%);pointer-events:none;">${svgSearch}</span>
      <input id="storage-search-input" type="text" placeholder="Search memories..." style="width:100%;padding:12px 16px 12px 44px;border-radius:24px;border:1.5px solid ${isDark ? '#2c2f36' : '#e1e5e9'};background:${isDark ? '#181a20' : '#fff'};color:${isDark ? '#f3f6fa' : '#1a1a1a'};font-size:15px;outline:none;box-shadow:none;transition:border 0.15s;" />
    </div>
  `;

  // Memories/Folders toggle
  const subTabToggleHTML = `
    <div style="display:flex;gap:0;align-items:center;margin:18px 0 0 0;">
      <button class="search-subtab-btn" data-subtab="memories" style="font-size:16px;font-weight:600;padding:10px 28px;border:none;border-radius:18px 0 0 18px;background:${window.activeSearchSubTab==='memories' ? (isDark ? '#fff1' : '#fff') : 'none'};color:${window.activeSearchSubTab==='memories' ? (isDark ? '#b2f7ef' : '#222') : (isDark ? '#b2b8c2' : '#888')};cursor:pointer;transition:background 0.15s, color 0.15s;">Memories</button>
      <button class="search-subtab-btn" data-subtab="folders" style="font-size:16px;font-weight:600;padding:10px 28px;border:none;border-radius:0 18px 18px 0;background:${window.activeSearchSubTab==='folders' ? (isDark ? '#fff1' : '#fff') : 'none'};color:${window.activeSearchSubTab==='folders' ? (isDark ? '#b2f7ef' : '#222') : (isDark ? '#b2b8c2' : '#888')};cursor:pointer;transition:background 0.15s, color 0.15s;">Folders</button>
    </div>
  `;

  // Bulk actions (conditionally rendered)
  const selectedCount = getSelectedCount();
  const bulkActionsHTML = selectedCount > 0 ? `
    <div class="bulk-actions" style="display:flex;justify-content:center;gap:18px;margin:24px 0 0 0;">
      <button id="add-to-prompt-btn" style="padding:12px 32px;background:#b2f7ef;border:none;border-radius:24px;color:#222;font-weight:bold;cursor:pointer;font-size:15px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">Add To Prompt</button>
      <button id="add-to-folder-btn" style="padding:12px 32px;background:#b2c7f7;border:none;border-radius:24px;color:#222;font-weight:bold;cursor:pointer;font-size:15px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">Add To Folder</button>
      <button id="deselect-all-btn" style="padding:12px 32px;background:${isDark ? '#23272f' : '#e1e5e9'};border:none;border-radius:24px;color:${isDark ? '#b2f7ef' : '#007bff'};font-weight:bold;cursor:pointer;font-size:15px;">Deselect All</button>
    </div>
  ` : '';

  // Tabs
  // Remove the in-content tabs (tabsHTML) from the search view
  // Remove all code related to tabsHTML and .search-tabs
  // Only keep the searchBarHTML, subTabToggleHTML, and bulkActionsHTML in the header
  tabContent.innerHTML = `
    <div class="search-header" style="padding:24px 24px 0 24px;">
      ${searchBarHTML}
      ${subTabToggleHTML}
      ${bulkActionsHTML}
    </div>
    <div id="search-results-container" style="padding:24px;"></div>
  `;

  // Search input
  const searchInput = tabContent.querySelector('#storage-search-input');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch(searchInput.value.trim());
      }
    });
  }

  // Subtab switching
  tabContent.querySelectorAll('.search-subtab-btn').forEach(btn => {
    btn.onclick = () => {
      window.activeSearchSubTab = btn.dataset.subtab;
      renderSearchView();
    };
  });

  // Bulk actions
  const addToPromptBtn = tabContent.querySelector('#add-to-prompt-btn');
  const addToFolderBtn = tabContent.querySelector('#add-to-folder-btn');
  const deselectAllBtn = tabContent.querySelector('#deselect-all-btn');
  if (addToPromptBtn) addToPromptBtn.onclick = addSelectedToPrompt;
  if (addToFolderBtn) addToFolderBtn.onclick = () => {
    // Implement add to folder logic or call a global handler
    if (window.showFolderSelectorForStorage) {
      const selected = Object.keys(window.selectedCards || {}).filter(k => window.selectedCards[k]);
      window.showFolderSelectorForStorage(selected);
    }
  };
  if (deselectAllBtn) deselectAllBtn.onclick = deselectAllCards;

  // Render results for the current subtab
  const resultsContainer = tabContent.querySelector('#search-results-container');
  if (window.activeSearchSubTab === 'folders') {
    renderFoldersTab(resultsContainer);
  } else {
    // Fetch logs/messages from backend
    let logs = [];
    try {
      const res = await fetch(`${SERVER_CONFIG.BASE_URL}/api/messages?userUUID=${await getOrCreateUserUUID()}`);
      if (res.ok) {
        logs = await res.json();
      }
    } catch (e) {
      // Optionally handle error
    }
    // Helper to render cards with pagination (copied from renderTab)
    function renderCardsWithPagination(cards, itemsPerPage = 10) {
      const totalPages = Math.ceil(cards.length / itemsPerPage);
      const currentPage = window.currentPage || 1;
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentCards = cards.slice(startIndex, endIndex);
      resultsContainer.innerHTML = '';
      currentCards.forEach((log, idx) => resultsContainer.appendChild(renderLogCard(log, idx)));
      if (totalPages > 1) {
        const paginationDiv = document.createElement('div');
        paginationDiv.style.cssText = `
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 20px;
          padding: 10px;
          border-top: 1px solid #e1e5e9;
        `;
        paginationDiv.innerHTML = `
          <button id="prev-page-btn" style="padding:8px 12px;background:${isDark ? '#3a3f4b' : '#f7d6b2'};border:none;border-radius:6px;color:${isDark ? '#fff' : '#222'};font-weight:bold;cursor:pointer;${currentPage === 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">← Previous</button>
          <span style="color:${isDark ? '#f3f6fa' : '#1a1a1a'};font-size:14px;">Page ${currentPage} of ${totalPages} (${cards.length} total)</span>
          <button id="next-page-btn" style="padding:8px 12px;background:${isDark ? '#3a3f4b' : '#f7d6b2'};border:none;border-radius:6px;color:${isDark ? '#fff' : '#222'};font-weight:bold;cursor:pointer;${currentPage === totalPages ? 'opacity:0.5;cursor:not-allowed;' : ''}">Next →</button>
        `;
        resultsContainer.appendChild(paginationDiv);
        const prevBtn = paginationDiv.querySelector('#prev-page-btn');
        const nextBtn = paginationDiv.querySelector('#next-page-btn');
        if (prevBtn && currentPage > 1) {
          prevBtn.onclick = () => {
            window.currentPage = currentPage - 1;
            renderCardsWithPagination(cards, itemsPerPage);
          };
        }
        if (nextBtn && currentPage < totalPages) {
          nextBtn.onclick = () => {
            window.currentPage = currentPage + 1;
            renderCardsWithPagination(cards, itemsPerPage);
          };
        }
      }
      setTimeout(attachStorageListeners, 0);
    }
    // Render recent memories (sorted by timestamp)
    const sortedLogs = logs.sort((a, b) => b.timestamp - a.timestamp);
    if (sortedLogs.length === 0) {
      resultsContainer.innerHTML = '<div style="text-align:center;color:#888;">No messages stored yet</div>';
    } else {
      renderCardsWithPagination(sortedLogs);
    }
  }

  // Perform search using backend
  async function performSearch(query) {
    if (!query) {
      resultsContainer.innerHTML = '';
      window.searchResults = [];
      return;
    }
    // Show loading state
    resultsContainer.innerHTML = '<div style="text-align:center;color:#888;padding:20px;">Searching...</div>';
    try {
      const res = await fetch(`${SERVER_CONFIG.BASE_URL}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, userUUID: await getOrCreateUserUUID() })
      });
      if (!res.ok) {
        throw new Error('Search failed');
      }
      const results = await res.json();
      if (results.length === 0) {
        resultsContainer.innerHTML = `<div style="text-align:center;color:#888;padding:20px;">
          No results found<br>
          <small style="color:#999;">Try different keywords</small>
        </div>`;
        window.searchResults = [];
      } else {
        window.searchResults = results;
        window.currentPage = 1;
        renderCardsWithPagination(results);
      }
    } catch (error) {
      resultsContainer.innerHTML = `<div style="text-align:center;color:#ff6b6b;padding:20px;">
        Search error occurred<br>
        <small style="color:#999;">${error.message}</small>
      </div>`;
    }
  }
}

// Helper to get all selected card texts
function getSelectedCardTexts() {
  const selected = window.selectedCards || {};
  const cards = Array.from(document.querySelectorAll('.storage-card'));
  const texts = [];
  cards.forEach(card => {
    const messageId = card.getAttribute('data-message-id');
    if (selected[messageId]) {
      const textDiv = card.querySelector('.storage-log-content');
      if (textDiv) texts.push(textDiv.textContent);
    }
  });
  return texts;
}

// Bulk add to prompt
function addSelectedToPrompt() {
  const texts = getSelectedCardTexts();
  if (!texts.length) return;
  const prompt = document.querySelector('.ProseMirror');
  if (!prompt) return;
  let current = prompt.innerText.trim();
  const preface = 'Here are useful memories for this conversation:';
  let newText = '';
  if (current.includes(preface)) {
    newText = current + '\n---\n' + texts.join('\n---\n');
  } else {
    newText = (current ? current + '\n\n' : '') + preface + '\n\n---\n' + texts.join('\n---\n');
  }
  prompt.focus();
  prompt.innerHTML = '';
  const formattedText = newText.replace(/\n/g, '<br>');
  prompt.innerHTML = formattedText;
  // Optionally, clear selection after adding
  deselectAllCards();
}

// Deselect all cards
function deselectAllCards() {
  window.selectedCards = {};
  document.querySelectorAll('.storage-card-checkbox').forEach(cb => {
    cb.checked = false;
  });
}

// Sidebar event listeners
function setupSidebarNavigation() {
  const sidebar = document.getElementById('memory-chat-sidebar');
  if (!sidebar) return;
  sidebar.querySelectorAll('.sidebar-btn').forEach(btn => {
    btn.onclick = () => setSidebarView(btn.dataset.view);
  });
}

// Initialize sidebar and main content
function initializeTabs() {
  setupSidebarNavigation();
  renderSidebar();
  renderMainContent();
}

window.setSidebarView = setSidebarView;
window.initializeTabs = initializeTabs;
window.renderStorageTab = renderMainContent;
