// Semantic Search Module
// Handles text embedding and vector similarity search

// Simple text embedding using a lightweight approach
// This uses a combination of TF-IDF and word frequency to create embeddings
class SemanticSearch {
  constructor() {
    this.embeddingDimension = 512; // Fixed dimension for embeddings
    this.wordVectors = new Map(); // Cache for word vectors
    this.initializeWordVectors();
  }

  // Initialize word vectors with random but consistent values
  initializeWordVectors() {
    // Use a simple hash function to generate consistent vectors for words
    const hash = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash);
    };

    // Generate consistent word vectors based on word hash
    const generateWordVector = (word) => {
      const seed = hash(word);
      const vector = new Float32Array(this.embeddingDimension);
      for (let i = 0; i < this.embeddingDimension; i++) {
        // Use seed to generate consistent random values
        const x = Math.sin(seed + i) * 10000;
        vector[i] = x - Math.floor(x);
      }
      return vector;
    };

    // Pre-generate vectors for common words
    const commonWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
      'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
      'what', 'when', 'where', 'why', 'how', 'who', 'which', 'whose', 'whom'
    ];

    commonWords.forEach(word => {
      this.wordVectors.set(word, generateWordVector(word));
    });
  }

  // Get or generate vector for a word
  getWordVector(word) {
    if (this.wordVectors.has(word)) {
      return this.wordVectors.get(word);
    }

    // Generate new vector for unknown word
    const hash = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash);
    };

    const seed = hash(word);
    const vector = new Float32Array(this.embeddingDimension);
    for (let i = 0; i < this.embeddingDimension; i++) {
      const x = Math.sin(seed + i) * 10000;
      vector[i] = x - Math.floor(x);
    }

    this.wordVectors.set(word, vector);
    return vector;
  }

  // Tokenize text into words
  tokenize(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  // Create embedding for text
  createEmbedding(text) {
    const tokens = this.tokenize(text);
    const embedding = new Float32Array(this.embeddingDimension);

    // Sum word vectors
    tokens.forEach(token => {
      const wordVector = this.getWordVector(token);
      for (let i = 0; i < this.embeddingDimension; i++) {
        embedding[i] += wordVector[i];
      }
    });

    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < this.embeddingDimension; i++) {
        embedding[i] /= magnitude;
      }
    }

    return embedding;
  }

  // Calculate cosine similarity between two embeddings
  cosineSimilarity(embedding1, embedding2) {
    let dotProduct = 0;
    for (let i = 0; i < this.embeddingDimension; i++) {
      dotProduct += embedding1[i] * embedding2[i];
    }
    return dotProduct; // Embeddings are already normalized, so this is the cosine similarity
  }

  // Convert embedding to string for storage
  embeddingToString(embedding) {
    return Array.from(embedding).join(',');
  }

  // Convert string back to embedding
  stringToEmbedding(embeddingString) {
    return new Float32Array(embeddingString.split(',').map(Number));
  }

  // Search for similar texts
  search(query, documents, topK = 10) {
    const queryEmbedding = this.createEmbedding(query);

    const results = documents.map(doc => {
      const docEmbedding = doc.embedding ? this.stringToEmbedding(doc.embedding) : this.createEmbedding(doc.text);
      const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);
      return {
        ...doc,
        similarity
      };
    });

    // Sort by similarity and return top K
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
  }

  // Process text and return both text and embedding
  processText(text) {
    return {
      text: text,
      embedding: this.embeddingToString(this.createEmbedding(text))
    };
  }

  // Batch process multiple texts
  processTexts(texts) {
    return texts.map(text => this.processText(text));
  }
}

// Create global instance
window.semanticSearch = new SemanticSearch();
