// Add a Clear All Logs button at the bottom of the chat
function addClearAllLogsButton() {
  if (document.querySelector('.memory-chat-clear-btn')) return;
  // Try to find the main chat container or fallback to body
  let container = document.querySelector('main') || document.body;
  const btn = document.createElement('button');
  btn.textContent = 'Clear All Logs';
  btn.className = 'memory-chat-clear-btn';
  btn.style.display = 'block';
  btn.style.margin = '32px auto 16px auto';
  btn.style.padding = '10px 28px';
  btn.style.background = 'linear-gradient(90deg, #f7d6b2 0%, #f7b2b2 100%)';
  btn.style.border = 'none';
  btn.style.borderRadius = '10px';
  btn.style.color = '#222';
  btn.style.fontWeight = 'bold';
  btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
  btn.style.cursor = 'pointer';
  btn.style.fontSize = '16px';
  btn.style.transition = 'background 0.2s, color 0.2s';
  btn.onmouseenter = () => btn.style.background = '#f7b2b2';
  btn.onmouseleave = () => btn.style.background = 'linear-gradient(90deg, #f7d6b2 0%, #f7b2b2 100%)';
  btn.onclick = () => {
    chrome.storage.local.set({ chatLogs: [] }, () => {
      // After clearing, update all log buttons
      document.querySelectorAll('.memory-chat-log-btn').forEach(b => {
        b.textContent = 'Add to Log';
        b.style.background = 'linear-gradient(90deg, #b2f7ef 0%, #c2f7cb 100%)';
        b.style.color = '#222';
      });
      // Update storage UI if open
      const storageUI = document.getElementById('memory-chat-storage');
      if (storageUI && storageUI.style.display !== 'none') {
        loadAndDisplayLogs();
      }
    });
  };
  container.appendChild(btn);
} 