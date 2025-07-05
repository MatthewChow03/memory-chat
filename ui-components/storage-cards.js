// Storage Cards Module
// Handles individual message card rendering and interactions

// Render a log card with plus button (safe DOM, with show more/less, footer always visible)
function renderLogCard(log, idx) {
  // Card container
  const card = document.createElement('div');
  const storageUI = document.getElementById('memory-chat-storage');
  const isDark = storageUI && storageUI.classList.contains('memory-chat-dark');
  card.className = 'storage-card';
  card.style.background = isDark ? '#23272f' : '#fff';
  card.style.border = isDark ? '1.5px solid #2c2f36' : '1.5px solid #e1e5e9';
  card.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
  card.style.borderRadius = '16px';
  card.style.margin = '18px 0';
  card.style.padding = '22px 28px';
  card.style.fontSize = '15px';
  card.style.lineHeight = '1.6';
  card.style.wordBreak = 'break-word';
  card.style.display = 'flex';
  card.style.alignItems = 'flex-start';
  card.style.gap = '18px';
  card.style.position = 'relative';
  card.style.transition = 'box-shadow 0.18s, border 0.18s, background 0.18s, opacity 0.2s';
  card.onmouseenter = () => {
    card.style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)';
    card.style.border = isDark ? '1.5px solid #b2f7ef' : '1.5px solid #b2f7ef';
  };
  card.onmouseleave = () => {
    card.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
    card.style.border = isDark ? '1.5px solid #2c2f36' : '1.5px solid #e1e5e9';
  };

  // Use MongoDB _id for the card
  const messageId = log._id;
  card.setAttribute('data-message-id', messageId);

  // Checkbox for multi-select - using same approach as multiselect component
  const checkboxWrapper = document.createElement('div');
  checkboxWrapper.className = 'storage-card-checkbox-wrapper';
  checkboxWrapper.style.margin = '6px 16px 0 0';
  checkboxWrapper.style.position = 'relative';
  checkboxWrapper.style.width = '20px';
  checkboxWrapper.style.height = '20px';
  checkboxWrapper.style.cursor = 'pointer';

  // Hidden native checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'storage-card-checkbox';
  checkbox.style.opacity = '0';
  checkbox.style.width = '20px';
  checkbox.style.height = '20px';
  checkbox.style.margin = '0';
  checkbox.style.position = 'absolute';
  checkbox.style.left = '0';
  checkbox.style.top = '0';
  checkbox.style.cursor = 'pointer';
  checkbox.style.zIndex = '2';
  checkbox.checked = window.selectedCards && window.selectedCards[messageId];

  // Custom visual checkbox
  const visualCheckbox = document.createElement('span');
  visualCheckbox.className = 'storage-card-visual-checkbox';
  visualCheckbox.style.display = 'block';
  visualCheckbox.style.width = '20px';
  visualCheckbox.style.height = '20px';
  visualCheckbox.style.border = '2px solid #b2f7ef';
  visualCheckbox.style.borderRadius = '6px';
  visualCheckbox.style.background = '#fff';
  visualCheckbox.style.transition = 'border-color 0.2s, background 0.2s';
  visualCheckbox.style.position = 'relative';
  visualCheckbox.style.zIndex = '1';

  // SVG checkmark (hidden by default)
  const checkSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  checkSvg.setAttribute('width', '16');
  checkSvg.setAttribute('height', '16');
  checkSvg.setAttribute('viewBox', '0 0 16 16');
  checkSvg.style.display = 'none';
  checkSvg.style.position = 'absolute';
  checkSvg.style.top = '50%';
  checkSvg.style.left = '50%';
  checkSvg.style.transform = 'translate(-50%, -50%)';
  checkSvg.style.pointerEvents = 'none';
  checkSvg.innerHTML = '<polyline points="3 8 7 12 13 4" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';

  // Set initial state
  if (checkbox.checked) {
    visualCheckbox.style.borderColor = '#1a73e8';
    visualCheckbox.style.background = '#1a73e8';
    checkSvg.style.display = 'block';
  }

  // Click handler
  checkboxWrapper.onclick = (e) => {
    e.stopPropagation();
    if (!window.selectedCards) window.selectedCards = {};
    
    checkbox.checked = !checkbox.checked;
    window.selectedCards[messageId] = checkbox.checked;
    
    if (checkbox.checked) {
      visualCheckbox.style.borderColor = '#1a73e8';
      visualCheckbox.style.background = '#1a73e8';
      checkSvg.style.display = 'block';
    } else {
      visualCheckbox.style.borderColor = '#b2f7ef';
      visualCheckbox.style.background = '#fff';
      checkSvg.style.display = 'none';
    }
  };

  // Sync visual state with checkbox
  checkbox.onchange = () => {
    if (checkbox.checked) {
      visualCheckbox.style.borderColor = '#1a73e8';
      visualCheckbox.style.background = '#1a73e8';
      checkSvg.style.display = 'block';
    } else {
      visualCheckbox.style.borderColor = '#b2f7ef';
      visualCheckbox.style.background = '#fff';
      checkSvg.style.display = 'none';
    }
  };

  // Add hover effects
  checkboxWrapper.onmouseenter = () => {
    if (!checkbox.checked) {
      visualCheckbox.style.borderColor = '#1a73e8';
      visualCheckbox.style.background = '#f8f9fa';
    }
  };

  checkboxWrapper.onmouseleave = () => {
    if (!checkbox.checked) {
      visualCheckbox.style.borderColor = '#b2f7ef';
      visualCheckbox.style.background = '#fff';
    }
  };

  visualCheckbox.appendChild(checkSvg);
  checkboxWrapper.appendChild(checkbox);
  checkboxWrapper.appendChild(visualCheckbox);

  // Main content (text)
  const insights = log.insights || log.text;
  const insightsText = Array.isArray(insights)
    ? insights.map(insight => `• ${insight}`).join('\n')
    : insights;
  const textDiv = document.createElement('div');
  textDiv.className = 'storage-log-content clamped';
  textDiv.style.flex = '1';
  textDiv.style.minWidth = '0';
  textDiv.style.whiteSpace = 'pre-line';
  textDiv.textContent = insightsText;
  textDiv.style.color = isDark ? '#f3f6fa' : '#1a1a1a';
  textDiv.style.fontWeight = '500';
  textDiv.style.fontSize = '15px';

  // Show More logic
  const messageLines = insightsText.split('\n').length;
  const shouldClamp = messageLines > 4 || insightsText.length > 200;
  if (shouldClamp) {
    textDiv.style.display = '-webkit-box';
    textDiv.style.webkitLineClamp = '4';
    textDiv.style.webkitBoxOrient = 'vertical';
    textDiv.style.overflow = 'hidden';
    textDiv.style.textOverflow = 'ellipsis';
    textDiv.style.maxHeight = '6.2em';
  }

  // Footer (timestamp + show more/less + similarity score)
  const footerDiv = document.createElement('div');
  footerDiv.style.display = 'flex';
  footerDiv.style.alignItems = 'center';
  footerDiv.style.justifyContent = 'space-between';
  footerDiv.style.marginTop = '16px';

  // Left side: timestamp and similarity score
  const leftFooter = document.createElement('div');
  leftFooter.style.display = 'flex';
  leftFooter.style.alignItems = 'center';
  leftFooter.style.gap = '14px';

  // Timestamp
  const ts = document.createElement('div');
  ts.style.color = isDark ? '#b2b8c2' : '#888';
  ts.style.fontSize = '13px';
  ts.textContent = new Date(log.timestamp).toLocaleString();
  leftFooter.appendChild(ts);

  // Similarity score (if available)
  if (log.similarity !== undefined || log.score !== undefined) {
    const score = log.similarity !== undefined ? log.similarity : log.score;
    const scoreDiv = document.createElement('div');
    scoreDiv.style.color = isDark ? '#b2f7ef' : '#007bff';
    scoreDiv.style.fontSize = '13px';
    scoreDiv.style.fontWeight = 'bold';
    scoreDiv.style.padding = '2px 10px';
    scoreDiv.style.background = isDark ? '#2e4a3a' : '#e6f7e6';
    scoreDiv.style.borderRadius = '8px';
    scoreDiv.textContent = `Score: ${(score * 100).toFixed(1)}%`;
    leftFooter.appendChild(scoreDiv);
  }

  // Show more/less button
  const showBtn = document.createElement('button');
  showBtn.textContent = 'Show more';
  showBtn.className = 'storage-show-btn';
  showBtn.style.background = 'none';
  showBtn.style.border = 'none';
  showBtn.style.color = isDark ? '#7ab7ff' : '#007bff';
  showBtn.style.cursor = 'pointer';
  showBtn.style.fontSize = '14px';
  showBtn.style.padding = '4px 10px';
  showBtn.style.borderRadius = '6px';
  showBtn.style.fontWeight = 'bold';
  showBtn.style.transition = 'background 0.15s, color 0.15s;';
  const shouldShowButton = messageLines > 4 || insightsText.length > 200;
  showBtn.style.display = shouldShowButton ? 'inline-block' : 'none';
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
      textDiv.style.maxHeight = '6.2em';
      showBtn.textContent = 'Show more';
    }
  };

  footerDiv.appendChild(leftFooter);
  footerDiv.appendChild(showBtn);

  // Three-dot menu
  const menuContainer = document.createElement('div');
  menuContainer.className = 'storage-card-menu-container';
  menuContainer.style.position = 'relative';
  menuContainer.style.marginLeft = '16px';

  const menuBtn = document.createElement('button');
  menuBtn.className = 'storage-card-menu-btn';
  menuBtn.innerHTML = '&#8942;'; // vertical ellipsis
  menuBtn.style.background = 'none';
  menuBtn.style.border = 'none';
  menuBtn.style.fontSize = '24px';
  menuBtn.style.color = isDark ? '#b2b8c2' : '#888';
  menuBtn.style.cursor = 'pointer';
  menuBtn.style.padding = '2px 10px';
  menuBtn.style.borderRadius = '8px';
  menuBtn.setAttribute('aria-label', 'Open card menu');
  menuBtn.onmouseenter = () => menuBtn.style.background = isDark ? '#2c2f36' : '#f4f6fa';
  menuBtn.onmouseleave = () => menuBtn.style.background = 'none';

  // Dropdown menu
  const dropdown = document.createElement('div');
  dropdown.className = 'storage-card-dropdown';
  dropdown.style.position = 'absolute';
  dropdown.style.top = '36px';
  dropdown.style.right = '0';
  dropdown.style.background = isDark ? '#23272f' : '#fff';
  dropdown.style.border = isDark ? '1.5px solid #2c2f36' : '1.5px solid #e1e5e9';
  dropdown.style.borderRadius = '10px';
  dropdown.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
  dropdown.style.display = 'none';
  dropdown.style.minWidth = '140px';
  dropdown.style.zIndex = '10';

  // Dropdown items
  const editItem = document.createElement('button');
  editItem.textContent = 'Edit';
  editItem.className = 'storage-card-menu-item';
  editItem.style.background = 'none';
  editItem.style.border = 'none';
  editItem.style.width = '100%';
  editItem.style.textAlign = 'left';
  editItem.style.padding = '12px 20px';
  editItem.style.fontSize = '15px';
  editItem.style.color = isDark ? '#b2f7ef' : '#007bff';
  editItem.style.cursor = 'pointer';
  editItem.onmouseover = () => editItem.style.background = isDark ? '#2c2f36' : '#f4f6fa';
  editItem.onmouseout = () => editItem.style.background = 'none';
  editItem.onclick = (e) => {
    e.stopPropagation();
    dropdown.style.display = 'none';
    card.style.opacity = '1';
    // Inline edit: replace textDiv with textarea and save/cancel buttons
    if (card.querySelector('.storage-edit-area')) return; // Prevent multiple edits
    const originalText = insightsText;
    const editArea = document.createElement('textarea');
    editArea.className = 'storage-edit-area';
    editArea.value = originalText;
    editArea.style.width = '100%';
    editArea.style.minHeight = '80px';
    editArea.style.margin = '10px 0';
    editArea.style.fontSize = '15px';
    editArea.style.borderRadius = '10px';
    editArea.style.border = isDark ? '1.5px solid #2c2f36' : '1.5px solid #e1e5e9';
    editArea.style.background = isDark ? '#23272f' : '#fff';
    editArea.style.color = isDark ? '#f3f6fa' : '#1a1a1a';
    // Save/Cancel buttons
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.style.marginRight = '14px';
    saveBtn.style.padding = '8px 22px';
    saveBtn.style.borderRadius = '8px';
    saveBtn.style.border = 'none';
    saveBtn.style.background = isDark ? '#b2f7ef' : '#007bff';
    saveBtn.style.color = isDark ? '#23272f' : '#fff';
    saveBtn.style.fontWeight = 'bold';
    saveBtn.style.cursor = 'pointer';
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.padding = '8px 22px';
    cancelBtn.style.borderRadius = '8px';
    cancelBtn.style.border = 'none';
    cancelBtn.style.background = isDark ? '#23272f' : '#e1e5e9';
    cancelBtn.style.color = isDark ? '#b2f7ef' : '#222';
    cancelBtn.style.fontWeight = 'bold';
    cancelBtn.style.cursor = 'pointer';
    // Replace textDiv with editArea and buttons
    textDiv.style.display = 'none';
    footerDiv.style.display = 'none';
    const editWrapper = document.createElement('div');
    editWrapper.className = 'storage-edit-wrapper';
    editWrapper.appendChild(editArea);
    editWrapper.appendChild(saveBtn);
    editWrapper.appendChild(cancelBtn);
    contentCol.insertBefore(editWrapper, contentCol.firstChild);
    // Save logic
    saveBtn.onclick = async () => {
      const newText = editArea.value.trim();
      if (!newText) return;
      // Update backend
      try {
        const res = await fetch(`${SERVER_CONFIG.BASE_URL}${SERVER_CONFIG.API_ENDPOINTS.MESSAGES}/edit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: messageId, text: newText, userUUID: await getOrCreateUserUUID() })
        });
        if (!res.ok) throw new Error('Failed to update message');
        // Update UI
        textDiv.textContent = newText;
        textDiv.style.display = '';
        footerDiv.style.display = '';
        editWrapper.remove();
        if (window.showFeedback) window.showFeedback('Memory updated!', 'success');
      } catch (err) {
        if (window.showFeedback) window.showFeedback('Failed to update memory', 'error');
      }
    };
    // Cancel logic
    cancelBtn.onclick = () => {
      textDiv.style.display = '';
      footerDiv.style.display = '';
      editWrapper.remove();
    };
  };

  const organizeItem = document.createElement('button');
  organizeItem.textContent = 'Organize';
  organizeItem.className = 'storage-card-menu-item';
  organizeItem.style.background = 'none';
  organizeItem.style.border = 'none';
  organizeItem.style.width = '100%';
  organizeItem.style.textAlign = 'left';
  organizeItem.style.padding = '12px 20px';
  organizeItem.style.fontSize = '15px';
  organizeItem.style.color = isDark ? '#b2f7ef' : '#007bff';
  organizeItem.style.cursor = 'pointer';
  organizeItem.onmouseover = () => organizeItem.style.background = isDark ? '#2c2f36' : '#f4f6fa';
  organizeItem.onmouseout = () => organizeItem.style.background = 'none';
  organizeItem.onclick = (e) => {
    e.stopPropagation();
    dropdown.style.display = 'none';
    card.style.opacity = '1';
    if (window.showFolderSelectorForStorage) {
      window.showFolderSelectorForStorage(messageId);
    } else {
      if (window.showFeedback) window.showFeedback('Folder selector not available', 'error');
    }
  };

  const deleteItem = document.createElement('button');
  deleteItem.textContent = 'Delete';
  deleteItem.className = 'storage-card-menu-item';
  deleteItem.style.background = 'none';
  deleteItem.style.border = 'none';
  deleteItem.style.width = '100%';
  deleteItem.style.textAlign = 'left';
  deleteItem.style.padding = '12px 20px';
  deleteItem.style.fontSize = '15px';
  deleteItem.style.color = isDark ? '#ffb2b2' : '#d32f2f';
  deleteItem.style.cursor = 'pointer';
  deleteItem.onmouseover = () => deleteItem.style.background = isDark ? '#3a2323' : '#f7e6e6';
  deleteItem.onmouseout = () => deleteItem.style.background = 'none';
  deleteItem.onclick = async (e) => {
    e.stopPropagation();
    dropdown.style.display = 'none';
    card.style.opacity = '1';
    if (confirm('Delete this memory? This action cannot be undone.')) {
      try {
        const res = await fetch(`${SERVER_CONFIG.BASE_URL}${SERVER_CONFIG.API_ENDPOINTS.MESSAGES}/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: messageId, userUUID: await getOrCreateUserUUID() })
        });
        if (!res.ok) throw new Error('Failed to delete message');
        card.remove();
        if (window.showFeedback) window.showFeedback('Memory deleted successfully!', 'success');
      } catch (err) {
        if (window.showFeedback) window.showFeedback('Failed to delete memory', 'error');
      }
    }
  };

  dropdown.appendChild(editItem);
  dropdown.appendChild(organizeItem);
  dropdown.appendChild(deleteItem);

  // Menu open/close logic
  let menuOpen = false;
  menuBtn.onclick = (e) => {
    e.stopPropagation();
    menuOpen = !menuOpen;
    dropdown.style.display = menuOpen ? 'block' : 'none';
    card.style.opacity = menuOpen ? '0.7' : '1';
    // Close other open menus
    document.querySelectorAll('.storage-card-dropdown').forEach(dd => {
      if (dd !== dropdown) dd.style.display = 'none';
    });
  };
  // Close menu on click outside
  document.addEventListener('click', (e) => {
    if (!menuContainer.contains(e.target)) {
      dropdown.style.display = 'none';
      card.style.opacity = '1';
      menuOpen = false;
    }
  });

  menuContainer.appendChild(menuBtn);
  menuContainer.appendChild(dropdown);

  // Stack text, footer
  const contentCol = document.createElement('div');
  contentCol.style.flex = '1';
  contentCol.style.minWidth = '0';
  contentCol.appendChild(textDiv);
  contentCol.appendChild(footerDiv);

  card.appendChild(checkboxWrapper);
  card.appendChild(contentCol);
  card.appendChild(menuContainer);

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
  card.style.background = isDark ? '#23272f' : '#fff';
  card.style.border = isDark ? '1.5px solid #2c2f36' : '1.5px solid #e1e5e9';
  card.style.borderRadius = '16px';
  card.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
  card.style.marginBottom = '14px';
  card.style.padding = '20px 28px';
  card.style.fontSize = '15px';
  card.style.lineHeight = '1.6';
  card.style.color = isDark ? '#f3f6fa' : '#1a1a1a';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.gap = '10px';
  card.style.position = 'relative';
  card.style.transition = 'box-shadow 0.18s, border 0.18s, background 0.18s, opacity 0.2s';
  card.onmouseenter = () => {
    card.style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)';
    card.style.border = isDark ? '1.5px solid #b2f7ef' : '1.5px solid #b2f7ef';
  };
  card.onmouseleave = () => {
    card.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
    card.style.border = isDark ? '1.5px solid #2c2f36' : '1.5px solid #e1e5e9';
  };

  // Folder name (bold)
  const nameDiv = document.createElement('div');
  nameDiv.style.fontWeight = 'bold';
  nameDiv.style.fontSize = '17px';
  nameDiv.style.color = isDark ? '#b2f7ef' : '#222';
  nameDiv.style.marginBottom = '2px';
  nameDiv.textContent = folderName;

  // Description (1-line snippet)
  const descDiv = document.createElement('div');
  descDiv.style.fontSize = '14px';
  descDiv.style.color = isDark ? '#b2b8c2' : '#888';
  descDiv.style.whiteSpace = 'nowrap';
  descDiv.style.overflow = 'hidden';
  descDiv.style.textOverflow = 'ellipsis';
  descDiv.style.maxWidth = '100%';
  descDiv.textContent = (message.description || '').split('\n')[0];

  // Message count
  const countDiv = document.createElement('div');
  countDiv.style.fontSize = '13px';
  countDiv.style.color = isDark ? '#b2b8c2' : '#888';
  countDiv.textContent = message.messageCount !== undefined ? `${message.messageCount} message${message.messageCount !== 1 ? 's' : ''}` : '';

  // Footer with timestamp and actions
  const footerDiv = document.createElement('div');
  footerDiv.style.display = 'flex';
  footerDiv.style.alignItems = 'center';
  footerDiv.style.justifyContent = 'space-between';
  footerDiv.style.marginTop = '10px';

  // Timestamp
  const ts = document.createElement('div');
  ts.style.color = isDark ? '#b2b8c2' : '#888';
  ts.style.fontSize = '13px';
  ts.textContent = new Date(messageTimestamp).toLocaleString();

  // Actions (Delete)
  const actionsDiv = document.createElement('div');
  actionsDiv.style.display = 'flex';
  actionsDiv.style.gap = '10px';

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'remove-from-folder';
  deleteBtn.setAttribute('data-folder', folderName);
  deleteBtn.setAttribute('data-index', idx);
  deleteBtn.title = 'Remove';
  deleteBtn.style.background = isDark ? '#3a2323' : '#f7e6e6';
  deleteBtn.style.border = 'none';
  deleteBtn.style.borderRadius = '8px';
  deleteBtn.style.padding = '6px 14px';
  deleteBtn.style.cursor = 'pointer';
  deleteBtn.style.fontSize = '15px';
  deleteBtn.style.color = isDark ? '#ffb2b2' : '#d32f2f';
  deleteBtn.style.transition = 'background 0.15s, color 0.15s;';
  deleteBtn.onmouseenter = () => {
    deleteBtn.style.background = isDark ? '#5a2323' : '#ffd6d6';
  };
  deleteBtn.onmouseleave = () => {
    deleteBtn.style.background = isDark ? '#3a2323' : '#f7e6e6';
  };

  actionsDiv.appendChild(deleteBtn);

  footerDiv.appendChild(ts);
  footerDiv.appendChild(actionsDiv);

  card.appendChild(nameDiv);
  card.appendChild(descDiv);
  card.appendChild(countDiv);
  card.appendChild(footerDiv);

  return card;
}

// Export functions for use in other modules
window.renderLogCard = renderLogCard;
window.attachStorageListeners = attachStorageListeners;
window.renderFolderMessageCard = renderFolderMessageCard;
