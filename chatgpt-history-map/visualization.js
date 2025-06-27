// ChatGPT History Map Visualization
class ChatGPTHistoryMap {
    constructor() {
        this.data = null;
        this.svg = null;
        this.width = 0;
        this.height = 0;
        this.zoom = d3.zoom().scaleExtent([0.1, 10]);
        this.simulation = null;
        this.nodes = [];
        this.links = [];
        this.clusters = [];
        this.currentZoom = 1;
        this.clusterColors = d3.scaleOrdinal(d3.schemeCategory10);
        this.messageColors = d3.scaleOrdinal(d3.schemeSet3);
        
        // OpenAI clustering
        this.openAIClustering = null;
        this.useSemanticClustering = false;
        this.clusteringMode = 'categorical'; // 'categorical', 'semantic', 'hybrid'
        
        this.init();
    }

    async init() {
        // Generate synthetic data
        const generator = new ChatGPTDataGenerator();
        this.data = generator.generateFullDataset();
        
        console.log('Generated data:', this.data);
        
        this.setupSVG();
        this.setupZoom();
        this.setupFilters();
        this.setupAPIControls();
        this.createVisualization();
        this.setupControls();
        this.setupTooltips();
        this.updateClusterStats();
        this.updateClusterOutput();
    }

    setupSVG() {
        const container = document.getElementById('visualization-container');
        this.width = container.clientWidth;
        this.height = container.clientHeight;

        this.svg = d3.select('#map-svg')
            .attr('width', this.width)
            .attr('height', this.height);

        // Add defs for filters
        const defs = this.svg.append('defs');
        
        // Blur filter for cluster bubbles
        defs.append('filter')
            .attr('id', 'blur')
            .append('feGaussianBlur')
            .attr('stdDeviation', '3');

        // Glow filter for hover effects
        defs.append('filter')
            .attr('id', 'glow')
            .append('feGaussianBlur')
            .attr('stdDeviation', '2')
            .attr('result', 'coloredBlur');
        
        const feMerge = defs.append('filter')
            .attr('id', 'glow')
            .append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    }

    setupZoom() {
        this.zoom.on('zoom', (event) => {
            this.currentZoom = event.transform.k;
            this.updateZoomLevel();
            
            const g = this.svg.select('g');
            g.attr('transform', event.transform);
            
            // Update visibility based on zoom level
            this.updateVisibilityByZoom();
        });

        this.svg.call(this.zoom);
    }

    setupFilters() {
        // Add filter for cluster blur effects
        const defs = this.svg.select('defs');
        
        // Radial gradient for cluster bubbles
        const radialGradient = defs.append('radialGradient')
            .attr('id', 'clusterGradient')
            .attr('cx', '50%')
            .attr('cy', '50%')
            .attr('r', '50%');
            
        radialGradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', 'rgba(255, 255, 255, 0.8)');
            
        radialGradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', 'rgba(255, 255, 255, 0.1)');
    }

