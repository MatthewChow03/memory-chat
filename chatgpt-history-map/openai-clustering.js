// OpenAI-based Semantic Clustering for ChatGPT History
class OpenAIClustering {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.openai.com/v1';
        this.embeddings = new Map(); // Cache for embeddings
        this.similarityThreshold = 0.75; // Threshold for considering messages similar
        this.maxBatchSize = 100; // OpenAI API batch limit
    }

    // Generate embeddings for a batch of texts
    async generateEmbeddings(texts) {
        try {
            const response = await fetch(`${this.baseURL}/embeddings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'text-embedding-3-small',
                    input: texts,
                    encoding_format: 'float'
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.data.map(item => ({
                text: item.input,
                embedding: item.embedding
            }));
        } catch (error) {
            console.error('Error generating embeddings:', error);
            throw error;
        }
    }

    // Calculate cosine similarity between two vectors
    calculateCosineSimilarity(vec1, vec2) {
        if (vec1.length !== vec2.length) {
            throw new Error('Vectors must have the same length');
        }

        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }

        norm1 = Math.sqrt(norm1);
        norm2 = Math.sqrt(norm2);

        if (norm1 === 0 || norm2 === 0) {
            return 0;
        }

        return dotProduct / (norm1 * norm2);
    }

    // Generate embeddings for all messages
    async generateMessageEmbeddings(messages) {
        console.log('Generating embeddings for', messages.length, 'messages...');
        
        const embeddings = new Map();
        const batches = this.chunkArray(messages, this.maxBatchSize);

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} messages)`);
            
            // Create text representations for each message
            const texts = batch.map(message => {
                return `${message.input} ${message.output}`.substring(0, 8000); // OpenAI limit
            });

            try {
                const batchEmbeddings = await this.generateEmbeddings(texts);
                
                batchEmbeddings.forEach((item, index) => {
                    const messageId = batch[index].id;
                    embeddings.set(messageId, item.embedding);
                });

                // Add small delay to respect rate limits
                await this.delay(100);
            } catch (error) {
                console.error(`Error processing batch ${i + 1}:`, error);
                // Continue with other batches
            }
        }

        return embeddings;
    }

    // Perform semantic clustering using embeddings
    async performSemanticClustering(messages) {
        console.log('Starting semantic clustering...');
        
        // Store original messages for reference
        this.originalMessages = messages;
        
        // Generate embeddings for all messages
        const embeddings = await this.generateMessageEmbeddings(messages);
        
        // Create similarity matrix
        const similarityMatrix = this.createSimilarityMatrix(messages, embeddings);
        
        // Perform hierarchical clustering using similarity matrix
        const clusters = this.performHierarchicalClustering(messages, similarityMatrix);
        
        console.log('Semantic clustering completed. Found', clusters.length, 'clusters');
        return clusters;
    }

    // Create similarity matrix between all messages
    createSimilarityMatrix(messages, embeddings) {
        const matrix = [];
        
        for (let i = 0; i < messages.length; i++) {
            matrix[i] = [];
            const embedding1 = embeddings.get(messages[i].id);
            
            if (!embedding1) {
                // If no embedding available, set all similarities to 0
                for (let j = 0; j < messages.length; j++) {
                    matrix[i][j] = 0;
                }
                continue;
            }

            for (let j = 0; j < messages.length; j++) {
                if (i === j) {
                    matrix[i][j] = 1.0; // Self-similarity
                } else {
                    const embedding2 = embeddings.get(messages[j].id);
                    if (embedding2) {
                        matrix[i][j] = this.calculateCosineSimilarity(embedding1, embedding2);
                    } else {
                        matrix[i][j] = 0;
                    }
                }
            }
        }
        
        return matrix;
    }

    // Perform hierarchical clustering
    performHierarchicalClustering(messages, similarityMatrix) {
        const clusters = [];
        const visited = new Set();
        
        // First pass: Create initial clusters based on high similarity
        for (let i = 0; i < messages.length; i++) {
            if (visited.has(i)) continue;
            
            const cluster = this.createInitialCluster(messages[i], i, similarityMatrix, visited);
            if (cluster.size > 1) {
                clusters.push(cluster);
            }
        }
        
        // Second pass: Merge similar clusters
        const mergedClusters = this.mergeSimilarClusters(clusters, similarityMatrix);
        
        // Third pass: Create hierarchical structure
        const hierarchicalClusters = this.createHierarchicalStructure(mergedClusters, messages);
        
        return hierarchicalClusters;
    }

    // Create initial cluster from a seed message
    createInitialCluster(seedMessage, seedIndex, similarityMatrix, visited) {
        const cluster = {
            id: `semantic_cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'semantic',
            name: this.generateClusterName(seedMessage),
            messages: [seedMessage],
            size: 1,
            centroid: similarityMatrix[seedIndex],
            keywords: this.extractKeywords([seedMessage]),
            similarity: 1.0,
            subclusters: [],
            level: 0
        };
        
        visited.add(seedIndex);
        
        // Find similar messages
        for (let j = 0; j < similarityMatrix.length; j++) {
            if (visited.has(j)) continue;
            
            const similarity = similarityMatrix[seedIndex][j];
            if (similarity >= this.similarityThreshold) {
                const similarMessage = this.originalMessages[j];
                if (similarMessage) {
                    cluster.messages.push(similarMessage);
                    cluster.size++;
                    visited.add(j);
                }
            }
        }
        
        return cluster;
    }

    // Find message by index in the original messages array
    findMessageByIndex(index) {
        return this.originalMessages ? this.originalMessages[index] : null;
    }

    // Merge similar clusters
    mergeSimilarClusters(clusters, similarityMatrix) {
        const merged = [...clusters];
        let mergedThisRound = true;
        
        while (mergedThisRound) {
            mergedThisRound = false;
            
            for (let i = 0; i < merged.length; i++) {
                for (let j = i + 1; j < merged.length; j++) {
                    const cluster1 = merged[i];
                    const cluster2 = merged[j];
                    
                    // Calculate cluster similarity
                    const clusterSimilarity = this.calculateClusterSimilarity(cluster1, cluster2, similarityMatrix);
                    
                    if (clusterSimilarity >= this.similarityThreshold * 0.8) { // Slightly lower threshold for cluster merging
                        // Merge clusters
                        const mergedCluster = this.mergeClusters(cluster1, cluster2);
                        
                        // Remove original clusters and add merged one
                        merged.splice(j, 1);
                        merged.splice(i, 1);
                        merged.push(mergedCluster);
                        
                        mergedThisRound = true;
                        break;
                    }
                }
                if (mergedThisRound) break;
            }
        }
        
        return merged;
    }

    // Calculate similarity between two clusters
    calculateClusterSimilarity(cluster1, cluster2, similarityMatrix) {
        let totalSimilarity = 0;
        let comparisonCount = 0;
        
        // Compare messages between clusters
        for (const msg1 of cluster1.messages) {
            const index1 = this.findMessageIndex(msg1);
            if (index1 === -1) continue;
            
            for (const msg2 of cluster2.messages) {
                const index2 = this.findMessageIndex(msg2);
                if (index2 === -1) continue;
                
                totalSimilarity += similarityMatrix[index1][index2];
                comparisonCount++;
            }
        }
        
        return comparisonCount > 0 ? totalSimilarity / comparisonCount : 0;
    }

    // Find message index in original array
    findMessageIndex(message) {
        if (!this.originalMessages) return -1;
        return this.originalMessages.findIndex(m => m.id === message.id);
    }

    // Merge two clusters
    mergeClusters(cluster1, cluster2) {
        const mergedMessages = [...cluster1.messages, ...cluster2.messages];
        const mergedKeywords = this.extractKeywords(mergedMessages);
        
        return {
            id: `merged_cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'semantic',
            name: this.generateMergedClusterName(cluster1, cluster2),
            messages: mergedMessages,
            size: mergedMessages.length,
            keywords: mergedKeywords,
            similarity: (cluster1.similarity + cluster2.similarity) / 2,
            subclusters: [cluster1, cluster2], // Keep original clusters as subclusters
            level: Math.max(cluster1.level, cluster2.level) + 1
        };
    }

    // Create hierarchical structure
    createHierarchicalStructure(clusters, messages) {
        // Group clusters by similarity to create higher-level clusters
        const hierarchicalClusters = [];
        const processed = new Set();
        
        for (let i = 0; i < clusters.length; i++) {
            if (processed.has(i)) continue;
            
            const mainCluster = clusters[i];
            const relatedClusters = [];
            
            // Find related clusters
            for (let j = i + 1; j < clusters.length; j++) {
                if (processed.has(j)) continue;
                
                const otherCluster = clusters[j];
                const similarity = this.calculateClusterSimilarity(mainCluster, otherCluster, null);
                
                if (similarity >= this.similarityThreshold * 0.6) {
                    relatedClusters.push(otherCluster);
                    processed.add(j);
                }
            }
            
            if (relatedClusters.length > 0) {
                // Create a higher-level cluster
                const allMessages = [mainCluster, ...relatedClusters].flatMap(c => c.messages);
                const higherCluster = {
                    id: `hierarchical_cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'semantic',
                    name: this.generateHierarchicalClusterName(mainCluster, relatedClusters),
                    messages: allMessages,
                    size: allMessages.length,
                    keywords: this.extractKeywords(allMessages),
                    similarity: 0.8,
                    subclusters: [mainCluster, ...relatedClusters],
                    level: 1
                };
                
                hierarchicalClusters.push(higherCluster);
                processed.add(i);
            } else {
                hierarchicalClusters.push(mainCluster);
                processed.add(i);
            }
        }
        
        return hierarchicalClusters;
    }

    // Generate name for merged cluster
    generateMergedClusterName(cluster1, cluster2) {
        const keywords1 = cluster1.keywords.slice(0, 3);
        const keywords2 = cluster2.keywords.slice(0, 3);
        const allKeywords = [...new Set([...keywords1, ...keywords2])];
        
        return allKeywords.slice(0, 4).join(' ').replace(/[^\w\s]/g, '') || 'Merged Discussion';
    }

    // Generate name for hierarchical cluster
    generateHierarchicalClusterName(mainCluster, relatedClusters) {
        const allKeywords = [mainCluster, ...relatedClusters]
            .flatMap(c => c.keywords)
            .filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
            .slice(0, 5);
        
        return allKeywords.join(' ').replace(/[^\w\s]/g, '') || 'Related Discussions';
    }

    // Generate a meaningful name for a cluster based on its messages
    generateClusterName(representativeMessage) {
        const input = representativeMessage.input.toLowerCase();
        const output = representativeMessage.output.toLowerCase();
        
        // Extract key terms
        const terms = [...input.split(' '), ...output.split(' ')]
            .filter(word => word.length > 3)
            .filter(word => !['the', 'and', 'for', 'with', 'this', 'that', 'have', 'will', 'from'].includes(word))
            .slice(0, 5);
        
        // Create a name from the most common terms
        const name = terms.slice(0, 3).join(' ').replace(/[^\w\s]/g, '');
        return name.charAt(0).toUpperCase() + name.slice(1) || 'General Discussion';
    }

    // Extract keywords from a group of messages
    extractKeywords(messages) {
        const allText = messages.map(m => `${m.input} ${m.output}`).join(' ').toLowerCase();
        const words = allText.split(/\s+/);
        
        // Simple keyword extraction (could be enhanced with TF-IDF)
        const wordCount = {};
        words.forEach(word => {
            if (word.length > 3 && !['the', 'and', 'for', 'with', 'this', 'that', 'have', 'will', 'from'].includes(word)) {
                wordCount[word] = (wordCount[word] || 0) + 1;
            }
        });
        
        return Object.entries(wordCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([word]) => word);
    }

    // Hybrid clustering: Combine semantic and categorical clustering
    async performHybridClustering(messages) {
        console.log('Performing hybrid clustering...');
        
        // Get semantic clusters
        const semanticClusters = await this.performSemanticClustering(messages);
        
        // Get categorical clusters (existing logic)
        const categoricalClusters = this.performCategoricalClustering(messages);
        
        // Combine and organize clusters
        const hybridClusters = this.combineClusters(semanticClusters, categoricalClusters);
        
        return hybridClusters;
    }

    // Perform categorical clustering (existing logic)
    performCategoricalClustering(messages) {
        const topicGroups = d3.group(messages, d => d.topic);
        const clusters = [];
        let clusterId = 0;
        
        topicGroups.forEach((messages, topic) => {
            const cluster = {
                id: `categorical_cluster_${clusterId++}`,
                type: 'categorical',
                name: topic,
                messages: messages,
                size: messages.length,
                category: topic
            };
            
            // Create subclusters by category
            const categoryGroups = d3.group(messages, d => d.category);
            cluster.subclusters = [];
            
            categoryGroups.forEach((categoryMessages, category) => {
                const subcluster = {
                    id: `subcluster_${clusterId++}`,
                    type: 'category',
                    name: category,
                    messages: categoryMessages,
                    size: categoryMessages.length,
                    parent: cluster.id
                };
                cluster.subclusters.push(subcluster);
            });
            
            clusters.push(cluster);
        });
        
        return clusters;
    }

    // Combine semantic and categorical clusters
    combineClusters(semanticClusters, categoricalClusters) {
        const combined = {
            semantic: semanticClusters,
            categorical: categoricalClusters,
            hybrid: []
        };
        
        // Create hybrid clusters by finding semantic clusters that align with categories
        semanticClusters.forEach(semanticCluster => {
            const dominantTopic = this.findDominantTopic(semanticCluster.messages);
            const matchingCategorical = categoricalClusters.find(c => c.category === dominantTopic);
            
            if (matchingCategorical) {
                combined.hybrid.push({
                    ...semanticCluster,
                    type: 'hybrid',
                    categoricalParent: matchingCategorical.id,
                    topic: dominantTopic
                });
            } else {
                combined.hybrid.push(semanticCluster);
            }
        });
        
        return combined;
    }

    // Find the dominant topic in a cluster
    findDominantTopic(messages) {
        const topicCount = {};
        messages.forEach(message => {
            topicCount[message.topic] = (topicCount[message.topic] || 0) + 1;
        });
        
        return Object.entries(topicCount)
            .sort(([,a], [,b]) => b - a)[0][0];
    }

    // Utility functions
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Update similarity threshold
    setSimilarityThreshold(threshold) {
        this.similarityThreshold = Math.max(0, Math.min(1, threshold));
    }

    // Get clustering statistics
    getClusteringStats(clusters) {
        const stats = {
            totalClusters: clusters.length,
            totalMessages: clusters.reduce((sum, c) => sum + c.size, 0),
            averageClusterSize: 0,
            largestCluster: 0,
            smallestCluster: Infinity,
            clusterTypes: {}
        };
        
        clusters.forEach(cluster => {
            stats.averageClusterSize += cluster.size;
            stats.largestCluster = Math.max(stats.largestCluster, cluster.size);
            stats.smallestCluster = Math.min(stats.smallestCluster, cluster.size);
            stats.clusterTypes[cluster.type] = (stats.clusterTypes[cluster.type] || 0) + 1;
        });
        
        stats.averageClusterSize = stats.averageClusterSize / clusters.length;
        
        return stats;
    }
}

// Export for use in other files
window.OpenAIClustering = OpenAIClustering; 