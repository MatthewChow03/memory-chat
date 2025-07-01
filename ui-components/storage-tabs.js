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
  
  // Fetch logs/messages from backend
  let logs = [];
  try {
    const res = await fetch('http://localhost:3000/api/messages');
    if (res.ok) {
      logs = await res.json();
    } else {
      tabContent.innerHTML = '<div style="text-align:center;color:#ff6b6b;padding:20px;">Failed to load messages from backend</div>';
      return;
    }
  } catch (error) {
    tabContent.innerHTML = `<div style="text-align:center;color:#ff6b6b;padding:20px;">Error loading messages: ${error.message}</div>`;
    return;
  }
  
  // Helper to clear and append cards with pagination
  function renderCardsWithPagination(cards, itemsPerPage = 10) {
    const totalPages = Math.ceil(cards.length / itemsPerPage);
    const currentPage = window.currentPage || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentCards = cards.slice(startIndex, endIndex);
    
    // Clear only the content area, preserving any UI elements
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
          // Re-render just the cards, not the entire tab
          renderCardsWithPagination(cards, itemsPerPage);
        };
      }
      
      if (nextBtn && currentPage < totalPages) {
        nextBtn.onclick = () => {
          window.currentPage = currentPage + 1;
          // Re-render just the cards, not the entire tab
          renderCardsWithPagination(cards, itemsPerPage);
        };
      }
    }
    
    // Attach event listeners after rendering
    setTimeout(attachStorageListeners, 0);
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
  
  // Note: attachStorageListeners is called within renderCardsWithPagination
  // so we don't need to call it here again
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
    let scored = [];
    let searchMethod = 'threshold';
    // Use client-side semantic search if available
    if (window.advancedSemanticSearch) {
      const results = await window.advancedSemanticSearch.searchMessages(prompt, logs, logs.length, 0.05);
      scored = results.map(result => ({
        ...result,
        score: result.similarity || result.score || 0
      }));
      // Check if we got results but they might be from fallback (lower similarity scores)
      const highSimilarityCount = scored.filter(result => result.similarity >= 0.85).length;
      if (scored.length > 0 && highSimilarityCount === 0) {
        searchMethod = 'topk';
      }
    } else {
      tabContent.innerHTML = '<div style="text-align:center;color:#888;">Advanced semantic search not available</div>';
      return;
    }
    
    if (scored.length === 0) {
      tabContent.innerHTML = `<div style="text-align:center;color:#888;padding:20px;">
        No relevant messages found with AI-powered semantic search<br>
        <small style="color:#999;">Try rephrasing your prompt or check the "All" tab</small>
      </div>`;
    } else {
      // Filter out memories that are already included in the prompt
      const filteredResults = filterOutPromptIncludedMemories(scored, prompt);
      
      if (filteredResults.length === 0) {
        tabContent.innerHTML = `<div style="text-align:center;color:#888;padding:20px;">
          All relevant messages are already included in your prompt<br>
          <small style="color:#999;">Try adding more context to your prompt or check the "All" tab</small>
        </div>`;
        return;
      }
      // Add search method indicator
      const methodIndicator = document.createElement('div');
      methodIndicator.style.cssText = `
        font-size: 11px;
        color: #999;
        text-align: center;
        margin-bottom: 10px;
        padding: 4px 8px;
        background: #f8f9fa;
        border-radius: 4px;
        border: 1px solid #e1e5e9;
      `;
      const filteredCount = filteredResults.length;
      const originalCount = scored.length;
      const filteredOutCount = originalCount - filteredCount;
      if (searchMethod === 'threshold') {
        methodIndicator.textContent = `Found ${filteredCount} relevant messages using AI-powered semantic search (85%+ similarity)${filteredOutCount > 0 ? `, ${filteredOutCount} already in prompt` : ''}`;
      } else {
        methodIndicator.textContent = `Found ${filteredCount} messages using AI-powered search (top results, some below 85% similarity)${filteredOutCount > 0 ? `, ${filteredOutCount} already in prompt` : ''}`;
      }
      tabContent.innerHTML = '';
      tabContent.appendChild(methodIndicator);
      renderCards(filteredResults);
    }
  } catch (error) {
    console.error('Relevance search error:', error);
    tabContent.innerHTML = `<div style="text-align:center;color:#ff6b6b;padding:20px;">
      Error finding relevant messages<br>
      <small style="color:#999;">${error.message}</small>
    </div>`;
  }
}

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
  const storageUI = document.getElementById('memory-chat-storage');
  const isDark = storageUI && storageUI.classList.contains('memory-chat-dark');
  
  // Get search status
  let searchStatus = 'Search ready';
  let searchType = 'ready';

  tabContent.innerHTML = `
    <div id="search-input-container" style="margin-bottom: 12px;">
      <input id="storage-search-input" type="text" placeholder="Type your search and press Enter..." style="width:100%;padding:8px;border-radius:6px;border:1px solid #e1e5e9;outline:none;" />
      <div style="margin-top: 8px; font-size: 12px; color: ${isDark ? '#b2b8c2' : '#666'};">
        <span id="search-type-indicator">${searchStatus}</span>
      </div>
      <div style="margin-top: 4px; font-size: 11px; color: ${isDark ? '#888' : '#999'};">
        \ud83e\udd16 Using backend-powered search
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
    
    if (currentResults.length === 0) {
      resultsDiv.innerHTML = '<div style="text-align:center;color:#888;">No results found</div>';
      return;
    }
    
    resultsDiv.innerHTML = '';
    currentResults.forEach((result, idx) => {
      const card = renderLogCard(result, idx);
      resultsDiv.appendChild(card);
    });
    
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
      
      paginationDiv.innerHTML = `
        <button id="prev-page-btn" style="padding:8px 12px;background:${isDark ? '#3a3f4b' : '#f7d6b2'};border:none;border-radius:6px;color:${isDark ? '#fff' : '#222'};font-weight:bold;cursor:pointer;${currentPage === 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">\u2190 Previous</button>
        <span style="color:${isDark ? '#f3f6fa' : '#1a1a1a'};font-size:14px;">Page ${currentPage} of ${totalPages} (${results.length} results)</span>
        <button id="next-page-btn" style="padding:8px 12px;background:${isDark ? '#3a3f4b' : '#f7d6b2'};border:none;border-radius:6px;color:${isDark ? '#fff' : '#222'};font-weight:bold;cursor:pointer;${currentPage === totalPages ? 'opacity:0.5;cursor:not-allowed;' : ''}">Next \u2192</button>
      `;
      
      resultsDiv.appendChild(paginationDiv);
      
      // Setup pagination event handlers
      const prevBtn = paginationDiv.querySelector('#prev-page-btn');
      const nextBtn = paginationDiv.querySelector('#next-page-btn');
      
      if (prevBtn && currentPage > 1) {
        prevBtn.onclick = () => {
          window.currentPage = currentPage - 1;
          renderSearchResultsWithPagination(results, itemsPerPage);
        };
      }
      
      if (nextBtn && currentPage < totalPages) {
        nextBtn.onclick = () => {
          window.currentPage = currentPage + 1;
          renderSearchResultsWithPagination(results, itemsPerPage);
        };
      }
    }
    
    // Attach event listeners after rendering
    setTimeout(attachStorageListeners, 0);
  }
  
  // Perform search using backend
  async function performSearch(query) {
    if (!query) {
      resultsDiv.innerHTML = '';
      window.searchResults = [];
      return;
    }
    // Show loading state
    resultsDiv.innerHTML = '<div style="text-align:center;color:#888;padding:20px;">Searching...</div>';
    try {
      const res = await fetch('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (!res.ok) {
        throw new Error('Search failed');
      }
      const results = await res.json();
      if (results.length === 0) {
        resultsDiv.innerHTML = `<div style="text-align:center;color:#888;padding:20px;">
          No results found<br>
          <small style="color:#999;">Try different keywords or check the "All" tab</small>
        </div>`;
        window.searchResults = [];
      } else {
        window.searchResults = results;
        window.currentPage = 1;
        renderSearchResultsWithPagination(results);
        // Update search status indicator
        const statusIndicator = tabContent.querySelector('#search-type-indicator');
        if (statusIndicator) {
          statusIndicator.textContent = `Found ${results.length} results using backend search`;
        }
      }
    } catch (error) {
      resultsDiv.innerHTML = `<div style="text-align:center;color:#ff6b6b;padding:20px;">
        Search error occurred<br>
        <small style="color:#999;">${error.message}</small>
      </div>`;
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
  try {
    const res = await fetch('http://localhost:3000/api/folders');
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
        try {
          const res = await fetch('http://localhost:3000/api/folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: folderName.trim() })
          });
          if (!res.ok) throw new Error('Failed to create folder');
          renderFoldersTab(tabContent);
        } catch (error) {
          tabContent.innerHTML = `<div style=\"text-align:center;color:#ff6b6b;padding:20px;\">Error creating folder: ${error.message}</div>`;
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
      const messageCount = folders[folderName].messageCount || 0;
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
    // Add create folder event handler
    const createBtn = tabContent.querySelector('#create-folder-btn');
    createBtn.onclick = async () => {
      const folderName = prompt('Enter folder name:');
      if (folderName && folderName.trim()) {
        try {
          const res = await fetch('http://localhost:3000/api/folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: folderName.trim() })
          });
          if (!res.ok) throw new Error('Failed to create folder');
          renderFoldersTab(tabContent);
        } catch (error) {
          tabContent.innerHTML = `<div style=\"text-align:center;color:#ff6b6b;padding:20px;\">Error creating folder: ${error.message}</div>`;
        }
      }
    };
    // Add delete folder event handlers
    tabContent.querySelectorAll('.folder-delete-btn').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const folderName = btn.dataset.folder;
        if (confirm(`Delete folder '${folderName}'? This cannot be undone.`)) {
          try {
            const res = await fetch(`http://localhost:3000/api/folders/${encodeURIComponent(folderName)}`, {
              method: 'DELETE'
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
  // Add theme toggle button
  chrome.storage.local.get({ storageTheme: 'light', openaiApiKey: '' }, (result) => {
    const isDark = result.storageTheme === 'dark';
    const currentApiKey = result.openaiApiKey || '';
    
    // Mask the API key for display (show only first 4 and last 4 characters)
    const maskedApiKey = currentApiKey ? 
      currentApiKey.substring(0, 4) + '••••••••' + currentApiKey.substring(currentApiKey.length - 4) : 
      '';
    
    tabContent.innerHTML = `
      <div style="margin-bottom: 24px;">
        <div style="margin-bottom:8px;font-weight:bold;">OpenAI API Key</div>
        <input type="password" id="openai-api-key" placeholder="Enter your OpenAI API key" value="" style="width:100%;padding:12px;border:1px solid ${isDark ? '#444' : '#ddd'};border-radius:8px;background:${isDark ? '#23272f' : '#fff'};color:${isDark ? '#fff' : '#222'};font-size:14px;box-sizing:border-box;">
        <div id="api-key-status-display" style="margin-top:4px;font-size:12px;color:${isDark ? '#aaa' : '#666'};">
          ${currentApiKey ? `API Key saved: ${maskedApiKey}` : 'No API key saved'}
        </div>
        <button id="save-api-key-btn" style="margin-top:8px;padding:8px 16px;background:${isDark ? '#2e4a3a' : '#b2f7ef'};border:none;border-radius:6px;color:${isDark ? '#fff' : '#222'};font-weight:bold;cursor:pointer;font-size:14px;">Save API Key</button>
        <button id="debug-api-key-btn" style="margin-top:8px;margin-left:8px;padding:8px 16px;background:${isDark ? '#4a2e3a' : '#f7b2d6'};border:none;border-radius:6px;color:${isDark ? '#fff' : '#222'};font-weight:bold;cursor:pointer;font-size:14px;">Debug</button>
        <button id="clear-api-key-btn" style="margin-top:8px;margin-left:8px;padding:8px 16px;background:${isDark ? '#4a2e2e' : '#f7b2b2'};border:none;border-radius:6px;color:${isDark ? '#fff' : '#222'};font-weight:bold;cursor:pointer;font-size:14px;">Clear Key</button>
        <span id="api-key-status" style="margin-left:12px;font-size:13px;color:${isDark ? '#fff' : '#007bff'}"></span>
      </div>
      <button id="clear-logs-btn" style="display:block;margin:0 0 16px 0;padding:10px 28px;background:${isDark ? '#3a3f4b' : '#f7d6b2'};border:none;border-radius:10px;color:${isDark ? '#fff' : '#222'};font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.08);cursor:pointer;font-size:16px;text-align:left;">Clear All Logs</button>
      <button id="add-full-chat-btn" style="display:block;margin:0 0 16px 0;padding:10px 28px;background:${isDark ? '#2e4a3a' : '#b2f7ef'};border:none;border-radius:10px;color:${isDark ? '#fff' : '#222'};font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.08);cursor:pointer;font-size:16px;text-align:left;">Add Full Chat to Log</button>
      
      <div style="margin: 32px 0 16px 0; padding: 16px; background:${isDark ? '#2a2e36' : '#f8f9fa'}; border-radius: 12px; border: 1px solid ${isDark ? '#444a58' : '#e1e5e9'};">
        <div style="margin-bottom: 16px; font-weight: bold; font-size: 18px; color:${isDark ? '#b2b8c2' : '#666'}; text-align: center;">🚧 Coming Soon 🚧</div>
        <div style="padding: 10px 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e1e5e9;">Buttons all functional for testing</div>
        <button id="update-embeddings-btn" style="display:block;margin:0 0 16px 0;padding:10px 28px;background:${isDark ? '#555' : '#ccc'};border:none;border-radius:10px;color:${isDark ? '#aaa' : '#666'};font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.08);cursor:pointer;font-size:16px;text-align:left;opacity:0.6;">Update Embeddings for Existing Messages</button>
        <button id="migrate-folders-btn" style="display:block;margin:0 0 16px 0;padding:10px 28px;background:${isDark ? '#555' : '#ccc'};border:none;border-radius:10px;color:${isDark ? '#aaa' : '#666'};font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.08);cursor:pointer;font-size:16px;text-align:left;opacity:0.6;">Migrate Folders to New Format</button>
        <button id="debug-indexeddb-btn" style="display:block;margin:0 0 16px 0;padding:10px 28px;background:${isDark ? '#555' : '#ccc'};border:none;border-radius:10px;color:${isDark ? '#aaa' : '#666'};font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.08);cursor:pointer;font-size:16px;text-align:left;opacity:0.6;">Debug IndexedDB</button>
        <button id="theme-toggle-btn" style="display:block;margin:0 0 16px 0;padding:10px 28px;background:${isDark ? '#555' : '#ccc'};border:none;border-radius:10px;color:${isDark ? '#aaa' : '#666'};font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.08);cursor:pointer;font-size:16px;text-align:left;opacity:0.6;">Switch to ${isDark ? 'Light' : 'Dark'} Mode</button>
        <div style="margin: 24px 0 0 0;">
          <div style="margin-bottom:8px;font-weight:bold;">Import ChatGPT conversations.json</div>
          <label for="import-chatgpt-json" id="import-chatgpt-label" style="display:inline-block;padding:18px 32px;background:${isDark ? '#23272f' : '#f4f6fa'};border-radius:12px;text-align:center;cursor:pointer;font-size:17px;color:${isDark ? '#b2f7ef' : '#007bff'};font-weight:bold;border:1.5px solid ${isDark ? '#b2f7ef' : '#b2c7f7'};transition:background 0.2s;">
            <span id="import-chatgpt-label-text">Select conversations.json file...</span>
            <input type="file" id="import-chatgpt-json" accept="application/json" style="display:none;" />
          </label>
          <div id="import-chatgpt-filename" style="margin-top:8px;font-size:14px;color:${isDark ? '#fff' : '#007bff'}"></div>
          <button id="import-chatgpt-btn" style="margin-top:12px;padding:10px 32px;background:${isDark ? '#555' : '#ccc'};border:none;border-radius:8px;color:${isDark ? '#aaa' : '#666'};font-weight:bold;cursor:pointer;font-size:16px;opacity:0.6;">Import</button>
          <span id="import-chatgpt-status" style="margin-left:12px;font-size:13px;color:${isDark ? '#fff' : '#007bff'}"></span>
          <div id="import-chatgpt-progress-container" style="margin-top:12px;height:18px;width:100%;background:${isDark ? '#23272f' : '#e1e5e9'};border-radius:8px;display:none;overflow:hidden;">
            <div id="import-chatgpt-progress" style="height:100%;width:0%;background:${isDark ? '#fff' : '#b2c7f7'};transition:width 0.2s;"></div>
          </div>
        </div>
      </div>
    `;
    
    // API Key management
    const apiKeyInput = tabContent.querySelector('#openai-api-key');
    const saveApiKeyBtn = tabContent.querySelector('#save-api-key-btn');
    const debugApiKeyBtn = tabContent.querySelector('#debug-api-key-btn');
    const clearApiKeyBtn = tabContent.querySelector('#clear-api-key-btn');
    const apiKeyStatus = tabContent.querySelector('#api-key-status');
    
    saveApiKeyBtn.onclick = async () => {
      const apiKey = apiKeyInput.value.trim();
      console.log('API Key length:', apiKey.length);
      console.log('API Key starts with:', apiKey.substring(0, 10) + '...');
      
      if (!apiKey) {
        apiKeyStatus.textContent = 'Please enter an API key';
        return;
      }
      
      // Check for problematic characters
      if (!/^[a-zA-Z0-9\-_]+$/.test(apiKey)) {
        apiKeyStatus.textContent = 'API key contains invalid characters. Please check your API key.';
        return;
      }
      
      saveApiKeyBtn.disabled = true;
      saveApiKeyBtn.textContent = 'Testing...';
      apiKeyStatus.textContent = 'Testing API key...';
      
      try {
        // Initialize insight extraction service with the API key
        if (window.insightExtractionService) {
          await window.insightExtractionService.initialize(apiKey);
          
          // Save API key to storage
          chrome.storage.local.set({ openaiApiKey: apiKey }, () => {
            apiKeyStatus.textContent = 'API key saved and tested successfully!';
            saveApiKeyBtn.textContent = 'Save API Key';
            saveApiKeyBtn.disabled = false;
          });
        } else {
          throw new Error('Insight extraction service not available');
        }
      } catch (error) {
        console.error('Failed to test API key:', error);
        apiKeyStatus.textContent = `Error: ${error.message}`;
        saveApiKeyBtn.textContent = 'Save API Key';
        saveApiKeyBtn.disabled = false;
      }
    };
    
    // Debug button functionality
    debugApiKeyBtn.onclick = async () => {
      console.log('=== API Key Debug Info ===');
      
      // Check storage
      const result = await new Promise((resolve) => {
        chrome.storage.local.get({ openaiApiKey: '' }, resolve);
      });
      console.log('Stored API key:', result.openaiApiKey ? 'Present' : 'Not found');
      console.log('Stored API key length:', result.openaiApiKey ? result.openaiApiKey.length : 0);
      if (result.openaiApiKey) {
        const masked = result.openaiApiKey.substring(0, 4) + '••••••••' + result.openaiApiKey.substring(result.openaiApiKey.length - 4);
        console.log('Stored API key (masked):', masked);
        console.log('Stored API key starts with:', result.openaiApiKey.substring(0, 10) + '...');
        console.log('Stored API key format valid:', result.openaiApiKey.startsWith('sk-') && result.openaiApiKey.length === 51);
        console.log('Stored API key contains only valid chars:', /^[a-zA-Z0-9\-_]+$/.test(result.openaiApiKey));
        
        // Check for non-ASCII characters
        const nonAsciiChars = result.openaiApiKey.match(/[^\x00-\x7F]/g);
        if (nonAsciiChars) {
          console.warn('Stored API key contains non-ASCII characters:', nonAsciiChars);
        }
      }
      
      // Check service status
      console.log('Insight extraction service available:', !!window.insightExtractionService);
      if (window.insightExtractionService) {
        console.log('Service initialized:', window.insightExtractionService.isInitialized);
        console.log('Service ready:', window.insightExtractionService.isReady());
        console.log('Service status:', window.insightExtractionService.getStatus());
        
        // Check the service's stored API key
        if (window.insightExtractionService.apiKey) {
          console.log('Service API key length:', window.insightExtractionService.apiKey.length);
          console.log('Service API key starts with:', window.insightExtractionService.apiKey.substring(0, 10) + '...');
          console.log('Service API key format valid:', window.insightExtractionService.apiKey.startsWith('sk-') && window.insightExtractionService.apiKey.length === 51);
        }
      }
      
      // Test current input value
      const currentInputValue = apiKeyInput.value.trim();
      console.log('Current input value:', currentInputValue ? 'Present' : 'Empty');
      console.log('Input value length:', currentInputValue.length);
      if (currentInputValue) {
        const masked = currentInputValue.substring(0, 4) + '••••••••' + currentInputValue.substring(currentInputValue.length - 4);
        console.log('Input value (masked):', masked);
        console.log('Input value starts with:', currentInputValue.substring(0, 10) + '...');
        console.log('Input value format valid:', currentInputValue.startsWith('sk-'));
        console.log('Input value contains only valid chars:', /^[a-zA-Z0-9\-_]+$/.test(currentInputValue));
      }
      
      // Compare stored vs input
      if (result.openaiApiKey && currentInputValue) {
        console.log('Stored and input match:', result.openaiApiKey === currentInputValue);
        if (result.openaiApiKey !== currentInputValue) {
          console.log('Mismatch detected! This might indicate corruption.');
          console.log('Stored length:', result.openaiApiKey.length, 'Input length:', currentInputValue.length);
        }
      } else if (result.openaiApiKey && !currentInputValue) {
        console.log('API key is stored but input field is empty (this is normal)');
      } else if (!result.openaiApiKey && currentInputValue) {
        console.log('Input field has value but nothing is stored yet');
      } else {
        console.log('No API key stored and input field is empty');
      }
      
      apiKeyStatus.textContent = 'Debug info logged to console';
      setTimeout(() => {
        apiKeyStatus.textContent = '';
      }, 3000);
    };
    
    // Clear API key button functionality
    clearApiKeyBtn.onclick = async () => {
      if (confirm('Are you sure you want to clear the stored API key? This will disable insight extraction until you enter a new key.')) {
        try {
          // Clear from storage
          chrome.storage.local.remove('openaiApiKey', () => {
            console.log('API key cleared from storage');
          });
          
          // Reset the service
          if (window.insightExtractionService) {
            window.insightExtractionService.reset();
            console.log('Insight extraction service reset');
          }
          
          // Clear input field
          apiKeyInput.value = '';
          
          // Update status display
          const statusDisplay = tabContent.querySelector('#api-key-status-display');
          if (statusDisplay) {
            statusDisplay.textContent = 'No API key saved';
          }
          
          apiKeyStatus.textContent = 'API key cleared successfully';
          setTimeout(() => {
            apiKeyStatus.textContent = '';
          }, 3000);
          
        } catch (error) {
          console.error('Error clearing API key:', error);
          apiKeyStatus.textContent = 'Error clearing API key';
          setTimeout(() => {
            apiKeyStatus.textContent = '';
          }, 3000);
        }
      }
    };
    
    // Initialize insight extraction service if API key exists
    if (currentApiKey && currentApiKey.trim() && window.insightExtractionService) {
      // Validate the stored API key before using it
      if (!currentApiKey.startsWith('sk-') || !/^[a-zA-Z0-9\-_]+$/.test(currentApiKey)) {
        console.error('Stored API key appears to be corrupted:', currentApiKey.substring(0, 10) + '...');
        apiKeyStatus.textContent = 'Stored API key appears corrupted. Please re-enter your API key.';
        // Clear the corrupted key
        chrome.storage.local.remove('openaiApiKey');
        return;
      }
      
      // Only initialize if the service is not already initialized
      if (!window.insightExtractionService.isReady()) {
        window.insightExtractionService.initialize(currentApiKey).then(() => {
          console.log('Settings tab: Insight extraction service initialized with saved API key');
        }).catch(error => {
          console.error('Settings tab: Failed to initialize insight extraction service:', error);
          apiKeyStatus.textContent = 'Failed to initialize with saved API key. Please re-enter your API key.';
          // Clear the problematic key
          chrome.storage.local.remove('openaiApiKey');
        });
      } else {
        console.log('Settings tab: Insight extraction service already initialized');
      }
    }
    
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

    // Migrate folders button
    const migrateFoldersBtn = tabContent.querySelector('#migrate-folders-btn');
    migrateFoldersBtn.onclick = async () => {
      migrateFoldersBtn.disabled = true;
      migrateFoldersBtn.textContent = 'Migrating...';
      
      try {
        if (window.memoryChatIDB && window.memoryChatIDB.migrateFoldersToPointers) {
          const result = await window.memoryChatIDB.migrateFoldersToPointers();
          if (window.showFeedback) window.showFeedback(`Migrated ${result.migratedFolders} folders to new format!`, 'success');
          // Refresh the storage tab to show updated folder counts
          if (window.renderStorageTab) window.renderStorageTab();
        } else {
          if (window.showFeedback) window.showFeedback('IndexedDB not available.', 'error');
        }
      } catch (error) {
        console.error('Error migrating folders:', error);
        if (window.showFeedback) window.showFeedback('Error migrating folders: ' + error.message, 'error');
      } finally {
        migrateFoldersBtn.disabled = false;
        migrateFoldersBtn.textContent = 'Migrate Folders to New Format';
      }
    };

    // Debug IndexedDB button
    const debugIndexedDBBtn = tabContent.querySelector('#debug-indexeddb-btn');
    debugIndexedDBBtn.onclick = async () => {
      debugIndexedDBBtn.disabled = true;
      debugIndexedDBBtn.textContent = 'Debugging...';
      
      try {
        if (window.memoryChatIDB && window.memoryChatIDB.debugIndexedDB) {
          const result = await window.memoryChatIDB.debugIndexedDB();
          console.log('IndexedDB debug result:', result);
          if (window.showFeedback) window.showFeedback(`IndexedDB debug complete. Check console for details.`, 'success');
        } else {
          if (window.showFeedback) window.showFeedback('IndexedDB not available.', 'error');
        }
      } catch (error) {
        console.error('Error debugging IndexedDB:', error);
        if (window.showFeedback) window.showFeedback('Error debugging IndexedDB: ' + error.message, 'error');
      } finally {
        debugIndexedDBBtn.disabled = false;
        debugIndexedDBBtn.textContent = 'Debug IndexedDB';
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

    importBtn.onclick = async () => {
      if (!fileContent) {
        statusSpan.textContent = 'Please select a JSON file first.';
        return;
      }
      
      if (!window.insightExtractionService || !window.insightExtractionService.isReady()) {
        statusSpan.textContent = 'Insight extraction service not available. Please check your OpenAI API key.';
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
      statusSpan.textContent = `Processing ${messageObjs.length} messages for insight extraction... (This may take several minutes for large imports)`;
      // Batch in chunks for progress bar
      const batchSize = 50; // Smaller batch size for insight extraction
      let imported = 0, skipped = 0, processed = 0;
      async function processBatch(startIdx) {
        if (startIdx >= messageObjs.length) {
          progressBar.style.width = '100%';
          statusSpan.textContent = `Imported ${imported} new insights, skipped ${skipped} duplicates.`;
          progressContainer.style.display = 'none';
          if (window.showFeedback) window.showFeedback(`Imported ${imported} new insights, skipped ${skipped} duplicates.`, 'success');
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
          statusSpan.textContent = 'Error during import: ' + (err && err.message ? err.message : err);
          progressContainer.style.display = 'none';
          if (window.showFeedback) window.showFeedback('Error during import: ' + (err && err.message ? err.message : err), 'error');
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
  
  // Folder click to view contents
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
    btn.onclick = async (e) => {
      e.stopPropagation();
      const folderName = btn.dataset.folder;
      
      // Get folder contents with resolved message data
      let folderMessages = [];
      if (window.memoryChatIDB && window.memoryChatIDB.getFolderContents) {
        folderMessages = await window.memoryChatIDB.getFolderContents(folderName);
      }
      
      if (folderMessages.length > 0) {
        const prompt = document.querySelector('.ProseMirror');
        if (prompt) {
          let current = prompt.innerText.trim();
          const preface = `Here are messages from folder "${folderName}":`;
          let newText = '';
          
          // Convert messages to text format
          const messageTexts = folderMessages.map(msg => {
            const insights = msg.insights || msg.text;
            return Array.isArray(insights) ? insights.join('\n') : insights;
          });
          
          if (current.includes(preface)) {
            newText = current + '\n' + messageTexts.map(text => `- ${text}`).join('\n');
          } else {
            newText = (current ? current + '\n' : '') + preface + '\n' + messageTexts.map(text => `- ${text}`).join('\n');
          }
          
          // Set the prompt text using a more reliable method that preserves newlines
          prompt.focus();
          
          // Clear existing content
          prompt.innerHTML = '';
          
          // Convert newlines to <br> tags and insert as HTML to preserve formatting
          const formattedText = newText.replace(/\n/g, '<br>');
          prompt.innerHTML = formattedText;
          
          // Move cursor to end
          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(prompt);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
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