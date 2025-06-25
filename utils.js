// Helper to get only the message text, excluding the log button
function getMessageText(msg) {
  const clone = msg.cloneNode(true);
  const btn = clone.querySelector('.memory-chat-log-btn');
  if (btn) btn.remove();
  return clone.innerText.trim();
}

// Load and display logs in the popup
function loadAndDisplayLogs() {
  const container = document.getElementById('memory-chat-log-container');
  if (!container) return;
  
  chrome.storage.local.get({ chatLogs: [] }, (result) => {
    const logs = result.chatLogs;
    if (logs.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No messages logged yet</div>';
      return;
    }
    
    container.innerHTML = logs.map(log => `
      <div style="
        background: #f8f9fa;
        border: 1px solid #e1e5e9;
        border-radius: 8px;
        margin-bottom: 12px;
        padding: 12px;
        font-size: 14px;
        line-height: 1.4;
        word-break: break-word;
      ">
        <div style="margin-bottom: 4px;">${log.text.replace(/\n/g, '<br>')}</div>
        <div style="color: #888; font-size: 11px;">${new Date(log.timestamp).toLocaleString()}</div>
      </div>
    `).join('');
  });
} 