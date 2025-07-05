// Storage Folders Module
// Handles folder management, folder contents viewing, and folder operations

// View folder contents
async function viewFolderContents(folderName, folderId) {
  const storageUI = document.getElementById('memory-chat-storage');
  if (!storageUI) return;

  const tabContent = storageUI.querySelector('#memory-chat-tab-content');
  if (!tabContent) return;

  // Get folder contents from backend
  let folderMessages = [];
  try {
    const res = await fetch(`${SERVER_CONFIG.BASE_URL}${SERVER_CONFIG.API_ENDPOINTS.FOLDERS}/${encodeURIComponent(folderId)}/contents?userUUID=${await getOrCreateUserUUID()}`);
    if (res.ok) {
      folderMessages = await res.json();
    } else {
      tabContent.innerHTML = '<div style="text-align:center;color:#ff6b6b;padding:20px;">Failed to load folder contents from backend</div>';
      return;
    }
  } catch (error) {
    tabContent.innerHTML = `<div style="text-align:center;color:#ff6b6b;padding:20px;">Error loading folder contents: ${error.message}</div>`;
    return;
  }

  let contentHTML = `
    <div style="margin-top:48px;padding:0 24px 0 24px;">
      <div class="search-bar-container" style="margin-bottom:18px;position:relative;">
        <input id="folder-search-input" type="text" placeholder="Search in this folder..." style="width:100%;padding:12px 16px 12px 44px;border-radius:24px;border:1.5px solid #2c2f36;background:#181a20;color:#f3f6fa;font-size:15px;outline:none;box-shadow:none;transition:border 0.15s;" />
        <span style="position:absolute;left:16px;top:50%;transform:translateY(-50%);pointer-events:none;">
          <svg width='18' height='18' fill='none' xmlns='http://www.w3.org/2000/svg'><circle cx='8' cy='8' r='6.5' stroke='#b2f7ef' stroke-width='2'/><line x1='13.5' y1='13.5' x2='17' y2='17' stroke='#b2f7ef' stroke-width='2' stroke-linecap='round'/></svg>
        </span>
      </div>
      <button id="back-to-folders" style="background:#fff;color:#23272f;font-weight:600;font-size:14px;padding:4px 16px;border:none;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:18px;cursor:pointer;">Back to Folders</button>
    </div>
    <div id="folder-messages-list" style="padding:0 24px 0 24px;"></div>
  `;
  tabContent.innerHTML = contentHTML;

  // Render folder messages as storage cards
  const messagesList = tabContent.querySelector('#folder-messages-list');
  if (folderMessages.length === 0) {
    messagesList.innerHTML = '<div style="text-align:center;color:#888;">This folder is empty</div>';
  } else {
    folderMessages.forEach((message, idx) => {
      const card = window.renderLogCard ? window.renderLogCard(message, idx) : null;
      if (card) messagesList.appendChild(card);
    });
  }

  // Setup folder content event handlers
  setupFolderContentEventHandlers(tabContent, folderName, folderId);
}

// Setup folder content event handlers
function setupFolderContentEventHandlers(tabContent, folderName, folderId) {
  // Back button
  tabContent.querySelector('#back-to-folders').onclick = () => {
    window.activeSearchSubTab = 'folders';
    if (window.renderSearchView) {
      window.renderSearchView();
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
    btn.onclick = async () => {
      const folderName = btn.dataset.folder;
      const messageId = btn.dataset.messageId;

      if (confirm('Remove this memory from this folder only? (It will remain in storage)')) {
        try {
          const res = await fetch(`${SERVER_CONFIG.BASE_URL}${SERVER_CONFIG.API_ENDPOINTS.FOLDERS}/remove-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              folderId: btn.dataset.folderId,
              messageId: messageId,
              userUUID: await getOrCreateUserUUID()
            })
          });
          if (!res.ok) throw new Error('Failed to remove message from folder');
          // Refresh the folder contents
          viewFolderContents(folderName, btn.dataset.folderId);
        } catch (error) {
          tabContent.innerHTML = `<div style="text-align:center;color:#ff6b6b;padding:20px;">Error removing message from folder: ${error.message}</div>`;
        }
      }
    };
  });

  // Delete memory buttons (delete from everywhere)
  tabContent.querySelectorAll('.delete-memory').forEach(btn => {
    btn.onclick = async () => {
      const messageId = btn.dataset.messageId;

      if (confirm('Delete this memory from everywhere? This action cannot be undone.')) {
        try {
          const res = await fetch(`${SERVER_CONFIG.BASE_URL}${SERVER_CONFIG.API_ENDPOINTS.MESSAGES}/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: messageId, userUUID: await getOrCreateUserUUID() })
          });
          if (!res.ok) throw new Error('Failed to delete message');

          // Remove the card from the UI
          const card = btn.closest('.folder-message-card');
          if (card) {
            card.remove();
          }

          // Show success feedback
          if (window.showFeedback) {
            window.showFeedback('Memory deleted successfully!', 'success');
          }
        } catch (error) {
          console.error('Error deleting memory:', error);
          alert('Failed to delete memory. Please try again.');
        }
      }
    };
  });
}