    setupAPIControls() {
        console.log("Setting up API Controls")
        const enableSemanticBtn = document.getElementById('enable-semantic');
        const clusteringControls = document.getElementById('clustering-controls');
        const clusteringStatus = document.getElementById('clustering-status');
        const similarityThreshold = document.getElementById('similarity-threshold');
        const thresholdValue = document.getElementById('threshold-value');
        const reclusterBtn = document.getElementById('recluster');
        const toggleOutputBtn = document.getElementById('toggle-cluster-output');

        // Enable semantic clustering
        enableSemanticBtn.addEventListener('click', async () => {
            console.log("Enable Semantic Clustering Button Pressed")
            // Get API key from environment variable or config
            const apiKey = await this.getAPIKey();
            if (!apiKey) {
                alert('OpenAI API key not found. Please set the OPENAI_API_KEY environment variable or add it to the configuration.');
                return;
            }

            try {
                this.showLoading('Initializing OpenAI clustering...');
                this.openAIClustering = new OpenAIClustering(apiKey);
                this.useSemanticClustering = true;
                this.clusteringMode = 'semantic';
                
                clusteringControls.style.display = 'flex';
                clusteringStatus.textContent = 'Semantic clustering active';
                enableSemanticBtn.style.display = 'none';
                
                await this.performSemanticClustering();
                this.hideLoading();
            } catch (error) {
                this.hideLoading();
                alert('Error initializing semantic clustering: ' + error.message);
                console.error('Semantic clustering error:', error);
            }
        });

        // Similarity threshold slider
        similarityThreshold.addEventListener('input', (e) => {
            const value = e.target.value;
            thresholdValue.textContent = value;
            if (this.openAIClustering) {
                this.openAIClustering.setSimilarityThreshold(parseFloat(value));
            }
        });

        // Set initial threshold value
        thresholdValue.textContent = similarityThreshold.value;

        // Recluster button
        reclusterBtn.addEventListener('click', async () => {
            if (this.openAIClustering) {
                try {
                    this.showLoading('Reclustering with new threshold...');
                    await this.performSemanticClustering();
                    this.hideLoading();
                } catch (error) {
                    this.hideLoading();
                    alert('Error reclustering: ' + error.message);
                    console.error('Reclustering error:', error);
                }
            }
        });

        // Toggle cluster output
        toggleOutputBtn.addEventListener('click', () => {
            const outputSection = document.getElementById('cluster-output-section');
            const outputContent = document.getElementById('cluster-output-content');
            
            if (outputContent.style.display === 'none') {
                outputContent.style.display = 'block';
                outputSection.classList.add('expanded');
                this.updateClusterOutput();
            } else {
                outputContent.style.display = 'none';
                outputSection.classList.remove('expanded');
            }
        });
    }

    // Get API key from environment variable or configuration
    async getAPIKey() {
        // Try to get from environment variable (for server-side)
        if (typeof process !== 'undefined' && process.env && process.env.OPENAI_API_KEY) {
            return process.env.OPENAI_API_KEY;
        }
        
        // Try to get from window object (for client-side)
        if (typeof window !== 'undefined' && window.OPENAI_API_KEY) {
            return window.OPENAI_API_KEY;
        }
        
        // Try to get from a config object
        if (typeof window !== 'undefined' && window.config && window.config.OPENAI_API_KEY) {
            return window.config.OPENAI_API_KEY;
        }
        
        // Try to get from localStorage (for development)
        if (typeof localStorage !== 'undefined') {
            const storedKey = localStorage.getItem('OPENAI_API_KEY');
            if (storedKey) {
                return storedKey;
            }
        }
        
        // Try to fetch from server config endpoint
        try {
            const response = await fetch('/api/config');
            if (response.ok) {
                const config = await response.json();
                if (config.OPENAI_API_KEY && config.OPENAI_API_KEY !== 'your-api-key-here') {
                    return config.OPENAI_API_KEY;
                }
            }
        } catch (error) {
            console.log('Could not fetch config from server:', error.message);
        }
        
        return null;
    }

    async performSemanticClustering() {
        if (!this.openAIClustering) return;

        try {
            this.showLoading('Generating embeddings...');
            
            // Perform semantic clustering
            const semanticClusters = await this.openAIClustering.performSemanticClustering(this.data.messages);
            
            // Update visualization with semantic clusters
            this.updateVisualizationWithClusters(semanticClusters, 'semantic');
            
            this.updateClusterStats();
            this.updateClusterOutput();
            
        } catch (error) {
            console.error('Semantic clustering failed:', error);
            throw error;
        }
    }

    updateVisualizationWithClusters(newClusters, type) {
        // Clear existing clusters
        this.svg.selectAll('.clusters').remove();
        
        // Update cluster data
        this.clusters = newClusters.map((cluster, index) => ({
            ...cluster,
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            radius: Math.sqrt(cluster.size) * 3 + 20,
            color: type === 'semantic' ? this.clusterColors(cluster.name) : this.clusterColors(cluster.topic || cluster.name)
        }));

        // Recreate clusters
        const g = this.svg.select('g');
        this.createClusters(g);
        
        // Update force simulation
        this.setupForceSimulation();
    }

