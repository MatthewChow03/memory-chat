// IndexedDB utility for chat logs
const DB_NAME = 'memoryChatDB';
const STORE_NAME = 'chatLogs';
const DB_VERSION = 1;
const FOLDER_STORE = 'folders';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'text' });
      }
      if (!db.objectStoreNames.contains(FOLDER_STORE)) {
        db.createObjectStore(FOLDER_STORE, { keyPath: 'name' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function addMessages(messages) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      let added = 0, skipped = 0;
      let processed = 0;
      messages.forEach(msg => {
        const getReq = store.get(msg.text);
        getReq.onsuccess = () => {
          if (getReq.result) {
            skipped++;
          } else {
            store.add(msg);
            added++;
          }
          processed++;
          if (processed === messages.length) {
            resolve({ added, skipped });
          }
        };
        getReq.onerror = () => {
          processed++;
          if (processed === messages.length) {
            resolve({ added, skipped });
          }
        };
      });
      if (messages.length === 0) resolve({ added: 0, skipped: 0 });
    });
  });
}

function getAllMessages() {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  });
}

function clearMessages() {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
}

function messageExists(text) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(text);
      req.onsuccess = () => resolve(!!req.result);
      req.onerror = () => reject(req.error);
    });
  });
}

function addOrUpdateFolder(name, messages) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(FOLDER_STORE, 'readwrite');
      const store = tx.objectStore(FOLDER_STORE);
      const req = store.put({ name, messages });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
}

function getAllFolders() {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(FOLDER_STORE, 'readonly');
      const store = tx.objectStore(FOLDER_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const result = {};
        req.result.forEach(folder => {
          result[folder.name] = folder.messages;
        });
        resolve(result);
      };
      req.onerror = () => reject(req.error);
    });
  });
}

function removeFolder(name) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(FOLDER_STORE, 'readwrite');
      const store = tx.objectStore(FOLDER_STORE);
      const req = store.delete(name);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
}

function clearFolders() {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(FOLDER_STORE, 'readwrite');
      const store = tx.objectStore(FOLDER_STORE);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
}

function addMessageToFolder(name, message) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(FOLDER_STORE, 'readwrite');
      const store = tx.objectStore(FOLDER_STORE);
      const getReq = store.get(name);
      getReq.onsuccess = () => {
        let folder = getReq.result;
        if (!folder) {
          folder = { name, messages: [message] };
        } else {
          if (!folder.messages.some(m => m.text === message.text)) {
            folder.messages.push(message);
          }
        }
        const putReq = store.put(folder);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  });
}

window.memoryChatIDB = {
  openDB,
  addMessages,
  getAllMessages,
  clearMessages,
  messageExists,
  addOrUpdateFolder,
  getAllFolders,
  removeFolder,
  clearFolders,
  addMessageToFolder
}; 