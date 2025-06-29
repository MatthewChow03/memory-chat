// IndexedDB utility for chat logs
const DB_NAME = 'memoryChatDB';
const STORE_NAME = 'chatLogs';
const DB_VERSION = 4;
const FOLDER_STORE = 'folders';

// Simple hash function to make keys more unique
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

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
      const insightsKey = validInsights.join('|') + '_' + simpleHash(validInsights.join('|'));
      
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
          const insightsKey = validInsights.join('|') + '_' + simpleHash(validInsights.join('|'));
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
      
      // Convert insights array to key string with hash
      const insightsKey = Array.isArray(insights) 
        ? insights.join('|') + '_' + simpleHash(insights.join('|'))
        : insights;
      
      const req = store.get(insightsKey);
      req.onsuccess = () => resolve(!!req.result);
      req.onerror = () => reject(req.error);
    });
  });
}

function addOrUpdateFolder(name, messageRefs) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(FOLDER_STORE, 'readwrite');
      const store = tx.objectStore(FOLDER_STORE);
      // Use the new pointer-based system (messageRefs) instead of old messages array
      const req = store.put({ name, messageRefs: messageRefs || [] });
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
          // Use the new pointer-based system (messageRefs) instead of old messages array
          result[folder.name] = folder.messageRefs || [];
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

function addMessageToFolder(name, insightsKeyOrMessage) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(FOLDER_STORE, 'readwrite');
      const store = tx.objectStore(FOLDER_STORE);
      const getReq = store.get(name);
      getReq.onsuccess = () => {
        let folder = getReq.result;
        if (!folder) {
          folder = { name, messageRefs: [] };
        }
        
        // Ensure messageRefs exists (for backward compatibility with old folders)
        if (!folder.messageRefs) {
          folder.messageRefs = [];
        }
        
        // Convert input to insightsKey reference
        let insightsKey;
        if (typeof insightsKeyOrMessage === 'string') {
          // If it's already a string, assume it's an insightsKey
          insightsKey = insightsKeyOrMessage;
        } else if (insightsKeyOrMessage && insightsKeyOrMessage.insightsKey) {
          // If it's an object with insightsKey, use that
          insightsKey = insightsKeyOrMessage.insightsKey;
        } else if (insightsKeyOrMessage && insightsKeyOrMessage.insights) {
          // If it's an object with insights, create the key
          insightsKey = insightsKeyOrMessage.insights.join('|') + '_' + simpleHash(insightsKeyOrMessage.insights.join('|'));
        } else if (insightsKeyOrMessage && insightsKeyOrMessage.text) {
          // Legacy support: if it's an object with text, we need to find the corresponding insightsKey
          // This is a fallback for backward compatibility
          insightsKey = insightsKeyOrMessage.text; // This will be resolved later
        } else {
          reject(new Error('Invalid message format for folder reference'));
          return;
        }
        
        // Add reference if it doesn't already exist
        if (!folder.messageRefs.includes(insightsKey)) {
          folder.messageRefs.push(insightsKey);
        }
        
        const putReq = store.put(folder);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  });
}

// Get folder contents with resolved message data
function getFolderContents(folderName) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction([FOLDER_STORE, STORE_NAME], 'readonly');
      const folderStore = tx.objectStore(FOLDER_STORE);
      const messageStore = tx.objectStore(STORE_NAME);
      
      const getFolderReq = folderStore.get(folderName);
      getFolderReq.onsuccess = () => {
        const folder = getFolderReq.result;
        if (!folder || !folder.messageRefs || folder.messageRefs.length === 0) {
          resolve([]);
          return;
        }
        
        // Resolve all message references
        const resolvedMessages = [];
        let resolvedCount = 0;
        
        folder.messageRefs.forEach(insightsKey => {
          const getMessageReq = messageStore.get(insightsKey);
          getMessageReq.onsuccess = () => {
            const message = getMessageReq.result;
            if (message) {
              resolvedMessages.push(message);
            }
            resolvedCount++;
            
            if (resolvedCount === folder.messageRefs.length) {
              // Sort by timestamp (newest first)
              resolvedMessages.sort((a, b) => b.timestamp - a.timestamp);
              resolve(resolvedMessages);
            }
          };
          getMessageReq.onerror = () => {
            resolvedCount++;
            if (resolvedCount === folder.messageRefs.length) {
              // Sort by timestamp (newest first)
              resolvedMessages.sort((a, b) => b.timestamp - a.timestamp);
              resolve(resolvedMessages);
            }
          };
        });
      };
      getFolderReq.onerror = () => reject(getFolderReq.error);
    });
  });
}