    showLoading(message) {
        const loadingOverlay = document.getElementById('loading-overlay');
        const loadingText = document.getElementById('loading-text');
        loadingText.textContent = message;
        loadingOverlay.style.display = 'flex';
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        loadingOverlay.style.display = 'none';
    }

    updateClusterStats() {
        const statsElement = document.getElementById('cluster-stats');
        if (this.clusters.length > 0) {
            const stats = this.openAIClustering ? 
                this.openAIClustering.getClusteringStats(this.clusters) :
                this.getCategoricalStats();
            
            statsElement.innerHTML = `
                <strong>Total Clusters:</strong> ${stats.totalClusters}<br>
                <strong>Total Messages:</strong> ${stats.totalMessages}<br>
                <strong>Average Cluster Size:</strong> ${stats.averageClusterSize.toFixed(1)}<br>
                <strong>Largest Cluster:</strong> ${stats.largestCluster}<br>
                <strong>Clustering Mode:</strong> ${this.clusteringMode}<br>
                ${this.openAIClustering ? `<strong>Similarity Threshold:</strong> ${this.openAIClustering.similarityThreshold}` : ''}
            `;
        } else {
            statsElement.textContent = 'No clusters available';
        }
    }

    getCategoricalStats() {
        return {
            totalClusters: this.clusters.length,
            totalMessages: this.clusters.reduce((sum, c) => sum + c.size, 0),
            averageClusterSize: this.clusters.reduce((sum, c) => sum + c.size, 0) / this.clusters.length,
            largestCluster: Math.max(...this.clusters.map(c => c.size)),
            smallestCluster: Math.min(...this.clusters.map(c => c.size))
        };
    }

    createVisualization() {
        // Create main group for all elements
        const g = this.svg.append('g');
        
        // Process data into nodes and clusters
        this.processData();
        
        // Create clusters
        this.createClusters(g);
        
        // Create links
        this.createLinks(g);
        
        // Setup force simulation
        this.setupForceSimulation();
    }

    processData() {
        // Group messages by topic and category
        const topicGroups = d3.group(this.data.messages, d => d.topic);
        const categoryGroups = d3.group(this.data.messages, d => d.category);
        
        // Create cluster nodes
        this.clusters = [];
        let clusterId = 0;
        
        // Topic-level clusters
        topicGroups.forEach((messages, topic) => {
            const cluster = {
                id: `cluster_${clusterId++}`,
                type: 'topic',
                name: topic,
                messages: messages,
                size: messages.length,
                x: 200 + (clusterId - 1) * 200,
                y: 200 + ((clusterId - 1) % 2) * 200,
                radius: Math.sqrt(messages.length) * 3 + 20,
                color: this.clusterColors(topic),
                subclusters: []
            };
            
            // Create category subclusters
            const categorySubgroups = d3.group(messages, d => d.category);
            categorySubgroups.forEach((categoryMessages, category) => {
                const subcluster = {
                    id: `subcluster_${clusterId++}`,
                    type: 'category',
                    name: category,
                    messages: categoryMessages,
                    size: categoryMessages.length,
                    x: cluster.x + (Math.random() - 0.5) * 100,
                    y: cluster.y + (Math.random() - 0.5) * 100,
                    radius: Math.sqrt(categoryMessages.length) * 2 + 15,
                    color: this.messageColors(category),
                    parent: cluster.id
                };
                cluster.subclusters.push(subcluster);
            });
            
            this.clusters.push(cluster);
        });
        
        // Create message nodes positioned within their clusters
        this.nodes = this.data.messages.map((message, index) => {
            // Find the cluster this message belongs to
            const cluster = this.clusters.find(c => c.name === message.topic);
            const subcluster = cluster?.subclusters.find(sc => sc.name === message.category);
            
            // Position message within its subcluster (or cluster if no subcluster)
            const targetCluster = subcluster || cluster;
            const angle = (index % targetCluster.messages.length) / targetCluster.messages.length * 2 * Math.PI;
            const distance = Math.random() * (targetCluster.radius * 0.6); // Within 60% of cluster radius
            
            return {
                id: message.id,
                type: 'message',
                data: message,
                x: targetCluster.x + Math.cos(angle) * distance,
                y: targetCluster.y + Math.sin(angle) * distance,
                radius: 3,
                color: this.messageColors(message.category),
                cluster: message.topic,
                subcluster: message.category,
                clusterId: targetCluster.id
            };
        });
        
        // Create links between related messages
        this.links = this.generateLinks();
    }

