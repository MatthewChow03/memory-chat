# Memory Chat Chrome Extension

A Chrome extension that reads conversations from the ChatGPT website, allows you to selectively log messages to `chrome.storage.local` using a button, and displays a popup log within the ChatGPT interface.

## Features
- **Tabbed Message Storage Popup**: View your logs in a popup with tabs for Relevant, Recent, All, Search, Folders, and Settings
- **Relevant Tab**: Shows the 3 most similar stored messages to your current prompt using fuzzy TF-IDF similarity
- **Recent Tab**: Shows the 3 most recently logged messages
- **All Tab**: Shows all stored messages
- **Search Tab**: Lets you search your logs with fuzzy similarity (not just exact matches)
- **Folders Tab**: Create and manage folders to organize your messages into categories
- **Settings Tab**: Manage your log, including a "Clear All Logs" button and "Add Full Chat to Log" button
- **Add to Prompt**: Use the plus (+) button on any message to inject it as a bullet point into your prompt, under a single preface
- **Add to Folder**: Use the 📁 button next to messages to add them to specific folders
- **Folder Management**: Create, delete, and view folders with their contained messages
- **Folder to Prompt**: Use the plus (+) button on folders to add all messages from that folder to your prompt
- **Real-time Updates**: Tabs update instantly as you type in the prompt or add/remove messages
- **Modern Design**: Clean, pastel-colored buttons and UI elements

## File Structure

### Core Extension Files
- `manifest.json`: Chrome extension manifest (v3) with permissions and content script configuration
- `background.js`: Service worker that handles message storage and removal in `chrome.storage.local`
- `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`: Extension icons

### Content Script Components
- `utils.js`: Shared utility functions for text extraction and fuzzy similarity search
- `ui-components/storage-button.js`: Storage popup UI, tab logic, and storage button functionality
- `ui-components/message-buttons.js`: Individual message logging buttons for each ChatGPT message
- `ui-components/folder-button.js`: Folder management functionality and "Add to Folder" buttons
- `content.js`: Main orchestration script that coordinates all components

## How to Install & Test

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked" and select this project folder
4. Navigate to https://chat.openai.com
5. Start a conversation and use the "Add to Log" buttons next to messages
6. Click the 📋 button in the input area to view your logged messages and tabs

## Usage

- **Add Message**: Click the green "Add to Log" button next to any ChatGPT message
- **Remove Message**: Click the red "Remove from Log" button to remove a message
- **Add to Folder**: Click the 📁 button next to any message to add it to a specific folder
- **View Log**: Click the 📋 clipboard button in the ChatGPT input area
- **Tabs**: Switch between Relevant, Recent, All, Search, Folders, and Settings
- **Add to Prompt**: Click the plus (+) button on any message to add it as a bullet point in your prompt
- **Folders**: 
  - Create folders in the Folders tab
  - Click on a folder to view its contents
  - Use the plus (+) button on folders to add all messages from that folder to your prompt
  - Delete folders using the × button
- **Clear All**: Go to the Settings tab and click "Clear All Logs"
