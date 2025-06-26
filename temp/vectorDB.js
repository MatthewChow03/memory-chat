// vectorDB.js

export const DB_NAME = 'VectorDB';
export const STORE_NAME = 'vectors';

export let db;
export let useModel;

export async function loadModel() {
  useModel = await use.load();
  console.log("USE model loaded");
}

export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      db = event.target.result;
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      store.createIndex("text", "text", { unique: false });
    };
    request.onsuccess = (event) => {
      db = event.target.result;
      resolve();
    };
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

export async function storeTextWithEmbedding(text) {
  const embeddings = await useModel.embed([text]);
  const vector = Array.from(embeddings.arraySync()[0]);

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.add({ text, vector });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function getAllStoredEntries() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dot / (normA * normB);
}

export async function searchSimilarEntries(queryText, topK = 5) {
  const embedding = await useModel.embed([queryText]);
  const queryVector = Array.from(embedding.arraySync()[0]);

  const allEntries = await getAllStoredEntries();

  const results = allEntries.map(entry => ({
    text: entry.text,
    score: cosineSimilarity(queryVector, entry.vector)
  }));

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}
