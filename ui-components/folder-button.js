// Add folder button to ChatGPT messages
function addFolderButtons() {
  const messages = document.querySelectorAll('[data-message-author-role]');

  // Use for...of loop to handle async operations properly
  (async () => {
    for (const msg of messages) {
      // Skip messages that have already been processed
      if (msg.hasAttribute('data-memory-chat-processed')) {
        continue;
      }

      // Find or create the flex container
      let btnContainer = msg.querySelector('.memory-chat-btn-row');
      if (!btnContainer) {
        btnContainer = document.createElement('div');
        btnContainer.className = 'memory-chat-btn-row';
        btnContainer.style.display = 'flex';
        btnContainer.style.flexDirection = 'row';
        btnContainer.style.gap = '8px';
        btnContainer.style.marginTop = '8px';
        btnContainer.style.alignItems = 'center';
        
        // Align buttons based on message role
        const messageRole = msg.getAttribute('data-message-author-role');
        if (messageRole === 'assistant') {
          btnContainer.style.justifyContent = 'flex-start'; // Left align for assistant
          btnContainer.style.alignSelf = 'flex-start'; // Override parent's items-end
        } else if (messageRole === 'user') {
          btnContainer.style.justifyContent = 'flex-end'; // Right align for user
          btnContainer.style.alignSelf = 'flex-end'; // Match parent's items-end
        }
        
        msg.appendChild(btnContainer);
      }
      // Only add the folder button if it doesn't already exist in the container
      if (!btnContainer.querySelector('.memory-chat-folder-btn')) {
        // Create folder button
        const folderBtn = document.createElement('button');
        folderBtn.className = 'memory-chat-folder-btn';
        folderBtn.title = 'Add to folder';
        folderBtn.setAttribute('aria-label', 'Add to folder');
        folderBtn.style.cssText = `
          display: flex;
          align-items: center;
          gap: 5px;
          background: none;
          border: none;
          border-radius: 0;
          color: #fff;
          font-weight: normal;
          box-shadow: none;
          cursor: pointer;
          font-size: 15px;
          padding: 0;
          margin: 0;
          transition: color 0.2s;
        `;
        folderBtn.innerHTML = `
          <span style="display: flex; align-items: center;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:5px;display:inline-block;vertical-align:middle;color:currentColor;"><path d="M3 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>
            <span style="color:currentColor;">Add to folder</span>
          </span>
        `;
        folderBtn.onmouseenter = () => folderBtn.style.color = '#b2f7ef';
        folderBtn.onmouseleave = () => folderBtn.style.color = '#fff';
        folderBtn.onclick = (e) => {
          e.stopPropagation();
          showFolderSelector(msg);
        };
        btnContainer.appendChild(folderBtn);
      }
    }
  })();
}