// Get all folders with resolved message counts
function getAllFoldersWithCounts() {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction([FOLDER_STORE, STORE_NAME], 'readonly');
      const folderStore = tx.objectStore(FOLDER_STORE);
      const messageStore = tx.objectStore(STORE_NAME);
      
      const getAllFoldersReq = folderStore.getAll();
      getAllFoldersReq.onsuccess = () => {
        const folders = getAllFoldersReq.result;
        const result = {};
        
        if (folders.length === 0) {
          resolve(result);
          return;
        }
        
        let processedFolders = 0;
        
        folders.forEach(folder => {
          if (!folder.messageRefs || folder.messageRefs.length === 0) {
            result[folder.name] = { messageRefs: [], messageCount: 0 };
            processedFolders++;
            if (processedFolders === folders.length) {
              resolve(result);
            }
            return;
          }
          
          // Count valid references
          let validRefs = 0;
          let checkedRefs = 0;
          
          folder.messageRefs.forEach(insightsKey => {
            const getMessageReq = messageStore.get(insightsKey);
            getMessageReq.onsuccess = () => {
              if (getMessageReq.result) {
                validRefs++;
              }
              checkedRefs++;
              
              if (checkedRefs === folder.messageRefs.length) {
                result[folder.name] = { 
                  messageRefs: folder.messageRefs, 
                  messageCount: validRefs 
                };
                processedFolders++;
                if (processedFolders === folders.length) {
                  resolve(result);
                }
              }
            };
            getMessageReq.onerror = () => {
              checkedRefs++;
              if (checkedRefs === folder.messageRefs.length) {
                result[folder.name] = { 
                  messageRefs: folder.messageRefs, 
                  messageCount: validRefs 
                };
                processedFolders++;
                if (processedFolders === folders.length) {
                  resolve(result);
                }
              }
            };
          });
        });
      };
      getAllFoldersReq.onerror = () => reject(getAllFoldersReq.error);
    });
  });
}

// Remove message reference from folder
function removeMessageFromFolder(folderName, insightsKey) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(FOLDER_STORE, 'readwrite');
      const store = tx.objectStore(FOLDER_STORE);
      const getReq = store.get(folderName);
      getReq.onsuccess = () => {
        const folder = getReq.result;
        if (!folder) {
          resolve();
          return;
        }
        
        // Remove the reference
        folder.messageRefs = folder.messageRefs.filter(ref => ref !== insightsKey);
        
        const putReq = store.put(folder);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  });
}