// Show folder selector popup
async function showFolderSelector(messageElement) {
  // Remove existing popup if any
  const existingPopup = document.getElementById('memory-chat-folder-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  let folders = {};
  try {
    const res = await fetch(`${SERVER_CONFIG.BASE_URL}${SERVER_CONFIG.API_ENDPOINTS.FOLDERS}?userUUID=${await getOrCreateUserUUID()}`);
    if (res.ok) {
      folders = await res.json();
    } else {
      console.error('Failed to load folders from backend');
      return;
    }
  } catch (error) {
    console.error('Error loading folders:', error);
    return;
  }
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
    display: flex;
    flex-direction: column;
  `;

  let popupHTML = `
    <div style="padding: 20px; border-bottom: 1px solid #e1e5e9; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
      <h3 style="margin: 0; color: #1a1a1a; font-size: 18px;">Add to Folder</h3>
      <button id="memory-chat-folder-close" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #666;">×</button>
    </div>
    <div style="padding: 20px; overflow-y: auto; flex: 1; max-height: 400px;">
  `;

  if (folders.length === 0) {
    popupHTML += `
      <div style="text-align: center; color: #888; margin-bottom: 20px;">No folders created yet</div>
      <button id="create-folder-from-popup" style="display: block; margin: 0 auto; padding: 10px 20px; background: linear-gradient(90deg,#b2f7ef 0%,#c2f7cb 100%); border: none; border-radius: 8px; color: #222; font-weight: bold; cursor: pointer;">Create New Folder</button>
    `;
  } else {
    popupHTML += `
      <div style="margin-bottom: 16px; font-weight: bold; color: #1a1a1a;">Select a folder:</div>
    `;

    folders.forEach(folder => {
      const messageCount = folder.messageCount || 0;
      popupHTML += `
        <div class="folder-option" data-folder="${folder.name}" data-folder-id="${folder.folderID}" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f8f9fa; border: 1px solid #e1e5e9; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: background 0.2s;">
          <div>
            <div style="font-weight: bold; color: #1a1a1a;">${folder.name}</div>
            <div style="font-size: 12px; color: #888;">${messageCount} message${messageCount !== 1 ? 's' : ''}</div>
          </div>
          <div style="color: #007bff; font-size: 14px;">+</div>
        </div>
      `;
    });
  }

  popupHTML += '</div>';
  popup.innerHTML = popupHTML;

  document.body.appendChild(popup);

  // Setup folder popup event handlers
  setupFolderPopupEventHandlers(popup, messageElement, folders);
}

// Setup folder popup event handlers
function setupFolderPopupEventHandlers(popup, messageElement, folders) {
  // Close button
  popup.querySelector('#memory-chat-folder-close').onclick = () => {
    popup.remove();
  };

  // Create folder from popup
  const createBtn = popup.querySelector('#create-folder-from-popup');
  if (createBtn) {
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

          // Close popup and show success feedback
          popup.remove();
          if (window.showFeedback) {
            window.showFeedback('Folder created successfully!', 'success');
          }
        } catch (error) {
          console.error('Error creating folder:', error);
          alert('Failed to create folder. Please try again.');
        }
      }
    };
  }

  // Folder option clicks
  popup.querySelectorAll('.folder-option').forEach(option => {
    option.onclick = async () => {
      const folderId = option.dataset.folderId;
      const folderName = option.dataset.folder;
      const messageText = window.MemoryChatUtils ? window.MemoryChatUtils.getMessageText(messageElement) : null;
      if (messageText !== undefined) {
        // Add message by text
        try {
          const res = await fetch(`${SERVER_CONFIG.BASE_URL}${SERVER_CONFIG.API_ENDPOINTS.FOLDERS}/${encodeURIComponent(folderId)}/add-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: messageText,
              timestamp: Date.now(),
              userUUID: await getOrCreateUserUUID()
            })
          });
          if (!res.ok) throw new Error('Failed to add message to folder');

          // Close popup and show success feedback
          popup.remove();
          if (window.showFeedback) {
            window.showFeedback(`Message added to folder '${folderName}'!`, 'success');
          }
        } catch (error) {
          console.error('Error adding message to folder:', error);
          alert('Failed to add message to folder. Please try again.');
        }
      } else {
        console.error('No message text found to add to folder');
        alert('No message text found to add to folder');
      }
      popup.remove();
    };

    option.onmouseenter = () => option.style.background = '#e9ecef';
    option.onmouseleave = () => option.style.background = '#f8f9fa';
  });
}

