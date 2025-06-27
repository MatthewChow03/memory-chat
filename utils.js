// Simple Porter-like stemmer for English
function stem(word) {
  return word.replace(/(ing|ed|ly|es|s|ment)$/i, '');
}

// Tokenize and stem
function tokenizeAndStem(str) {
  return str.toLowerCase().split(/\W+/).filter(Boolean).map(stem);
}

// Compute TF (term frequency) for a document
function termFreq(tokens) {
  const tf = {};
  tokens.forEach(t => tf[t] = (tf[t] || 0) + 1);
  const total = tokens.length;
  Object.keys(tf).forEach(t => tf[t] /= total);
  return tf;
}

// Compute IDF (inverse document frequency) for all docs
function inverseDocFreq(allDocs) {
  const idf = {};
  const N = allDocs.length;
  const allTokens = Array.from(new Set(allDocs.flat()));
  allTokens.forEach(token => {
    const containing = allDocs.filter(doc => doc.includes(token)).length;
    idf[token] = Math.log((N + 1) / (containing + 1)) + 1;
  });
  return idf;
}

// Compute TF-IDF vector for a doc
function tfidfVector(tokens, idf) {
  const tf = termFreq(tokens);
  const vec = [];
  Object.keys(idf).forEach(token => {
    vec.push((tf[token] || 0) * idf[token]);
  });
  return vec;
}

// Cosine similarity using TF-IDF and stemming
function cosineSimilarity(query, doc, allDocs = []) {
  const queryTokens = tokenizeAndStem(query);
  const docTokens = tokenizeAndStem(doc);
  const docsTokens = allDocs.length ? allDocs.map(tokenizeAndStem) : [queryTokens, docTokens];
  const idf = inverseDocFreq(docsTokens);
  const v1 = tfidfVector(queryTokens, idf);
  const v2 = tfidfVector(docTokens, idf);
  const dot = v1.reduce((sum, v, i) => sum + v * v2[i], 0);
  const mag1 = Math.sqrt(v1.reduce((sum, v) => sum + v * v, 0));
  const mag2 = Math.sqrt(v2.reduce((sum, v) => sum + v * v, 0));
  return mag1 && mag2 ? dot / (mag1 * mag2) : 0;
}

// Get the current prompt text from the input area
function getPromptText() {
  const prompt = document.querySelector('.ProseMirror');
  return prompt ? prompt.innerText.trim() : '';
}

// Load and display logs in the popup
async function loadAndDisplayLogs() {
  const container = document.getElementById('memory-chat-log-container');
  if (!container) return;

  if (!window.memoryChatIDB || !window.memoryChatIDB.getAllMessages) {
    container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">IndexedDB not available</div>';
    return;
  }

  const logs = await window.memoryChatIDB.getAllMessages();
  if (!logs || logs.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No messages logged yet</div>';
    return;
  }

  container.innerHTML = logs.map(log => `
    <div style="
      background: #f8f9fa;
      border: 1px solid #e1e5e9;
      border-radius: 8px;
      margin-bottom: 12px;
      padding: 12px;
      font-size: 14px;
      line-height: 1.4;
      word-break: break-word;
    ">
      <div style="margin-bottom: 4px;">${log.text.replace(/\n/g, '<br>')}</div>
      <div style="color: #888; font-size: 11px;">${new Date(log.timestamp).toLocaleString()}</div>
    </div>
  `).join('');
} 