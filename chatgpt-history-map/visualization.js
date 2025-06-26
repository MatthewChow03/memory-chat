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
        this.createVisualization();
        this.setupControls();
        this.setupTooltips();
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

    createVisualization() {
        // Create main group for all elements
        const g = this.svg.append('g');
        
        // Process data into nodes and clusters
        this.processData();
        
        // Create clusters
        this.createClusters(g);
        
        // Create messages
        this.createMessages(g);
        
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
                x: Math.random() * this.width,
                y: Math.random() * this.height,
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
        
        // Create message nodes
        this.nodes = this.data.messages.map((message, index) => ({
            id: message.id,
            type: 'message',
            data: message,
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            radius: 3,
            color: this.messageColors(message.category),
            cluster: message.topic,
            subcluster: message.category
        }));
        
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
        // Create cluster bubbles
        const clusterGroup = g.append('g').attr('class', 'clusters');
        
        // Topic clusters
        const topicClusters = clusterGroup.selectAll('.cluster')
            .data(this.clusters.filter(c => c.type === 'topic'))
            .enter()
            .append('g')
            .attr('class', 'cluster')
            .attr('data-cluster-id', d => d.id)
            .attr('transform', d => `translate(${d.x},${d.y})`);
        
        // Cluster bubble
        topicClusters.append('circle')
            .attr('class', 'cluster-bubble')
            .attr('r', d => d.radius)
            .attr('fill', d => d.color)
            .attr('opacity', 0.7)
            .style('filter', 'url(#blur)');
        
        // Cluster label
        topicClusters.append('text')
            .attr('class', 'cluster-label')
            .text(d => d.name)
            .style('font-size', d => Math.max(12, d.radius / 3) + 'px');
        
        // Category subclusters
        this.clusters.forEach(cluster => {
            if (cluster.subclusters) {
                cluster.subclusters.forEach(subcluster => {
                    const subGroup = clusterGroup.append('g')
                        .attr('class', 'cluster subcluster')
                        .attr('data-cluster-id', subcluster.id)
                        .attr('data-parent', subcluster.parent)
                        .attr('transform', `translate(${subcluster.x},${subcluster.y})`);
                    
                    subGroup.append('circle')
                        .attr('class', 'cluster-bubble')
                        .attr('r', subcluster.radius)
                        .attr('fill', subcluster.color)
                        .attr('opacity', 0.6)
                        .style('filter', 'url(#blur)');
                    
                    subGroup.append('text')
                        .attr('class', 'cluster-label')
                        .text(subcluster.name)
                        .style('font-size', Math.max(10, subcluster.radius / 2) + 'px');
                });
            }
        });
    }

    createMessages(g) {
        const messageGroup = g.append('g').attr('class', 'messages');
        
        messageGroup.selectAll('.message')
            .data(this.nodes)
            .enter()
            .append('g')
            .attr('class', 'message')
            .attr('data-message-id', d => d.id)
            .append('circle')
            .attr('class', 'message-circle')
            .attr('r', d => d.radius)
            .attr('fill', d => d.color)
            .attr('opacity', 0.8);
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
        this.simulation = d3.forceSimulation(this.nodes)
            .force('link', d3.forceLink(this.links).id(d => d.id).distance(50))
            .force('charge', d3.forceManyBody().strength(-30))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('collision', d3.forceCollide().radius(d => d.radius + 5))
            .on('tick', () => this.updatePositions());
        
        // Add cluster forces
        this.clusters.forEach(cluster => {
            this.simulation.force(`cluster-${cluster.id}`, 
                d3.forceCenter(cluster.x, cluster.y).strength(0.1));
        });
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
            messages: 2.0,
            subclusters: 1.0,
            topicClusters: 0.5
        };
        
        // Show/hide elements based on zoom level
        this.svg.selectAll('.message')
            .style('opacity', this.currentZoom >= zoomThresholds.messages ? 0.8 : 0);
        
        this.svg.selectAll('.subcluster')
            .style('opacity', this.currentZoom >= zoomThresholds.subclusters ? 0.6 : 0);
        
        this.svg.selectAll('.cluster:not(.subcluster)')
            .style('opacity', this.currentZoom >= zoomThresholds.topicClusters ? 0.7 : 0.3);
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
        document.getElementById('zoom-level').textContent = `Zoom: ${zoomPercent}%`;
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
                tooltip.classed('show', true)
                    .html(`
                        <strong>${d.name}</strong><br>
                        <em>Type:</em> ${d.type}<br>
                        <em>Messages:</em> ${d.size}<br>
                        <em>Topics:</em> ${d.messages ? [...new Set(d.messages.map(m => m.topic))].join(', ') : ''}
                    `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', () => {
                tooltip.classed('show', false);
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