# Memory Chat Chrome Extension

A Chrome extension that allows you to selectively log and manage ChatGPT conversations with **AI-powered insight extraction** and **semantic search** using OpenAI's 4o-mini model and transformer models.

## 🚀 Features

- **AI-Powered Insight Extraction**: Extract 3 or fewer key insights from messages using OpenAI's 4o-mini model
- **Selective Logging**: Add individual messages to your log with one click
- **AI-Powered Semantic Search**: Advanced transformer-based search using @xenova/transformers
- **Smart Organization**: Create folders to organize related insights
- **Message Reuse**: Add logged insights back to your prompt with formatting
- **Bulk Operations**: Add entire conversations or folder contents to your prompt
- **Modern UI**: Clean, responsive interface with tabs and search functionality
- **Import Support**: Import ChatGPT conversations.json files with automatic insight extraction
- **High-Quality Results**: 85%+ similarity threshold ensures only highly relevant results
- **Persistent API Key**: Save your OpenAI API key for seamless insight extraction

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
5. **Set up OpenAI API Key**: Click the 📋 button, go to Settings tab, and enter your OpenAI API key
6. Start a conversation and use the "Add to Log" buttons next to messages
7. View your extracted insights in the storage interface

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
- OpenAI API key (for insight extraction)

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
2. **Set up API Key**: Enter your OpenAI API key in the Settings tab
3. **Make Changes**: Edit files in the project
4. **Test Changes**: Refresh the extension in `chrome://extensions/` and test on ChatGPT
5. **Reload**: Click the refresh button on the extension card to reload changes

### Project Structure
```
memory-chat/
├── manifest.json          # Extension manifest
├── content.js             # Main content script
├── background.js          # Service worker
├── utils.js              # Shared utilities
├── package.json          # Dependencies and scripts
├── ui-components/        # Modular UI components
│   ├── insight-extraction.js # OpenAI insight extraction service
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

#### AI-Powered Features
- `ui-components/insight-extraction.js`: **OpenAI-powered insight extraction** using GPT-4o-mini
- `ui-components/advanced-semantic-search.js`: **AI-powered semantic search** using @xenova/transformers
- `ui-components/idb-utils.js`: IndexedDB utilities with insight storage and search capabilities

#### Tab System
- `ui-components/storage-tabs.js`: Tab management, rendering, and tab-specific content (Relevant, Recent, All, Search, Folders, Settings)

#### Message Components
- `ui-components/storage-cards.js`: Individual insight card rendering and interactions
- `ui-components/message-buttons.js`: "Add to Log" buttons for each ChatGPT message
- `ui-components/folder-button.js`: "Add to Folder" buttons and folder selector popup

#### Folder Management
- `ui-components/storage-folders.js`: Folder creation, deletion, content viewing, and folder operations

#### Utilities & Styling
- `ui-components/storage-utils.js`: Helper functions for text processing, similarity calculations, and storage operations
- `ui-components/storage-styles.js`: CSS injection and styling for the storage UI

### Icons
- `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`: Extension icons

## 🤖 AI-Powered Features

### OpenAI Insight Extraction
- **Model**: Uses OpenAI's GPT-4o-mini for high-quality insight extraction
- **Key Insights**: Extracts 3 or fewer key insights from each message
- **Bullet Point Format**: Insights are formatted as concise bullet points
- **Rate Limiting**: Built-in rate limiting to respect API limits
- **Error Handling**: Comprehensive error handling for API failures
- **Persistent Storage**: API key is securely stored and persists across sessions

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

### Import & Processing
- **Automatic Insight Extraction**: New messages automatically get insights extracted via OpenAI
- **Bulk Import**: Import conversations.json files with automatic insight extraction
- **Update Existing**: Update embeddings for existing insights via settings
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
- [ ] OpenAI API key can be set and saved
- [ ] Messages can be processed for insights
- [ ] Insights are displayed correctly
- [ ] Search functionality works with insights
- [ ] Folder operations work
- [ ] Import functionality works with insight extraction
- [ ] UI is responsive and accessible

### Reporting Issues
When reporting issues, please include:
- Browser version and OS
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)
- Screenshots (if relevant)
- OpenAI API key status (if insight extraction related)

## 📖 Usage Guide

### Setup
1. **Get OpenAI API Key**: Sign up at https://platform.openai.com and get an API key
2. **Enter API Key**: Click the 📋 button, go to Settings tab, and enter your API key
3. **Test Connection**: The extension will test your API key and save it securely

### Basic Operations
- **Add Message**: Click the green "Add to Log" button next to any ChatGPT message
- **Remove Message**: Click the red "Remove from Log" button to remove insights
- **View Insights**: Click the 📋 clipboard button in the ChatGPT input area

### AI-Powered Features
- **Insight Extraction**: Messages are automatically processed to extract key insights
- **Search Tab**: Advanced AI-powered semantic search through insights
- **Relevance Tab**: Shows insights similar to your current prompt using AI-powered search
- **High-Quality Results**: 85%+ similarity threshold ensures only highly relevant results
- **Search Status**: Real-time indication of AI model status

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