// Show folder selector popup for storage insights (no message element needed)
async function showFolderSelectorForStorage(messageId) {
  // Remove existing popup if any
  const existingPopup = document.getElementById('memory-chat-folder-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  let folders = {};
  try {
    const res = await fetch(`${SERVER_CONFIG.BASE_URL}${SERVER_CONFIG.API_ENDPOINTS.FOLDERS}?userUUID=${await getOrCreateUserUUID()}`);
    if (res.ok) {
      folders = await res.json();
    } else {
      console.error('Failed to load folders from backend');
      return;
    }
  } catch (error) {
    console.error('Error loading folders:', error);
    return;
  }
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
    display: flex;
    flex-direction: column;
  `;

  let popupHTML = `
    <div style="padding: 20px; border-bottom: 1px solid #e1e5e9; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
      <h3 style="margin: 0; color: #1a1a1a; font-size: 18px;">Add Memory to Folder</h3>
      <button id="memory-chat-folder-close" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #666;">×</button>
    </div>
    <div style="padding: 20px; overflow-y: auto; flex: 1; max-height: 400px;">
  `;

  if (folders.length === 0) {
    popupHTML += `
      <div style="text-align: center; color: #888; margin-bottom: 20px;">No folders created yet</div>
      <button id="create-folder-from-popup" style="display: block; margin: 0 auto; padding: 10px 20px; background: linear-gradient(90deg,#b2f7ef 0%,#c2f7cb 100%); border: none; border-radius: 8px; color: #222; font-weight: bold; cursor: pointer;">Create New Folder</button>
    `;
  } else {
    popupHTML += `
      <div style="margin-bottom: 16px; font-weight: bold; color: #1a1a1a;">Select a folder:</div>
    `;

    folders.forEach(folder => {
      const messageCount = folder.messageCount || 0;
      popupHTML += `
        <div class="folder-option" data-folder="${folder.name}" data-folder-id="${folder.folderID}" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f8f9fa; border: 1px solid #e1e5e9; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: background 0.2s;">
          <div>
            <div style="font-weight: bold; color: #1a1a1a;">${folder.name}</div>
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
  setupFolderPopupEventHandlersForStorage(popup, messageId, folders);
}

// Setup folder popup event handlers for storage insights
function setupFolderPopupEventHandlersForStorage(popup, messageId, folders) {
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
    option.onclick = async () => {
      const folderId = option.dataset.folderId;
      const folderName = option.dataset.folder;
      if (typeof messageId !== 'undefined') {
        // Add message by id
        try {
          const res = await fetch(`${SERVER_CONFIG.BASE_URL}${SERVER_CONFIG.API_ENDPOINTS.FOLDERS}/${encodeURIComponent(folderId)}/add-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId: messageId, userUUID: await getOrCreateUserUUID() })
          });
          if (!res.ok) throw new Error('Failed to add message to folder');

          // Show success feedback
          if (window.showFeedback) {
            window.showFeedback('Message added to folder successfully!', 'success');
          }
        } catch (error) {
          console.error('Error adding message to folder:', error);
          alert('Failed to add message to folder. Please try again.');
        }
      } else {
        console.error('No message ID found to add to folder');
        alert('No message ID found to add to folder');
      }
      popup.remove();
    };

    option.onmouseenter = () => option.style.background = '#e9ecef';
    option.onmouseleave = () => option.style.background = '#f8f9fa';
  });

  // Create folder button
  popup.querySelector('#create-folder-from-popup').onclick = async () => {
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

        // Close popup and show success feedback
        popup.remove();
        if (window.showFeedback) {
          window.showFeedback('Folder created successfully!', 'success');
        }
      } catch (error) {
        console.error('Error creating folder:', error);
        alert('Failed to create folder. Please try again.');
      }
    }
  };
}

// Export functions for use in other modules
window.viewFolderContents = viewFolderContents;
window.showFolderSelector = showFolderSelector;
window.showFolderSelectorForStorage = showFolderSelectorForStorage;
