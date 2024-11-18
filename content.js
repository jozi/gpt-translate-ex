let popupElement = null;
let lastTranslationRequest = null;
let translationTimer = null;

function showLoadingPopup() {
  removePopup();
  
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  popupElement = document.createElement('div');
  popupElement.className = 'gpt-translator-popup';
  popupElement.textContent = 'در حال ترجمه...';
  popupElement.style.position = 'absolute';
  popupElement.style.left = `${rect.left + window.scrollX}px`;
  popupElement.style.top = `${rect.bottom + window.scrollY}px`;

  document.body.appendChild(popupElement);
}

function showErrorPopup(message) {
  removePopup();
  
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  popupElement = document.createElement('div');
  popupElement.className = 'gpt-translator-popup error';
  popupElement.innerHTML = `
    <div class="error-message">${message}</div>
    <button class="settings-button" onclick="window.open(chrome.runtime.getURL('popup.html'))">
      تنظیمات افزونه
    </button>
  `;
  popupElement.style.position = 'absolute';
  popupElement.style.left = `${rect.left + window.scrollX}px`;
  popupElement.style.top = `${rect.bottom + window.scrollY}px`;

  document.body.appendChild(popupElement);
}

function removePopup() {
  if (popupElement) {
    popupElement.remove();
    popupElement = null;
  }
}

function showPopup(content) {
  removePopup();
  
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  popupElement = document.createElement('div');
  popupElement.className = 'gpt-translator-popup';
  popupElement.style.position = 'absolute';
  popupElement.style.left = `${rect.left + window.scrollX}px`;
  popupElement.style.top = `${rect.bottom + window.scrollY}px`;

  popupElement.innerHTML = content;
  document.body.appendChild(popupElement);
}

function splitIntoParagraphs(text) {
  return text.split(/\n+/).filter(para => para.trim() !== '');
}

function processText(paragraphs) {
  const englishWordPattern = /[a-zA-Z]+/g;
  return paragraphs.map(para => 
    `<p>${para.replace(englishWordPattern, match => `<span class="en">${match}</span>`)}</p>`
  ).join('');
}

let isTranslating = false;

document.addEventListener('mouseup', async () => {
  if (isTranslating) return;
  
  clearTimeout(translationTimer);
  
  translationTimer = setTimeout(async () => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (!selectedText) return;
    
    const currentRequest = Date.now();
    lastTranslationRequest = currentRequest;
    
    try {
      // Check if API key exists
      const { openaiApiKey } = await chrome.storage.sync.get('openaiApiKey');
      if (!openaiApiKey) {
        showErrorPopup('لطفاً ابتدا API key خود را در تنظیمات افزونه وارد کنید');
        return;
      }
      
      isTranslating = true;
      showLoadingPopup();
      
      const paragraphs = splitIntoParagraphs(selectedText);
      
      const { targetAge = 20, expertiseLevel = 3, writingStyle = 'formal', creativityLevel = 3 } = 
        await chrome.storage.sync.get(['targetAge', 'expertiseLevel', 'writingStyle', 'creativityLevel']);
      
      const response = await chrome.runtime.sendMessage({
        action: 'translate',
        paragraphs,
        targetAge,
        expertiseLevel,
        writingStyle,
        creativityLevel
      });
      
      if (lastTranslationRequest !== currentRequest) return;
      
      if (response.error) {
        showErrorPopup(response.error);
      } else {
        showPopup(processText(response.translation));
      }
    } catch (error) {
      if (error.message.includes('Extension context invalidated')) {
        // افزونه ری‌لود شده است - نیازی به نمایش خطا نیست
        return;
      }
      showErrorPopup(error.message);
    } finally {
      isTranslating = false;
    }
  }, 500);
});

document.addEventListener('mousedown', (event) => {
  if (popupElement && !popupElement.contains(event.target)) {
    removePopup();
  }
});