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
    width: 400px;
    max-height: 600px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    z-index: 10000;
    display: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    border: 1px solid #e1e5e9;
  `;
  
  storageUI.innerHTML = `
    <div style="padding: 20px; border-bottom: 1px solid #e1e5e9; display: flex; justify-content: space-between; align-items: center;">
      <h3 style="margin: 0; color: #1a1a1a; font-size: 18px;">Message Storage</h3>
      <button id="memory-chat-close" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #666;">×</button>
    </div>
    <div id="memory-chat-log-container" style="padding: 20px; max-height: 500px; overflow-y: auto;">
      <div style="text-align: center; color: #666; padding: 20px;">No messages stored yet</div>
    </div>
  `;
  
  document.body.appendChild(storageUI);
  
  // Close button functionality
  document.getElementById('memory-chat-close').onclick = () => {
    storageUI.style.display = 'none';
  };
  
  // Close on outside click
  storageUI.onclick = (e) => {
    if (e.target === storageUI) {
      storageUI.style.display = 'none';
    }
  };
}

// Add storage button to ChatGPT interface
function addStorageButton() {
  if (document.querySelector('.memory-chat-view-btn')) return;

  // Find the composer footer actions container
  const footerActions = document.querySelector('div[data-testid="composer-footer-actions"]');
  if (!footerActions) return;

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

  storageBtn.onclick = () => {
    const storageUI = document.getElementById('memory-chat-storage');
    if (storageUI) {
      storageUI.style.display = storageUI.style.display === 'none' ? 'block' : 'none';
      if (storageUI.style.display === 'block') {
        loadAndDisplayLogs();
      }
    }
  };

  // Append the storage button to the footer actions
  footerActions.appendChild(storageBtn);
} 