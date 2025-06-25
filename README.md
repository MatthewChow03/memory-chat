# Memory Chat Chrome Extension

A Chrome extension that reads conversations from the ChatGPT website, allows you to selectively log messages to `chrome.storage.local` using a button, and displays a popup log within the ChatGPT interface.

## Features
- **Selective Logging**: Add/remove individual messages from your log with toggle buttons
- **Popup UI**: View all logged messages in a modern popup interface
- **Real-time Updates**: Log updates automatically in the popup
- **Clear All**: One-click button to clear all logged messages
- **Modern Design**: Clean, pastel-colored buttons and UI elements

## File Structure

### Core Extension Files
- `manifest.json`: Chrome extension manifest (v3) with permissions and content script configuration
- `background.js`: Service worker that handles message storage and removal in `chrome.storage.local`
- `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`: Extension icons

### Content Script Components
- `utils.js`: Shared utility functions for text extraction and log display
- `ui-components/storage-button.js`: Storage UI creation and storage button functionality
- `ui-components/message-buttons.js`: Individual message logging buttons for each ChatGPT message
- `ui-components/clear-button.js`: "Clear All Logs" button functionality
- `content.js`: Main orchestration script that coordinates all components

## How to Install & Test

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked" and select this project folder
4. Navigate to https://chat.openai.com
5. Start a conversation and use the "Add to Log" buttons next to messages
6. Click the 📋 button in the input area to view your logged messages

## Usage

- **Add Message**: Click the green "Add to Log" button next to any ChatGPT message
- **Remove Message**: Click the red "Remove from Log" button to remove a message
- **View Log**: Click the 📋 clipboard button in the ChatGPT input area
- **Clear All**: Click the "Clear All Logs" button at the bottom of the chat
