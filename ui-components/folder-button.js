// Add folder button to ChatGPT messages
function addFolderButtons() {
  const messages = document.querySelectorAll('[data-message-author-role]');
  messages.forEach(msg => {
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
      msg.appendChild(btnContainer);
    }
    // Only add the folder button if it doesn't already exist in the container
    if (!btnContainer.querySelector('.memory-chat-folder-btn')) {
      // Create folder button
      const folderBtn = document.createElement('button');
      folderBtn.textContent = '📁';
      folderBtn.className = 'memory-chat-folder-btn';
      folderBtn.title = 'Add to Folder';
      folderBtn.style.cssText = `
        padding: 6px 12px;
        background: linear-gradient(90deg, #e6f3ff 0%, #d4e7ff 100%);
        border: none;
        border-radius: 8px;
        color: #1a73e8;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        cursor: pointer;
        transition: background 0.2s, color 0.2s;
        font-size: 14px;
      `;
      folderBtn.onmouseenter = () => folderBtn.style.background = '#cce7ff';
      folderBtn.onmouseleave = () => folderBtn.style.background = 'linear-gradient(90deg, #e6f3ff 0%, #d4e7ff 100%)';
      folderBtn.onclick = (e) => {
        e.stopPropagation();
        showFolderSelector(msg);
      };
      btnContainer.appendChild(folderBtn);
    }
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
  if (window.memoryChatIDB && window.memoryChatIDB.getAllFolders) {
    folders = await window.memoryChatIDB.getAllFolders();
  }
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
      const folderName = option.dataset.folder;
      const messageText = window.MemoryChatUtils.getMessageText(messageElement);
      if (window.memoryChatIDB && window.memoryChatIDB.addMessageToFolder) {
        await window.memoryChatIDB.addMessageToFolder(folderName, { text: messageText, timestamp: Date.now() });
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
      if (window.memoryChatIDB && window.memoryChatIDB.addOrUpdateFolder) {
        await window.memoryChatIDB.addOrUpdateFolder(folderName.trim(), []);
      }
      popup.remove();
      showFolderSelector(messageElement);
    }
  };
}

// Add message to folder (for other usages)
async function addMessageToFolder(folderName, messageText, messageElement) {
  if (window.memoryChatIDB && window.memoryChatIDB.addMessageToFolder) {
    await window.memoryChatIDB.addMessageToFolder(folderName, { text: messageText, timestamp: Date.now() });
    // Update the log button state to show "Remove from Log"
    if (messageElement) {
      const logBtn = messageElement.querySelector('.memory-chat-log-btn');
      if (logBtn) {
        logBtn.textContent = 'Remove from Log';
        logBtn.style.background = '#f7b2b2';
        logBtn.style.color = '#222';
      }
    }
    showFolderFeedback('Message added to folder and log!', 'success');
  } else {
    showFolderFeedback('IndexedDB not available', 'error');
  }
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
