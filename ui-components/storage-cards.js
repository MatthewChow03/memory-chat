// Storage Cards Module
// Handles individual message card rendering and interactions

// Render a log card with plus button (safe DOM, with show more/less, footer always visible)
function renderLogCard(log, idx) {
  // Card container
  const card = document.createElement('div');
  // Detect dark mode
  const storageUI = document.getElementById('memory-chat-storage');
  const isDark = storageUI && storageUI.classList.contains('memory-chat-dark');
  card.style.background = isDark ? '#2c2f36' : '#f8f9fa';
  card.style.border = isDark ? '1px solid #444a58' : '1px solid #e1e5e9';
  card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
  card.style.borderRadius = '8px';
  card.style.margin = '18px 0';
  card.style.padding = '16px';
  card.style.fontSize = '14px';
  card.style.lineHeight = '1.4';
  card.style.wordBreak = 'break-word';
  card.style.display = 'flex';
  card.style.alignItems = 'flex-start';
  card.style.justifyContent = 'space-between';
  card.style.gap = '8px';
  card.style.color = isDark ? '#f3f6fa' : '#1a1a1a';

  // Message text (clamped, single block)
  const textDiv = document.createElement('div');
  textDiv.className = 'storage-log-content clamped';
  textDiv.style.flex = '1';
  textDiv.style.minWidth = '0';
  textDiv.style.whiteSpace = 'pre-line';
  textDiv.textContent = log.text;
  textDiv.style.color = isDark ? '#f3f6fa' : '#1a1a1a';

  // Footer (timestamp + show more/less + similarity score)
  const footerDiv = document.createElement('div');
  footerDiv.style.display = 'flex';
  footerDiv.style.alignItems = 'center';
  footerDiv.style.justifyContent = 'space-between';
  footerDiv.style.marginTop = '8px';
  
  // Left side: timestamp and similarity score
  const leftFooter = document.createElement('div');
  leftFooter.style.display = 'flex';
  leftFooter.style.alignItems = 'center';
  leftFooter.style.gap = '8px';
  
  // Timestamp
  const ts = document.createElement('div');
  ts.style.color = isDark ? '#aaa' : '#888';
  ts.style.fontSize = '11px';
  ts.textContent = new Date(log.timestamp).toLocaleString();
  leftFooter.appendChild(ts);
  
  // Similarity score (if available)
  if (log.similarity !== undefined || log.score !== undefined) {
    const score = log.similarity !== undefined ? log.similarity : log.score;
    const scoreDiv = document.createElement('div');
    scoreDiv.style.color = isDark ? '#b2f7ef' : '#007bff';
    scoreDiv.style.fontSize = '11px';
    scoreDiv.style.fontWeight = 'bold';
    scoreDiv.style.padding = '2px 6px';
    scoreDiv.style.background = isDark ? '#2e4a3a' : '#e6f7e6';
    scoreDiv.style.borderRadius = '4px';
    scoreDiv.textContent = `Score: ${(score * 100).toFixed(1)}%`;
    leftFooter.appendChild(scoreDiv);
  }
  
  // Show more/less button
  const showBtn = document.createElement('button');
  showBtn.textContent = 'Show more';
  showBtn.style.background = 'none';
  showBtn.style.border = 'none';
  showBtn.style.color = isDark ? '#7ab7ff' : '#007bff';
  showBtn.style.cursor = 'pointer';
  showBtn.style.fontSize = '13px';
  showBtn.style.padding = '0';
  showBtn.style.display = (log.text.split('\n').length > 4) ? 'block' : 'none';
  showBtn.className = 'storage-show-btn';
  
  let expanded = false;
  showBtn.onclick = () => {
    expanded = !expanded;
    if (expanded) {
      textDiv.classList.remove('clamped');
      textDiv.classList.add('expanded');
      showBtn.textContent = 'Show less';
    } else {
      textDiv.classList.remove('expanded');
      textDiv.classList.add('clamped');
      showBtn.textContent = 'Show more';
    }
  };
  
  footerDiv.appendChild(leftFooter);
  footerDiv.appendChild(showBtn);

  // Plus button
  const plusBtn = document.createElement('button');
  plusBtn.className = 'storage-plus-btn';
  plusBtn.setAttribute('data-log', encodeURIComponent(log.text));
  plusBtn.title = 'Add to prompt';
  plusBtn.style.background = isDark ? '#2e3a4a' : '#e6f7e6';
  plusBtn.style.border = 'none';
  plusBtn.style.borderRadius = '50%';
  plusBtn.style.width = '32px';
  plusBtn.style.height = '32px';
  plusBtn.style.display = 'flex';
  plusBtn.style.alignItems = 'center';
  plusBtn.style.justifyContent = 'center';
  plusBtn.style.cursor = 'pointer';
  plusBtn.style.fontSize = '20px';
  plusBtn.textContent = '+';
  plusBtn.style.color = isDark ? '#b2f7ef' : '#222';

  // Stack text, footer, plus button
  const leftCol = document.createElement('div');
  leftCol.style.flex = '1';
  leftCol.style.minWidth = '0';
  leftCol.appendChild(textDiv);
  leftCol.appendChild(footerDiv);
  card.appendChild(leftCol);
  card.appendChild(plusBtn);
  
  return card;
}

