// Helper function to get language name from code
function getLanguageName(code) {
    const languages = {
      'auto': 'Auto-detect',
      'en': 'English',
      'fr': 'French',
      'es': 'Spanish',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'zh': 'Chinese',
      'ko': 'Korean',
      'ar': 'Arabic'
    };
    return languages[code] || code;
  }
  
  // Check API key and update status
  function checkApiStatus() {
    const apiStatus = document.getElementById('api-status');
    
    chrome.storage.sync.get(['apiKey'], (result) => {
      if (!result.apiKey) {
        apiStatus.textContent = 'API key not set! Please configure in settings.';
        apiStatus.className = 'status error';
      } else {
        apiStatus.textContent = 'API key configured.';
        apiStatus.className = 'status success';
      }
    });
  }
  
  // Update language display
  function updateLanguageDisplay() {
    const sourceLangElement = document.getElementById('source-lang');
    const targetLangElement = document.getElementById('target-lang');
    
    chrome.storage.sync.get(['sourceLanguage', 'targetLanguage'], (result) => {
      const sourceLang = result.sourceLanguage || 'auto';
      const targetLang = result.targetLanguage || 'en';
      
      sourceLangElement.textContent = getLanguageName(sourceLang);
      targetLangElement.textContent = getLanguageName(targetLang);
    });
  }
  
  // Open options page when settings button is clicked
  document.getElementById('settings-btn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // Initialize popup
  document.addEventListener('DOMContentLoaded', () => {
    checkApiStatus();
    updateLanguageDisplay();
  });
  
  // Listen for changes to settings
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
      checkApiStatus();
      updateLanguageDisplay();
    }
  });