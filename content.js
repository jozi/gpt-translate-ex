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

  const contentDiv = document.createElement('div');
  contentDiv.className = 'translation-content';
  contentDiv.innerHTML = content;

  const copyButton = document.createElement('button');
  copyButton.className = 'copy-button';
  copyButton.innerHTML = '📋';
  copyButton.title = 'کپی متن';
  copyButton.addEventListener('click', (e) => {
    if (!e || !copyButton) return;
    e.stopPropagation();
    navigator.clipboard.writeText(content.replace(/<[^>]+>/g, ''))
      .then(() => {
        if (copyButton) {
          copyButton.innerHTML = '✓';
          setTimeout(() => {
            if (copyButton) {
              copyButton.innerHTML = '📋';
            }
          }, 2000);
        }
      })
      .catch(err => console.error('Error copying text:', err));
  });

  popupElement.appendChild(contentDiv);
  popupElement.appendChild(copyButton);
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

document.addEventListener('mouseup', async (e) => {
  // اگر کلیک روی پاپ‌آپ بود، هیچ کاری نکن
  if (popupElement && popupElement.contains(e.target)) {
    return;
  }

  if (isTranslating) return;
  
  clearTimeout(translationTimer);
  
  translationTimer = setTimeout(async () => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (!selectedText) return;

    const MAX_CHARS = 1000;
    if (selectedText.length > MAX_CHARS) {
      showErrorPopup(`متن انتخابی خیلی طولانی است (${selectedText.length} کاراکتر). لطفاً متن کوتاه‌تری انتخاب کنید.`);
      return;
    }
    
    const currentRequest = Date.now();
    lastTranslationRequest = currentRequest;
    
    try {
      const { openaiApiKey } = await chrome.storage.sync.get('openaiApiKey');
      if (!openaiApiKey) {
        showErrorPopup('لطفاً کلید API را وارد کنید');
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