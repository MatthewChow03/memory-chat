// Multi-select UI logic for Memory Chat Chrome Extension
// Injects a circle/checkbox to the left of each chat message and tracks selected messages

(function() {
  // Global set to track selected message elements
  window.memoryChatSelectedMessages = new Set();

  // Style for the multi-select circle
  const circleStyle = `
    display: inline-block;
    width: 22px;
    height: 22px;
    border: 2px solid #b2f7ef;
    border-radius: 50%;
    background: #fff;
    margin-right: 12px;
    vertical-align: middle;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    position: relative;
  `;
  const checkedStyle = `
    background: linear-gradient(90deg, #b2f7ef 0%, #c2f7cb 100%);
    border-color: #1a73e8;
  `;

  // Injects multi-select checkboxes into each chat message
  function addMultiSelectCircles() {
    const messages = document.querySelectorAll('[data-message-author-role]');
    messages.forEach(msg => {
      // Avoid duplicate checkboxes
      if (msg.querySelector('.memory-chat-multiselect-checkbox-wrapper')) return;

      // Find any existing button row
      const btnRow = msg.querySelector('.memory-chat-btn-row');

      // Create a top-level flex container for the entire message
      const topLevelContainer = document.createElement('div');
      topLevelContainer.className = 'memory-chat-message-top-level';
      topLevelContainer.style.display = 'flex';
      topLevelContainer.style.flexDirection = 'row';
      topLevelContainer.style.alignItems = 'flex-start';
      topLevelContainer.style.gap = '12px';
      topLevelContainer.style.width = 'calc(100% + 60px)';
      topLevelContainer.style.marginRight = '-60px';

      // Create a container for the message content and buttons
      const messageContentContainer = document.createElement('div');
      messageContentContainer.className = 'memory-chat-message-content-container';
      messageContentContainer.style.display = 'flex';
      messageContentContainer.style.flexDirection = 'column';
      messageContentContainer.style.flex = '1';
      messageContentContainer.style.minWidth = '0';

      // Move all children except the button row into the message content container
      while (msg.firstChild && msg.firstChild !== btnRow) {
        messageContentContainer.appendChild(msg.firstChild);
      }

      // Add the button row to the message content container if it exists
      if (btnRow) {
        messageContentContainer.appendChild(btnRow);
      }

      // Create the custom checkbox wrapper
      const wrapper = document.createElement('span');
      wrapper.className = 'memory-chat-multiselect-checkbox-wrapper';
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'flex-start';
      wrapper.style.justifyContent = 'center';
      wrapper.style.width = '22px';
      wrapper.style.height = '22px';
      wrapper.style.marginTop = '8px';
      wrapper.style.flexShrink = '0';
      wrapper.style.position = 'sticky';
      wrapper.style.top = '12px';
      wrapper.style.zIndex = '10';

      // Create the hidden native checkbox
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'memory-chat-multiselect-checkbox';
      checkbox.setAttribute('tabindex', '0');
      checkbox.setAttribute('role', 'checkbox');
      checkbox.setAttribute('aria-checked', 'false');
      checkbox.style.opacity = '0';
      checkbox.style.width = '22px';
      checkbox.style.height = '22px';
      checkbox.style.margin = '0';
      checkbox.style.position = 'absolute';
      checkbox.style.left = '0';
      checkbox.style.top = '0';
      checkbox.style.cursor = 'pointer';
      checkbox.style.zIndex = '2';

      // Create the custom visual box
      const visual = document.createElement('span');
      visual.className = 'memory-chat-multiselect-custombox';
      visual.style.display = 'inline-flex';
      visual.style.alignItems = 'center';
      visual.style.justifyContent = 'center';
      visual.style.width = '22px';
      visual.style.height = '22px';
      visual.style.border = '2px solid #b2f7ef';
      visual.style.borderRadius = '6px';
      visual.style.background = '#fff';
      visual.style.transition = 'border-color 0.2s, background 0.2s';
      visual.style.position = 'relative';
      visual.style.zIndex = '1';

      // SVG checkmark (hidden by default)
      const checkSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      checkSvg.setAttribute('width', '22');
      checkSvg.setAttribute('height', '22');
      checkSvg.setAttribute('viewBox', '0 0 22 22');
      checkSvg.style.display = 'none';
      checkSvg.style.position = 'static';
      checkSvg.innerHTML = '<polyline points="6 12 10 16 16 8" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>';

      visual.style.display = 'flex';
      visual.style.alignItems = 'center';
      visual.style.justifyContent = 'center';
      visual.appendChild(checkSvg);
      wrapper.appendChild(checkbox);
      wrapper.appendChild(visual);

      // Click handler to toggle selection (logic unchanged)
      wrapper.onclick = (e) => {
        e.stopPropagation();
        const isSelected = window.memoryChatSelectedMessages.has(msg);
        if (isSelected) {
          window.memoryChatSelectedMessages.delete(msg);
          checkbox.checked = false;
          checkbox.setAttribute('aria-checked', 'false');
          visual.style.borderColor = '#b2f7ef';
          visual.style.background = '#fff';
          checkSvg.style.display = 'none';
        } else {
          window.memoryChatSelectedMessages.add(msg);
          checkbox.checked = true;
          checkbox.setAttribute('aria-checked', 'true');
          visual.style.borderColor = '#1a73e8';
          visual.style.background = '#1a73e8';
          checkSvg.style.display = 'block';
        }
        window.dispatchEvent(new CustomEvent('memoryChatSelectionChanged'));
      };

      // Sync visual state with checkbox (for keyboard accessibility)
      checkbox.onchange = () => {
        if (checkbox.checked) {
          window.memoryChatSelectedMessages.add(msg);
          visual.style.borderColor = '#1a73e8';
          visual.style.background = '#1a73e8';
          checkSvg.style.display = 'block';
          checkbox.setAttribute('aria-checked', 'true');
        } else {
          window.memoryChatSelectedMessages.delete(msg);
          visual.style.borderColor = '#b2f7ef';
          visual.style.background = '#fff';
          checkSvg.style.display = 'none';
          checkbox.setAttribute('aria-checked', 'false');
        }
        window.dispatchEvent(new CustomEvent('memoryChatSelectionChanged'));
      };

      // Assemble the new structure
      topLevelContainer.appendChild(messageContentContainer);
      topLevelContainer.appendChild(wrapper);

      // Replace the message content with our new structure
      msg.appendChild(topLevelContainer);

      // Add scroll event listener to handle sticky behavior
      const handleScroll = () => {
        const messageRect = msg.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        const messageBottom = messageRect.bottom;
        const wrapperBottom = wrapperRect.bottom;
        
        // If the message is going out of view, adjust the checkbox position
        if (messageBottom < wrapperRect.height + 12) {
          // Calculate how much the checkbox should move down
          const offset = Math.max(0, wrapperRect.height + 12 - messageBottom);
          wrapper.style.top = `${12 - offset}px`;
        } else {
          wrapper.style.top = '12px';
        }
      };

      // Add scroll listener to window
      window.addEventListener('scroll', handleScroll, { passive: true });
      
      // Also handle resize events
      window.addEventListener('resize', handleScroll, { passive: true });
    });
  }

  // Export for use in content script or other UI logic
  window.addMultiSelectCircles = addMultiSelectCircles;

  // Button group logic above ChatGPT prompt input
  function addExtractInsightsButtonGroup() {
    // Remove button group if no messages are selected
    const count = window.memoryChatSelectedMessages.size;
    const existingGroup = document.getElementById('memory-chat-extract-insights-group');
    if (count === 0) {
      if (existingGroup) existingGroup.remove();
      return;
    }
    // Check if group already exists
    if (existingGroup) return;

    // Find the ChatGPT input box (composer)
    const composerForm = document.querySelector('form[aria-label="Message Composer"]');
    if (!composerForm) return;

    // Create the button group container
    const group = document.createElement('div');
    group.id = 'memory-chat-extract-insights-group';
    group.style.cssText = `
      display: flex;
      flex-direction: row;
      gap: 8px;
      justify-content: center;
      align-items: center;
      margin-bottom: 6px;
      width: 100%;
      z-index: 10010;
    `;

    // Extract Insights button
    const extractBtn = document.createElement('button');
    extractBtn.id = 'memory-chat-extract-insights-btn';
    extractBtn.textContent = 'Extract Insights';
    extractBtn.style.cssText = `
      padding: 6px 14px;
      background: #fff;
      color: #111;
      border: 1px solid #e1e5e9;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      cursor: pointer;
      opacity: 0.92;
      transition: background 0.2s, color 0.2s, opacity 0.2s;
    `;
    extractBtn.disabled = true;
    extractBtn.style.opacity = '0.5';

    // Deselect All button
    const deselectBtn = document.createElement('button');
    deselectBtn.id = 'memory-chat-deselect-all-btn';
    deselectBtn.textContent = 'Deselect All';
    deselectBtn.style.cssText = `
      padding: 6px 14px;
      background: #fff;
      color: #111;
      border: 1px solid #e1e5e9;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      cursor: pointer;
      opacity: 0.92;
      transition: background 0.2s, color 0.2s, opacity 0.2s;
    `;

    // Enable/disable based on selection
    function updateButtonState() {
      const count = window.memoryChatSelectedMessages.size;
      if (count === 0) {
        group.remove();
        return;
      }
      extractBtn.disabled = count === 0;
      extractBtn.style.opacity = count === 0 ? '0.5' : '0.92';
    }
    window.addEventListener('memoryChatSelectionChanged', updateButtonState);
    updateButtonState();

    // Extract Insights button click (reuse existing logic)
    extractBtn.onclick = async (e) => {
      e.preventDefault();
      if (extractBtn.disabled) return;
      // Gather selected messages' text
      const selected = Array.from(window.memoryChatSelectedMessages);
      const messageTexts = selected.map(msg => {
        if (window.MemoryChatUtils && window.MemoryChatUtils.getMessageText) {
          return window.MemoryChatUtils.getMessageText(msg);
        }
        return msg.innerText;
      });
      // Modal container
      const modal = document.createElement('div');
      modal.id = 'memory-chat-insight-modal';
      modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.18);
        z-index: 10020;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      // Modal content
      const content = document.createElement('div');
      content.style.cssText = `
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.16);
        width: 520px;
        max-width: 96vw;
        max-height: 90vh;
        padding: 0;
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        border: 1px solid #e1e5e9;
        position: relative;
      `;
      // Header with close button
      const header = document.createElement('div');
      header.style.cssText = 'padding: 20px 24px 12px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e1e5e9;';
      const title = document.createElement('h3');
      title.textContent = 'Extract Insight';
      title.style.cssText = 'margin: 0; font-size: 20px; color: #1a1a1a;';
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '×';
      closeBtn.style.cssText = 'background: none; border: none; font-size: 28px; cursor: pointer; color: #666; margin-left: 8px;';
      closeBtn.onclick = () => modal.remove();
      header.appendChild(title);
      header.appendChild(closeBtn);
      // Selected messages preview
      const preview = document.createElement('div');
      preview.style.cssText = 'padding: 16px 24px; background: #f8f9fa; border-bottom: 1px solid #e1e5e9; max-height: 160px; overflow-y: auto; font-size: 14px; color: #333;';
      preview.innerHTML = messageTexts.map(text => `<div style="margin-bottom:8px;">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`).join('');
      // Custom instructions textarea (hidden by default)
      const promptLabel = document.createElement('label');
      promptLabel.textContent = 'Custom instructions for regeneration:';
      promptLabel.style.cssText = 'margin: 16px 24px 4px 24px; font-size: 14px; color: #1a1a1a; font-weight: 500; display: none;';
      const promptBox = document.createElement('textarea');
      promptBox.style.cssText = 'margin: 0 24px 0 24px; width: calc(100% - 48px); min-height: 36px; max-height: 60px; border-radius: 8px; border: 1px solid #e1e5e9; font-size: 14px; padding: 8px; resize: vertical; background: #f4f6fa; color: #1a1a1a; display: none;';
      promptBox.placeholder = 'E.g. Summarize the main points, extract action items, etc. Press Enter to submit.';
      // Editable insight textarea
      const insightBox = document.createElement('textarea');
      insightBox.style.cssText = 'margin: 18px 24px 0 24px; width: calc(100% - 48px); min-height: 80px; max-height: 180px; border-radius: 8px; border: 1px solid #e1e5e9; font-size: 15px; padding: 12px; resize: vertical; background: #f4f6fa; color: #1a1a1a;';
      insightBox.placeholder = 'Your extracted insight will appear here...';
      insightBox.value = '';
      // Button row
      const btnRow = document.createElement('div');
      btnRow.style.cssText = 'display: flex; gap: 12px; justify-content: flex-end; padding: 18px 24px 24px 24px;';
      const btns = [
        { text: 'Regenerate', handler: null },
        { text: 'Add to Memories', handler: null },
        { text: 'Add to Folder', handler: null },
        { text: 'Start New Chat', handler: null },
      ];
      btns.forEach(({text, handler}) => {
        const b = document.createElement('button');
        b.textContent = text;
        b.style.cssText = 'padding: 10px 18px; background: linear-gradient(90deg, #b2f7ef 0%, #c2f7cb 100%); color: #1a1a1a; border: none; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.06);';
        btnRow.appendChild(b);
      });
      // Assemble modal
      content.appendChild(header);
      content.appendChild(preview);
      content.appendChild(promptLabel);
      content.appendChild(promptBox);
      content.appendChild(insightBox);
      content.appendChild(btnRow);
      modal.appendChild(content);
      document.body.appendChild(modal);
      // Close modal on outside click
      modal.addEventListener('mousedown', (e) => {
        if (e.target === modal) modal.remove();
      });
      // Fetch initial insight from backend
      (async () => {
        try {
          const userUUID = await getUserUUID();
          const payload = {
            userUUID,
            messages: messageTexts,
            prompt: ''
          };
          insightBox.value = 'Generating insight...';
          const res = await fetch('http://localhost:3000/api/extract-insight', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error('Failed to extract insight');
          const data = await res.json();
          if (!data.insights || !Array.isArray(data.insights)) throw new Error('No insights returned');
          insightBox.value = data.insights.join('\n---\n');
        } catch (e) {
          console.error(e);
          insightBox.value = 'Failed to generate insight.';
        }
      })();
      // Patch actions, pass promptBox, and add logic for Regenerate button
      const [regenBtn, memBtn, folderBtn, chatBtn] = btnRow.querySelectorAll('button');
      // Regenerate button logic
      regenBtn.onclick = async () => {
        // Show prompt input if hidden
        promptLabel.style.display = 'block';
        promptBox.style.display = 'block';
        promptBox.focus();
        // If already has value, allow user to submit
        promptBox.onkeydown = async (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const prompt = promptBox.value.trim();
            if (!prompt) return;
            const toast = window.MemoryChatUtils && window.MemoryChatUtils.createProgressToast ? window.MemoryChatUtils.createProgressToast('Regenerating insight...') : null;
            try {
              const userUUID = await getUserUUID();
              const payload = {
                userUUID,
                messages: messageTexts,
                prompt
              };
              insightBox.value = 'Regenerating...';
              const res = await fetch('http://localhost:3000/api/extract-insight', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              if (!res.ok) throw new Error('Failed to regenerate insight');
              const data = await res.json();
              if (!data.insights || !Array.isArray(data.insights)) throw new Error('No insights returned');
              insightBox.value = data.insights.join('\n---\n');
              if (toast && window.MemoryChatUtils && window.MemoryChatUtils.updateProgressToast) window.MemoryChatUtils.updateProgressToast(toast, 1, 1, 'Insight generated!');
              setTimeout(() => toast && window.MemoryChatUtils.removeProgressToast && window.MemoryChatUtils.removeProgressToast(toast), 600);
              window.showFeedback && window.showFeedback('Insight regenerated!', 'success');
            } catch (e) {
              insightBox.value = 'Failed to regenerate insight.';
              toast && window.MemoryChatUtils.removeProgressToast && window.MemoryChatUtils.removeProgressToast(toast);
              window.showFeedback && window.showFeedback('Failed to regenerate insight.', 'error');
            }
          }
        };
      };
      // Add to Memories
      memBtn.onclick = async () => {
        const toast = window.MemoryChatUtils && window.MemoryChatUtils.createProgressToast ? window.MemoryChatUtils.createProgressToast('Saving to memories...') : null;
        try {
          const userUUID = await getUserUUID();
          const res = await fetch(`${window.SERVER_CONFIG?.BASE_URL || 'http://localhost:3000'}${window.SERVER_CONFIG?.API_ENDPOINTS?.MESSAGES || '/api/messages'}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: insightBox.value,
              timestamp: Date.now(),
              userUUID,
              insights: [insightBox.value] // Pass as array for compatibility
            })
          });
          if (!res.ok) throw new Error('Failed to add to memories');
          if (toast && window.MemoryChatUtils && window.MemoryChatUtils.updateProgressToast) window.MemoryChatUtils.updateProgressToast(toast, 1, 1, 'Saved!');
          setTimeout(() => toast && window.MemoryChatUtils.removeProgressToast && window.MemoryChatUtils.removeProgressToast(toast), 600);
          window.showFeedback && window.showFeedback('Insight added to memories!', 'success');
        } catch (e) {
          toast && window.MemoryChatUtils.removeProgressToast && window.MemoryChatUtils.removeProgressToast(toast);
          window.showFeedback && window.showFeedback('Failed to add to memories.', 'error');
        }
      };
      // Add to Folder
      folderBtn.onclick = async () => {
        modal.remove(); // Hide the insight modal before showing the folder popup
        await showInsightFolderSelector(insightBox.value);
      };
      // Start New Chat
      chatBtn.onclick = async () => {
        const insight = insightBox.value;
        // Copy to clipboard as fallback
        await copyToClipboard(insight);
        // Send message to background to navigate to new chat and inject insight
        chrome.runtime.sendMessage({
          type: 'START_NEW_CHAT_WITH_INSIGHT',
          insight
        });
        window.showFeedback && window.showFeedback('Navigating to new chat with your insight...', 'success');
      };
    };

    // Deselect All button click
    deselectBtn.onclick = () => {
      window.memoryChatSelectedMessages.forEach(msg => {
        // Uncheck the checkbox and update visual state
        const checkbox = msg.querySelector('.memory-chat-multiselect-checkbox');
        const visual = msg.querySelector('.memory-chat-multiselect-custombox');
        const checkSvg = visual && visual.querySelector('svg');
        if (checkbox) {
          checkbox.checked = false;
          checkbox.setAttribute('aria-checked', 'false');
        }
        if (visual) {
          visual.style.borderColor = '#b2f7ef';
          visual.style.background = '#fff';
        }
        if (checkSvg) {
          checkSvg.style.display = 'none';
        }
      });
      window.memoryChatSelectedMessages.clear();
      window.dispatchEvent(new CustomEvent('memoryChatSelectionChanged'));
    };

    group.appendChild(extractBtn);
    group.appendChild(deselectBtn);

    // Insert the button group above the composer input
    composerForm.parentNode.insertBefore(group, composerForm);
  }

  // Auto-initialize the button group on script load
  addExtractInsightsButtonGroup();
  // Also re-add if DOM changes (in case of navigation)
  window.addEventListener('memoryChatSelectionChanged', addExtractInsightsButtonGroup);
})();

// Helper to simulate async delay (for demo purposes)
function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

// Helper to copy text to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try { document.execCommand('copy'); } catch (err) { document.body.removeChild(textarea); return false; }
    document.body.removeChild(textarea);
    return true;
  }
}

// Helper to show folder selector for an insight (not a DOM message)
async function showInsightFolderSelector(insightText) {
  // Remove existing popup if any
  const existingPopup = document.getElementById('memory-chat-folder-popup');
  if (existingPopup) existingPopup.remove();

  // Get user UUID
  const userUUID = await getUserUUID();
  // Get folders from backend
  let folders = [];
  try {
    const res = await fetch(`${window.SERVER_CONFIG?.BASE_URL || 'http://localhost:3000'}${window.SERVER_CONFIG?.API_ENDPOINTS?.FOLDERS || '/api/folders'}?userUUID=${userUUID}`);
    if (res.ok) {
      folders = await res.json();
    }
  } catch (error) {
    window.showFeedback && window.showFeedback('Failed to load folders', 'error');
    return;
  }

  // Build popup
  const popup = document.createElement('div');
  popup.id = 'memory-chat-folder-popup';
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 400px;
    max-height: 500px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    z-index: 10001;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    border: 1px solid #e1e5e9;
  `;
  let popupHTML = `
    <div style="padding: 20px; border-bottom: 1px solid #e1e5e9; display: flex; justify-content: space-between; align-items: center;">
      <h3 style="margin: 0; color: #1a1a1a; font-size: 18px;">Add Insight to Folder</h3>
      <button id="memory-chat-folder-close" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #666;">×</button>
    </div>
    <div style="padding: 20px;">
  `;
  if (folders.length === 0) {
    popupHTML += `
      <div style="text-align: center; color: #888; margin-bottom: 20px;">No folders created yet</div>
      <button id="create-folder-from-popup" style="display: block; margin: 0 auto; padding: 10px 20px; background: linear-gradient(90deg,#b2f7ef 0%,#c2f7cb 100%); border: none; border-radius: 8px; color: #222; font-weight: bold; cursor: pointer;">Create New Folder</button>
    `;
  } else {
    popupHTML += `<div style="margin-bottom: 16px; font-weight: bold; color: #1a1a1a;">Select a folder:</div>`;
    folders.forEach(folder => {
      const messageCount = folder.messageCount || 0;
      popupHTML += `
        <div class="folder-option" data-folder="${folder.name}" data-folder-id="${folder.folderID}" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f8f9fa; border: 1px solid #e1e5e9; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: background 0.2s;">
          <div>
            <div style="font-weight: bold; color: #1a1a1a;">${folder.name}</div>
            <div style="font-size: 12px; color: #888;">${messageCount} message${messageCount !== 1 ? 's' : ''}</div>
          </div>
          <div style="color: #007bff; font-size: 14px;">+</div>
        </div>
      `;
    });
    popupHTML += `<div style="margin-top: 20px; text-align: center;"><button id="create-folder-from-popup" style="padding: 8px 16px; background: linear-gradient(90deg,#b2f7ef 0%,#c2f7cb 100%); border: none; border-radius: 6px; color: #222; font-weight: bold; cursor: pointer; font-size: 12px;">+ Create New Folder</button></div>`;
  }
  popupHTML += '</div>';
  popup.innerHTML = popupHTML;
  document.body.appendChild(popup);
  // Close button
  popup.querySelector('#memory-chat-folder-close').onclick = () => popup.remove();
  // Close on outside click
  popup.onclick = (e) => { if (e.target === popup) popup.remove(); };
  // Create folder
  const createBtn = popup.querySelector('#create-folder-from-popup');
  if (createBtn) {
    createBtn.onclick = async () => {
      const folderName = prompt('Enter folder name:');
      if (folderName && folderName.trim()) {
        const folderDescription = prompt('Enter a description for this folder (optional, 1 line):') || '';
        let autoPopulate = false;
        autoPopulate = confirm('Do you want to auto-populate this folder?');
        try {
          const res = await fetch(`${SERVER_CONFIG.BASE_URL}/api/folders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: folderName.trim(), description: folderDescription.trim(), userUUID: await getUserUUID(), autoPopulate })
          });
          if (!res.ok) throw new Error('Failed to create folder');
          popup.remove();
          window.showFeedback && window.showFeedback('Folder created successfully!', 'success');
        } catch (error) {
          window.showFeedback && window.showFeedback('Failed to create folder', 'error');
        }
      }
    };
  }
  // Folder option clicks
  popup.querySelectorAll('.folder-option').forEach(option => {
    option.onclick = async () => {
      const folderId = option.dataset.folderId;
      try {
        // Add the insight as a message to the folder
        const res = await fetch(`${window.SERVER_CONFIG?.BASE_URL || 'http://localhost:3000'}${window.SERVER_CONFIG?.API_ENDPOINTS?.FOLDERS || '/api/folders'}/${encodeURIComponent(folderId)}/add-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: insightText, timestamp: Date.now(), userUUID, insights: [insightText] })
        });
        if (!res.ok) throw new Error('Failed to add insight to folder');
        popup.remove();
        window.showFeedback && window.showFeedback('Insight added to folder!', 'success');
      } catch (error) {
        window.showFeedback && window.showFeedback('Failed to add insight to folder', 'error');
      }
    };
    option.onmouseenter = () => option.style.background = '#e9ecef';
    option.onmouseleave = () => option.style.background = '#f8f9fa';
  });
}

// Helper to get user UUID
async function getUserUUID() {
  if (window.getOrCreateUserUUID) return window.getOrCreateUserUUID();
  if (window.MemoryChatUtils && window.MemoryChatUtils.getOrCreateUserUUID) return window.MemoryChatUtils.getOrCreateUserUUID();
  return null;
} 