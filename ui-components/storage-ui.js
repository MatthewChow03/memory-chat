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
    width: 800px;
    height: 700px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    z-index: 10000;
    display: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    border: 1px solid #e1e5e9;
    overflow: hidden;
    min-width: 350px;
    min-height: 500px;
    background: var(--storage-bg, #fff);
  `;

  // SVG icon markup (20x20 for all icons)
  const svgSearch = `<svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="2"/><line x1="15.65" y1="15.65" x2="19" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  const svgAccount = `<svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="7" r="3.5" stroke="currentColor" stroke-width="2"/><path d="M3 17c0-3.5 7-3.5 7-3.5s7 0 7 3.5" stroke="currentColor" stroke-width="2"/></svg>`;
  const svgMoon = `<svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 11.77A8 8 0 0110.21 2a6 6 0 100 12A8 8 0 0018 11.77z" fill="currentColor"/></svg>`;
  const svgSun = `<svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="6" fill="#FFD600"/><g stroke="#FFD600" stroke-width="2"><line x1="10" y1="1" x2="10" y2="4"/><line x1="10" y1="16" x2="10" y2="19"/><line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/><line x1="13.66" y1="13.66" x2="15.78" y2="15.78"/><line x1="1" y1="10" x2="4" y2="10"/><line x1="16" y1="10" x2="19" y2="10"/><line x1="4.22" y1="15.78" x2="6.34" y2="13.66"/><line x1="13.66" y1="6.34" x2="15.78" y2="4.22"/></g></svg>`;
  const svgCollapse = `<svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="13 5 7 10 13 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const svgExpand = `<svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="7 5 13 10 7 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const svgFolder = `<svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 5.5A1.5 1.5 0 014 4h3.5l1.5 2.25H16a1.5 1.5 0 011.5 1.5v6.25A1.5 1.5 0 0116 15.5H4A1.5 1.5 0 012.5 14V5.5z" stroke="currentColor" stroke-width="2" fill="none"/></svg>`;
  // New, visually balanced gear icon for 20x20
  const svgGear = `<svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <path d="M10 2v2M10 16v2M18 10h-2M4 10H2M15.66 4.34l-1.41 1.41M5.75 14.25l-1.41 1.41M15.66 15.66l-1.41-1.41M5.75 5.75l-1.41-1.41" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`;

  storageUI.innerHTML = `
    <div style="height:100%;display:flex;flex-direction:row;">
      <nav class="storage-sidebar" id="memory-chat-sidebar" style="width:150px;min-width:140px;max-width:180px;background:var(--sidebar-bg,#181a20);display:flex;flex-direction:column;align-items:stretch;padding:16px 0;gap:16px;position:relative;transition:width 0.2s;">
        <div id="sidebar-top-controls" style="width:100%;display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding:0 16px;">
          <div id="theme-toggle-group" style="display:flex;gap:8px;">
            <button id="theme-moon-btn" class="theme-toggle-btn" style="background:none;border:none;cursor:pointer;padding:2px;border-radius:6px;display:flex;align-items:center;justify-content:center;">
              <span class="theme-toggle-icon">${svgMoon}</span>
            </button>
            <button id="theme-sun-btn" class="theme-toggle-btn" style="background:none;border:none;cursor:pointer;padding:2px;border-radius:6px;display:flex;align-items:center;justify-content:center;">
              <span class="theme-toggle-icon">${svgSun}</span>
            </button>
          </div>
          <button id="sidebar-collapse-btn" style="background:none;border:none;cursor:pointer;padding:0 4px;">
            <span style="color:#fff;">${svgCollapse}</span>
          </button>
        </div>
        <button class="sidebar-btn" data-view="search" title="Search"><span class="sidebar-icon">${svgSearch}</span><span class="sidebar-label">Search</span></button>
        <button class="sidebar-btn" data-view="folders" title="Folders"><span class="sidebar-icon">${svgFolder}</span><span class="sidebar-label">Folders</span></button>
        <button class="sidebar-btn" data-view="settings" title="Settings"><span class="sidebar-icon">${svgGear}</span><span class="sidebar-label">Settings</span></button>
        <div style="flex:1;"></div>
        <button class="sidebar-btn" data-view="account" title="Account"><span class="sidebar-icon">${svgAccount}</span><span class="sidebar-label">Account</span></button>
        <button id="memory-chat-close" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #666; margin-top:16px;">×</button>
      </nav>
      <div class="storage-main" id="memory-chat-main" style="flex:1;display:flex;flex-direction:column;height:100%;background:var(--main-bg,#23272f);">
        <div id="memory-chat-tab-content" style="flex:1;overflow-y:auto;padding:0 0 0 0;"></div>
      </div>
      <div id="memory-chat-resize-handle" style="position: absolute; bottom: -8px; right: -8px; width: 24px; height: 24px; cursor: se-resize; background: linear-gradient(135deg, transparent 50%, #007bff 50%); border-radius: 0 0 16px 0; box-shadow: 0 2px 8px rgba(0,123,255,0.3), 0 0 0 2px rgba(0,123,255,0.1); transition: all 0.2s ease; z-index: 10001;"></div>
      <div id="sidebar-expand-btn" style="display:none;position:absolute;left:0;top:24px;z-index:10002;">
        <button style="background:none;border:none;cursor:pointer;padding:0 8px;">
          <span style="color:#fff;">${svgExpand}</span>
        </button>
      </div>
    </div>
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

  // Theme toggle logic (side by side)
  const moonBtn = storageUI.querySelector('#theme-moon-btn');
  const sunBtn = storageUI.querySelector('#theme-sun-btn');
  function updateThemeToggle(selected) {
    if (selected === 'dark') {
      moonBtn.style.background = '#23272f';
      moonBtn.style.color = '#b2f7ef';
      sunBtn.style.background = 'none';
      sunBtn.style.color = '#fff';
    } else {
      sunBtn.style.background = '#f8f9fa';
      sunBtn.style.color = '#b2f7ef';
      moonBtn.style.background = 'none';
      moonBtn.style.color = '#fff';
    }
  }
  chrome.storage.local.get({ storageTheme: 'light' }, (result) => {
    updateThemeToggle(result.storageTheme === 'dark' ? 'dark' : 'light');
  });
  moonBtn.onclick = () => {
    chrome.storage.local.set({ storageTheme: 'dark' }, () => {
      if (window.applyStorageTheme) window.applyStorageTheme();
      updateThemeToggle('dark');
    });
  };
  sunBtn.onclick = () => {
    chrome.storage.local.set({ storageTheme: 'light' }, () => {
      if (window.applyStorageTheme) window.applyStorageTheme();
      updateThemeToggle('light');
    });
  };

  // Sidebar collapse/expand logic
  const sidebar = storageUI.querySelector('#memory-chat-sidebar');
  const collapseBtn = storageUI.querySelector('#sidebar-collapse-btn');
  const expandBtnContainer = storageUI.querySelector('#sidebar-expand-btn');
  const expandBtn = expandBtnContainer.querySelector('button');
  collapseBtn.onclick = () => {
    sidebar.style.display = 'none';
    expandBtnContainer.style.display = 'block';
  };
  expandBtn.onclick = () => {
    sidebar.style.display = 'flex';
    expandBtnContainer.style.display = 'none';
  };

  // Sidebar button hover/active color
  const sidebarBtns = storageUI.querySelectorAll('.sidebar-btn');
  sidebarBtns.forEach(btn => {
    btn.style.display = 'flex';
    btn.style.flexDirection = 'row';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'flex-start';
    btn.style.gap = '12px';
    btn.style.padding = '10px 16px';
    btn.style.fontSize = '16px';
    btn.style.color = '#fff';
    btn.style.background = 'none';
    btn.style.border = 'none';
    btn.style.borderRadius = '8px';
    btn.style.marginBottom = '4px';
    btn.style.transition = 'background 0.15s, color 0.15s';
    btn.style.textAlign = 'left';
    btn.querySelector('.sidebar-icon').style.color = '#fff';
    const label = btn.querySelector('.sidebar-label');
    label.style.color = '#fff';
    label.style.fontSize = '16px';
    label.style.fontWeight = '600';
    label.style.textAlign = 'left';
    btn.onmouseenter = () => {
      btn.style.color = '#b2f7ef';
      btn.querySelector('.sidebar-icon').style.color = '#b2f7ef';
      label.style.color = '#b2f7ef';
    };
    btn.onmouseleave = () => {
      btn.style.color = '#fff';
      btn.querySelector('.sidebar-icon').style.color = '#fff';
      label.style.color = '#fff';
    };
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
  storageBtn.title = 'View Memory Storage';
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