    generateLinks() {
        const links = [];
        const linkCount = Math.floor(this.nodes.length * 0.1); // 10% of messages have links
        
        for (let i = 0; i < linkCount; i++) {
            const source = this.nodes[Math.floor(Math.random() * this.nodes.length)];
            const target = this.nodes[Math.floor(Math.random() * this.nodes.length)];
            
            if (source.id !== target.id) {
                links.push({
                    source: source,
                    target: target,
                    strength: Math.random() * 0.5 + 0.1
                });
            }
        }
        
        return links;
    }

    createClusters(g) {
        // Create cluster groups
        const clusterGroups = this.svg.selectAll('.cluster')
            .data(this.clusters)
            .enter()
            .append('g')
            .attr('class', d => `cluster ${d.type === 'category' ? 'subcluster' : ''}`)
            .attr('data-cluster-id', d => d.id)
            .attr('transform', d => `translate(${d.x},${d.y})`);
        
        // Cluster bubble
        clusterGroups.append('circle')
            .attr('r', d => d.radius)
            .attr('fill', d => d.color)
            .attr('opacity', 0.7)
            .attr('stroke', d => d.color)
            .attr('stroke-width', 2);
        
        // Cluster label
        clusterGroups.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('fill', 'white')
            .attr('font-weight', 'bold')
            .attr('font-size', d => d.type === 'topic' ? '14px' : '12px')
            .text(d => d.name);
        
        // Render messages inside each cluster group
        clusterGroups.each((clusterData, i, nodes) => {
            // Find messages for this cluster
            const messages = this.nodes.filter(m => m.clusterId === clusterData.id);
            if (messages.length === 0) return;
            
            // Create a group for messages
            const messageGroup = d3.select(nodes[i])
                .append('g')
                .attr('class', 'messages');
            
            // Arrange messages in a circle within the cluster
            const clusterRadius = clusterData.radius || 50;
            const messageRadius = Math.min(clusterRadius * 0.7, 35);
            messages.forEach((msg, idx) => {
                const angle = (idx / messages.length) * 2 * Math.PI;
                const distance = messageRadius * 0.7;
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                
                const msgG = messageGroup.append('g')
                    .attr('class', 'message')
                    .attr('data-message-id', msg.id)
                    .attr('transform', `translate(${x},${y})`);
                msgG.append('circle')
                    .attr('class', 'message-circle')
                    .attr('r', msg.radius)
                    .attr('fill', msg.color)
                    .attr('opacity', 0.8);
            });
        });
        
        // Add hover effects
        clusterGroups
            .on('mouseover', (event, d) => {
                d3.select(event.currentTarget).select('circle')
                    .transition()
                    .duration(200)
                    .attr('opacity', 0.9)
                    .attr('r', d.radius + 5);
                
                this.showTooltip(event, this.createClusterTooltip(d));
            })
            .on('mouseout', (event, d) => {
                d3.select(event.currentTarget).select('circle')
                    .transition()
                    .duration(200)
                    .attr('opacity', 0.7)
                    .attr('r', d.radius);
                
                this.hideTooltip();
            })
            .on('click', (event, d) => {
                this.handleClusterClick(d);
            });
    }

    createLinks(g) {
        const linkGroup = g.append('g').attr('class', 'links');
        
        linkGroup.selectAll('.link')
            .data(this.links)
            .enter()
            .append('line')
            .attr('class', 'link')
            .attr('stroke-width', 1);
    }