// Clean up orphaned references (remove references to deleted messages)
function cleanupFolderReferences() {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction([FOLDER_STORE, STORE_NAME], 'readwrite');
      const folderStore = tx.objectStore(FOLDER_STORE);
      const messageStore = tx.objectStore(STORE_NAME);
      
      const getAllFoldersReq = folderStore.getAll();
      getAllFoldersReq.onsuccess = () => {
        const folders = getAllFoldersReq.result;
        let processedFolders = 0;
        let totalCleaned = 0;
        
        if (folders.length === 0) {
          resolve({ cleanedFolders: 0, totalCleaned: 0 });
          return;
        }
        
        folders.forEach(folder => {
          if (!folder.messageRefs || folder.messageRefs.length === 0) {
            processedFolders++;
            if (processedFolders === folders.length) {
              resolve({ cleanedFolders: totalCleaned > 0 ? 1 : 0, totalCleaned });
            }
            return;
          }
          
          const originalRefs = [...folder.messageRefs];
          let checkedRefs = 0;
          let validRefs = [];
          
          folder.messageRefs.forEach(insightsKey => {
            const getMessageReq = messageStore.get(insightsKey);
            getMessageReq.onsuccess = () => {
              if (getMessageReq.result) {
                validRefs.push(insightsKey);
              }
              checkedRefs++;
              
              if (checkedRefs === folder.messageRefs.length) {
                // Update folder with only valid references
                if (validRefs.length !== originalRefs.length) {
                  folder.messageRefs = validRefs;
                  const putReq = folderStore.put(folder);
                  putReq.onsuccess = () => {
                    totalCleaned += (originalRefs.length - validRefs.length);
                    processedFolders++;
                    if (processedFolders === folders.length) {
                      resolve({ cleanedFolders: totalCleaned > 0 ? 1 : 0, totalCleaned });
                    }
                  };
                  putReq.onerror = () => {
                    processedFolders++;
                    if (processedFolders === folders.length) {
                      resolve({ cleanedFolders: totalCleaned > 0 ? 1 : 0, totalCleaned });
                    }
                  };
                } else {
                  processedFolders++;
                  if (processedFolders === folders.length) {
                    resolve({ cleanedFolders: totalCleaned > 0 ? 1 : 0, totalCleaned });
                  }
                }
              }
            };
            getMessageReq.onerror = () => {
              checkedRefs++;
              if (checkedRefs === folder.messageRefs.length) {
                // Update folder with only valid references
                if (validRefs.length !== originalRefs.length) {
                  folder.messageRefs = validRefs;
                  const putReq = folderStore.put(folder);
                  putReq.onsuccess = () => {
                    totalCleaned += (originalRefs.length - validRefs.length);
                    processedFolders++;
                    if (processedFolders === folders.length) {
                      resolve({ cleanedFolders: totalCleaned > 0 ? 1 : 0, totalCleaned });
                    }
                  };
                  putReq.onerror = () => {
                    processedFolders++;
                    if (processedFolders === folders.length) {
                      resolve({ cleanedFolders: totalCleaned > 0 ? 1 : 0, totalCleaned });
                    }
                  };
                } else {
                  processedFolders++;
                  if (processedFolders === folders.length) {
                    resolve({ cleanedFolders: totalCleaned > 0 ? 1 : 0, totalCleaned });
                  }
                }
              }
            };
          });
        });
      };
      getAllFoldersReq.onerror = () => reject(getAllFoldersReq.error);
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

// Remove a specific message from storage
function removeMessage(insightsKeyOrInsights) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME, FOLDER_STORE], 'readwrite');
      const messageStore = tx.objectStore(STORE_NAME);
      const folderStore = tx.objectStore(FOLDER_STORE);
      
      let insightsKey;
      
      // Handle different input formats
      if (Array.isArray(insightsKeyOrInsights)) {
        // If it's an insights array, create the key
        insightsKey = insightsKeyOrInsights.join('|') + '_' + simpleHash(insightsKeyOrInsights.join('|'));
      } else if (typeof insightsKeyOrInsights === 'string') {
        // If it's already a key string, use it as is
        insightsKey = insightsKeyOrInsights;
      } else {
        reject(new Error('Invalid input format for removeMessage'));
        return;
      }
      
      // First, remove the message
      const deleteMessageReq = messageStore.delete(insightsKey);
      deleteMessageReq.onsuccess = () => {
        console.log('Successfully removed message with key:', insightsKey);
        
        // Then, clean up folder references
        const getAllFoldersReq = folderStore.getAll();
        getAllFoldersReq.onsuccess = () => {
          const folders = getAllFoldersReq.result;
          let processedFolders = 0;
          let cleanedFolders = 0;
          
          if (folders.length === 0) {
            resolve();
            return;
          }
          
          folders.forEach(folder => {
            if (!folder.messageRefs || folder.messageRefs.length === 0) {
              processedFolders++;
              if (processedFolders === folders.length) {
                resolve();
              }
              return;
            }
            
            // Check if this folder contains a reference to the deleted message
            const hasReference = folder.messageRefs.includes(insightsKey);
            if (hasReference) {
              // Remove the reference
              folder.messageRefs = folder.messageRefs.filter(ref => ref !== insightsKey);
              const putFolderReq = folderStore.put(folder);
              putFolderReq.onsuccess = () => {
                cleanedFolders++;
                processedFolders++;
                if (processedFolders === folders.length) {
                  console.log(`Cleaned up references in ${cleanedFolders} folder(s)`);
                  resolve();
                }
              };
              putFolderReq.onerror = () => {
                processedFolders++;
                if (processedFolders === folders.length) {
                  resolve();
                }
              };
            } else {
              processedFolders++;
              if (processedFolders === folders.length) {
                resolve();
              }
            }
          });
        };
        getAllFoldersReq.onerror = () => {
          console.error('Failed to get folders for cleanup:', getAllFoldersReq.error);
          resolve(); // Still resolve since the message was deleted successfully
        };
      };
      deleteMessageReq.onerror = () => {
        console.error('Failed to remove message with key:', insightsKey, deleteMessageReq.error);
        reject(deleteMessageReq.error);
      };
    });
  });
}

