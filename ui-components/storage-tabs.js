// Storage Tabs Module
// Handles tab management, rendering, and tab-specific content

let activeTab = 'relevant';
window.activeTab = activeTab;

// Set active tab and re-render
function setActiveTab(tab) {
  activeTab = tab;
  
  // Reset pagination when switching tabs
  window.currentPage = 1;
  
  // Update tab button styles
  const storageUI = document.getElementById('memory-chat-storage');
  if (!storageUI) return;
  
  const isDark = storageUI.classList.contains('memory-chat-dark');
  const tabs = Array.from(storageUI.querySelectorAll('.storage-tab'));
  tabs.forEach(t => {
    if (t.dataset.tab === tab) {
      t.style.background = isDark ? '#23272f' : '#f8f9fa';
      t.style.color = isDark ? '#b2f7ef' : '#222';
    } else {
      t.style.background = 'none';
      t.style.color = isDark ? '#f3f6fa' : '#222';
    }
  });
  
  renderTab();
}

// Main tab rendering logic
async function renderTab() {
  const storageUI = document.getElementById('memory-chat-storage');
  if (!storageUI) return;
  
  const tabContent = storageUI.querySelector('#memory-chat-tab-content');
  if (!tabContent) return;
  
  let logs = [];
  if (window.memoryChatIDB && window.memoryChatIDB.getAllMessages) {
    logs = await window.memoryChatIDB.getAllMessages();
  }
  
  // Helper to clear and append cards with pagination
  function renderCardsWithPagination(cards, itemsPerPage = 10) {
    const totalPages = Math.ceil(cards.length / itemsPerPage);
    const currentPage = window.currentPage || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentCards = cards.slice(startIndex, endIndex);
    
    tabContent.innerHTML = '';
    currentCards.forEach((log, idx) => tabContent.appendChild(renderLogCard(log, idx)));
    
    // Add pagination controls if needed
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
      
      const isDark = storageUI.classList.contains('memory-chat-dark');
      
      paginationDiv.innerHTML = `
        <button id="prev-page-btn" style="padding:8px 12px;background:${isDark ? '#3a3f4b' : '#f7d6b2'};border:none;border-radius:6px;color:${isDark ? '#fff' : '#222'};font-weight:bold;cursor:pointer;${currentPage === 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">← Previous</button>
        <span style="color:${isDark ? '#f3f6fa' : '#1a1a1a'};font-size:14px;">Page ${currentPage} of ${totalPages} (${cards.length} total)</span>
        <button id="next-page-btn" style="padding:8px 12px;background:${isDark ? '#3a3f4b' : '#f7d6b2'};border:none;border-radius:6px;color:${isDark ? '#fff' : '#222'};font-weight:bold;cursor:pointer;${currentPage === totalPages ? 'opacity:0.5;cursor:not-allowed;' : ''}">Next →</button>
      `;
      
      tabContent.appendChild(paginationDiv);
      
      // Setup pagination event handlers
      const prevBtn = paginationDiv.querySelector('#prev-page-btn');
      const nextBtn = paginationDiv.querySelector('#next-page-btn');
      
      if (prevBtn && currentPage > 1) {
        prevBtn.onclick = () => {
          window.currentPage = currentPage - 1;
          renderTab();
        };
      }
      
      if (nextBtn && currentPage < totalPages) {
        nextBtn.onclick = () => {
          window.currentPage = currentPage + 1;
          renderTab();
        };
      }
    }
  }
  
  if (activeTab === 'relevant') {
    renderRelevantTab(tabContent, logs, renderCardsWithPagination);
  } else if (activeTab === 'recent') {
    renderRecentTab(tabContent, logs, renderCardsWithPagination);
  } else if (activeTab === 'all') {
    renderAllTab(tabContent, logs, renderCardsWithPagination);
  } else if (activeTab === 'search') {
    renderSearchTab(tabContent, logs, renderCardsWithPagination);
  } else if (activeTab === 'folders') {
    renderFoldersTab(tabContent);
  } else if (activeTab === 'settings') {
    renderSettingsTab(tabContent);
  }
  
  setTimeout(attachPlusListeners, 0);
}

