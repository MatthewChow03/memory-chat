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
      
      // Check if message is already in all folders
      const messageText = window.MemoryChatUtils.getMessageText(msg);
      if (messageText && messageText.trim().length > 0) {
        let folders = {};
        if (window.memoryChatIDB && window.memoryChatIDB.getAllFoldersWithCounts) {
          folders = await window.memoryChatIDB.getAllFoldersWithCounts();
        }
        
        // Check if message is in all folders
        let inAllFolders = true;
        for (const folderName of Object.keys(folders)) {
          const isInFolder = await isMessageInFolder(messageText, folderName);
          if (!isInFolder) {
            inAllFolders = false;
            break;
          }
        }
        
        // If message is in all folders, mark it as processed and skip
        if (inAllFolders && Object.keys(folders).length > 0) {
          msg.setAttribute('data-memory-chat-processed', 'true');
          continue;
        }
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

  let folders = {};
  if (window.memoryChatIDB && window.memoryChatIDB.getAllFoldersWithCounts) {
    folders = await window.memoryChatIDB.getAllFoldersWithCounts();
  }
  
  // Filter out folders where the message is already present
  const availableFolders = {};
  const unavailableFolders = {};
  for (const [folderName, folderData] of Object.entries(folders)) {
    const isInFolder = await isMessageInFolder(messageText, folderName);
    if (!isInFolder) {
      availableFolders[folderName] = folderData;
    } else {
      unavailableFolders[folderName] = folderData;
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
  `;

  if (folderNames.length === 0) {
    popupHTML += `
      <div style="text-align: center; color: #888; margin-bottom: 20px;">
        ${Object.keys(folders).length > 0 ? 
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
    folderNames.forEach(folderName => {
      const messageCount = availableFolders[folderName].messageCount || 0;
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
    
    // Show unavailable folders if any exist
    if (unavailableFolderNames.length > 0) {
      popupHTML += `
        <div style="margin: 24px 0 16px 0; font-weight: bold; color: #666; font-size: 14px;">Already in these folders:</div>
      `;
      unavailableFolderNames.forEach(folderName => {
        const messageCount = unavailableFolders[folderName].messageCount || 0;
        popupHTML += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 8px; opacity: 0.6;">
            <div>
              <div style="font-weight: bold; color: #666;">${folderName}</div>
              <div style="font-size: 12px; color: #999;">${messageCount} message${messageCount !== 1 ? 's' : ''} • Already contains this message</div>
            </div>
            <div style="color: #999; font-size: 14px;">✓</div>
          </div>
        `;
      });
    }
    
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
      
      try {
        // First, process the message through insight extraction and storage
        if (window.memoryChatIDB && window.memoryChatIDB.addMessages) {
          const result = await window.memoryChatIDB.addMessages([{ text: messageText, timestamp: Date.now() }]);
          
          if (result.added > 0) {
            // Message was successfully stored, now add it to the folder
            // We need to get the insightsKey for the stored message
            const allMessages = await window.memoryChatIDB.getAllMessages();
            const storedMessage = allMessages.find(msg => 
              msg.originalText === messageText || 
              (Array.isArray(msg.insights) && msg.insights.join('\n').includes(messageText.substring(0, 50)))
            );
            
            if (storedMessage && storedMessage.insightsKey) {
              await window.memoryChatIDB.addMessageToFolder(folderName, storedMessage.insightsKey);
              
              // Remove the log button since message has been added
              const logBtn = messageElement.querySelector('.memory-chat-log-btn');
              if (logBtn) {
                logBtn.remove();
              }
              
              // Mark message as processed
              messageElement.setAttribute('data-memory-chat-processed', 'true');
              
              showFolderFeedback('Message added to folder and memory!', 'success');
            } else {
              showFolderFeedback('Failed to find stored message', 'error');
            }
          } else {
            showFolderFeedback('Message already exists in memory', 'error');
          }
        } else {
          showFolderFeedback('IndexedDB not available', 'error');
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
  try {
    // First, process the message through insight extraction and storage
    if (window.memoryChatIDB && window.memoryChatIDB.addMessages) {
      const result = await window.memoryChatIDB.addMessages([{ text: messageText, timestamp: Date.now() }]);
      
      if (result.added > 0) {
        // Message was successfully stored, now add it to the folder
        // We need to get the insightsKey for the stored message
        const allMessages = await window.memoryChatIDB.getAllMessages();
        const storedMessage = allMessages.find(msg => 
          msg.originalText === messageText || 
          (Array.isArray(msg.insights) && msg.insights.join('\n').includes(messageText.substring(0, 50)))
        );
        
        if (storedMessage && storedMessage.insightsKey) {
          await window.memoryChatIDB.addMessageToFolder(folderName, storedMessage.insightsKey);
          
          // Remove the log button after adding to folder and log
          if (messageElement) {
            const logBtn = messageElement.querySelector('.memory-chat-log-btn');
            if (logBtn) {
              logBtn.remove();
            }
            // Mark message as processed
            messageElement.setAttribute('data-memory-chat-processed', 'true');
          }
          showFolderFeedback('Message added to folder and memory!', 'success');
        } else {
          showFolderFeedback('Failed to find stored message', 'error');
        }
      } else {
        showFolderFeedback('Message already exists in memory', 'error');
      }
    } else {
      showFolderFeedback('IndexedDB not available', 'error');
    }
  } catch (error) {
    console.error('Error adding message to folder:', error);
    showFolderFeedback('Error adding message to folder: ' + error.message, 'error');
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

// Check if a message is already in a folder using text matching
async function isMessageInFolder(messageText, folderName) {
  try {
    if (!window.memoryChatIDB || !window.memoryChatIDB.getFolderContents) {
      return false;
    }
    
    const folderMessages = await window.memoryChatIDB.getFolderContents(folderName);
    if (!folderMessages || folderMessages.length === 0) {
      return false;
    }
    
    const normalizedMessageText = messageText.toLowerCase().trim();
    
    return folderMessages.some(folderMsg => {
      // Get the memory text - could be in text or insights field
      let memoryText = '';
      if (folderMsg.text) {
        memoryText = folderMsg.text;
      } else if (folderMsg.insights) {
        // Handle both string and array formats for insights
        if (Array.isArray(folderMsg.insights)) {
          memoryText = folderMsg.insights.join(' ');
        } else {
          memoryText = folderMsg.insights;
        }
      }
      
      if (!memoryText) {
        return false;
      }
      
      const normalizedMemory = memoryText.toLowerCase().trim();
      
      // Check if the message text is contained within the folder memory
      // Use a more sophisticated check to avoid false positives
      const messageWords = normalizedMessageText.split(/\s+/).filter(word => word.length > 3);
      const memoryWords = normalizedMemory.split(/\s+/).filter(word => word.length > 3);
      
      // If message has very few words, use exact substring matching
      if (messageWords.length <= 3) {
        return normalizedMemory.includes(normalizedMessageText);
      }
      
      // For longer messages, check if a significant portion of words match
      const matchingWords = messageWords.filter(word => memoryWords.includes(word));
      const matchRatio = matchingWords.length / messageWords.length;
      
      // If more than 80% of the message words are in the folder memory, consider it a match
      return matchRatio >= 0.8;
    });
  } catch (error) {
    console.error('Error checking if message is in folder:', error);
    return false;
  }
}
