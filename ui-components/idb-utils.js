// IndexedDB utility for chat logs
const DB_NAME = 'memoryChatDB';
const STORE_NAME = 'chatLogs';
const DB_VERSION = 2;
const FOLDER_STORE = 'folders';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;
      
      // Create or update chat logs store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'text' });
      } else if (oldVersion < 2) {
        // Upgrade existing store to include embeddings
        db.deleteObjectStore(STORE_NAME);
        db.createObjectStore(STORE_NAME, { keyPath: 'text' });
      }
      
      // Create folders store
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
        // Ensure message has embedding if semantic search is available
        const messageWithEmbedding = msg.embedding ? msg : {
          ...msg,
          embedding: window.semanticSearch ? window.semanticSearch.processText(msg.text).embedding : null
        };
        
        const getReq = store.get(msg.text);
        getReq.onsuccess = () => {
          if (getReq.result) {
            // Update existing message with embedding if it doesn't have one
            if (!getReq.result.embedding && messageWithEmbedding.embedding) {
              const updatedMessage = { ...getReq.result, embedding: messageWithEmbedding.embedding };
              store.put(updatedMessage);
            }
            skipped++;
          } else {
            store.add(messageWithEmbedding);
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

function searchMessages(query, topK = 10) {
  return getAllMessages().then(messages => {
    if (!window.semanticSearch) {
      // Fallback to old cosine similarity if semantic search not available
      const scored = messages.map(log => ({...log, score: cosineSimilarity(query, log.text, messages.map(l => l.text))}));
      scored.sort((a, b) => b.score - a.score);
      return scored.filter(l => l.score > 0).slice(0, topK);
    }
    
    return window.semanticSearch.search(query, messages, topK);
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

// Add method to update embeddings for existing messages
function updateEmbeddingsForExistingMessages() {
  return getAllMessages().then(messages => {
    if (!window.semanticSearch) return Promise.resolve();
    
    const messagesNeedingEmbeddings = messages.filter(msg => !msg.embedding);
    if (messagesNeedingEmbeddings.length === 0) return Promise.resolve();
    
    const messagesWithEmbeddings = messagesNeedingEmbeddings.map(msg => ({
      ...msg,
      embedding: window.semanticSearch.processText(msg.text).embedding
    }));
    
    return addMessages(messagesWithEmbeddings);
  });
}

window.memoryChatIDB = {
  openDB,
  addMessages,
  getAllMessages,
  searchMessages,
  clearMessages,
  messageExists,
  addOrUpdateFolder,
  getAllFolders,
  removeFolder,
  clearFolders,
  addMessageToFolder,
  updateEmbeddingsForExistingMessages
}; 