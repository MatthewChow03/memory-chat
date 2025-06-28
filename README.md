# Memory Chat Chrome Extension

A Chrome extension that allows you to selectively log and manage ChatGPT conversations with **AI-powered semantic search** using transformer models, folder organization, and message reuse.

## 🚀 Features

- **Selective Logging**: Add individual messages to your log with one click
- **AI-Powered Semantic Search**: Advanced transformer-based search using @xenova/transformers
- **Smart Organization**: Create folders to organize related messages
- **Message Reuse**: Add logged messages back to your prompt with formatting
- **Bulk Operations**: Add entire conversations or folder contents to your prompt
- **Modern UI**: Clean, responsive interface with tabs and search functionality
- **Import Support**: Import ChatGPT conversations.json files with automatic embedding generation
- **High-Quality Results**: 85%+ similarity threshold ensures only highly relevant results

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [Usage Guide](#usage-guide)
- [Technical Details](#technical-details)
- [Troubleshooting](#troubleshooting)

## 🏃‍♂️ Quick Start

### For Users
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked" and select this project folder
4. Navigate to https://chatgpt.com
5. Start a conversation and use the "Add to Log" buttons next to messages
6. Click the 📋 button in the input area to view your logged messages and tabs

### For Developers
```bash
# Clone the repository
git clone https://github.com/MatthewChow03/memory-chat-logger.git
cd memory-chat-logger

# Install dependencies
npm install

# Load the extension in Chrome
# 1. Open chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked" and select this folder
```

## 🛠️ Development Setup

### Prerequisites
- Node.js (v14 or higher)
- Chrome browser (for testing)
- Git

### Installation
```bash
# Clone the repository
git clone https://github.com/MatthewChow03/memory-chat-logger.git
cd memory-chat-logger

# Install dependencies
npm install
```

### Development Workflow
1. **Load Extension**: Load the extension in Chrome using Developer mode
2. **Make Changes**: Edit files in the project
3. **Test Changes**: Refresh the extension in `chrome://extensions/` and test on ChatGPT
4. **Reload**: Click the refresh button on the extension card to reload changes

### Project Structure
```
memory-chat/
├── manifest.json          # Extension manifest
├── content.js             # Main content script
├── background.js          # Service worker
├── utils.js              # Shared utilities
├── package.json          # Dependencies and scripts
├── ui-components/        # Modular UI components
│   ├── storage-ui.js     # Main UI container
│   ├── storage-button.js # UI coordinator
│   ├── semantic-search.js # AI-powered search
│   └── ...               # Other UI modules
├── lib/                  # External libraries
├── icons/                # Extension icons
└── temp/                 # Temporary files (gitignored)
```

## 🏗️ Architecture

The extension uses a modular architecture for better maintainability and separation of concerns:

### Core Extension Files
- `manifest.json`: Chrome extension manifest (v3) with permissions and content script configuration
- `background.js`: Service worker that handles message storage and removal in `chrome.storage.local`
- `content.js`: Main orchestration script that coordinates all UI components
- `utils.js`: Shared utility functions for text extraction and similarity calculations

### UI Components (Modular Structure)

#### Core UI Management
- `ui-components/storage-ui.js`: Main UI container creation, storage button, and basic event handlers
- `ui-components/storage-button.js`: Coordinator that initializes all storage modules

#### Search & Intelligence
- `ui-components/advanced-semantic-search.js`: **AI-powered semantic search** using @xenova/transformers
- `ui-components/idb-utils.js`: IndexedDB utilities with embedding storage and search capabilities

#### Tab System
- `ui-components/storage-tabs.js`: Tab management, rendering, and tab-specific content (Relevant, Recent, All, Search, Folders, Settings)

#### Message Components
- `ui-components/storage-cards.js`: Individual message card rendering and interactions
- `ui-components/message-buttons.js`: "Add to Log" buttons for each ChatGPT message
- `ui-components/folder-button.js`: "Add to Folder" buttons and folder selector popup

#### Folder Management
- `ui-components/storage-folders.js`: Folder creation, deletion, content viewing, and folder operations

#### Utilities & Styling
- `ui-components/storage-utils.js`: Helper functions for text processing, similarity calculations, and storage operations
- `ui-components/storage-styles.js`: CSS injection and styling for the storage UI

### Icons
- `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`: Extension icons

## 🤖 AI-Powered Semantic Search Features

### Transformer-Based Search
- **Model**: Uses `Xenova/all-MiniLM-L6-v2` for high-quality semantic embeddings
- **384-Dimensional Vectors**: State-of-the-art embedding quality for superior semantic understanding
- **Real-time Processing**: Embeddings generated on-the-fly using WebAssembly/WebGPU
- **Context Awareness**: Understands meaning, not just keywords
- **Automatic Loading**: Model loads automatically when extension starts
- **High Threshold**: 85%+ similarity threshold ensures only highly relevant results

### Search Method
The extension uses **only** the AI-powered transformer search:
- **🤖 AI-powered semantic search**: Transformer-based semantic understanding
- **85%+ Similarity**: Only shows results with high semantic relevance
- **No Fallbacks**: Pure AI-powered search for consistent quality

### Import & Embedding Generation
- **Automatic Embeddings**: New messages automatically get high-quality embeddings generated
- **Bulk Import**: Import conversations.json files with automatic embedding generation
- **Update Existing**: Update embeddings for existing messages via settings
- **Model Caching**: Transformer model is cached for faster subsequent loads

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Development Guidelines
1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Follow the existing code style and architecture
4. **Test thoroughly**: Test on ChatGPT and ensure all features work
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**: Provide a clear description of your changes

### Code Style
- Use consistent indentation (2 spaces)
- Follow existing naming conventions
- Add comments for complex logic
- Keep functions focused and modular
- Test your changes before submitting

### Testing Checklist
- [ ] Extension loads without errors
- [ ] Messages can be added to log
- [ ] Search functionality works
- [ ] Folder operations work
- [ ] Import functionality works
- [ ] UI is responsive and accessible

### Reporting Issues
When reporting issues, please include:
- Browser version and OS
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)
- Screenshots (if relevant)

## 📖 Usage Guide

### Basic Operations
- **Add Message**: Click the green "Add to Log" button next to any ChatGPT message
- **Remove Message**: Click the red "Remove from Log" button to remove a message
- **View Log**: Click the 📋 clipboard button in the ChatGPT input area

### AI-Powered Search Features
- **Search Tab**: Advanced AI-powered semantic search with real-time feedback
- **Relevance Tab**: Shows messages similar to your current prompt using AI-powered search
- **High-Quality Results**: 85%+ similarity threshold ensures only highly relevant results
- **Search Status**: Real-time indication of AI model status

### Folder Management
- **Add to Folder**: Click the 📁 button next to any message to add it to a specific folder
- **Create Folders**: Use the Folders tab to create new folders
- **View Folder Contents**: Click on a folder name to view its messages
- **Bulk Add**: Use the plus (+) button on folders to add all messages from that folder to your prompt
- **Delete Folders**: Use the × button to delete folders

### Message Reuse
- **Add to Prompt**: Click the plus (+) button on any message to add it as a bullet point in your prompt
- **Bulk Operations**: Go to Settings tab to add the entire current chat to your log

### Import & Settings
- **Import Conversations**: Use the Settings tab to import ChatGPT conversations.json files
- **Update Embeddings**: Update embeddings for existing messages via the Settings tab
- **Clear All Logs**: Remove all stored messages and folders
- **Theme Toggle**: Switch between light and dark modes

### Search & Organization
- **Relevant Tab**: Shows messages similar to your current prompt using AI-powered semantic search
- **Recent Tab**: Shows the most recently added messages
- **All Tab**: Shows all logged messages
- **Search Tab**: Advanced AI-powered semantic search with 85%+ similarity threshold
- **Folders Tab**: Manage your message folders
- **Settings Tab**: Import, clear logs, and manage embeddings

## 🔧 Technical Details

### Dependencies
- `@xenova/transformers`: For AI-powered semantic embeddings
- IndexedDB: For local storage of messages and embeddings
- Chrome Extension APIs: For extension functionality

### Performance
- **Model Loading**: ~5-10 seconds on first load, cached thereafter
- **Search Speed**: Near-instant results once model is loaded
- **Memory Usage**: ~50MB for transformer model
- **Storage**: Embeddings stored locally in IndexedDB

### Browser Compatibility
- **Chrome**: Full support with AI-powered search
- **Edge**: Full support with AI-powered search
- **Firefox**: Limited support (WebAssembly restrictions)
- **Safari**: Limited support (WebAssembly restrictions)

### Development Scripts
```bash
npm run build    # Build the extension (placeholder)
npm run dev      # Development mode (placeholder)
npm run test     # Run tests (placeholder)
```

## 🐛 Troubleshooting

### AI Model Not Loading
1. Check internet connection (required for initial model download)
2. Refresh the page and try again
3. Check browser console for error messages
4. Ensure you're using a supported browser (Chrome/Edge recommended)

### Search Not Working
1. Ensure you have messages stored in the log
2. Try different search terms
3. Check if embeddings are being generated (Settings tab)
4. Clear browser cache and reload

### Performance Issues
1. Close other tabs to free up memory
2. Restart browser if model loading is slow
3. Wait for model to fully load before searching

### No Search Results
1. The 85%+ similarity threshold is high - try different search terms
2. Check the "All" tab to see if you have stored messages
3. Try rephrasing your search query
4. Add more diverse messages to your log for better search coverage

### Development Issues
1. **Extension not loading**: Check manifest.json for syntax errors
2. **Content script not working**: Check console for errors and ensure permissions are correct
3. **UI not appearing**: Verify content.js is properly injected and UI components are loaded
4. **Search not working**: Check if transformers library is loading correctly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [@xenova/transformers](https://github.com/xenova/transformers.js) for the AI-powered semantic search capabilities
- Chrome Extension APIs for the extension framework
- The open-source community for inspiration and tools

---

**Note**: The AI-powered search model will load automatically on first use. You'll see a loading indicator in the Search tab while the model initializes.