function addLogButtons() {
  const messages = document.querySelectorAll('[data-message-author-role]');
  messages.forEach(msg => {
    if (!msg.querySelector('.memory-chat-log-btn')) {
      // Create a modern pastel green button
      const btn = document.createElement('button');
      btn.textContent = 'Add to Log';
      btn.className = 'memory-chat-log-btn';
      btn.style.marginLeft = '8px';
      btn.style.padding = '6px 16px';
      btn.style.background = 'linear-gradient(90deg, #b2f7ef 0%, #c2f7cb 100%)';
      btn.style.border = 'none';
      btn.style.borderRadius = '8px';
      btn.style.color = '#222';
      btn.style.fontWeight = 'bold';
      btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
      btn.style.cursor = 'pointer';
      btn.style.transition = 'background 0.2s, color 0.2s';
      
      // Dynamic hover handlers that respect current state
      btn.onmouseenter = () => {
        if (btn.textContent === 'Add to Log') {
          btn.style.background = '#a0eec0';
        } else {
          btn.style.background = '#f7a0a0';
        }
      };
      
      btn.onmouseleave = () => {
        if (btn.textContent === 'Add to Log') {
          btn.style.background = 'linear-gradient(90deg, #b2f7ef 0%, #c2f7cb 100%)';
        } else {
          btn.style.background = '#f7b2b2';
        }
      };

      // Check if this message is already logged
      const text = getMessageText(msg);
      if (window.memoryChatIDB && window.memoryChatIDB.messageExists) {
        window.memoryChatIDB.messageExists(text).then(found => {
          if (found) {
            btn.textContent = 'Remove from Log';
            btn.style.background = '#f7b2b2';
            btn.style.color = '#222';
          }
        });
      }

      btn.onclick = async (e) => {
        e.stopPropagation();
        const text = getMessageText(msg);
        if (!window.memoryChatIDB) return;
        const found = await window.memoryChatIDB.messageExists(text);
        if (!found) {
          // Add to log
          await window.memoryChatIDB.addMessages([{ text, timestamp: Date.now() }]);
          btn.textContent = 'Remove from Log';
          btn.style.background = '#f7b2b2';
          btn.style.color = '#222';
        } else {
          // Remove from log
          if (!window.memoryChatIDB.removeMessage) {
            window.memoryChatIDB.removeMessage = function(text) {
              return window.memoryChatIDB.openDB().then(db => {
                return new Promise((resolve, reject) => {
                  const tx = db.transaction('chatLogs', 'readwrite');
                  const store = tx.objectStore('chatLogs');
                  const req = store.delete(text);
                  req.onsuccess = () => resolve();
                  req.onerror = () => reject(req.error);
                });
              });
            };
          }
          await window.memoryChatIDB.removeMessage(text);
          btn.textContent = 'Add to Log';
          btn.style.background = 'linear-gradient(90deg, #b2f7ef 0%, #c2f7cb 100%)';
          btn.style.color = '#222';
        }
      };
      msg.appendChild(btn);
    }
  });
} 