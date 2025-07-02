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

  // Get insights text (either from insights array or fallback to text)
  const insights = log.insights || log.text;
  const insightsText = Array.isArray(insights) 
    ? insights.map(insight => `• ${insight}`).join('\n')
    : insights;

  // Use MongoDB _id for the card
  const messageId = log._id;
  card.setAttribute('data-message-id', messageId);
  card.className = 'storage-card'; // Add a unique class for easy identification
  
  // Debug: Log the card structure
  console.log('Created card with class:', card.className);
  console.log('Card data-message-id:', card.getAttribute('data-message-id'));

  // Message text (clamped, single block)
  const textDiv = document.createElement('div');
  textDiv.className = 'storage-log-content clamped';
  textDiv.style.flex = '1';
  textDiv.style.minWidth = '0';
  textDiv.style.whiteSpace = 'pre-line';
  textDiv.textContent = insightsText;
  textDiv.style.color = isDark ? '#f3f6fa' : '#1a1a1a';
  
  // Apply initial clamping
  const messageLines = insightsText.split('\n').length;
  const shouldClamp = messageLines > 4 || insightsText.length > 200;
  if (shouldClamp) {
    textDiv.style.display = '-webkit-box';
    textDiv.style.webkitLineClamp = '4';
    textDiv.style.webkitBoxOrient = 'vertical';
    textDiv.style.overflow = 'hidden';
    textDiv.style.textOverflow = 'ellipsis';
    textDiv.style.maxHeight = '5.6em';
  }

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
  showBtn.style.padding = '4px 8px';
  showBtn.style.borderRadius = '4px';
  showBtn.style.fontWeight = 'bold';
  
  // Better logic for determining if show button should be visible
  const shouldShowButton = messageLines > 4 || insightsText.length > 200; // Show if more than 4 lines OR more than 200 characters
  showBtn.style.display = shouldShowButton ? 'inline-block' : 'none';
  showBtn.className = 'storage-show-btn';
  
  // Debug logging
  console.log('Message lines:', messageLines, 'Text length:', insightsText.length, 'Should show button:', shouldShowButton);
  
  let expanded = false;
  showBtn.onclick = () => {
    expanded = !expanded;
    if (expanded) {
      textDiv.classList.remove('clamped');
      textDiv.classList.add('expanded');
      textDiv.style.display = 'block';
      textDiv.style.webkitLineClamp = 'unset';
      textDiv.style.overflow = 'visible';
      textDiv.style.textOverflow = 'unset';
      textDiv.style.maxHeight = 'none';
      showBtn.textContent = 'Show less';
    } else {
      textDiv.classList.remove('expanded');
      textDiv.classList.add('clamped');
      textDiv.style.display = '-webkit-box';
      textDiv.style.webkitLineClamp = '4';
      textDiv.style.overflow = 'hidden';
      textDiv.style.textOverflow = 'ellipsis';
      textDiv.style.maxHeight = '5.6em';
      showBtn.textContent = 'Show more';
    }
  };
  
  footerDiv.appendChild(leftFooter);
  footerDiv.appendChild(showBtn);

  // Plus button
  const plusBtn = document.createElement('button');
  plusBtn.className = 'storage-plus-btn';
  plusBtn.setAttribute('data-log', encodeURIComponent(insightsText));
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

  // Folder button
  const folderBtn = document.createElement('button');
  folderBtn.className = 'storage-folder-btn';
  folderBtn.setAttribute('data-message-id', messageId);
  folderBtn.title = 'Add to folder';
  folderBtn.style.background = isDark ? '#2e3a4a' : '#e6f3ff';
  folderBtn.style.border = 'none';
  folderBtn.style.borderRadius = '50%';
  folderBtn.style.width = '32px';
  folderBtn.style.height = '32px';
  folderBtn.style.display = 'flex';
  folderBtn.style.alignItems = 'center';
  folderBtn.style.justifyContent = 'center';
  folderBtn.style.cursor = 'pointer';
  folderBtn.style.fontSize = '16px';
  folderBtn.textContent = '📁';
  folderBtn.style.color = isDark ? '#b2f7ef' : '#1a73e8';
  folderBtn.style.marginLeft = '8px';

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'storage-delete-btn';
  deleteBtn.setAttribute('data-message-id', messageId);
  deleteBtn.title = 'Delete memory';
  deleteBtn.style.background = isDark ? '#3a2323' : '#f7e6e6';
  deleteBtn.style.border = 'none';
  deleteBtn.style.borderRadius = '50%';
  deleteBtn.style.width = '32px';
  deleteBtn.style.height = '32px';
  deleteBtn.style.display = 'flex';
  deleteBtn.style.alignItems = 'center';
  deleteBtn.style.justifyContent = 'center';
  deleteBtn.style.cursor = 'pointer';
  deleteBtn.style.fontSize = '16px';
  deleteBtn.textContent = '×';
  deleteBtn.style.color = isDark ? '#ffb2b2' : '#d32f2f';
  deleteBtn.style.marginLeft = '8px';

  // Add delete functionality
  deleteBtn.onclick = async (e) => {
    e.stopPropagation();
    
    if (confirm('Delete this memory? This action cannot be undone.')) {
      try {
        const res = await fetch('http://localhost:3000/api/messages/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: messageId })
        });
        
        if (res.ok) {
          // Remove the card from the UI
          card.remove();
          
          // Show success feedback
          if (window.showFeedback) {
            window.showFeedback('Memory deleted successfully!', 'success');
          }
        } else {
          throw new Error('Failed to delete message from backend');
        }
      } catch (error) {
        console.error('Error deleting memory:', error);
        alert('Failed to delete memory. Please try again.');
      }
    }
  };

  // Button container
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.alignItems = 'center';
  buttonContainer.style.gap = '8px';
  buttonContainer.appendChild(plusBtn);
  buttonContainer.appendChild(folderBtn);
  buttonContainer.appendChild(deleteBtn);

  // Stack text, footer, button container
  const leftCol = document.createElement('div');
  leftCol.style.flex = '1';
  leftCol.style.minWidth = '0';
  leftCol.appendChild(textDiv);
  leftCol.appendChild(footerDiv);
  card.appendChild(leftCol);
  card.appendChild(buttonContainer);
  
  return card;
}

