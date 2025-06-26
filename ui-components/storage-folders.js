// Storage Folders Module
// Handles folder management, folder contents viewing, and folder operations

// View folder contents
function viewFolderContents(folderName) {
  const storageUI = document.getElementById('memory-chat-storage');
  if (!storageUI) return;
  
  const tabContent = storageUI.querySelector('#memory-chat-tab-content');
  if (!tabContent) return;
  
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
    
    // Setup folder content event handlers
    setupFolderContentEventHandlers(tabContent, folderName, folders);
  });
}

// Setup folder content event handlers
function setupFolderContentEventHandlers(tabContent, folderName, folders) {
  // Back button
  tabContent.querySelector('#back-to-folders').onclick = () => {
    if (window.renderTab) {
      window.renderTab();
    }
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
}

// Show folder selector popup
function showFolderSelector(messageElement) {
  // Remove existing popup if any
  const existingPopup = document.getElementById('memory-chat-folder-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  chrome.storage.local.get({ folders: {} }, (result) => {
    const folders = result.folders;
    const folderNames = Object.keys(folders);
    
    const popup = document.createElement('div');
    popup.id = 'memory-chat-folder-popup';
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 400px;
      max-height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      border: 1px solid #e1e5e9;
    `;
    
    let popupHTML = `
      <div style="padding: 20px; border-bottom: 1px solid #e1e5e9; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; color: #1a1a1a; font-size: 18px;">Add to Folder</h3>
        <button id="memory-chat-folder-close" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #666;">×</button>
      </div>
      <div style="padding: 20px;">
    `;
    
    if (folderNames.length === 0) {
      popupHTML += `
        <div style="text-align: center; color: #888; margin-bottom: 20px;">No folders created yet</div>
        <button id="create-folder-from-popup" style="display: block; margin: 0 auto; padding: 10px 20px; background: linear-gradient(90deg,#b2f7ef 0%,#c2f7cb 100%); border: none; border-radius: 8px; color: #222; font-weight: bold; cursor: pointer;">Create New Folder</button>
      `;
    } else {
      popupHTML += `
        <div style="margin-bottom: 16px; font-weight: bold; color: #1a1a1a;">Select a folder:</div>
      `;
      
      folderNames.forEach(folderName => {
        const messageCount = folders[folderName].length;
        popupHTML += `
          <div class="folder-option" data-folder="${folderName}" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f8f9fa; border: 1px solid #e1e5e9; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: background 0.2s;">
            <div>
              <div style="font-weight: bold; color: #1a1a1a;">${folderName}</div>
              <div style="font-size: 12px; color: #888;">${messageCount} message${messageCount !== 1 ? 's' : ''}</div>
            </div>
            <div style="color: #007bff; font-size: 14px;">→</div>
          </div>
        `;
      });
      
      popupHTML += `
        <div style="margin-top: 20px; text-align: center;">
          <button id="create-folder-from-popup" style="padding: 8px 16px; background: linear-gradient(90deg,#b2f7ef 0%,#c2f7cb 100%); border: none; border-radius: 6px; color: #222; font-weight: bold; cursor: pointer; font-size: 12px;">+ Create New Folder</button>
        </div>
      `;
    }
    
    popupHTML += `
      </div>
    `;
    
    popup.innerHTML = popupHTML;
    document.body.appendChild(popup);
    
    // Setup popup event handlers
    setupFolderPopupEventHandlers(popup, messageElement, folders);
  });
}

// Setup folder popup event handlers
function setupFolderPopupEventHandlers(popup, messageElement, folders) {
  // Close button
  popup.querySelector('#memory-chat-folder-close').onclick = () => {
    popup.remove();
  };
  
  // Close on outside click
  popup.onclick = (e) => {
    if (e.target === popup) {
      popup.remove();
    }
  };
  
  // Folder option clicks
  popup.querySelectorAll('.folder-option').forEach(option => {
    option.onclick = () => {
      const folderName = option.dataset.folder;
      const messageText = getMessageText(messageElement);
      addMessageToFolder(folderName, messageText, messageElement);
      popup.remove();
    };
    
    option.onmouseenter = () => option.style.background = '#e9ecef';
    option.onmouseleave = () => option.style.background = '#f8f9fa';
  });
  
  // Create folder button
  popup.querySelector('#create-folder-from-popup').onclick = () => {
    const folderName = prompt('Enter folder name:');
    if (folderName && folderName.trim()) {
      const newFolders = { ...folders, [folderName.trim()]: [] };
      chrome.storage.local.set({ folders: newFolders }, () => {
        popup.remove();
        showFolderSelector(messageElement);
      });
    }
  };
}

// Export functions for use in other modules
window.viewFolderContents = viewFolderContents;
window.showFolderSelector = showFolderSelector; 