    setupForceSimulation() {
        // Remove force simulation to keep messages in their cluster positions
        // Only use it for initial positioning if needed
        this.simulation = d3.forceSimulation(this.nodes)
            .force('link', d3.forceLink(this.links).id(d => d.id).distance(20))
            .force('charge', d3.forceManyBody().strength(-5))
            .force('collision', d3.forceCollide().radius(d => d.radius + 2))
            .on('tick', () => this.updatePositions())
            .stop(); // Stop the simulation to maintain cluster-based positioning
        
        // Run simulation for a few ticks to settle initial positions within clusters
        for (let i = 0; i < 50; i++) {
            this.simulation.tick();
        }
    }

    updatePositions() {
        // Update message positions
        this.svg.selectAll('.message')
            .attr('transform', d => `translate(${d.x},${d.y})`);
        
        // Update link positions
        this.svg.selectAll('.link')
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
    }

    updateVisibilityByZoom() {
        const zoomThresholds = {
            messages: 2.0,        // Show individual messages
            subclusters: 1,     // Show subcategories
            topicClusters: 0.4    // Show main topics
        };
        
        // Update visibility based on zoom level
        this.svg.selectAll('.message')
            .style('opacity', this.currentZoom >= zoomThresholds.messages ? 0.8 : 0)
            .style('pointer-events', this.currentZoom >= zoomThresholds.messages ? 'auto' : 'none');
        
        // Handle subclusters (category level)
        this.svg.selectAll('.subcluster')
            .style('opacity', this.currentZoom >= zoomThresholds.subclusters && this.currentZoom < zoomThresholds.messages ? 0.8 : 0)
            .style('pointer-events', this.currentZoom >= zoomThresholds.subclusters && this.currentZoom < zoomThresholds.messages ? 'auto' : 'none');
        
        // Handle main topic clusters - hide them when zoomed into subcategories or messages
        this.svg.selectAll('.cluster:not(.subcluster)')
            .style('opacity', this.currentZoom >= zoomThresholds.topicClusters && this.currentZoom < zoomThresholds.subclusters ? 0.8 : 0)
            .style('pointer-events', this.currentZoom >= zoomThresholds.topicClusters && this.currentZoom < zoomThresholds.subclusters ? 'auto' : 'none');
        
        // Update cluster positioning based on zoom level
        this.updateClusterPositioning();
    }

    updateClusterPositioning() {
        if (this.currentZoom >= 1.5 && this.currentZoom < 3.0) {
            // Zoom level for subcategories - spread them out
            this.spreadSubclusters();
        } else if (this.currentZoom >= 3.0) {
            // Zoom level for messages - spread messages out within their clusters
            this.spreadMessagesWithinClusters();
        } else {
            // Default positioning
            this.resetClusterPositions();
        }
    }

    spreadSubclusters() {
        // Get all subclusters from all main clusters
        const allSubclusters = [];
        this.clusters.forEach(cluster => {
            if (cluster.subclusters) {
                allSubclusters.push(...cluster.subclusters);
            }
        });
        
        // Spread subclusters in a circle around the center
        this.svg.selectAll('.subcluster').each((d, i, nodes) => {
            const node = d3.select(nodes[i]);
            const angle = (i / allSubclusters.length) * 2 * Math.PI;
            const radius = Math.min(this.width, this.height) * 0.3; // 30% of screen size
            
            const x = this.width / 2 + Math.cos(angle) * radius;
            const y = this.height / 2 + Math.sin(angle) * radius;
            
            node.transition()
                .duration(500)
                .attr('transform', `translate(${x},${y})`);
        });
        
        // Hide main topic clusters completely
        this.svg.selectAll('.cluster:not(.subcluster)')
            .transition()
            .duration(300)
            .style('opacity', 0);
    }