// Migrate existing folders from old format to new pointer-based format
function migrateFoldersToPointers() {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction([FOLDER_STORE, STORE_NAME], 'readwrite');
      const folderStore = tx.objectStore(FOLDER_STORE);
      const messageStore = tx.objectStore(STORE_NAME);
      
      const getAllFoldersReq = folderStore.getAll();
      getAllFoldersReq.onsuccess = () => {
        const folders = getAllFoldersReq.result;
        let processedFolders = 0;
        let migratedFolders = 0;
        
        if (folders.length === 0) {
          resolve({ migratedFolders: 0, totalFolders: 0 });
          return;
        }
        
        folders.forEach(folder => {
          // Check if folder needs migration (has 'messages' array instead of 'messageRefs')
          if (folder.messages && Array.isArray(folder.messages) && !folder.messageRefs) {
            console.log(`Migrating folder: ${folder.name}`);
            
            // Convert messages to insightsKey references
            const messageRefs = [];
            let processedMessages = 0;
            
            folder.messages.forEach(message => {
              // Handle different message formats
              let messageText = '';
              if (typeof message === 'string') {
                messageText = message;
              } else if (message && message.text) {
                messageText = message.text;
              } else {
                processedMessages++;
                if (processedMessages === folder.messages.length) {
                  finishFolderMigration();
                }
                return;
              }
              
              // Find matching message in storage by text content
              const getAllMessagesReq = messageStore.getAll();
              getAllMessagesReq.onsuccess = () => {
                const allMessages = getAllMessagesReq.result;
                const matchingMessage = allMessages.find(msg => {
                  const msgText = Array.isArray(msg.insights) ? msg.insights.join('\n') : msg.text;
                  return msgText === messageText;
                });
                
                if (matchingMessage && matchingMessage.insightsKey) {
                  messageRefs.push(matchingMessage.insightsKey);
                }
                
                processedMessages++;
                if (processedMessages === folder.messages.length) {
                  finishFolderMigration();
                }
              };
              getAllMessagesReq.onerror = () => {
                processedMessages++;
                if (processedMessages === folder.messages.length) {
                  finishFolderMigration();
                }
              };
            });
            
            function finishFolderMigration() {
              // Update folder with new format
              const updatedFolder = {
                name: folder.name,
                messageRefs: messageRefs
              };
              
              const putReq = folderStore.put(updatedFolder);
              putReq.onsuccess = () => {
                migratedFolders++;
                processedFolders++;
                console.log(`Migrated folder ${folder.name} with ${messageRefs.length} references`);
                if (processedFolders === folders.length) {
                  resolve({ migratedFolders, totalFolders: folders.length });
                }
              };
              putReq.onerror = () => {
                processedFolders++;
                if (processedFolders === folders.length) {
                  resolve({ migratedFolders, totalFolders: folders.length });
                }
              };
            }
          } else {
            // Folder is already in new format or empty
            processedFolders++;
            if (processedFolders === folders.length) {
              resolve({ migratedFolders, totalFolders: folders.length });
            }
          }
        });
      };
      getAllFoldersReq.onerror = () => reject(getAllFoldersReq.error);
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
  removeMessage,
  addOrUpdateFolder,
  getAllFolders,
  removeFolder,
  clearFolders,
  addMessageToFolder,
  updateEmbeddingsForExistingMessages,
  debugIndexedDB,
  getFolderContents,
  getAllFoldersWithCounts,
  removeMessageFromFolder,
  cleanupFolderReferences,
  migrateFoldersToPointers
}; 