// Render relevant tab content
async function renderRelevantTab(tabContent, logs, renderCards) {
  const prompt = getPromptText();
  if (!prompt) {
    tabContent.innerHTML = '<div style="text-align:center;color:#888;">Start entering your prompt</div>';
    return;
  }
  if (logs.length === 0) {
    tabContent.innerHTML = '<div style="text-align:center;color:#888;">No messages stored yet</div>';
    return;
  }
  
  try {
    let scored;
    
    if (window.memoryChatIDB && window.memoryChatIDB.searchMessages) {
      // Use semantic search for relevance with 80% score threshold
      const results = await window.memoryChatIDB.searchMessages(prompt, 0.85);
      scored = results.map(result => ({
        ...result,
        score: result.similarity || result.score || 0
      }));
    } else {
      tabContent.innerHTML = '<div style="text-align:center;color:#888;">Semantic search not available</div>';
      return;
    }
    
    if (scored.length === 0) {
      tabContent.innerHTML = '<div style="text-align:center;color:#888;">No relevant messages found with score > 80%</div>';
    } else {
      renderCards(scored);
    }
  } catch (error) {
    console.error('Relevance search error:', error);
    tabContent.innerHTML = '<div style="text-align:center;color:#ff6b6b;">Error finding relevant messages</div>';
  }
}

// Render recent tab content
function renderRecentTab(tabContent, logs, renderCards) {
  const sortedLogs = logs.sort((a, b) => b.timestamp - a.timestamp);
  if (sortedLogs.length === 0) {
    tabContent.innerHTML = '<div style="text-align:center;color:#888;">No messages stored yet</div>';
  } else {
    renderCards(sortedLogs);
  }
}

// Render all tab content
function renderAllTab(tabContent, logs, renderCards) {
  const sortedLogs = logs.sort((a, b) => b.timestamp - a.timestamp);
  if (sortedLogs.length === 0) {
    tabContent.innerHTML = '<div style="text-align:center;color:#888;">No messages stored yet</div>';
  } else {
    renderCards(sortedLogs);
  }
}

// Render search tab content
function renderSearchTab(tabContent, logs, renderCards) {
  tabContent.innerHTML = `
    <div id="search-input-container" style="margin-bottom: 12px;">
      <input id="storage-search-input" type="text" placeholder="Type your search and press Enter..." style="width:100%;padding:8px;border-radius:6px;border:1px solid #e1e5e9;outline:none;" />
      <div style="margin-top: 8px; font-size: 12px; color: #666;">
        <span id="search-type-indicator">Semantic search enabled</span>
      </div>
    </div>
    <div id="storage-search-results"></div>
  `;
  
  const input = tabContent.querySelector('#storage-search-input');
  const resultsDiv = tabContent.querySelector('#storage-search-results');
  
  // Store search results globally for pagination
  window.searchResults = [];
  
  // Helper function to render search results with pagination
  function renderSearchResultsWithPagination(results, itemsPerPage = 10) {
    const totalPages = Math.ceil(results.length / itemsPerPage);
    const currentPage = window.currentPage || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentResults = results.slice(startIndex, endIndex);
    
    // Clear only the results div, not the entire tabContent
    resultsDiv.innerHTML = '';
    currentResults.forEach((result, idx) => resultsDiv.appendChild(renderLogCard(result, idx)));
    
    // Add pagination controls if needed
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
      
      const storageUI = document.getElementById('memory-chat-storage');
      const isDark = storageUI && storageUI.classList.contains('memory-chat-dark');
      
      paginationDiv.innerHTML = `
        <button id="prev-page-btn" style="padding:8px 12px;background:${isDark ? '#3a3f4b' : '#f7d6b2'};border:none;border-radius:6px;color:${isDark ? '#fff' : '#222'};font-weight:bold;cursor:pointer;${currentPage === 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">← Previous</button>
        <span style="color:${isDark ? '#f3f6fa' : '#1a1a1a'};font-size:14px;">Page ${currentPage} of ${totalPages} (${results.length} total)</span>
        <button id="next-page-btn" style="padding:8px 12px;background:${isDark ? '#3a3f4b' : '#f7d6b2'};border:none;border-radius:6px;color:${isDark ? '#fff' : '#222'};font-weight:bold;cursor:pointer;${currentPage === totalPages ? 'opacity:0.5;cursor:not-allowed;' : ''}">Next →</button>
      `;
      
      resultsDiv.appendChild(paginationDiv);
      
      // Setup pagination event handlers
      const prevBtn = paginationDiv.querySelector('#prev-page-btn');
      const nextBtn = paginationDiv.querySelector('#next-page-btn');
      
      if (prevBtn && currentPage > 1) {
        prevBtn.onclick = () => {
          window.currentPage = currentPage - 1;
          renderSearchResultsWithPagination(window.searchResults);
        };
      }
      
      if (nextBtn && currentPage < totalPages) {
        nextBtn.onclick = () => {
          window.currentPage = currentPage + 1;
          renderSearchResultsWithPagination(window.searchResults);
        };
      }
    }
  }
  
  // Perform search using semantic search
  async function performSearch(query) {
    if (!query) {
      resultsDiv.innerHTML = '';
      window.searchResults = [];
      return;
    }
    
    try {
      let results;
      
      if (window.memoryChatIDB && window.memoryChatIDB.searchMessages) {
        // Use semantic search with 80% score threshold
        results = await window.memoryChatIDB.searchMessages(query, 0.85);
        results = results.map(result => ({
          ...result,
          score: result.similarity || result.score || 0
        }));
      } else {
        resultsDiv.innerHTML = '<div style="text-align:center;color:#888;">Semantic search not available</div>';
        return;
      }
      
      if (results.length === 0) {
        resultsDiv.innerHTML = '<div style="text-align:center;color:#888;">No results found with score > 80%</div>';
        window.searchResults = [];
      } else {
        // Store results globally and reset to page 1 when searching
        window.searchResults = results;
        window.currentPage = 1;
        renderSearchResultsWithPagination(results);
      }
    } catch (error) {
      console.error('Search error:', error);
      resultsDiv.innerHTML = '<div style="text-align:center;color:#ff6b6b;">Search error occurred</div>';
    }
  }
  
  // Search only on Enter key press
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const term = input.value.trim();
      performSearch(term);
    }
  });
}

