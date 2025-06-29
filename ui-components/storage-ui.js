// Core Storage UI Management
// Handles main UI container creation, storage button, and basic event handlers

// Create and inject the storage UI
function createStorageUI() {
  if (document.getElementById('memory-chat-storage')) return;
  
  const storageUI = document.createElement('div');
  storageUI.id = 'memory-chat-storage';
  storageUI.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 600px;
    height: 700px;
    /* background: white; */ /* Now handled by theme class */
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    z-index: 10000;
    display: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    border: 1px solid #e1e5e9;
    overflow: hidden;
    min-width: 650px;
    min-height: 500px;
  `;
  
  storageUI.innerHTML = `
    <div style="padding: 20px; border-bottom: 1px solid #e1e5e9; display: flex; justify-content: space-between; align-items: center;">
      <h3 style="margin: 0; font-size: 18px;">Message Storage</h3>
      <button id="memory-chat-close" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #666;">×</button>
    </div>
    <div id="memory-chat-tabs" style="display: flex; border-bottom: 1px solid #e1e5e9;">
      <button class="storage-tab" data-tab="relevant" style="flex:1; padding: 10px; border:none; background:none; font-weight:bold; cursor:pointer;">Relevant</button>
      <button class="storage-tab" data-tab="recent" style="flex:1; padding: 10px; border:none; background:none; font-weight:bold; cursor:pointer;">Recent</button>
      <button class="storage-tab" data-tab="all" style="flex:1; padding: 10px; border:none; background:none; font-weight:bold; cursor:pointer;">All</button>
      <button class="storage-tab" data-tab="search" style="flex:1; padding: 10px; border:none; background:none; font-weight:bold; cursor:pointer;">Search</button>
      <button class="storage-tab" data-tab="folders" style="flex:1; padding: 10px; border:none; background:none; font-weight:bold; cursor:pointer;">Folders</button>
      <button class="storage-tab" data-tab="settings" style="flex:1; padding: 10px; border:none; background:none; font-weight:bold; cursor:pointer;">Settings</button>
    </div>
    <div id="memory-chat-tab-content" style="padding: 20px; height: calc(100% - 120px); overflow-y: auto;"></div>
    <div id="memory-chat-resize-handle" style="position: absolute; bottom: -8px; right: -8px; width: 24px; height: 24px; cursor: se-resize; background: linear-gradient(135deg, transparent 50%, #007bff 50%); border-radius: 0 0 16px 0; box-shadow: 0 2px 8px rgba(0,123,255,0.3), 0 0 0 2px rgba(0,123,255,0.1); transition: all 0.2s ease; z-index: 10001;"></div>
  `;
  
  document.body.appendChild(storageUI);
  
  // Apply theme on creation
  applyStorageTheme();
  
  // Add resize functionality
  setupResizeHandling(storageUI);
  
  // Setup basic event handlers
  setupBasicEventHandlers(storageUI);
  
  return storageUI;
}

// Apply theme class to modal based on chrome.storage.local
function applyStorageTheme() {
  const storageUI = document.getElementById('memory-chat-storage');
  if (!storageUI) return;
  chrome.storage.local.get({ storageTheme: 'light' }, (result) => {
    if (result.storageTheme === 'dark') {
      storageUI.classList.add('memory-chat-dark');
    } else {
      storageUI.classList.remove('memory-chat-dark');
    }
    // Force re-render of current tab to update all colors
    if (window.setActiveTab && window.activeTab) {
      window.setActiveTab(window.activeTab);
    }
  });
}
window.applyStorageTheme = applyStorageTheme;

// Setup resize handling for the storage UI
function setupResizeHandling(storageUI) {
  const resizeHandle = storageUI.querySelector('#memory-chat-resize-handle');
  let isResizing = false;
  let startX, startY, startWidth, startHeight;
  
  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = storageUI.offsetWidth;
    startHeight = storageUI.offsetHeight;
    
    // Add event listeners for mouse movement and release
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Prevent text selection during resize
    e.preventDefault();
  });
  
  function handleMouseMove(e) {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    const newWidth = Math.max(650, startWidth + deltaX);
    const newHeight = Math.max(500, startHeight + deltaY);
    
    storageUI.style.width = newWidth + 'px';
    storageUI.style.height = newHeight + 'px';
    
    // Update tab content height
    const tabContent = storageUI.querySelector('#memory-chat-tab-content');
    if (tabContent) {
      tabContent.style.height = (newHeight - 120) + 'px'; // Account for header and tabs
    }
  }
  
  function handleMouseUp() {
    isResizing = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }
  
  // Add hover effect to resize handle
  resizeHandle.addEventListener('mouseenter', () => {
    resizeHandle.style.background = 'linear-gradient(135deg, transparent 50%, #007bff 50%)';
  });
  
  resizeHandle.addEventListener('mouseleave', () => {
    if (!isResizing) {
      resizeHandle.style.background = 'linear-gradient(135deg, transparent 50%, #e1e5e9 50%)';
    }
  });
}

// Setup basic event handlers for the storage UI
function setupBasicEventHandlers(storageUI) {
  // Close button functionality
  const closeBtn = document.getElementById('memory-chat-close');
  if (closeBtn) {
    closeBtn.onclick = () => {
      storageUI.style.display = 'none';
      const backdrop = document.getElementById('memory-chat-backdrop');
      if (backdrop) backdrop.style.display = 'none';
    };
  }
  
  // Create backdrop overlay for better click detection
  const backdrop = document.createElement('div');
  backdrop.id = 'memory-chat-backdrop';
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.3);
    z-index: 9999;
    display: none;
  `;
  
  backdrop.addEventListener('click', () => {
    storageUI.style.display = 'none';
    backdrop.style.display = 'none';
  });
  
  document.body.appendChild(backdrop);
  
  // Close on outside click - improved to handle backdrop clicks
  storageUI.addEventListener('click', (e) => {
    // Check if the click is on the storage UI container itself (not its children)
    if (e.target === storageUI) {
      storageUI.style.display = 'none';
      backdrop.style.display = 'none';
    }
  });
}

