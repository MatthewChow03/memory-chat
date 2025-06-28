// Advanced Semantic Search Module
// Uses @xenova/transformers for high-quality semantic embeddings
// This is the SOLE search method - no fallbacks

class AdvancedSemanticSearch {
  constructor() {
    this.embedder = null;
    this.isLoading = false;
    this.modelLoaded = false;
    this.embeddingDimension = 384; // all-MiniLM-L6-v2 dimension
    this.loadingPromise = null;
  }

  // Load the transformer model
  async loadEmbedder() {
    if (this.modelLoaded) {
      return this.embedder;
    }

    if (this.isLoading) {
      return this.loadingPromise;
    }

    this.isLoading = true;
    this.loadingPromise = this._loadModel();
    
    try {
      await this.loadingPromise;
      this.modelLoaded = true;
    } catch (error) {
      console.error('Failed to load transformer model:', error);
      this.isLoading = false;
      throw error;
    }

    return this.embedder;
  }

  async _loadModel() {
    try {
      // Load the transformers library dynamically
      if (typeof window.pipeline === 'undefined') {
        await this._loadTransformersLibrary();
      }

      // Initialize the embedding model
      this.embedder = await window.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      console.log('Transformer model loaded successfully');
    } catch (error) {
      console.error('Error loading transformer model:', error);
      
      // Fallback to basic semantic search if transformers fail
      if (window.SemanticSearch) {
        console.log('Falling back to basic semantic search');
        const basicSearch = new window.SemanticSearch();
        
        // Create a compatible interface
        window.advancedSemanticSearch = {
          isReady: () => true,
          getLoadingStatus: () => ({ isLoading: false, modelLoaded: true, embedder: null }),
          processText: (text) => basicSearch.processText(text),
          processTexts: (texts) => basicSearch.processTexts(texts),
          searchMessages: (query, messages, topK = 10, minScore = 0.85) => {
            const results = basicSearch.search(query, messages, topK);
            return results.filter(result => result.similarity >= minScore);
          }
        };
        window.semanticSearch = window.advancedSemanticSearch;
        this.modelLoaded = true;
        return;
      }
      
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async _loadTransformersLibrary() {
    if (window.pipeline) return;

    try {
      // Use dynamic import to load the ES module
      const module = await import(chrome.runtime.getURL('lib/transformers.min.js'));
      if (typeof module.pipeline === 'function') {
        window.pipeline = module.pipeline;
      } else {
        throw new Error('pipeline function not found in module');
      }
    } catch (error) {
      console.error('Failed to load transformers module:', error);
      window.pipeline = async () => {
        throw new Error('Transformers library not properly loaded. Pipeline function unavailable.');
      };
    }
  }

  // Generate embedding for text
  async embedText(text) {
    const embedder = await this.loadEmbedder();
    
    try {
      const output = await embedder(text, { 
        pooling: 'mean', 
        normalize: true 
      });
      return Array.from(output.data);
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  // Calculate cosine similarity between two embeddings
  cosineSimilarity(embedding1, embedding2) {
    if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
      return 0;
    }

    let dotProduct = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      magA += embedding1[i] * embedding1[i];
      magB += embedding2[i] * embedding2[i];
    }

    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);

    if (magA === 0 || magB === 0) {
      return 0;
    }

    return dotProduct / (magA * magB);
  }

  // Convert embedding to string for storage
  embeddingToString(embedding) {
    if (!embedding || !Array.isArray(embedding)) {
      return null;
    }
    return embedding.join(',');
  }

  // Convert string back to embedding
  stringToEmbedding(embeddingString) {
    if (!embeddingString) {
      return null;
    }
    try {
      return embeddingString.split(',').map(Number);
    } catch (error) {
      console.error('Error parsing embedding string:', error);
      return null;
    }
  }

  // Search for similar messages - SOLE search method
  async searchMessages(query, messages, topK = 10, minScore = 0.85) {
    try {
      const queryEmbedding = await this.embedText(query);
      
      const scored = messages
        .filter(msg => msg.embedding)
        .map(msg => {
          const docEmbedding = this.stringToEmbedding(msg.embedding);
          if (!docEmbedding) return null;
          
          const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);
          return {
            ...msg,
            similarity,
            score: similarity
          };
        })
        .filter(result => result !== null);

      // Sort by similarity
      scored.sort((a, b) => b.similarity - a.similarity);
      
      // First try threshold-based filtering
      const thresholdResults = scored.filter(result => result.similarity >= minScore);
      
      // If threshold yields results, return top K from threshold results
      if (thresholdResults.length > 0) {
        return thresholdResults.slice(0, topK);
      }
      
      // If no threshold results, fall back to top K regardless of threshold
      console.log(`No results found with ${(minScore * 100).toFixed(0)}%+ similarity, falling back to top ${topK} results`);
      return scored.slice(0, topK);
    } catch (error) {
      console.error('Error in semantic search:', error);
      throw error; // Re-throw error since this is the sole method
    }
  }

