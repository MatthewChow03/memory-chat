// IndexedDB utility for chat logs
const DB_NAME = 'memoryChatDB';
const STORE_NAME = 'chatLogs';
const DB_VERSION = 4;
const FOLDER_STORE = 'folders';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;
      
      // Create or update chat logs store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // New store with insightsKey as keyPath (string representation of insights)
        db.createObjectStore(STORE_NAME, { keyPath: 'insightsKey' });
      } else if (oldVersion < 3) {
        // Upgrade existing store to insights schema
        db.deleteObjectStore(STORE_NAME);
        db.createObjectStore(STORE_NAME, { keyPath: 'insightsKey' });
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

// Process messages through insight extraction before storage
async function processMessagesForStorage(messages) {
  if (!window.insightExtractionService || !window.insightExtractionService.isReady()) {
    throw new Error('Insight extraction service not available or not initialized');
  }

  const processedMessages = [];
  
  for (const message of messages) {
    try {
      const messageText = message.text || message;
      const insights = await window.insightExtractionService.extractInsights(messageText);
      
      // Validate insights before adding to processed messages
      if (!insights || !Array.isArray(insights)) {
        console.error('Invalid insights returned from API:', insights);
        continue;
      }
      
      // Filter out empty or invalid insights
      const validInsights = insights.filter(insight => 
        insight && typeof insight === 'string' && insight.trim().length > 0
      );
      
      if (validInsights.length === 0) {
        console.error('No valid insights extracted for message:', messageText.substring(0, 100) + '...');
        continue;
      }
      
      // Create a unique key from insights array
      const insightsKey = validInsights.join('|');
      
      processedMessages.push({
        insights: validInsights,
        insightsKey: insightsKey, // String key for IndexedDB
        timestamp: message.timestamp || Date.now(),
        originalText: messageText // Keep original text for reference during transition
      });
    } catch (error) {
      console.error('Failed to extract insights for message:', error);
      // Skip messages that fail insight extraction
      continue;
    }
  }
  
  return processedMessages;
}

function addMessages(messages) {
  return processMessagesForStorage(messages).then(processedMessages => {
    return openDB().then(db => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        let added = 0, skipped = 0;
        let processed = 0;
        
        processedMessages.forEach(async msg => {
          // Ensure message has embedding using ONLY advanced semantic search
          let messageWithEmbedding = msg;
          
          if (!msg.embedding) {
            if (!window.advancedSemanticSearch) {
              console.error('Advanced semantic search not available for embedding generation');
              processed++;
              if (processed === processedMessages.length) {
                resolve({ added, skipped });
              }
              return;
            }
            
            try {
              // Create embedding from insights text (join insights with newlines)
              const insightsText = Array.isArray(msg.insights) ? msg.insights.join('\n') : msg.insights;
              const processed = await window.advancedSemanticSearch.processText(insightsText);
              messageWithEmbedding = { ...msg, embedding: processed.embedding };
            } catch (error) {
              console.error('Failed to generate embedding:', error);
              processed++;
              if (processed === processedMessages.length) {
                resolve({ added, skipped });
              }
              return;
            }
          }
          
          // Validate insights before using as key
          if (!messageWithEmbedding.insights) {
            console.error('Message missing insights field:', messageWithEmbedding);
            processed++;
            if (processed === processedMessages.length) {
              resolve({ added, skipped });
            }
            return;
          }
          
          // Ensure insights is an array and has valid content
          if (!Array.isArray(messageWithEmbedding.insights) || messageWithEmbedding.insights.length === 0) {
            console.error('Invalid insights format:', messageWithEmbedding.insights);
            processed++;
            if (processed === processedMessages.length) {
              resolve({ added, skipped });
            }
            return;
          }
          
          // Filter out empty insights
          const validInsights = messageWithEmbedding.insights.filter(insight => 
            insight && typeof insight === 'string' && insight.trim().length > 0
          );
          
          if (validInsights.length === 0) {
            console.error('No valid insights found:', messageWithEmbedding.insights);
            processed++;
            if (processed === processedMessages.length) {
              resolve({ added, skipped });
            }
            return;
          }
          
          // Update message with validated insights
          messageWithEmbedding = { ...messageWithEmbedding, insights: validInsights };
          
          // Create insightsKey for IndexedDB
          const insightsKey = validInsights.join('|');
          messageWithEmbedding = { ...messageWithEmbedding, insightsKey: insightsKey };
          
          // Use insightsKey for checking existence
          const getReq = store.get(insightsKey);
          getReq.onsuccess = () => {
            if (getReq.result) {
              // Update existing message with embedding if it doesn't have one
              if (!getReq.result.embedding && messageWithEmbedding.embedding) {
                const updatedMessage = { ...getReq.result, embedding: messageWithEmbedding.embedding };
                store.put(updatedMessage);
              }
              skipped++;
            } else {
              try {
                store.add(messageWithEmbedding);
                added++;
              } catch (error) {
                console.error('Failed to add message to store:', error, messageWithEmbedding);
                // Try to add with a fallback key if the insights key fails
                try {
                  const fallbackMessage = { 
                    ...messageWithEmbedding, 
                    insightsKey: `fallback_${Date.now()}_${Math.random()}`
                  };
                  store.add(fallbackMessage);
                  added++;
                } catch (fallbackError) {
                  console.error('Fallback key also failed:', fallbackError);
                }
              }
            }
            processed++;
            if (processed === processedMessages.length) {
              resolve({ added, skipped });
            }
          };
          getReq.onerror = () => {
            processed++;
            if (processed === processedMessages.length) {
              resolve({ added, skipped });
            }
          };
        });
        if (processedMessages.length === 0) resolve({ added: 0, skipped: 0 });
      });
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
      // Convert insights to text for search (join insights with newlines)
      const messagesForSearch = messages.map(msg => ({
        ...msg,
        text: Array.isArray(msg.insights) ? msg.insights.join('\n') : msg.insights
      }));
      
      const results = await window.advancedSemanticSearch.searchMessages(query, messagesForSearch, messagesForSearch.length, minScore);
      
      // Convert back to insights format for display
      return results.map(result => ({
        ...result,
        insights: result.insights || result.text,
        text: Array.isArray(result.insights) ? result.insights.join('\n') : result.insights
      }));
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

function messageExists(insights) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      
      // Convert insights array to key string
      const insightsKey = Array.isArray(insights) ? insights.join('|') : insights;
      
      const req = store.get(insightsKey);
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
      // Convert insights to text for embedding generation
      const insightsTexts = messagesNeedingEmbeddings.map(msg => 
        Array.isArray(msg.insights) ? msg.insights.join('\n') : msg.insights
      );
      
      // Use optimized batch processing for better performance
      const messagesWithEmbeddings = await window.advancedSemanticSearch.processTextsOptimized(
        insightsTexts,
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

// Debug function to check IndexedDB state
function debugIndexedDB() {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const messages = req.result;
        console.log('=== IndexedDB Debug Info ===');
        console.log('Total messages in store:', messages.length);
        console.log('Database version:', db.version);
        console.log('Store name:', STORE_NAME);
        console.log('Key path:', store.keyPath);
        
        if (messages.length > 0) {
          console.log('Sample message structure:', messages[0]);
          console.log('Sample insights:', messages[0].insights);
          console.log('Sample insightsKey:', messages[0].insightsKey);
          console.log('Insights type:', typeof messages[0].insights);
          console.log('Is insights array:', Array.isArray(messages[0].insights));
        }
        
        // Check for problematic messages
        const problematicMessages = messages.filter(msg => 
          !msg.insights || !Array.isArray(msg.insights) || msg.insights.length === 0 ||
          !msg.insightsKey || typeof msg.insightsKey !== 'string'
        );
        
        if (problematicMessages.length > 0) {
          console.warn('Found problematic messages:', problematicMessages.length);
          console.warn('Problematic messages:', problematicMessages);
        }
        
        resolve({
          totalMessages: messages.length,
          problematicMessages: problematicMessages.length,
          sampleMessage: messages[0] || null
        });
      };
      req.onerror = () => reject(req.error);
    });
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
  updateEmbeddingsForExistingMessages,
  debugIndexedDB
}; 