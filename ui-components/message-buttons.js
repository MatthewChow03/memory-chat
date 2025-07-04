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
      btn.className = 'memory-chat-log-btn';
      btn.setAttribute('aria-label', 'Add to Memory');
      btn.title = 'Add to Memory';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.gap = '5px';
      btn.style.background = 'none';
      btn.style.border = 'none';
      btn.style.borderRadius = '0';
      btn.style.color = '#fff';
      btn.style.fontWeight = 'normal';
      btn.style.boxShadow = 'none';
      btn.style.cursor = 'pointer';
      btn.style.fontSize = '15px';
      btn.style.padding = '0';
      btn.style.margin = '0';
      btn.style.transition = 'color 0.2s';
      btn.innerHTML = `
        <span style="display: flex; align-items: center;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:5px;display:inline-block;vertical-align:middle;color:currentColor;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          <span style="color:currentColor;">Add to Memory</span>
        </span>
      `;
      btn.onmouseenter = () => btn.style.color = '#b2f7ef';
      btn.onmouseleave = () => btn.style.color = '#fff';

      btn.onclick = async (e) => {
        e.stopPropagation();

        // Hide button immediately for better UX
        btn.style.display = 'none';

        const text = window.MemoryChatUtils.getMessageText(msg);
        if (!text || text.trim().length === 0) {
          window.MemoryChatUtils.showFeedback('No message text found', 'error');
          // Show button again on error
          btn.style.display = 'inline-block';
          return;
        }

        try {
          // Show processing indicator
          const progressToast = window.MemoryChatUtils.createProgressToast('Processing message...');

          // Send message to backend (insights will be generated automatically)
          const res = await fetch(`${SERVER_CONFIG.BASE_URL}${SERVER_CONFIG.API_ENDPOINTS.MESSAGES}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: text,
              timestamp: Date.now(),
              userUUID: await getOrCreateUserUUID()
            })
          });

          // Remove progress toast
          window.MemoryChatUtils.removeProgressToast(progressToast);

          if (res.ok) {
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
            throw new Error('Failed to save message to backend');
          }
        } catch (error) {
          console.error('Failed to process message:', error);
          window.MemoryChatUtils.showFeedback(`Failed to process message: ${error.message}`, 'error');
          // Show button again on error - let user retry
          btn.style.display = 'inline-block';
        }
      };
      // Ensure the button is always in the .memory-chat-btn-row below the message
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
      btnContainer.appendChild(btn);
    }
  });
}
