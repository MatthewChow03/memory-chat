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

      btn.onclick = async (e) => {
        e.stopPropagation();
        
        if (!window.insightExtractionService || !window.insightExtractionService.isReady()) {
          window.MemoryChatUtils.showFeedback('Insight extraction service not available. Please check your OpenAI API key in settings.', 'error');
          return;
        }
        
        if (!window.memoryChatIDB) return;
        
        const text = window.MemoryChatUtils.getMessageText(msg);
        if (!text || text.trim().length === 0) {
          window.MemoryChatUtils.showFeedback('No message text found', 'error');
          return;
        }
        
        try {
          // Extract insights and add to log
          const insights = await window.insightExtractionService.extractInsights(text);
          const exists = await window.memoryChatIDB.messageExists(insights);
          
          if (!exists) {
            // Add to log
            await window.memoryChatIDB.addMessages([{ text, timestamp: Date.now() }]);
            btn.textContent = 'Remove from Log';
            btn.style.background = '#f7b2b2';
            btn.style.color = '#222';
            window.MemoryChatUtils.showFeedback('Message insights added to log!', 'success');
          } else {
            // Remove from log
            if (!window.memoryChatIDB.removeMessage) {
              window.memoryChatIDB.removeMessage = function(insights) {
                return window.memoryChatIDB.openDB().then(db => {
                  return new Promise((resolve, reject) => {
                    const tx = db.transaction('chatLogs', 'readwrite');
                    const store = tx.objectStore('chatLogs');
                    // Convert insights array to key string
                    const insightsKey = Array.isArray(insights) ? insights.join('|') : insights;
                    const req = store.delete(insightsKey);
                    req.onsuccess = () => resolve();
                    req.onerror = () => reject(req.error);
                  });
                });
              };
            }
            await window.memoryChatIDB.removeMessage(insights);
            btn.textContent = 'Add to Log';
            btn.style.background = 'linear-gradient(90deg, #b2f7ef 0%, #c2f7cb 100%)';
            btn.style.color = '#222';
            window.MemoryChatUtils.showFeedback('Message insights removed from log!', 'success');
          }
        } catch (error) {
          console.error('Failed to process message:', error);
          window.MemoryChatUtils.showFeedback(`Failed to process message: ${error.message}`, 'error');
        }
      };
      msg.appendChild(btn);
    }
  });
} 