    spreadMessagesWithinClusters() {
        // Group messages by their cluster
        const messagesByCluster = new Map();
        
        this.svg.selectAll('.message').each((d, i, nodes) => {
            const clusterId = d.clusterId;
            if (clusterId) {
                if (!messagesByCluster.has(clusterId)) {
                    messagesByCluster.set(clusterId, []);
                }
                messagesByCluster.get(clusterId).push({ message: d, node: d3.select(nodes[i]) });
            }
        });
        
        // Spread messages within their cluster boundaries
        messagesByCluster.forEach((messages, clusterId) => {
            const cluster = this.findClusterById(clusterId);
            if (cluster) {
                // Calculate cluster position (either from cluster data or current transform)
                let clusterX = cluster.x;
                let clusterY = cluster.y;
                
                // If it's a subcluster, get its current position from the DOM
                if (cluster.type === 'category') {
                    const clusterElement = this.svg.select(`[data-cluster-id="${clusterId}"]`);
                    if (!clusterElement.empty()) {
                        const transform = clusterElement.attr('transform');
                        if (transform) {
                            const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
                            if (match) {
                                clusterX = parseFloat(match[1]);
                                clusterY = parseFloat(match[2]);
                            }
                        }
                    }
                }
                
                // Spread messages within the cluster radius
                const clusterRadius = cluster.radius || 50;
                const messageRadius = Math.min(clusterRadius * 0.7, 35); // Keep messages within cluster bounds
                
                messages.forEach((item, index) => {
                    const angle = (index / messages.length) * 2 * Math.PI;
                    const distance = Math.random() * messageRadius; // Random distance within cluster
                    
                    const x = clusterX + Math.cos(angle) * distance;
                    const y = clusterY + Math.sin(angle) * distance;
                    
                    item.node.transition()
                        .duration(500)
                        .attr('transform', `translate(${x},${y})`);
                });
            }
        });
        
        // Hide subclusters completely when showing messages
        this.svg.selectAll('.subcluster')
            .transition()
            .duration(300)
            .style('opacity', 0);
    }

    resetClusterPositions() {
        // Reset all clusters to their original positions
        this.svg.selectAll('.cluster')
            .transition()
            .duration(500)
            .attr('transform', d => `translate(${d.x},${d.y})`);
        
        // Reset messages to their original cluster-based positions
        this.svg.selectAll('.message')
            .transition()
            .duration(500)
            .attr('transform', d => `translate(${d.x},${d.y})`);
    }

    findClusterForMessage(message) {
        // Use the clusterId property if available
        if (message.clusterId) {
            return this.findClusterById(message.clusterId);
        }
        
        // Fallback to searching by topic/category
        for (const cluster of this.clusters) {
            if (cluster.messages && cluster.messages.some(m => m.id === message.id)) {
                return cluster;
            }
            if (cluster.subclusters) {
                for (const subcluster of cluster.subclusters) {
                    if (subcluster.messages && subcluster.messages.some(m => m.id === message.id)) {
                        return subcluster;
                    }
                }
            }
        }
        return null;
    }

    findClusterById(clusterId) {
        // Find cluster by ID (search both main clusters and subclusters)
        for (const cluster of this.clusters) {
            if (cluster.id === clusterId) {
                return cluster;
            }
            if (cluster.subclusters) {
                for (const subcluster of cluster.subclusters) {
                    if (subcluster.id === clusterId) {
                        return subcluster;
                    }
                }
            }
        }
        return null;
    }

    setupControls() {
        document.getElementById('zoom-in').addEventListener('click', () => {
            this.svg.transition().call(this.zoom.scaleBy, 1.5);
        });
        
        document.getElementById('zoom-out').addEventListener('click', () => {
            this.svg.transition().call(this.zoom.scaleBy, 0.75);
        });
        
        document.getElementById('reset-view').addEventListener('click', () => {
            this.svg.transition().call(this.zoom.transform, d3.zoomIdentity);
        });
    }

    updateZoomLevel() {
        const zoomPercent = Math.round(this.currentZoom * 100);
        let zoomDescription = '';
        
        if (this.currentZoom >= 3.0) {
            zoomDescription = ' (Messages)';
        } else if (this.currentZoom >= 1.5) {
            zoomDescription = ' (Subcategories)';
        } else if (this.currentZoom >= 0.8) {
            zoomDescription = ' (Topics)';
        } else {
            zoomDescription = ' (Overview)';
        }
        
        document.getElementById('zoom-level').textContent = `Zoom: ${zoomPercent}%${zoomDescription}`;
    }

