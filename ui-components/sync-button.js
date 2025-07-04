// Sync ChatGPT Memories Button
// Adds a button to sync ChatGPT memories with the memory storage system

function addSyncButton() {
  // Find the target div with class "mt-5 flex justify-end"
  const targetDiv = document.querySelector("div.mt-5.flex.justify-end");
  if (!targetDiv) return;

  // Check if button already exists
  const existingBtn = targetDiv.querySelector('.memory-chat-sync-btn');
  if (existingBtn) return;

  // Create the sync button
  const syncBtn = document.createElement('button');
  syncBtn.className = 'memory-chat-sync-btn';
  syncBtn.textContent = 'Sync ChatGPT Memories';
  syncBtn.title = 'Sync ChatGPT Memories with Memory Storage';
  syncBtn.style.cssText = `
    align-items: center;
    appearance: button;
    background-color: rgb(255, 255, 255);
    border-bottom-color: rgb(0, 0, 0);
    border-bottom-left-radius: 3.35544e+07px;
    border-bottom-right-radius: 3.35544e+07px;
    border-bottom-style: solid;
    border-bottom-width: 1px;
    border-image-outset: 0;
    border-image-repeat: stretch;
    border-image-slice: 100%;
    border-image-source: none;
    border-image-width: 1;
    border-left-color: rgb(0, 0, 0);
    border-left-style: solid;
    border-left-width: 1px;
    border-right-color: rgb(0, 0, 0);
    border-right-style: solid;
    border-right-width: 1px;
    border-top-color: rgb(0, 0, 0);
    border-top-left-radius: 3.35544e+07px;
    border-top-right-radius: 3.35544e+07px;
    border-top-style: solid;
    border-top-width: 1px;
    box-sizing: border-box;
    color: rgb(0, 0, 0);
    color-scheme: light;
    cursor: pointer;
    display: flex;
    flex-shrink: 0;
    font-family: ui-sans-serif, -apple-system, system-ui, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol";
    font-feature-settings: normal;
    font-kerning: auto;
    font-optical-sizing: auto;
    font-size: 14px;
    font-size-adjust: none;
    font-stretch: 100%;
    font-style: normal;
    font-variant-alternates: normal;
    font-variant-caps: normal;
    font-variant-east-asian: normal;
    font-variant-emoji: normal;
    font-variant-ligatures: normal;
    font-variant-numeric: normal;
    font-variant-position: normal;
    font-variation-settings: normal;
    font-weight: 500;
    height: 37px;
    justify-content: center;
    letter-spacing: normal;
    line-height: 20px;
    margin-bottom: 0px;
    margin-left: 8px;
    margin-right: 8px;
    margin-top: 0px;
    min-height: 36px;
    opacity: 1;
    padding-block-end: 0px;
    padding-block-start: 0px;
    padding-bottom: 0px;
    padding-inline-end: 12px;
    padding-inline-start: 12px;
    padding-left: 12px;
    padding-right: 12px;
    padding-top: 0px;
    pointer-events: auto;
    position: relative;
    scrollbar-color: auto;
    tab-size: 4;
    text-align: center;
    text-indent: 0px;
    text-rendering: auto;
    text-shadow: none;
    text-size-adjust: 100%;
    text-transform: none;
    width: auto;
    word-spacing: 0px;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    -webkit-border-image: none;
  `;

  // Add hover effects
  syncBtn.onmouseenter = () => {
    syncBtn.style.backgroundColor = 'rgb(245, 245, 245)';
  };

  syncBtn.onmouseleave = () => {
    syncBtn.style.backgroundColor = 'rgb(255, 255, 255)';
  };

  // Add click handler
  syncBtn.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const table = document.querySelector(
      "table.w-full.border-separate.border-spacing-0"
    );
    
    if (!table) {
      console.error("Memory table not found.");
      return;
    }
    let memories = [];
    const rows = table.querySelectorAll("tbody tr");
    for (const row of rows) {
      const cell = row.querySelectorAll("td")[0];
      if (!cell) continue;
      const memory = cell.querySelector("div.whitespace-pre-wrap").textContent.trim();
      if (memory) {
        memories.push(memory);
      }
    }
    if (memories.length === 0) {
      console.warn("No memories found to sync.");
      return;
    }
    
    // Send memories to backend
    try {
      const userUUID = await getOrCreateUserUUID();
      
      const response = await fetch(`${SERVER_CONFIG.BASE_URL}${SERVER_CONFIG.API_ENDPOINTS.MEMORIES_BULK}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userUUID: userUUID,
          memories: memories
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`Successfully synced ${result.added_count} memories:`, result.message);
        
        // Show success feedback
        if (window.MemoryChatUtils && window.MemoryChatUtils.showFeedback) {
          window.MemoryChatUtils.showFeedback(`Successfully synced ${result.added_count} memories!`, 'success');
        }
        
        // Re-render storage tab to show new memories immediately
        if (window.renderStorageTab) {
          const storageUI = document.getElementById('memory-chat-storage');
          if (storageUI && storageUI.style.display !== 'none') {
            window.renderStorageTab();
          }
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to sync memories:', errorData.error);
        
        // Show error feedback
        if (window.MemoryChatUtils && window.MemoryChatUtils.showFeedback) {
          window.MemoryChatUtils.showFeedback(`Failed to sync memories: ${errorData.error}`, 'error');
        }
      }
    } catch (error) {
      console.error('Error syncing memories:', error);
      
      // Show error feedback
      if (window.MemoryChatUtils && window.MemoryChatUtils.showFeedback) {
        window.MemoryChatUtils.showFeedback(`Error syncing memories: ${error.message}`, 'error');
      }
    }
  };

  // Append the sync button to the target div
  targetDiv.prepend(syncBtn);
}

// Export function for use in content script
window.addSyncButton = addSyncButton; 