// Attach listeners to storage cards (plus and folder buttons)
function attachStorageListeners() {
  const storageUI = document.getElementById('memory-chat-storage');
  if (!storageUI) return;
  
  // Use event delegation for better reliability
  // Remove any existing event listeners to prevent duplicates
  storageUI.removeEventListener('click', handleStorageCardClick);
  storageUI.addEventListener('click', handleStorageCardClick);
}

// Event delegation handler for all storage card interactions
function handleStorageCardClick(event) {
  const target = event.target;
  
  // Handle plus button clicks
  if (target.classList.contains('storage-plus-btn')) {
    const text = decodeURIComponent(target.getAttribute('data-log'));
    const prompt = document.querySelector('.ProseMirror');
    if (!prompt) return;
    
    let current = prompt.innerText.trim();
    const preface = 'Here is a useful memory for this conversation:';
    
    let newText = '';
    if (current.includes(preface)) {
      // If preface already exists, add as new memory with separator
      newText = current + `\n---\n${text}`;
    } else {
      // Add preface and first memory
      newText = (current ? current + '\n\n' : '') + preface + '\n\n---\n' + text;
    }
    
    // Set the prompt text using a more reliable method that preserves newlines
    prompt.focus();
    
    // Clear existing content
    prompt.innerHTML = '';
    
    // Convert newlines to <br> tags and insert as HTML to preserve formatting
    const formattedText = newText.replace(/\n/g, '<br>');
    prompt.innerHTML = formattedText;
    
    // Move cursor to end
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(prompt);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Immediately hide the card if it should be filtered out
    setTimeout(() => {
      hideCardIfIncludedInPrompt(target, text);
    }, 0);
  }
  
  // Handle folder button clicks
  if (target.classList.contains('storage-folder-btn')) {
    const messageId = target.getAttribute('data-message-id');
    
    // Show folder selector popup for storage insights
    if (window.showFolderSelectorForStorage) {
      window.showFolderSelectorForStorage(messageId);
    } else {
      console.error('showFolderSelectorForStorage function not available');
    }
  }
  
  // Handle delete button clicks
  if (target.classList.contains('storage-delete-btn')) {
    const messageId = target.getAttribute('data-message-id');
    console.log('Delete button clicked, messageId:', messageId);
    console.log('Button element:', target);
    
    // Confirm deletion
    if (confirm('Are you sure you want to delete this memory?')) {
      handleDeleteCard(target, messageId);
    }
  }
}

// Helper function to hide a card if its content is now included in the prompt
function hideCardIfIncludedInPrompt(button, memoryText) {
  const prompt = document.querySelector('.ProseMirror');
  if (!prompt) return;
  
  const promptText = prompt.innerText.trim();
  if (!promptText || !memoryText) return;
  
  const normalizedPrompt = promptText.toLowerCase().trim();
  const normalizedMemory = memoryText.toLowerCase().trim();
  
  // Use the same logic as filterOutPromptIncludedMemories
  const memoryWords = normalizedMemory.split(/\s+/).filter(word => word.length > 3);
  const promptWords = normalizedPrompt.split(/\s+/).filter(word => word.length > 3);
  
  let shouldHide = false;
  
  // If memory has very few words, use exact substring matching
  if (memoryWords.length <= 3) {
    shouldHide = normalizedPrompt.includes(normalizedMemory);
  } else {
    // For longer memories, check if a significant portion of words match
    const matchingWords = memoryWords.filter(word => promptWords.includes(word));
    const matchRatio = matchingWords.length / memoryWords.length;
    
    // If more than 80% of the memory words are in the prompt, consider it included
    shouldHide = matchRatio >= 0.8;
  }
  
  if (shouldHide) {
    const card = button.closest('.storage-card');
    if (card) {
      // Add a fade-out animation
      card.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
      card.style.opacity = '0';
      card.style.transform = 'translateX(-20px)';
      
      // Remove the card after animation
      setTimeout(() => {
        card.remove();
      }, 300);
    }
  }
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
window.attachStorageListeners = attachStorageListeners;
window.renderFolderMessageCard = renderFolderMessageCard; 