// Render folders tab content
async function renderFoldersTab(tabContent) {
  let folders = {};
  if (window.memoryChatIDB && window.memoryChatIDB.getAllFolders) {
    folders = await window.memoryChatIDB.getAllFolders();
  }
  const folderNames = Object.keys(folders);
  const storageUI = document.getElementById('memory-chat-storage');
  const isDark = storageUI && storageUI.classList.contains('memory-chat-dark');

  if (folderNames.length === 0) {
    tabContent.innerHTML = `
      <div style="text-align:center;color:#888;margin-bottom:20px;">No folders created yet</div>
      <button id="create-folder-btn" style="display:block;margin:0 auto;padding:10px 20px;background:linear-gradient(90deg,#b2f7ef 0%,#c2f7cb 100%);border:none;border-radius:8px;color:#222;font-weight:bold;cursor:pointer;">Create New Folder</button>
    `;
    const createBtn = tabContent.querySelector('#create-folder-btn');
    createBtn.onclick = async () => {
      const folderName = prompt('Enter folder name:');
      if (folderName && folderName.trim()) {
        if (window.memoryChatIDB && window.memoryChatIDB.addOrUpdateFolder) {
          await window.memoryChatIDB.addOrUpdateFolder(folderName.trim(), []);
          renderFoldersTab(tabContent);
        }
      }
    };
  } else {
    let foldersHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h4 style="margin:0;${isDark ? 'color:#f3f6fa;' : 'color:#1a1a1a;'}">Your Folders</h4>
        <button id="create-folder-btn" style="padding:8px 16px;background:linear-gradient(90deg,#b2f7ef 0%,#c2f7cb 100%);border:none;border-radius:6px;color:#222;font-weight:bold;cursor:pointer;font-size:12px;">+ New Folder</button>
      </div>
    `;
    folderNames.forEach(folderName => {
      const messageCount = folders[folderName].length;
      foldersHTML += `
        <div class="folder-item" data-folder="${folderName}" style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:${isDark ? '#23272f' : '#f8f9fa'};border:1px solid ${isDark ? '#2c2f36' : '#e1e5e9'};border-radius:8px;margin-bottom:8px;cursor:pointer;">
          <div style="flex:1;">
            <div style="font-weight:bold;${isDark ? 'color:#f3f6fa;' : 'color:#1a1a1a;'}">${folderName}</div>
            <div style="font-size:12px;${isDark ? 'color:#b2b8c2;' : 'color:#888;'}">${messageCount} message${messageCount !== 1 ? 's' : ''}</div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="folder-plus-btn" data-folder="${folderName}" style="background:${isDark ? '#2e3a4a' : '#e6f7e6'};border:none;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:${isDark ? '#b2f7ef' : '#222'};" title="Add all messages to prompt">+</button>
            <button class="folder-delete-btn" data-folder="${folderName}" style="background:${isDark ? '#3a2323' : '#f7e6e6'};border:none;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;color:${isDark ? '#ffb2b2' : '#d32f2f'};" title="Delete folder">×</button>
          </div>
        </div>
      `;
    });
    tabContent.innerHTML = foldersHTML;
    // Setup folder event handlers
    setupFolderEventHandlers(tabContent, folders);
  }
}

// Render settings tab content
function renderSettingsTab(tabContent) {
  // Add theme toggle button
  chrome.storage.local.get({ storageTheme: 'light' }, (result) => {
    const isDark = result.storageTheme === 'dark';
    tabContent.innerHTML = `
      <button id="clear-logs-btn" style="display:block;margin:0 0 16px 0;padding:10px 28px;background:${isDark ? '#3a3f4b' : '#f7d6b2'};border:none;border-radius:10px;color:${isDark ? '#fff' : '#222'};font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.08);cursor:pointer;font-size:16px;text-align:left;">Clear All Logs</button>
      <button id="add-full-chat-btn" style="display:block;margin:0 0 16px 0;padding:10px 28px;background:${isDark ? '#2e4a3a' : '#b2f7ef'};border:none;border-radius:10px;color:${isDark ? '#fff' : '#222'};font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.08);cursor:pointer;font-size:16px;text-align:left;">Add Full Chat to Log</button>
      <button id="update-embeddings-btn" style="display:block;margin:0 0 16px 0;padding:10px 28px;background:${isDark ? '#4a2e3a' : '#f7b2d6'};border:none;border-radius:10px;color:${isDark ? '#fff' : '#222'};font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.08);cursor:pointer;font-size:16px;text-align:left;">Update Embeddings for Existing Messages</button>
      <button id="theme-toggle-btn" style="display:block;margin:0 0 16px 0;padding:10px 28px;background:${isDark ? '#2e3a4a' : '#b2c7f7'};border:none;border-radius:10px;color:${isDark ? '#fff' : '#222'};font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.08);cursor:pointer;font-size:16px;text-align:left;">Switch to ${isDark ? 'Light' : 'Dark'} Mode</button>
      <div style="margin: 24px 0 0 0;">
        <div style="margin-bottom:8px;font-weight:bold;">Import ChatGPT conversations.json</div>
        <label for="import-chatgpt-json" id="import-chatgpt-label" style="display:inline-block;padding:18px 32px;background:${isDark ? '#23272f' : '#f4f6fa'};border-radius:12px;text-align:center;cursor:pointer;font-size:17px;color:${isDark ? '#b2f7ef' : '#007bff'};font-weight:bold;border:1.5px solid ${isDark ? '#b2f7ef' : '#b2c7f7'};transition:background 0.2s;">
          <span id="import-chatgpt-label-text">Select conversations.json file...</span>
          <input type="file" id="import-chatgpt-json" accept="application/json" style="display:none;" />
        </label>
        <div id="import-chatgpt-filename" style="margin-top:8px;font-size:14px;color:${isDark ? '#fff' : '#007bff'}"></div>
        <button id="import-chatgpt-btn" style="margin-top:12px;padding:10px 32px;background:${isDark ? '#2e3a4a' : '#b2f7ef'};border:none;border-radius:8px;color:${isDark ? '#fff' : '#222'};font-weight:bold;cursor:pointer;font-size:16px;">Import</button>
        <span id="import-chatgpt-status" style="margin-left:12px;font-size:13px;color:${isDark ? '#fff' : '#007bff'}"></span>
        <div id="import-chatgpt-progress-container" style="margin-top:12px;height:18px;width:100%;background:${isDark ? '#23272f' : '#e1e5e9'};border-radius:8px;display:none;overflow:hidden;">
          <div id="import-chatgpt-progress" style="height:100%;width:0%;background:${isDark ? '#fff' : '#b2c7f7'};transition:width 0.2s;"></div>
        </div>
      </div>
    `;
    
    const clearBtn = tabContent.querySelector('#clear-logs-btn');
    clearBtn.onclick = clearAllLogs;
    
    const addFullBtn = tabContent.querySelector('#add-full-chat-btn');
    addFullBtn.onclick = addFullChatToLog;

    // Update embeddings button
    const updateEmbeddingsBtn = tabContent.querySelector('#update-embeddings-btn');
    updateEmbeddingsBtn.onclick = async () => {
      if (!window.semanticSearch) {
        if (window.showFeedback) window.showFeedback('Semantic search not available.', 'error');
        return;
      }
      
      updateEmbeddingsBtn.disabled = true;
      updateEmbeddingsBtn.textContent = 'Updating...';
      
      try {
        if (window.memoryChatIDB && window.memoryChatIDB.updateEmbeddingsForExistingMessages) {
          const result = await window.memoryChatIDB.updateEmbeddingsForExistingMessages();
          if (window.showFeedback) window.showFeedback('Embeddings updated successfully!', 'success');
        } else {
          if (window.showFeedback) window.showFeedback('IndexedDB not available.', 'error');
        }
      } catch (error) {
        console.error('Error updating embeddings:', error);
        if (window.showFeedback) window.showFeedback('Error updating embeddings: ' + error.message, 'error');
      } finally {
        updateEmbeddingsBtn.disabled = false;
        updateEmbeddingsBtn.textContent = 'Update Embeddings for Existing Messages';
      }
    };

    // Theme toggle logic
    const themeBtn = tabContent.querySelector('#theme-toggle-btn');
    themeBtn.onclick = () => {
      const newTheme = isDark ? 'light' : 'dark';
      chrome.storage.local.set({ storageTheme: newTheme }, () => {
        if (window.applyStorageTheme) window.applyStorageTheme();
        // Re-render settings tab to update button label
        renderSettingsTab(tabContent);
      });
    };

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

    // Helper to wait for memoryChatIDB to be available
    function waitForIDBMethod(method, maxRetries = 20, delay = 1000) {
      return new Promise((resolve, reject) => {
        let tries = 0;
        function check() {
          if (window.memoryChatIDB && window.memoryChatIDB[method]) {
            resolve(window.memoryChatIDB[method]);
          } else if (tries < maxRetries) {
            tries++;
            setTimeout(check, delay);
          } else {
            reject(new Error('IndexedDB is not available.'));
          }
        }
        check();
      });
    }

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
      // Prepare messages for IndexedDB
      const now = Date.now();
      const messageObjs = messages.map(text => ({ text, timestamp: now }));
      progressContainer.style.display = 'block';
      progressBar.style.width = '0%';
      statusSpan.textContent = 'Importing...';
      // Batch in chunks for progress bar
      const batchSize = 500;
      let imported = 0, skipped = 0, processed = 0;
      async function processBatch(startIdx) {
        if (startIdx >= messageObjs.length) {
          progressBar.style.width = '100%';
          statusSpan.textContent = `Imported ${imported} new, skipped ${skipped} duplicates.`;
          progressContainer.style.display = 'none';
          if (window.showFeedback) window.showFeedback(`Imported ${imported} new, skipped ${skipped} duplicates.`, 'success');
          if (window.renderStorageTab) window.renderStorageTab();
          return;
        }
        const batch = messageObjs.slice(startIdx, startIdx + batchSize);
        let addMessagesFn;
        try {
          addMessagesFn = await waitForIDBMethod('addMessages');
        } catch (err) {
          statusSpan.textContent = 'IndexedDB is not available.';
          progressContainer.style.display = 'none';
          if (window.showFeedback) window.showFeedback('IndexedDB is not available.', 'error');
          return;
        }
        addMessagesFn(batch).then(({ added, skipped: batchSkipped }) => {
          imported += added;
          skipped += batchSkipped;
          processed += batch.length;
          progressBar.style.width = Math.round((processed / messageObjs.length) * 100) + '%';
          setTimeout(() => processBatch(startIdx + batchSize), 0);
        }).catch(err => {
          statusSpan.textContent = 'IndexedDB error: ' + (err && err.message ? err.message : err);
          progressContainer.style.display = 'none';
          if (window.showFeedback) window.showFeedback('IndexedDB error: ' + (err && err.message ? err.message : err), 'error');
        });
      }
      processBatch(0);
    };
  });
}

// Setup folder event handlers
function setupFolderEventHandlers(tabContent, folders) {
  // Create folder button
  const createBtn = tabContent.querySelector('#create-folder-btn');
  if (createBtn) {
    createBtn.onclick = async () => {
      const folderName = prompt('Enter folder name:');
      if (folderName && folderName.trim()) {
        if (window.memoryChatIDB && window.memoryChatIDB.addOrUpdateFolder) {
          await window.memoryChatIDB.addOrUpdateFolder(folderName.trim(), []);
          if (window.renderTab) window.renderTab();
        }
      }
    };
  }
  // Folder click to view contents (not implemented here, but could be added)
  tabContent.querySelectorAll('.folder-item').forEach(item => {
    item.onclick = (e) => {
      if (!e.target.classList.contains('folder-plus-btn') && !e.target.classList.contains('folder-delete-btn')) {
        const folderName = item.dataset.folder;
        if (window.viewFolderContents) {
          window.viewFolderContents(folderName);
        }
      }
    };
  });
  // Folder plus button (add all messages to prompt)
  tabContent.querySelectorAll('.folder-plus-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const folderName = btn.dataset.folder;
      const folderMessages = folders[folderName];
      if (folderMessages.length > 0) {
        const prompt = document.querySelector('.ProseMirror');
        if (prompt) {
          let current = prompt.innerText.trim();
          const preface = `Here are messages from folder "${folderName}":`;
          let newText = '';
          if (current.includes(preface)) {
            newText = current + '\n' + folderMessages.map(msg => `- ${typeof msg === 'string' ? msg : msg.text}`).join('\n');
          } else {
            newText = (current ? current + '\n' : '') + preface + '\n' + folderMessages.map(msg => `- ${typeof msg === 'string' ? msg : msg.text}`).join('\n');
          }
          prompt.focus();
          document.execCommand('selectAll', false, null);
          document.execCommand('insertText', false, newText);
        }
      }
    };
  });
  // Folder delete button
  tabContent.querySelectorAll('.folder-delete-btn').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const folderName = btn.dataset.folder;
      if (confirm(`Are you sure you want to delete the folder "${folderName}"?`)) {
        if (window.memoryChatIDB && window.memoryChatIDB.removeFolder) {
          await window.memoryChatIDB.removeFolder(folderName);
          if (window.renderTab) window.renderTab();
        }
      }
    };
  });
}

// Setup tab switching
function setupTabSwitching() {
  const storageUI = document.getElementById('memory-chat-storage');
  if (!storageUI) return;
  
  const tabs = Array.from(storageUI.querySelectorAll('.storage-tab'));
  tabs.forEach(t => t.onclick = () => setActiveTab(t.dataset.tab));
}

// Setup live updates
function setupLiveUpdates() {
  // Live update: re-render on prompt input changes
  const prompt = document.querySelector('.ProseMirror');
  if (prompt) {
    prompt.addEventListener('input', () => {
      const storageUI = document.getElementById('memory-chat-storage');
      if (storageUI && storageUI.style.display !== 'none' && activeTab === 'relevant') {
        renderTab();
      }
    });
  }

  // Live update: re-render on storage changes
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes.chatLogs || changes.folders)) {
      const storageUI = document.getElementById('memory-chat-storage');
      if (storageUI && storageUI.style.display !== 'none') {
        renderTab();
      }
    }
  });
}

// Initialize tabs
function initializeTabs() {
  setupTabSwitching();
  setupLiveUpdates();
  setActiveTab('relevant');
}

// Export functions for use in other modules
window.setActiveTab = setActiveTab;
window.renderTab = renderTab;
window.initializeTabs = initializeTabs;
window.renderStorageTab = renderTab; // Alias for backward compatibility 