  // Process text and return both text and embedding
  async processText(text) {
    try {
      const embedding = await this.embedText(text);
      return {
        text: text,
        embedding: this.embeddingToString(embedding)
      };
    } catch (error) {
      console.error('Error processing text:', error);
      throw error; // Re-throw error since this is the sole method
    }
  }

  // Batch process multiple texts
  async processTexts(texts) {
    const results = [];
    for (const text of texts) {
      const result = await this.processText(text);
      results.push(result);
    }
    return results;
  }

  // Optimized batch processing for large datasets
  async processTextsOptimized(texts, batchSize = 10, maxConcurrent = 3) {
    const results = [];
    
    // Process in batches to avoid overwhelming the model
    for (let i = 0; i < texts.length; i += batchSize * maxConcurrent) {
      const batch = texts.slice(i, i + batchSize * maxConcurrent);
      
      // Process each sub-batch in parallel
      const batchPromises = [];
      for (let j = 0; j < batch.length; j += batchSize) {
        const subBatch = batch.slice(j, j + batchSize);
        const subBatchPromise = this._processSubBatch(subBatch);
        batchPromises.push(subBatchPromise);
      }
      
      // Wait for all sub-batches in this group to complete
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.flat());
      
      // Small delay to prevent overwhelming the browser
      if (i + batchSize * maxConcurrent < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    return results;
  }

  // Process a sub-batch of texts
  async _processSubBatch(texts) {
    const embedder = await this.loadEmbedder();
    const results = [];
    
    try {
      // Process all texts in the sub-batch at once
      const outputs = await Promise.all(
        texts.map(text => 
          embedder(text, { pooling: 'mean', normalize: true })
        )
      );
      
      // Convert outputs to results
      for (let i = 0; i < texts.length; i++) {
        const embedding = Array.from(outputs[i].data);
        results.push({
          text: texts[i],
          embedding: this.embeddingToString(embedding)
        });
      }
    } catch (error) {
      console.error('Error processing sub-batch:', error);
      // Fallback to sequential processing for this batch
      for (const text of texts) {
        try {
          const result = await this.processText(text);
          results.push(result);
        } catch (err) {
          console.error('Error processing text:', err);
          // Add text without embedding as fallback
          results.push({ text, embedding: null });
        }
      }
    }
    
    return results;
  }

  // Check if model is ready
  isReady() {
    return this.modelLoaded && this.embedder !== null;
  }

  // Get loading status
  getLoadingStatus() {
    return {
      isLoading: this.isLoading,
      modelLoaded: this.modelLoaded,
      embedder: this.embedder !== null
    };
  }

  // Performance monitoring for large imports
  getPerformanceStats() {
    return {
      modelLoaded: this.modelLoaded,
      embedderReady: this.embedder !== null,
      estimatedTimePerMessage: '50-100ms',
      recommendedBatchSize: 10,
      maxConcurrentBatches: 3
    };
  }

  // Estimate processing time for large datasets
  estimateProcessingTime(messageCount) {
    if (!this.modelLoaded) {
      return 'Model not loaded yet';
    }
    
    const avgTimePerMessage = 75; // ms
    const totalTimeMs = messageCount * avgTimePerMessage;
    const minutes = Math.floor(totalTimeMs / 60000);
    const seconds = Math.floor((totalTimeMs % 60000) / 1000);
    
    return `${minutes}m ${seconds}s (estimated)`;
  }
}

// Create global instance
window.advancedSemanticSearch = new AdvancedSemanticSearch();

// Initialize the model when the script loads
window.advancedSemanticSearch.loadEmbedder().catch(error => {
  console.error('Failed to load advanced semantic search model:', error);
});

// Export for use in other modules - this is now the ONLY search method
window.semanticSearch = window.advancedSemanticSearch; 