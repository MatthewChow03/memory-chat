# ChatGPT History Map

A beautiful, interactive 2D visualization of ChatGPT conversation history with clustering, infinite scroll, and immersive navigation.

![](/chatgpt-history-map/memory-map-v1.png)

## Features

### 🎯 Core Visualization
- **Infinite Scroll Map**: Navigate through your entire ChatGPT history in a seamless 2D space
- **Smart Clustering**: Messages are automatically grouped by topic and category
- **Dynamic Links**: Visual connections between related conversations
- **Hazy Bubble Clusters**: Beautiful, smoky bubble shapes around conversation clusters
- **Progressive Detail**: Zoom from broad categories to specific messages

### 🎨 Visual Design
- **Colorful Clusters**: Each topic has its own distinct color scheme
- **Smoky Effects**: Gaussian blur filters create hazy, ethereal bubble shapes
- **Smooth Animations**: Fluid transitions and force-directed layouts
- **Responsive Design**: Works beautifully on all screen sizes

### 🔍 Interactive Features
- **Zoom & Pan**: Navigate with mouse wheel and drag
- **Hover Tooltips**: See message previews and cluster information
- **Click to Explore**: Click clusters to zoom into specific topics
- **Progressive Disclosure**: Different levels of detail based on zoom level

## Data Structure

The visualization works with a hierarchical data structure:

### Messages (Base Unit)
Each message represents a single input/output interaction:
```javascript
{
  id: "unique_id",
  timestamp: "2024-01-01T10:00:00Z",
  topic: "programming",
  category: "JavaScript",
  input: "How do I create a React component?",
  output: "Here's how to create a React component...",
  user: "Alex",
  tags: ["react", "component", "javascript"],
  sentiment: "positive",
  complexity: "beginner"
}
```

### Chats (Message Groups)
Messages are organized into chats (conversation sessions):
```javascript
{
  id: "chat_id",
  title: "JavaScript Development Help",
  topic: "programming",
  category: "JavaScript",
  messages: [...],
  timestamp: "2024-01-01T10:00:00Z",
  messageCount: 8,
  tags: ["javascript", "react", "development"]
}
```

### Clusters (Visual Groups)
- **Topic Clusters**: High-level groupings (Programming, Writing, Learning, etc.)
- **Category Clusters**: Sub-groupings within topics (JavaScript, Python, React, etc.)
- **Message Nodes**: Individual conversation points

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (for development)
- OpenAI API key (for semantic clustering)

### Installation

1. **Clone or download the project**
   ```bash
   cd chatgpt-history-map
   ```

2. **Set up your OpenAI API key** (choose one method):

   **Method A: Environment Variable (Recommended)**
   ```bash
   # On Windows
   set OPENAI_API_KEY=your-actual-api-key-here
   
   # On macOS/Linux
   export OPENAI_API_KEY=your-actual-api-key-here
   ```

   **Method B: Configuration File**
   Edit `config.js` and replace `'your-api-key-here'` with your actual API key:
   ```javascript
   window.config = {
       OPENAI_API_KEY: 'sk-your-actual-api-key-here'
   };
   ```

   **Method C: Browser Console (Development)**
   Open browser console and run:
   ```javascript
   localStorage.setItem('OPENAI_API_KEY', 'your-actual-api-key-here');
   ```

3. **Start the local server**
   ```bash
   # Using the custom Python server (recommended)
   python server.py
   
   # Or using standard Python server
   python -m http.server 8000
   
   # Or using Node.js
   npx http-server -p 8000
   ```

4. **Open in browser**
   ```
   http://localhost:8000
   ```

### Usage

#### Navigation
- **Scroll**: Zoom in/out
- **Drag**: Pan around the map
- **Click clusters**: Zoom into specific topics
- **Hover**: See message and cluster details

#### Controls
- **Enable Semantic Clustering**: Click the green button to activate AI-powered clustering
- **Similarity Threshold**: Adjust clustering sensitivity (0.5-0.95)
- **Recluster**: Re-run clustering with new settings
- **Zoom In/Out**: Use the buttons or mouse wheel
- **Reset View**: Return to the overview
- **Zoom Level**: See current zoom percentage

#### Understanding the Visualization

1. **Overview Level** (Zoom < 50%): See topic clusters
2. **Category Level** (Zoom 50-100%): See category subclusters
3. **Message Level** (Zoom > 200%): See individual messages

#### Clustering Modes

- **Categorical Clustering**: Default mode using predefined topics/categories
- **Semantic Clustering**: AI-powered clustering based on message content similarity
- **Hybrid Clustering**: Combines both approaches for optimal results

## Synthetic Data

The application includes a comprehensive synthetic data generator that creates realistic ChatGPT conversations across 8 main topics:

### Topics Covered
- **Programming**: JavaScript, Python, React, Node.js, etc.
- **Writing**: Creative, Academic, Business, Technical writing
- **Learning**: Math, Science, History, Literature, etc.
- **Productivity**: Time management, Goal setting, Workflow optimization
- **Health**: Fitness, Nutrition, Mental health, Wellness
- **Technology**: AI/ML, Blockchain, Cloud computing, Cybersecurity
- **Business**: Marketing, Finance, Strategy, Operations
- **Personal**: Relationships, Family, Personal growth, Life advice

### Data Generation
- **500 messages** across all topics
- **Realistic conversation patterns** (questions, requests, discussions, problems, learning)
- **Varied complexity levels** (beginner to expert)
- **Diverse sentiment** (positive, neutral, negative, curious, etc.)
- **Temporal distribution** (spread across the last year)

## Technical Implementation

### Technologies Used
- **D3.js**: Data visualization and force simulation
- **SVG**: Vector graphics for crisp, scalable visuals
- **CSS3**: Modern styling with gradients and animations
- **Vanilla JavaScript**: No framework dependencies

### Key Components

#### Data Generator (`data-generator.js`)
- Generates realistic synthetic ChatGPT data
- Creates hierarchical topic/category structure
- Produces varied conversation types and sentiments

#### Visualization Engine (`visualization.js`)
- D3.js force-directed graph layout
- Zoom and pan functionality
- Progressive detail rendering
- Interactive tooltips and navigation

#### Styling (`styles.css`)
- Modern, responsive design
- Smooth animations and transitions
- Beautiful color schemes and effects

### Architecture

```
ChatGPTHistoryMap
├── Data Generation
│   ├── Topic/Category Hierarchy
│   ├── Message Generation
│   └── Chat Organization
├── Visualization
│   ├── Force Simulation
│   ├── Cluster Rendering
│   ├── Message Nodes
│   └── Link Connections
└── Interaction
    ├── Zoom/Pan Controls
    ├── Tooltip System
    └── Progressive Detail
```

## Customization

### Adding Real Data
To use your actual ChatGPT data:

1. Export your ChatGPT history (JSON format)
2. Transform the data to match the expected structure
3. Replace the synthetic data generator with your data loader

### Styling Customization
- Modify `styles.css` for visual changes
- Adjust color schemes in `visualization.js`
- Customize cluster shapes and effects

### Data Structure Modifications
- Extend the data generator for new topics
- Add new message types or categories
- Modify clustering algorithms


## Future Enhancements

- **Real-time data integration** with ChatGPT API
- **Advanced clustering algorithms** (K-means, DBSCAN)
- **Search and filtering** capabilities
- **Export and sharing** features
- **Mobile optimization** for touch interactions
- **Dark/light theme** toggle
- **Custom color schemes** and themes
