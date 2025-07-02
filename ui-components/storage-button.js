// Storage Button Coordinator
// Main entry point that coordinates all storage UI modules

// Initialize the storage system
function initializeStorageSystem() {
  // Inject styles first
  if (window.injectStorageStyles) {
    window.injectStorageStyles();
  }

  // Create the storage UI
  if (window.createStorageUI) {
    window.createStorageUI();
  }

  // Initialize tabs
  if (window.initializeTabs) {
    window.initializeTabs();
  }

  // Add storage button to ChatGPT interface
  if (window.addStorageButton) {
    window.addStorageButton();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeStorageSystem);
} else {
  initializeStorageSystem();
}

// Export for use in content script
window.initializeStorageSystem = initializeStorageSystem;
