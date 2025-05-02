// Open options page when extension is installed or updated
chrome.runtime.onInstalled.addListener(details => {
    if (details.reason === 'install') {
      // Open options page after install
      chrome.runtime.openOptionsPage();
    }
  });
  
  // Handle messages from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openOptions') {
      chrome.runtime.openOptionsPage();
    }
    
    // Required for async message handling
    return true;
  });
  
  // Open options page when extension icon is clicked
  chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
  });