// Show folder selector popup
async function showFolderSelector(messageElement) {
  // Remove existing popup if any
  const existingPopup = document.getElementById('memory-chat-folder-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  const messageText = window.MemoryChatUtils.getMessageText(messageElement);
  if (!messageText || messageText.trim().length === 0) {
    showFolderFeedback('No message text found', 'error');
    return;
  }

  // Get folders from backend
  let folders = [];
  try {
    const foldersRes = await fetch(`${SERVER_CONFIG.BASE_URL}${SERVER_CONFIG.API_ENDPOINTS.FOLDERS}?userUUID=${await getOrCreateUserUUID()}`);
    if (foldersRes.ok) {
      folders = await foldersRes.json();
    }
  } catch (error) {
    console.error('Error fetching folders:', error);
  }

  // Filter out folders where the message is already present
  const availableFolders = [];
  const unavailableFolders = [];
  for (const folder of folders) {
    // Check if messageText matches any text in the folder's messages array
    const hasMessage = folder.messages && folder.messages.some(msg => msg.text === messageText);
    if (!hasMessage) {
      availableFolders.push(folder);
    } else {
      unavailableFolders.push(folder);
    }
  }

  const folderNames = Object.keys(availableFolders);
  const unavailableFolderNames = Object.keys(unavailableFolders);

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
      <div style=\"max-height: 260px; overflow-y: auto; margin-bottom: 16px;\">
  `;

  if (availableFolders.length === 0) {
    popupHTML += `
      <div style="text-align: center; color: #888; margin-bottom: 20px;">
        ${folders.length > 0 ?
        'Message already exists in all folders' :
        'No folders created yet'
      }
      </div>
      <button id="create-folder-from-popup" style="display: block; margin: 0 auto; padding: 10px 20px; background: linear-gradient(90deg,#b2f7ef 0%,#c2f7cb 100%); border: none; border-radius: 8px; color: #222; font-weight: bold; cursor: pointer;">Create New Folder</button>
    `;
  } else {
    popupHTML += `
      <div style="margin-bottom: 16px; font-weight: bold; color: #1a1a1a;">Available folders:</div>
    `;
    availableFolders.forEach(folder => {
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
    // Show unavailable folders if any exist
    if (unavailableFolders.length > 0) {
      popupHTML += `
        <div style="margin: 24px 0 16px 0; font-weight: bold; color: #666; font-size: 14px;">Already in these folders:</div>
      `;
      unavailableFolders.forEach(folder => {
        const messageCount = folder.messageCount || 0;
        popupHTML += `
          <div class="folder-option-disabled" data-folder="${folder.name}" title="Message already in this folder" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 8px; opacity: 0.6; pointer-events: none; cursor: not-allowed;">
            <div>
              <div style="font-weight: bold; color: #666;">${folder.name}</div>
              <div style="font-size: 12px; color: #999;">${messageCount} message${messageCount !== 1 ? 's' : ''} • Already contains this message</div>
            </div>
            <div style="color: #999; font-size: 14px;">✓</div>
          </div>
        `;
      });
    }
    popupHTML += `
      </div> <!-- end scrollable folder list -->
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

  // Folder option clicks (only for enabled options)
  popup.querySelectorAll('.folder-option').forEach(option => {
    option.onclick = async () => {
      const folderId = option.dataset.folderId;
      try {
        // Send message to backend with folder assignment
        const res = await fetch(`${SERVER_CONFIG.BASE_URL}${SERVER_CONFIG.API_ENDPOINTS.FOLDERS}/${encodeURIComponent(folderId)}/add-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: messageText,
            timestamp: Date.now(),
            userUUID: await getOrCreateUserUUID()
          })
        });

        if (res.ok) {
          // Remove the log button since message has been added
          const logBtn = messageElement.querySelector('.memory-chat-log-btn');
          if (logBtn) {
            logBtn.remove();
          }
          // Mark message as processed
          messageElement.setAttribute('data-memory-chat-processed', 'true');
          showFolderFeedback('Message added to folder and memory!', 'success');
        } else {
          const errorData = await res.json();
          showFolderFeedback('Error adding message to folder: ' + (errorData.error || 'Unknown error'), 'error');
        }
      } catch (error) {
        console.error('Error adding message to folder:', error);
        showFolderFeedback('Error adding message to folder: ' + error.message, 'error');
      }
      popup.remove();
    };
    option.onmouseenter = () => option.style.background = '#e9ecef';
    option.onmouseleave = () => option.style.background = '#f8f9fa';
  });
  // No click handler for disabled options (pointer-events: none)

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

        if (res.ok) {
          popup.remove();
          showFolderSelector(messageElement);
        } else {
          const errorData = await res.json();
          showFolderFeedback('Error creating folder: ' + (errorData.error || 'Unknown error'), 'error');
        }
      } catch (error) {
        console.error('Error creating folder:', error);
        showFolderFeedback('Error creating folder: ' + error.message, 'error');
      }
    }
  };
}

// Show feedback message
function showFolderFeedback(message, type) {
  const feedback = document.createElement('div');
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-weight: bold;
    z-index: 10002;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: ${type === 'success' ? '#28a745' : '#17a2b8'};
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  feedback.textContent = message;

  document.body.appendChild(feedback);

  setTimeout(() => {
    feedback.style.opacity = '0';
    feedback.style.transform = 'translateX(100%)';
    feedback.style.transition = 'opacity 0.3s, transform 0.3s';
    setTimeout(() => feedback.remove(), 300);
  }, 2000);
}