// Add storage button to ChatGPT interface
function addStorageButton() {
  // Find the composer footer actions container
  const footerActions = document.querySelector('div[data-testid="composer-footer-actions"]');
  if (!footerActions) return;

  // Check if button already exists in the correct location
  const existingBtn = footerActions.querySelector('.memory-chat-view-btn');
  if (existingBtn) return;

  // Remove any existing button that might be in the wrong location
  const oldBtn = document.querySelector('.memory-chat-view-btn');
  if (oldBtn) {
    oldBtn.remove();
  }

  const storageBtn = document.createElement('button');
  storageBtn.className = 'memory-chat-view-btn';
  storageBtn.innerHTML = '📋';
  storageBtn.title = 'View Message Storage';
  storageBtn.style.cssText = `
    background: linear-gradient(90deg, #b2f7ef 0%, #c2f7cb 100%);
    border: none;
    border-radius: 8px;
    padding: 8px 12px;
    margin-left: 8px;
    cursor: pointer;
    font-size: 16px;
    transition: background 0.2s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  `;
  
  storageBtn.onmouseenter = () => storageBtn.style.background = '#a0eec0';
  storageBtn.onmouseleave = () => storageBtn.style.background = 'linear-gradient(90deg, #b2f7ef 0%, #c2f7cb 100%)';

  storageBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const storageUI = document.getElementById('memory-chat-storage');
    const backdrop = document.getElementById('memory-chat-backdrop');
    if (storageUI) {
      const isVisible = storageUI.style.display !== 'none';
      if (isVisible) {
        storageUI.style.display = 'none';
        if (backdrop) backdrop.style.display = 'none';
      } else {
        storageUI.style.display = 'block';
        if (backdrop) backdrop.style.display = 'block';
        // Trigger tab rendering when opened
        if (window.renderStorageTab) {
          window.renderStorageTab();
        }
        // Apply theme when opening
        if (window.applyStorageTheme) window.applyStorageTheme();
      }
    }
  };
  
  // Append the storage button to the footer actions
  footerActions.appendChild(storageBtn);
}

// Export functions for use in other modules
window.createStorageUI = createStorageUI;
window.addStorageButton = addStorageButton; 