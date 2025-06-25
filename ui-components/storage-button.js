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
        // Similarity search
        const scored = logs.map(log => ({...log, score: cosineSimilarity(prompt, log.text, logs.map(l => l.text))}));
        scored.sort((a, b) => b.score - a.score);
        const top = scored.slice(0, 3).filter(l => l.score > 0);
        if (top.length === 0) {
          tabContent.innerHTML = '<div style="text-align:center;color:#888;">No relevant messages found</div>';
        } else {
          tabContent.innerHTML = top.map(log => renderLogCard(log)).join('');
        }
      } else if (activeTab === 'recent') {
        const top = logs.slice(-3).reverse();
        if (top.length === 0) {
          tabContent.innerHTML = '<div style="text-align:center;color:#888;">No messages stored yet</div>';
        } else {
          tabContent.innerHTML = top.map(log => renderLogCard(log)).join('');
        }
      } else if (activeTab === 'all') {
        if (logs.length === 0) {
          tabContent.innerHTML = '<div style="text-align:center;color:#888;">No messages stored yet</div>';
        } else {
          tabContent.innerHTML = logs.map(log => renderLogCard(log)).join('');
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
            resultsDiv.innerHTML = top.map(log => renderLogCard(log)).join('');
          }
        });
      } else if (activeTab === 'settings') {
        tabContent.innerHTML = `<button id="clear-logs-btn" style="display:block;margin:32px auto 16px auto;padding:10px 28px;background:linear-gradient(90deg,#f7d6b2 0%,#f7b2b2 100%);border:none;border-radius:10px;color:#222;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.08);cursor:pointer;font-size:16px;transition:background 0.2s,color 0.2s;">Clear All Logs</button>`;
        const clearBtn = tabContent.querySelector('#clear-logs-btn');
        clearBtn.onmouseenter = () => clearBtn.style.background = '#f7b2b2';
        clearBtn.onmouseleave = () => clearBtn.style.background = 'linear-gradient(90deg,#f7d6b2 0%,#f7b2b2 100%)';
        clearBtn.onclick = () => {
          chrome.storage.local.set({ chatLogs: [] }, () => {
            // After clearing, update all log buttons
            document.querySelectorAll('.memory-chat-log-btn').forEach(b => {
              b.textContent = 'Add to Log';
              b.style.background = 'linear-gradient(90deg, #b2f7ef 0%, #c2f7cb 100%)';
              b.style.color = '#222';
            });
            renderTab();
          });
        };
      }
      // Attach plus button listeners after rendering
      setTimeout(attachPlusListeners, 0);
    });
  }

  // Card renderer with plus button (safe DOM)
  function renderLogCard(log) {
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

    // Message content
    const contentDiv = document.createElement('div');
    contentDiv.style.flex = '1';
    contentDiv.style.minWidth = '0';
    // Split message by newlines and add <br>
    log.text.split('\n').forEach((line, idx, arr) => {
      const span = document.createElement('span');
      span.textContent = line;
      contentDiv.appendChild(span);
      if (idx < arr.length - 1) contentDiv.appendChild(document.createElement('br'));
    });
    // Timestamp
    const ts = document.createElement('div');
    ts.style.color = '#888';
    ts.style.fontSize = '11px';
    ts.textContent = new Date(log.timestamp).toLocaleString();
    contentDiv.appendChild(ts);

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

    card.appendChild(contentDiv);
    card.appendChild(plusBtn);
    return card.outerHTML;
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
    if (area === 'local' && changes.chatLogs) {
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