    setupTooltips() {
        const tooltip = d3.select('#tooltip');
        
        // Message tooltips
        this.svg.selectAll('.message')
            .on('mouseover', (event, d) => {
                tooltip.classed('show', true)
                    .html(`
                        <strong>${d.data.topic} - ${d.data.category}</strong><br>
                        <em>Input:</em> ${d.data.input.substring(0, 100)}...<br>
                        <em>Output:</em> ${d.data.output.substring(0, 100)}...<br>
                        <em>Sentiment:</em> ${d.data.sentiment}<br>
                        <em>Complexity:</em> ${d.data.complexity}
                    `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', () => {
                tooltip.classed('show', false);
            });
        
        // Cluster tooltips
        this.svg.selectAll('.cluster')
            .on('mouseover', (event, d) => {
                const clusterType = d.type || 'categorical';
                const tooltipClass = clusterType === 'semantic' ? 'semantic' : 
                                   clusterType === 'hybrid' ? 'hybrid' : '';
                
                let tooltipContent = `
                    <strong>${d.name}</strong><br>
                    <em>Type:</em> ${clusterType}<br>
                    <em>Messages:</em> ${d.size}<br>
                `;
                
                if (d.keywords && d.keywords.length > 0) {
                    tooltipContent += `<em>Keywords:</em> ${d.keywords.slice(0, 5).join(', ')}<br>`;
                }
                
                if (d.similarity !== undefined) {
                    tooltipContent += `<em>Avg Similarity:</em> ${(d.similarity * 100).toFixed(1)}%<br>`;
                }
                
                if (d.messages && d.messages.length > 0) {
                    const topics = [...new Set(d.messages.map(m => m.topic))];
                    tooltipContent += `<em>Topics:</em> ${topics.join(', ')}`;
                }
                
                tooltip.classed('show', true)
                    .classed(tooltipClass, true)
                    .html(tooltipContent)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', () => {
                tooltip.classed('show', false)
                    .classed('semantic', false)
                    .classed('hybrid', false);
            });
        
        // Click handlers for clusters
        this.svg.selectAll('.cluster')
            .on('click', (event, d) => {
                this.zoomToCluster(d);
            });
    }

    zoomToCluster(cluster) {
        const clusterElement = this.svg.select(`[data-cluster-id="${cluster.id}"]`);
        const bbox = clusterElement.node().getBBox();
        
        const scale = Math.min(this.width / bbox.width, this.height / bbox.height) * 0.8;
        const transform = d3.zoomIdentity
            .translate(this.width / 2 - (bbox.x + bbox.width / 2) * scale, 
                      this.height / 2 - (bbox.y + bbox.height / 2) * scale)
            .scale(scale);
        
        this.svg.transition()
            .duration(750)
            .call(this.zoom.transform, transform);
    }

    // Handle window resize
    handleResize() {
        const container = document.getElementById('visualization-container');
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        
        this.svg
            .attr('width', this.width)
            .attr('height', this.height);
        
        if (this.simulation) {
            this.simulation
                .force('center', d3.forceCenter(this.width / 2, this.height / 2))
                .alpha(0.3)
                .restart();
        }
    }

    updateClusterOutput() {
        const clusterTree = document.getElementById('cluster-tree');
        if (!clusterTree) return;

        let output = '';
        
        if (this.clusters.length === 0) {
            output = '<p>No clusters available. Run semantic clustering first.</p>';
        } else {
            output = this.generateClusterTreeHTML(this.clusters);
        }
        
        clusterTree.innerHTML = output;
    }

    generateClusterTreeHTML(clusters, level = 0) {
        let html = '';
        
        clusters.forEach((cluster, index) => {
            const indent = '  '.repeat(level);
            const clusterType = cluster.type || 'categorical';
            
            html += `
                <div class="cluster-item ${clusterType}">
                    <div class="cluster-header">
                        <span class="cluster-type ${clusterType}">${clusterType.toUpperCase()}</span>
                        <strong>${cluster.name}</strong>
                    </div>
                    <div class="cluster-details">
                        Size: ${cluster.size} messages | Level: ${cluster.level || 0}
                        ${cluster.similarity ? `| Similarity: ${(cluster.similarity * 100).toFixed(1)}%` : ''}
                    </div>
                    ${cluster.keywords && cluster.keywords.length > 0 ? 
                        `<div class="cluster-keywords">Keywords: ${cluster.keywords.slice(0, 5).join(', ')}</div>` : ''}
            `;
            
            // Add subclusters if they exist
            if (cluster.subclusters && cluster.subclusters.length > 0) {
                html += '<div class="subcluster-list">';
                html += '<strong>Subclusters:</strong>';
                html += this.generateClusterTreeHTML(cluster.subclusters, level + 1);
                html += '</div>';
            }
            
            // Add messages if they exist and we're at a leaf level
            if (cluster.messages && cluster.messages.length > 0 && (!cluster.subclusters || cluster.subclusters.length === 0)) {
                html += '<div class="message-list">';
                html += '<strong>Messages:</strong>';
                cluster.messages.forEach((message, msgIndex) => {
                    const preview = message.input.substring(0, 100) + (message.input.length > 100 ? '...' : '');
                    html += `
                        <div class="message-item">
                            <div><strong>${message.topic} - ${message.category}</strong></div>
                            <div class="message-preview">${preview}</div>
                        </div>
                    `;
                });
                html += '</div>';
            }
            
            html += '</div>';
        });
        
        return html;
    }

    generateData() {
        const topics = [
            { name: 'Programming', color: '#ff6b6b', categories: ['JavaScript', 'Python', 'Web Development', 'Data Science'] },
            { name: 'Science', color: '#4ecdc4', categories: ['Physics', 'Biology', 'Chemistry', 'Mathematics'] },
            { name: 'Technology', color: '#45b7d1', categories: ['AI/ML', 'Cybersecurity', 'Cloud Computing', 'IoT'] },
            { name: 'Arts', color: '#96ceb4', categories: ['Music', 'Visual Arts', 'Literature', 'Film'] },
            { name: 'Business', color: '#feca57', categories: ['Marketing', 'Finance', 'Entrepreneurship', 'Management'] }
        ];

        const messages = [];
        const clusters = [];
        let messageId = 1;

        topics.forEach((topic, topicIndex) => {
            const topicCluster = {
                id: `topic-${topicIndex}`,
                name: topic.name,
                type: 'topic',
                color: topic.color,
                x: 200 + topicIndex * 200,
                y: 200 + (topicIndex % 2) * 200,
                radius: 80,
                messages: [],
                subclusters: []
            };

            topic.categories.forEach((category, categoryIndex) => {
                const categoryCluster = {
                    id: `category-${topicIndex}-${categoryIndex}`,
                    name: category,
                    type: 'category',
                    color: topic.color,
                    x: topicCluster.x + (categoryIndex - 1.5) * 60,
                    y: topicCluster.y + (categoryIndex % 2 === 0 ? -40 : 40),
                    radius: 50,
                    messages: [],
                    parentCluster: topicCluster.id
                };

                // Generate 20-30 messages per category
                const messageCount = 20 + Math.floor(Math.random() * 10);
                for (let i = 0; i < messageCount; i++) {
                    const message = {
                        id: messageId++,
                        content: `Message ${messageId} about ${category}`,
                        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                        cluster: categoryCluster.id,
                        topic: topic.name,
                        category: category
                    };
                    
                    // Position message within the category cluster bounds
                    const angle = (i / messageCount) * 2 * Math.PI;
                    const distance = Math.random() * 30; // Within category radius
                    message.x = categoryCluster.x + Math.cos(angle) * distance;
                    message.y = categoryCluster.y + Math.sin(angle) * distance;
                    
                    messages.push(message);
                    categoryCluster.messages.push(message.id);
                }

                topicCluster.subclusters.push(categoryCluster);
                clusters.push(categoryCluster);
            });

            clusters.push(topicCluster);
        });

        return { messages, clusters };
    }
}

// Initialize the visualization when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const map = new ChatGPTHistoryMap();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        map.handleResize();
    });
    
    // Make map globally accessible for debugging
    window.chatGPTMap = map;
}); 