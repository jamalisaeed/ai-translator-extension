// Save options to Chrome storage
function saveOptions() {
    const apiKey = document.getElementById('api-key').value;
    const apiUrl = document.getElementById('api-url').value || 'https://api.openai.com/v1/chat/completions';
    const sourceLanguage = document.getElementById('source-language').value;
    const targetLanguage = document.getElementById('target-language').value;
    const customPrompt = document.getElementById('custom-prompt').value || 'Translate the following text from {source_language} to {target_language}: {text}';
    const iconPosition = document.getElementById('icon-position').value;
  
    chrome.storage.sync.set({
      apiKey,
      apiUrl,
      sourceLanguage,
      targetLanguage,
      customPrompt,
      iconPosition
    }, () => {
      // Update status to let user know options were saved
      const status = document.getElementById('status');
      status.textContent = 'Settings saved!';
      status.className = 'success';
      setTimeout(() => {
        status.textContent = '';
        status.className = '';
      }, 2000);
    });
  }
  
  // Restore options from Chrome storage
  function restoreOptions() {
    chrome.storage.sync.get({
      // Default values
      apiKey: '',
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      sourceLanguage: 'auto',
      targetLanguage: 'en',
      customPrompt: 'Translate the following text from {source_language} to {target_language}: {text}',
      iconPosition: 'top-right'
    }, (items) => {
      document.getElementById('api-key').value = items.apiKey;
      document.getElementById('api-url').value = items.apiUrl;
      document.getElementById('source-language').value = items.sourceLanguage;
      document.getElementById('target-language').value = items.targetLanguage;
      document.getElementById('custom-prompt').value = items.customPrompt;
      document.getElementById('icon-position').value = items.iconPosition;
    });
  }
  
  // Initialize the form when the DOM is loaded
  document.addEventListener('DOMContentLoaded', restoreOptions);
  
  // Add event listener for the save button
  document.getElementById('save-btn').addEventListener('click', saveOptions);