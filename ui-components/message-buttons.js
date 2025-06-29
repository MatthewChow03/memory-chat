function addLogButtons() {
  const messages = document.querySelectorAll('[data-message-author-role]');
  messages.forEach(msg => {
    // Skip messages that have already been processed
    if (msg.hasAttribute('data-memory-chat-processed')) {
      return;
    }
    
    if (!msg.querySelector('.memory-chat-log-btn')) {
      // Create a modern pastel green button
      const btn = document.createElement('button');
      btn.textContent = 'Add to Memories';
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
        if (btn.textContent === 'Add to Memories') {
          btn.style.background = '#a0eec0';
        }
      };
      
      btn.onmouseleave = () => {
        if (btn.textContent === 'Add to Memories') {
          btn.style.background = 'linear-gradient(90deg, #b2f7ef 0%, #c2f7cb 100%)';
        }
      };

      btn.onclick = async (e) => {
        e.stopPropagation();
        
        // Hide button immediately for better UX
        btn.style.display = 'none';
        
        if (!window.insightExtractionService || !window.insightExtractionService.isReady()) {
          window.MemoryChatUtils.showFeedback('Insight extraction service not available. Please check your OpenAI API key in settings.', 'error');
          // Show button again on error
          btn.style.display = 'inline-block';
          return;
        }
        
        if (!window.memoryChatIDB) {
          // Show button again on error
          btn.style.display = 'inline-block';
          return;
        }
        
        const text = window.MemoryChatUtils.getMessageText(msg);
        if (!text || text.trim().length === 0) {
          window.MemoryChatUtils.showFeedback('No message text found', 'error');
          // Show button again on error
          btn.style.display = 'inline-block';
          return;
        }
        
        try {
          // Show processing indicator
          const progressToast = window.MemoryChatUtils.createProgressToast('Extracting insights...');
          
          // Extract insights and add to log
          const insights = await window.insightExtractionService.extractInsights(text);
          
          // Update progress
          window.MemoryChatUtils.updateProgressToast(progressToast, 1, 2, 'Checking for duplicates...');
          
          const exists = await window.memoryChatIDB.messageExists(insights);
          
          // Remove progress toast
          window.MemoryChatUtils.removeProgressToast(progressToast);
          
          if (!exists) {
            // Add to log
            await window.memoryChatIDB.addMessages([{ text, timestamp: Date.now() }]);
            // Mark message as processed and remove button permanently
            msg.setAttribute('data-memory-chat-processed', 'true');
            btn.remove();
            
            // Re-render storage tab to show new memory immediately
            if (window.renderStorageTab) {
              // Only re-render if storage tab is currently visible to avoid unnecessary work
              const storageUI = document.getElementById('memory-chat-storage');
              if (storageUI && storageUI.style.display !== 'none') {
                window.renderStorageTab();
              }
            }
            
            window.MemoryChatUtils.showFeedback('Memory added to storage!', 'success');
          } else {
            // Message already exists in log, mark as processed and remove button permanently
            msg.setAttribute('data-memory-chat-processed', 'true');
            btn.remove();
            window.MemoryChatUtils.showFeedback('Memory already in storage', 'info');
          }
        } catch (error) {
          console.error('Failed to process message:', error);
          window.MemoryChatUtils.showFeedback(`Failed to process message: ${error.message}`, 'error');
          // Show button again on error - let user retry
          btn.style.display = 'inline-block';
        }
      };
      msg.appendChild(btn);
    }
  });
} 