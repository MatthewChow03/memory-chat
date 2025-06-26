// Create and inject the storage UI
function createStorageUI() {
  if (document.getElementById('memory-chat-storage')) return;
  
  const storageUI = document.createElement('div');
  storageUI.id = 'memory-chat-storage';
  storageUI.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 600px;
    max-height: 700px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    z-index: 10000;
    display: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    border: 1px solid #e1e5e9;
  `;
  
  storageUI.innerHTML = `
    <div style="padding: 20px; border-bottom: 1px solid #e1e5e9; display: flex; justify-content: space-between; align-items: center;">
      <h3 style="margin: 0; color: #1a1a1a; font-size: 18px;">Message Storage</h3>
      <button id="memory-chat-close" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #666;">×</button>
    </div>
    <div id="memory-chat-tabs" style="display: flex; border-bottom: 1px solid #e1e5e9;">
      <button class="storage-tab" data-tab="relevant" style="flex:1; padding: 10px; border:none; background:none; font-weight:bold; cursor:pointer;">Relevant</button>
      <button class="storage-tab" data-tab="recent" style="flex:1; padding: 10px; border:none; background:none; font-weight:bold; cursor:pointer;">Recent</button>
      <button class="storage-tab" data-tab="all" style="flex:1; padding: 10px; border:none; background:none; font-weight:bold; cursor:pointer;">All</button>
      <button class="storage-tab" data-tab="search" style="flex:1; padding: 10px; border:none; background:none; font-weight:bold; cursor:pointer;">Search</button>
      <button class="storage-tab" data-tab="folders" style="flex:1; padding: 10px; border:none; background:none; font-weight:bold; cursor:pointer;">Folders</button>
      <button class="storage-tab" data-tab="settings" style="flex:1; padding: 10px; border:none; background:none; font-weight:bold; cursor:pointer;">Settings</button>
    </div>
    <div id="memory-chat-tab-content" style="padding: 20px; max-height: 440px; overflow-y: auto;"></div>
  `;
  
  document.body.appendChild(storageUI);
  
  // Tab switching logic
  const tabContent = storageUI.querySelector('#memory-chat-tab-content');
  const tabs = Array.from(storageUI.querySelectorAll('.storage-tab'));
  let activeTab = 'relevant';

  function setActiveTab(tab) {
    activeTab = tab;
    tabs.forEach(t => t.style.background = t.dataset.tab === tab ? '#f8f9fa' : 'none');
    renderTab();
  }
  tabs.forEach(t => t.onclick = () => setActiveTab(t.dataset.tab));

  // Render logic for each tab
  function renderTab() {
    chrome.storage.local.get({ chatLogs: [] }, (result) => {
      const logs = result.chatLogs;
      // Helper to clear and append cards
      function renderCards(cards) {
        tabContent.innerHTML = '';
        cards.forEach((log, idx) => tabContent.appendChild(renderLogCard(log, idx)));
      }
      if (activeTab === 'relevant') {
        const prompt = getPromptText();
        if (!prompt) {
          tabContent.innerHTML = '<div style="text-align:center;color:#888;">Start entering your prompt</div>';
          return;
        }
        if (logs.length === 0) {
          tabContent.innerHTML = '<div style="text-align:center;color:#888;">No messages stored yet</div>';
          return;
        }
        const scored = logs.map(log => ({...log, score: cosineSimilarity(prompt, log.text, logs.map(l => l.text))}));
        scored.sort((a, b) => b.score - a.score);
        const top = scored.slice(0, 3).filter(l => l.score > 0);
        if (top.length === 0) {
          tabContent.innerHTML = '<div style="text-align:center;color:#888;">No relevant messages found</div>';
        } else {
          renderCards(top);
        }
      } else if (activeTab === 'recent') {
        const top = logs.slice(-3).reverse();
        if (top.length === 0) {
          tabContent.innerHTML = '<div style="text-align:center;color:#888;">No messages stored yet</div>';
        } else {
          renderCards(top);
        }
      } else if (activeTab === 'all') {
        if (logs.length === 0) {
          tabContent.innerHTML = '<div style="text-align:center;color:#888;">No messages stored yet</div>';
        } else {
          renderCards(logs);
        }
      } else if (activeTab === 'search') {
        tabContent.innerHTML = `<input id="storage-search-input" type="text" placeholder="Search..." style="width:100%;margin-bottom:12px;padding:8px;border-radius:6px;border:1px solid #e1e5e9;outline:none;" />
        <div id="storage-search-results"></div>`;
        const input = tabContent.querySelector('#storage-search-input');
        const resultsDiv = tabContent.querySelector('#storage-search-results');
        input.addEventListener('input', () => {
          const term = input.value.trim();
          if (!term) {
            resultsDiv.innerHTML = '';
            return;
          }
          const scored = logs.map(log => ({...log, score: cosineSimilarity(term, log.text, logs.map(l => l.text))}));
          scored.sort((a, b) => b.score - a.score);
          const top = scored.slice(0, 3).filter(l => l.score > 0);
          if (top.length === 0) {
            resultsDiv.innerHTML = '<div style="text-align:center;color:#888;">No results found</div>';
          } else {
            resultsDiv.innerHTML = '';
            top.forEach((log, idx) => resultsDiv.appendChild(renderLogCard(log, idx)));
          }
        });
      } else if (activeTab === 'folders') {
        chrome.storage.local.get({ folders: {} }, (result) => {
          const folders = result.folders;
          const folderNames = Object.keys(folders);
          
          if (folderNames.length === 0) {
            tabContent.innerHTML = `
              <div style="text-align:center;color:#888;margin-bottom:20px;">No folders created yet</div>
              <button id="create-folder-btn" style="display:block;margin:0 auto;padding:10px 20px;background:linear-gradient(90deg,#b2f7ef 0%,#c2f7cb 100%);border:none;border-radius:8px;color:#222;font-weight:bold;cursor:pointer;">Create New Folder</button>
            `;
            const createBtn = tabContent.querySelector('#create-folder-btn');
            createBtn.onclick = () => {
              const folderName = prompt('Enter folder name:');
              if (folderName && folderName.trim()) {
                const newFolders = { ...folders, [folderName.trim()]: [] };
                chrome.storage.local.set({ folders: newFolders }, () => {
                  renderTab();
                });
              }
            };
          } else {
            let foldersHTML = `
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                <h4 style="margin:0;color:#1a1a1a;">Your Folders</h4>
                <button id="create-folder-btn" style="padding:8px 16px;background:linear-gradient(90deg,#b2f7ef 0%,#c2f7cb 100%);border:none;border-radius:6px;color:#222;font-weight:bold;cursor:pointer;font-size:12px;">+ New Folder</button>
              </div>
            `;
            
            folderNames.forEach(folderName => {
              const messageCount = folders[folderName].length;
              foldersHTML += `
                <div class="folder-item" data-folder="${folderName}" style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:#f8f9fa;border:1px solid #e1e5e9;border-radius:8px;margin-bottom:8px;cursor:pointer;">
                  <div style="flex:1;">
                    <div style="font-weight:bold;color:#1a1a1a;">${folderName}</div>
                    <div style="font-size:12px;color:#888;">${messageCount} message${messageCount !== 1 ? 's' : ''}</div>
                  </div>
                  <div style="display:flex;gap:8px;">
                    <button class="folder-plus-btn" data-folder="${folderName}" style="background:#e6f7e6;border:none;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#222;" title="Add all messages to prompt">+</button>
                    <button class="folder-delete-btn" data-folder="${folderName}" style="background:#f7e6e6;border:none;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;color:#d32f2f;" title="Delete folder">×</button>
                  </div>
                </div>
              `;
            });
            
            tabContent.innerHTML = foldersHTML;
            
            // Create folder button
            const createBtn = tabContent.querySelector('#create-folder-btn');
            createBtn.onclick = () => {
              const folderName = prompt('Enter folder name:');
              if (folderName && folderName.trim()) {
                const newFolders = { ...folders, [folderName.trim()]: [] };
                chrome.storage.local.set({ folders: newFolders }, () => {
                  renderTab();
                });
              }
            };
            
            // Folder click to view contents
            tabContent.querySelectorAll('.folder-item').forEach(item => {
              item.onclick = (e) => {
                if (!e.target.classList.contains('folder-plus-btn') && !e.target.classList.contains('folder-delete-btn')) {
                  const folderName = item.dataset.folder;
                  viewFolderContents(folderName);
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
              btn.onclick = (e) => {
                e.stopPropagation();
                const folderName = btn.dataset.folder;
                if (confirm(`Are you sure you want to delete the folder "${folderName}"?`)) {
                  const newFolders = { ...folders };
                  delete newFolders[folderName];
                  chrome.storage.local.set({ folders: newFolders }, () => {
                    renderTab();
                  });
                }
              };
            });
          }
        });
      } else if (activeTab === 'settings') {
        tabContent.innerHTML = `
          <button id="clear-logs-btn" style="display:block;margin:0 0 16px 0;padding:10px 28px;background:linear-gradient(90deg,#f7d6b2 0%,#f7b2b2 100%);border:none;border-radius:10px;color:#222;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.08);cursor:pointer;font-size:16px;transition:background 0.2s,color 0.2s;text-align:left;">Clear All Logs</button>
          <button id="add-full-chat-btn" style="display:block;margin:0 0 16px 0;padding:10px 28px;background:linear-gradient(90deg,#b2f7ef 0%,#c2f7cb 100%);border:none;border-radius:10px;color:#222;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.08);cursor:pointer;font-size:16px;transition:background 0.2s,color 0.2s;text-align:left;">Add Full Chat to Log</button>
        `;
        const clearBtn = tabContent.querySelector('#clear-logs-btn');
        clearBtn.onmouseenter = () => clearBtn.style.background = '#f7b2b2';
        clearBtn.onmouseleave = () => clearBtn.style.background = 'linear-gradient(90deg,#f7d6b2 0%,#f7b2b2 100%)';
        clearBtn.onclick = () => {
          chrome.storage.local.set({ chatLogs: [], folders: {} }, () => {
            document.querySelectorAll('.memory-chat-log-btn').forEach(b => {
              b.textContent = 'Add to Log';
              b.style.background = 'linear-gradient(90deg, #b2f7ef 0%, #c2f7cb 100%)';
              b.style.color = '#222';
            });
            renderTab();
          });
        };
        const addFullBtn = tabContent.querySelector('#add-full-chat-btn');
        addFullBtn.onmouseenter = () => addFullBtn.style.background = '#a0eec0';
        addFullBtn.onmouseleave = () => addFullBtn.style.background = 'linear-gradient(90deg,#b2f7ef 0%,#c2f7cb 100%)';
        addFullBtn.onclick = () => {
          const messages = Array.from(document.querySelectorAll('[data-message-author-role]'));
          const texts = messages.map(msg => getMessageText(msg));
          chrome.storage.local.get({ chatLogs: [] }, (result) => {
            let chatLogs = result.chatLogs;
            let added = false;
            texts.forEach(text => {
              if (!chatLogs.some(log => log.text === text)) {
                chatLogs.push({ text, timestamp: Date.now() });
                added = true;
              }
            });
            chrome.storage.local.set({ chatLogs }, () => {
              document.querySelectorAll('.memory-chat-log-btn').forEach(b => {
                b.textContent = 'Remove from Log';
                b.style.background = '#f7b2b2';
                b.style.color = '#222';
              });
              renderTab();
            });
          });
        };
      }
      setTimeout(attachPlusListeners, 0);
    });
  }

  // Card renderer with plus button (safe DOM, with show more/less, footer always visible)
  function renderLogCard(log, idx) {
    // Card container
    const card = document.createElement('div');
    card.style.background = '#f8f9fa';
    card.style.border = '1px solid #e1e5e9';
    card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
    card.style.borderRadius = '8px';
    card.style.margin = '18px 0';
    card.style.padding = '16px';
    card.style.fontSize = '14px';
    card.style.lineHeight = '1.4';
    card.style.wordBreak = 'break-word';
    card.style.display = 'flex';
    card.style.alignItems = 'flex-start';
    card.style.justifyContent = 'space-between';
    card.style.gap = '8px';

    // Message text (clamped, single block)
    const textDiv = document.createElement('div');
    textDiv.className = 'storage-log-content clamped';
    textDiv.style.flex = '1';
    textDiv.style.minWidth = '0';
    textDiv.style.whiteSpace = 'pre-line';
    textDiv.textContent = log.text;

    // Footer (timestamp + show more/less)
    const footerDiv = document.createElement('div');
    footerDiv.style.display = 'flex';
    footerDiv.style.alignItems = 'center';
    footerDiv.style.justifyContent = 'space-between';
    footerDiv.style.marginTop = '8px';
    // Timestamp
    const ts = document.createElement('div');
    ts.style.color = '#888';
    ts.style.fontSize = '11px';
    ts.textContent = new Date(log.timestamp).toLocaleString();
    // Show more/less button
    const showBtn = document.createElement('button');
    showBtn.textContent = 'Show more';
    showBtn.style.background = 'none';
    showBtn.style.border = 'none';
    showBtn.style.color = '#007bff';
    showBtn.style.cursor = 'pointer';
    showBtn.style.fontSize = '13px';
    showBtn.style.padding = '0';
    showBtn.style.display = (log.text.split('\n').length > 4) ? 'block' : 'none';
    showBtn.className = 'storage-show-btn';
    let expanded = false;
    showBtn.onclick = () => {
      expanded = !expanded;
      if (expanded) {
        textDiv.classList.remove('clamped');
        textDiv.classList.add('expanded');
        showBtn.textContent = 'Show less';
      } else {
        textDiv.classList.remove('expanded');
        textDiv.classList.add('clamped');
        showBtn.textContent = 'Show more';
      }
    };
    footerDiv.appendChild(ts);
    footerDiv.appendChild(showBtn);

    // Plus button
    const plusBtn = document.createElement('button');
    plusBtn.className = 'storage-plus-btn';
    plusBtn.setAttribute('data-log', encodeURIComponent(log.text));
    plusBtn.title = 'Add to prompt';
    plusBtn.style.background = '#e6f7e6';
    plusBtn.style.border = 'none';
    plusBtn.style.borderRadius = '50%';
    plusBtn.style.width = '32px';
    plusBtn.style.height = '32px';
    plusBtn.style.display = 'flex';
    plusBtn.style.alignItems = 'center';
    plusBtn.style.justifyContent = 'center';
    plusBtn.style.cursor = 'pointer';
    plusBtn.style.fontSize = '20px';
    plusBtn.textContent = '+';

    // Stack text, footer, plus button
    const leftCol = document.createElement('div');
    leftCol.style.flex = '1';
    leftCol.style.minWidth = '0';
    leftCol.appendChild(textDiv);
    leftCol.appendChild(footerDiv);
    card.appendChild(leftCol);
    card.appendChild(plusBtn);
    return card;
  }

  // Function to view folder contents
  function viewFolderContents(folderName) {
    chrome.storage.local.get({ folders: {} }, (result) => {
      const folders = result.folders;
      const folderMessages = folders[folderName] || [];
      
      let contentHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <button id="back-to-folders" style="background:none;border:none;color:#007bff;cursor:pointer;font-size:14px;padding:0;">← Back to Folders</button>
          <h4 style="margin:0;color:#1a1a1a;">${folderName}</h4>
          <div style="width:80px;"></div>
        </div>
      `;
      
      if (folderMessages.length === 0) {
        contentHTML += '<div style="text-align:center;color:#888;">This folder is empty</div>';
      } else {
        folderMessages.forEach((message, idx) => {
          // Handle both old format (string) and new format (object with text and timestamp)
          const messageText = typeof message === 'string' ? message : message.text;
          const messageTimestamp = typeof message === 'string' ? Date.now() : message.timestamp;
          const messageLines = messageText.split('\n').length;
          const showMoreBtn = messageLines > 4 ? 'block' : 'none';
          
          contentHTML += `
            <div style="background:#f8f9fa;border:1px solid #e1e5e9;border-radius:8px;margin-bottom:8px;padding:12px;font-size:14px;line-height:1.4;">
              <div class="folder-message-content clamped" style="white-space:pre-line;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;text-overflow:ellipsis;max-height:5.6em;">${messageText}</div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <div style="color:#888;font-size:11px;">${new Date(messageTimestamp).toLocaleString()}</div>
                  <button class="folder-show-btn" data-index="${idx}" style="background:none;border:none;color:#007bff;cursor:pointer;font-size:13px;padding:0;display:${showMoreBtn};">Show more</button>
                </div>
                <button class="remove-from-folder" data-folder="${folderName}" data-index="${idx}" style="background:#f7e6e6;border:none;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:12px;color:#d32f2f;">Remove</button>
              </div>
            </div>
          `;
        });
      }
      
      tabContent.innerHTML = contentHTML;
      
      // Back button
      tabContent.querySelector('#back-to-folders').onclick = () => {
        renderTab();
      };
      
      // Show more/less buttons for folder messages
      tabContent.querySelectorAll('.folder-show-btn').forEach(btn => {
        let expanded = false;
        btn.onclick = () => {
          const index = parseInt(btn.dataset.index);
          const messageDiv = tabContent.querySelectorAll('.folder-message-content')[index];
          
          expanded = !expanded;
          if (expanded) {
            messageDiv.classList.remove('clamped');
            messageDiv.classList.add('expanded');
            messageDiv.style.display = 'block';
            messageDiv.style.maxHeight = 'none';
            messageDiv.style.overflow = 'visible';
            btn.textContent = 'Show less';
          } else {
            messageDiv.classList.remove('expanded');
            messageDiv.classList.add('clamped');
            messageDiv.style.display = '-webkit-box';
            messageDiv.style.maxHeight = '5.6em';
            messageDiv.style.overflow = 'hidden';
            btn.textContent = 'Show more';
          }
        };
      });
      
      // Remove from folder buttons
      tabContent.querySelectorAll('.remove-from-folder').forEach(btn => {
        btn.onclick = () => {
          const folderName = btn.dataset.folder;
          const index = parseInt(btn.dataset.index);
          const newFolders = { ...folders };
          newFolders[folderName].splice(index, 1);
          chrome.storage.local.set({ folders: newFolders }, () => {
            viewFolderContents(folderName);
          });
        };
      });
    });
  }

  // Attach plus button listeners
  function attachPlusListeners() {
    const plusBtns = storageUI.querySelectorAll('.storage-plus-btn');
    plusBtns.forEach(btn => {
      btn.onclick = () => {
        const text = decodeURIComponent(btn.getAttribute('data-log'));
        const prompt = document.querySelector('.ProseMirror');
        if (!prompt) return;
        let current = prompt.innerText.trim();
        const preface = 'Here is a useful memory for this conversation:';
        // Check if preface exists
        let newText = '';
        if (current.includes(preface)) {
          // Add as new bullet point
          newText = current.replace(new RegExp(`(${preface}[\s\S]*?)(\n|$)`), (match, p1) => {
            // Find where the bullets end
            return p1.endsWith('\n') ? p1 : p1 + '\n';
          });
          // Add bullet
          newText = current + `\n- ${text}`;
        } else {
          // Add preface and bullet
          newText = (current ? current + '\n' : '') + preface + '\n- ' + text;
        }
        // Set the prompt text (simulate typing)
        prompt.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, newText);
      };
    });
  }

  // Initial render
  setActiveTab('relevant');

  // Live update: re-render on prompt input changes
  const prompt = document.querySelector('.ProseMirror');
  if (prompt) {
    prompt.addEventListener('input', () => {
      if (storageUI.style.display !== 'none' && activeTab === 'relevant') {
        renderTab();
      }
    });
  }

  // Live update: re-render on storage changes
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes.chatLogs || changes.folders)) {
      if (storageUI.style.display !== 'none') {
        renderTab();
      }
    }
  });
  
  // Close button functionality
  document.getElementById('memory-chat-close').onclick = () => {
    storageUI.style.display = 'none';
  };
  
  // Close on outside click
  storageUI.onclick = (e) => {
    if (e.target === storageUI) {
      storageUI.style.display = 'none';
    }
  };

  if (!document.getElementById('memory-chat-storage-style')) {
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
    `;
    document.head.appendChild(style);
  }
}

// Add storage button to ChatGPT interface
function addStorageButton() {
  if (document.querySelector('.memory-chat-view-btn')) return;
  
  // Find the composer footer actions container
  const footerActions = document.querySelector('div[data-testid="composer-footer-actions"]');
  if (!footerActions) return;

  const storageBtn = document.createElement('button');
  storageBtn.className = 'memory-chat-view-btn';
  storageBtn.innerHTML = '📋';
  storageBtn.title = 'View Message Storage';
  storageBtn.style.cssText = `
    background: linear-gradient(90deg, #b2f7ef 0%, #c2f7cb 100%);
    border: none;
    border-radius: 8px;
    padding: 8px 12px;
    margin-left: 8px;
    cursor: pointer;
    font-size: 16px;
    transition: background 0.2s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  `;
  
  storageBtn.onmouseenter = () => storageBtn.style.background = '#a0eec0';
  storageBtn.onmouseleave = () => storageBtn.style.background = 'linear-gradient(90deg, #b2f7ef 0%, #c2f7cb 100%)';

  storageBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const storageUI = document.getElementById('memory-chat-storage');
    if (storageUI) {
      storageUI.style.display = storageUI.style.display === 'none' ? 'block' : 'none';
      if (storageUI.style.display === 'block') {
        loadAndDisplayLogs();
      }
    }
  };
  
  // Append the storage button to the footer actions
  footerActions.appendChild(storageBtn);
} 