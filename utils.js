// Get the current prompt text from the input area
function getPromptText() {
  const prompt = document.querySelector('.ProseMirror');
  return prompt ? prompt.innerText.trim() : '';
}

// UUID management for user identification
async function getOrCreateUserUUID() {
  return new Promise((resolve, reject) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['userUUID'], function(result) {
        if (result.userUUID) {
          resolve(result.userUUID);
        } else {
          const uuid = generateUUID();
          chrome.storage.local.set({ userUUID: uuid }, function() {
            resolve(uuid);
          });
        }
      });
    } else if (typeof localStorage !== 'undefined') {
      let uuid = localStorage.getItem('userUUID');
      if (uuid) {
        resolve(uuid);
      } else {
        uuid = generateUUID();
        localStorage.setItem('userUUID', uuid);
        resolve(uuid);
      }
    } else {
      reject('No storage available');
    }
  });
}

function generateUUID() {
  // RFC4122 version 4 compliant UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
