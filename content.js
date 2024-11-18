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

function removePopup() {
  if (popupElement) {
    popupElement.remove();
    popupElement = null;
  }
}

function showPopup(content) {
  removePopup(); // Remove existing popup before creating a new one
  
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

document.addEventListener('mouseup', () => {
  clearTimeout(translationTimer);
  
  translationTimer = setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    if (selectedText) {
      const currentRequest = Date.now();
      lastTranslationRequest = currentRequest;
      
      showLoadingPopup();
      
      const paragraphs = splitIntoParagraphs(selectedText);
      
      chrome.storage.sync.get(['targetAge', 'expertiseLevel', 'writingStyle', 'creativityLevel'], function(result) {
        const targetAge = result.targetAge || 20;
        const expertiseLevel = result.expertiseLevel || 3;
        const writingStyle = result.writingStyle || 'formal';
        const creativityLevel = result.creativityLevel || 3;
        
        chrome.runtime.sendMessage({ 
          action: "translate", 
          paragraphs: paragraphs,
          targetAge: targetAge,
          expertiseLevel: expertiseLevel,
          writingStyle: writingStyle,
          creativityLevel: creativityLevel
        }, response => {
          if (currentRequest === lastTranslationRequest) {
            if (response.translation) {
              showPopup(processText(response.translation));
            } else if (response.error) {
              showPopup(`خطا: ${response.error}`);
            }
          }
        });
      });
    } else {
      removePopup();
    }
  }, 300);
});

document.addEventListener('mousedown', (event) => {
  if (popupElement && !popupElement.contains(event.target)) {
    removePopup();
  }
});