// Attach plus button listeners to storage cards
function attachPlusListeners() {
  const storageUI = document.getElementById('memory-chat-storage');
  if (!storageUI) return;
  
  const plusBtns = storageUI.querySelectorAll('.storage-plus-btn');
  plusBtns.forEach(btn => {
    btn.onclick = () => {
      const text = decodeURIComponent(btn.getAttribute('data-log'));
      const prompt = document.querySelector('.ProseMirror');
      if (!prompt) return;
      
      let current = prompt.innerText.trim();
      const preface = 'Here is a useful memory for this conversation:';
      
      // Check if preface exists
      let newText = '';
      if (current.includes(preface)) {
        // Add as new bullet point
        newText = current.replace(new RegExp(`(${preface}[\s\S]*?)(\n|$)`), (match, p1) => {
          // Find where the bullets end
          return p1.endsWith('\n') ? p1 : p1 + '\n';
        });
        // Add bullet
        newText = current + `\n- ${text}`;
      } else {
        // Add preface and bullet
        newText = (current ? current + '\n' : '') + preface + '\n- ' + text;
      }
      
      // Set the prompt text (simulate typing)
      prompt.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, newText);
    };
  });
}

// Render folder message card
function renderFolderMessageCard(message, idx, folderName) {
  const storageUI = document.getElementById('memory-chat-storage');
  const isDark = storageUI && storageUI.classList.contains('memory-chat-dark');
  const messageText = typeof message === 'string' ? message : message.text;
  const messageTimestamp = typeof message === 'string' ? Date.now() : message.timestamp;
  const messageLines = messageText.split('\n').length;
  const showMoreBtn = messageLines > 4 ? 'block' : 'none';
  
  const card = document.createElement('div');
  card.style.background = isDark ? '#2c2f36' : '#f8f9fa';
  card.style.border = isDark ? '1px solid #444a58' : '1px solid #e1e5e9';
  card.style.borderRadius = '8px';
  card.style.marginBottom = '8px';
  card.style.padding = '12px';
  card.style.fontSize = '14px';
  card.style.lineHeight = '1.4';
  card.style.color = isDark ? '#f3f6fa' : '#1a1a1a';

  card.innerHTML = `
    <div class="folder-message-content clamped" style="white-space:pre-line;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;text-overflow:ellipsis;max-height:5.6em;color:${isDark ? '#f3f6fa' : '#1a1a1a'};">${messageText}</div>
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="color:${isDark ? '#aaa' : '#888'};font-size:11px;">${new Date(messageTimestamp).toLocaleString()}</div>
        <button class="folder-show-btn" data-index="${idx}" style="background:none;border:none;color:${isDark ? '#7ab7ff' : '#007bff'};cursor:pointer;font-size:13px;padding:0;display:${showMoreBtn};">Show more</button>
      </div>
      <button class="remove-from-folder" data-folder="${folderName}" data-index="${idx}" style="background:${isDark ? '#3a2323' : '#f7e6e6'};border:none;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:12px;color:${isDark ? '#ffb2b2' : '#d32f2f'};">Remove</button>
    </div>
  `;
  
  return card;
}

// Export functions for use in other modules
window.renderLogCard = renderLogCard;
window.attachPlusListeners = attachPlusListeners;
window.renderFolderMessageCard = renderFolderMessageCard; 