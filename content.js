// Global settings
let settings = {
  iconPosition: 'top-right',
  apiKey: '',
  apiUrl: 'https://api.openai.com/v1/chat/completions',
  sourceLanguage: 'auto',
  targetLanguage: 'en',
  customPrompt: 'Translate the following text from {source_language} to {target_language}: {text}'
};

// Load settings from storage
function loadSettings() {
  chrome.storage.sync.get({
    apiKey: '',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    sourceLanguage: 'auto',
    targetLanguage: 'en',
    customPrompt: 'Translate the following text from {source_language} to {target_language}: {text}',
    iconPosition: 'top-right'
  }, (items) => {
    settings = items;
  });
}

// Listen for changes to settings
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    loadSettings();
  }
});

// Initialize settings
loadSettings();

// Pre-create the SVG element once
const svgTemplate = document.createElement('template');
svgTemplate.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 8l6 6"></path>
    <path d="M4 14l6-6 2-3"></path>
    <path d="M2 5h12"></path>
    <path d="M7 2h1"></path>
    <path d="M22 22l-5-10-5 10"></path>
    <path d="M14 18h6"></path>
  </svg>
`;

// Create and append the translation icon with performance improvements
function createTranslationIcon(inputElement) {
  // Skip if the input is not visible
  if (inputElement.offsetParent === null || inputElement.disabled || inputElement.readOnly) {
    return null;
  }
  
  // Check if icon already exists for this element
  const existingIcon = inputElement.nextElementSibling;
  if (existingIcon && existingIcon.classList.contains('ai-translator-icon')) {
    return existingIcon;
  }

  // Create icon element using cloneNode for better performance
  const iconElement = document.createElement('div');
  iconElement.className = 'ai-translator-icon';
  iconElement.appendChild(svgTemplate.content.cloneNode(true));
  
  // Set the icon styles based on position setting
  iconElement.style.position = 'absolute';
  iconElement.style.zIndex = '9999';
  
  // Add loading state indicator
  iconElement.dataset.loading = 'false';
  
  // Position the icon based on user settings
  updateIconPosition(iconElement, inputElement);
  
  // Use event delegation for better performance
  const handleClick = async (event) => {
    // Get text from input
    const text = inputElement.value.trim();
    
    if (!text) {
      showToast('No text to translate!');
      return;
    }
    
    if (!settings.apiKey) {
      showToast('API key not set! Please configure in extension options.');
      chrome.runtime.sendMessage({ action: 'openOptions' });
      return;
    }
    
    // Prevent multiple clicks while processing
    if (iconElement.dataset.loading === 'true') {
      return;
    }
    
    // Set loading state
    iconElement.dataset.loading = 'true';
    
    try {
      const translatedText = await translateText(text);
      
      // Only update if the input still exists and is visible
      if (inputElement.isConnected && inputElement.offsetParent !== null) {
        inputElement.value = translatedText;
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        showToast('Translation complete!');
      }
    } catch (error) {
      console.error('Translation error:', error);
      showToast('Translation failed: ' + (error.message || 'See console for details'));
    } finally {
      iconElement.dataset.loading = 'false';
    }
  };
  
  // Add click event listener to the icon
  iconElement.addEventListener('click', handleClick);
  
  // Append the icon after the input
  const parentElement = inputElement.parentElement;
  if (parentElement) {
    // Check if we need to adjust parent positioning
    const parentPosition = window.getComputedStyle(parentElement).position;
    if (parentPosition === 'static') {
      // Instead of changing the parent, use a workaround with fixed positioning
      // that doesn't force layout recalculation of the entire page
      iconElement.style.position = 'fixed';
      
      // Update position on scroll using more efficient technique
      const updatePositionOnScroll = () => {
        if (inputElement.isConnected && iconElement.isConnected) {
          requestAnimationFrame(() => updateIconPosition(iconElement, inputElement));
        } else {
          // Clean up if elements are removed
          window.removeEventListener('scroll', updatePositionOnScroll);
        }
      };
      
      // Use passive event listener for better performance
      window.addEventListener('scroll', updatePositionOnScroll, { passive: true });
    }
    
    parentElement.appendChild(iconElement);
    return iconElement;
  }
  
  return null;
}

// Update icon position based on settings
function updateIconPosition(iconElement, inputElement) {
  if (!iconElement || !inputElement) return;
  
  const inputRect = inputElement.getBoundingClientRect();
  const iconSize = 24; // icon width/height in pixels
  const margin = 5; // margin from input edge
  
  switch (settings.iconPosition) {
    case 'top-right':
      iconElement.style.top = `${-iconSize/2}px`;
      iconElement.style.right = `${margin}px`;
      break;
    case 'top-left':
      iconElement.style.top = `${-iconSize/2}px`;
      iconElement.style.left = `${margin}px`;
      break;
    case 'bottom-right':
      iconElement.style.bottom = `${-iconSize/2}px`;
      iconElement.style.right = `${margin}px`;
      break;
    case 'bottom-left':
      iconElement.style.bottom = `${-iconSize/2}px`;
      iconElement.style.left = `${margin}px`;
      break;
    default:
      // Default to top-right
      iconElement.style.top = `${-iconSize/2}px`;
      iconElement.style.right = `${margin}px`;
  }
}

// Cache for recent translations to avoid redundant API calls
const translationCache = new Map();
const MAX_CACHE_SIZE = 50;

// Translate text using AI API with caching
async function translateText(text) {
  // Get current settings
  const { apiKey, apiUrl, sourceLanguage, targetLanguage, customPrompt } = settings;
  
  // Create a cache key based on text and languages
  const cacheKey = `${text}_${sourceLanguage}_${targetLanguage}`;
  
  // Check if we have a cached translation
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }
  
  // Replace placeholders in prompt
  const sourceLangName = getLanguageName(sourceLanguage);
  const targetLangName = getLanguageName(targetLanguage);
  const formattedPrompt = customPrompt
    .replace('{source_language}', sourceLangName)
    .replace('{target_language}', targetLangName)
    .replace('{text}', text);
  
  // Optimize payload by reducing message size
  const payload = {
    model: "gpt-3.5-turbo", // Default model, can be made configurable
    messages: [
      {
        role: "system",
        content: "You are a translator. Translate the text exactly as provided without explanation."
      },
      {
        role: "user",
        content: formattedPrompt
      }
    ],
    temperature: 0.3,
    max_tokens: Math.min(1000, text.length * 2), // Adjust tokens based on input length
    presence_penalty: 0,
    frequency_penalty: 0
  };
  
  try {
    // Use AbortController to set a timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
    
    // Send request to API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`API Error (${response.status}): ${errorData ? JSON.stringify(errorData) : response.statusText}`);
    }
    
    const responseData = await response.json();
    const translatedText = responseData.choices?.[0]?.message?.content.trim() || 'Translation failed!';
    
    // Add to cache
    translationCache.set(cacheKey, translatedText);
    
    // If cache is too large, remove oldest entry
    if (translationCache.size > MAX_CACHE_SIZE) {
      const firstKey = translationCache.keys().next().value;
      translationCache.delete(firstKey);
    }
    
    return translatedText;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Translation request timed out');
    }
    throw error;
  }
}

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

// Toast notification queue to prevent multiple toasts
const toastQueue = [];
let isShowingToast = false;

// Show a temporary toast message with queue management
function showToast(message) {
  // Add to queue
  toastQueue.push(message);
  
  // If already showing a toast, just queue it
  if (isShowingToast) {
    return;
  }
  
  // Process toast queue
  processToastQueue();
}

// Process toast queue
function processToastQueue() {
  if (toastQueue.length === 0) {
    isShowingToast = false;
    return;
  }
  
  isShowingToast = true;
  const message = toastQueue.shift();
  
  // Get or create toast element
  let toast = document.getElementById('ai-translator-toast');
  
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ai-translator-toast';
    toast.className = 'ai-translator-toast';
    document.body.appendChild(toast);
  }
  
  // Set message
  toast.textContent = message;
  
  // Append to document only when needed
  if (!toast.parentNode) {
    document.body.appendChild(toast);
  }
  
  // Show toast
  requestAnimationFrame(() => {
    toast.classList.add('show');
    
    // Hide toast after delay
    setTimeout(() => {
      toast.classList.remove('show');
      
      // Wait for hide animation to complete
      setTimeout(() => {
        // Process next toast in queue
        processToastQueue();
      }, 300); // Match transition time in CSS
    }, 2000);
  });
}

// Process all text input elements in the page with performance optimizations
function processInputElements() {
  // Only select visible inputs to reduce overhead
  const inputSelectors = 'textarea:not([disabled]), input[type="text"]:not([disabled]), [contenteditable="true"]';
  const inputElements = document.querySelectorAll(inputSelectors);
  
  // Use a shared resize observer for all elements
  const resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      const inputElement = entry.target;
      const icon = inputElement.nextElementSibling;
      if (icon && icon.classList.contains('ai-translator-icon')) {
        updateIconPosition(icon, inputElement);
      }
    }
  });
  
  inputElements.forEach(inputElement => {
    // Only process inputs that are visible and don't already have an icon
    if (inputElement.offsetParent !== null && 
        (!inputElement.nextElementSibling || 
         !inputElement.nextElementSibling.classList.contains('ai-translator-icon'))) {
      // Create translation icon for this input
      createTranslationIcon(inputElement);
      
      // Watch for input size/position changes
      resizeObserver.observe(inputElement);
    }
  });
}

// Watch for dynamically added input elements with improved performance
function observeDOMChanges() {
  // Use a debounce function to prevent excessive processing
  let debounceTimer;
  
  const observer = new MutationObserver(mutations => {
    // Clear previous timer
    clearTimeout(debounceTimer);
    
    // Check if we actually need to process
    let hasNewInput = false;
    
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        // Quick check if any added node might contain inputs
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'TEXTAREA' || 
                (node.tagName === 'INPUT' && node.type === 'text') ||
                node.getAttribute('contenteditable') === 'true' ||
                node.querySelector('textarea, input[type="text"], [contenteditable="true"]')) {
              hasNewInput = true;
              break;
            }
          }
        }
        if (hasNewInput) break;
      }
    }
    
    // Only schedule processing if we found potential inputs
    if (hasNewInput) {
      // Debounce the processing to avoid multiple rapid updates
      debounceTimer = setTimeout(() => {
        processInputElements();
      }, 300);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Initialize with performance optimizations
function initialize() {
  // Delay initial processing to let page load completely
  setTimeout(() => {
    processInputElements();
    observeDOMChanges();
  }, 500);
}

// Wait for page to be fully loaded
if (document.readyState === 'complete') {
  initialize();
} else {
  window.addEventListener('load', initialize);
}