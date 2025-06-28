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
      
      messages.forEach(async msg => {
        // Ensure message has embedding using ONLY advanced semantic search
        let messageWithEmbedding = msg;
        
        if (!msg.embedding) {
          if (!window.advancedSemanticSearch) {
            console.error('Advanced semantic search not available for embedding generation');
            processed++;
            if (processed === messages.length) {
              resolve({ added, skipped });
            }
            return;
          }
          
          try {
            const processed = await window.advancedSemanticSearch.processText(msg.text);
            messageWithEmbedding = { ...msg, embedding: processed.embedding };
          } catch (error) {
            console.error('Failed to generate embedding:', error);
            processed++;
            if (processed === messages.length) {
              resolve({ added, skipped });
            }
            return;
          }
        }
        
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

function searchMessages(query, minScore = 0.85) {
  return getAllMessages().then(async messages => {
    // Use ONLY advanced semantic search
    if (!window.advancedSemanticSearch) {
      return Promise.reject(new Error('Advanced semantic search not available'));
    }
    
    if (!window.advancedSemanticSearch.isReady()) {
      return Promise.reject(new Error('Advanced semantic search model not loaded'));
    }
    
    try {
      const results = await window.advancedSemanticSearch.searchMessages(query, messages, messages.length, minScore);
      return results;
    } catch (error) {
      console.error('Advanced semantic search failed:', error);
      throw error;
    }
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
  return getAllMessages().then(async messages => {
    const messagesNeedingEmbeddings = messages.filter(msg => !msg.embedding);
    if (messagesNeedingEmbeddings.length === 0) return Promise.resolve();
    
    if (!window.advancedSemanticSearch) {
      return Promise.reject(new Error('Advanced semantic search not available'));
    }
    
    try {
      // Use optimized batch processing for better performance
      const messagesWithEmbeddings = await window.advancedSemanticSearch.processTextsOptimized(
        messagesNeedingEmbeddings.map(msg => msg.text),
        10, // batchSize
        3   // maxConcurrent
      );
      
      const processedMessages = messagesNeedingEmbeddings.map((msg, index) => ({
        ...msg,
        embedding: messagesWithEmbeddings[index].embedding
      }));
      
      return addMessages(processedMessages);
    } catch (error) {
      console.error('Failed to update embeddings:', error);
      throw error;
    }
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