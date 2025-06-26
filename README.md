# Memory Chat Chrome Extension

A Chrome extension that allows you to selectively log and manage ChatGPT conversations with advanced features like folder organization, similarity search, and message reuse.

## Features

- **Selective Logging**: Add individual messages to your log with one click
- **Smart Organization**: Create folders to organize related messages
- **Similarity Search**: Find relevant messages based on your current prompt
- **Message Reuse**: Add logged messages back to your prompt with formatting
- **Bulk Operations**: Add entire conversations or folder contents to your prompt
- **Modern UI**: Clean, responsive interface with tabs and search functionality

## Architecture

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


## How to Install & Test

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked" and select this project folder
4. Navigate to https://chatgpt.com
5. Start a conversation and use the "Add to Log" buttons next to messages
6. Click the 📋 button in the input area to view your logged messages and tabs

## Usage

### Basic Operations
- **Add Message**: Click the green "Add to Log" button next to any ChatGPT message
- **Remove Message**: Click the red "Remove from Log" button to remove a message
- **View Log**: Click the 📋 clipboard button in the ChatGPT input area

### Folder Management
- **Add to Folder**: Click the 📁 button next to any message to add it to a specific folder
- **Create Folders**: Use the Folders tab to create new folders
- **View Folder Contents**: Click on a folder name to view its messages
- **Bulk Add**: Use the plus (+) button on folders to add all messages from that folder to your prompt
- **Delete Folders**: Use the × button to delete folders

### Message Reuse
- **Add to Prompt**: Click the plus (+) button on any message to add it as a bullet point in your prompt
- **Bulk Operations**: Go to Settings tab to add the entire current chat to your log

### Search & Organization
- **Relevant Tab**: Shows messages similar to your current prompt
- **Recent Tab**: Shows the 3 most recently added messages
- **All Tab**: Shows all logged messages
- **Search Tab**: Search through your logged messages
- **Folders Tab**: Manage your message folders
- **Settings Tab**: Clear all logs or add full chat