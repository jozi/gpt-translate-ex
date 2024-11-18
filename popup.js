document.addEventListener('DOMContentLoaded', async () => {
  // Get DOM elements
  const apiStatus = document.getElementById('api-status');
  const apiInput = document.getElementById('api-input');
  const apiKeyInput = document.getElementById('apiKey');
  const saveButton = document.getElementById('saveButton');
  const messageDiv = document.getElementById('message');
  const ageSlider = document.getElementById('age-slider');
  const ageDisplay = document.getElementById('age-display');
  const expertiseSlider = document.getElementById('expertise-slider');
  const expertiseDisplay = document.getElementById('expertise-display');
  const writingStyleSelect = document.getElementById('writing-style');
  const creativitySlider = document.getElementById('creativity-slider');
  const creativityDisplay = document.getElementById('creativity-display');
  const changeKeyBtn = document.getElementById('changeApiKey');

  // Check if all required elements exist
  if (!apiStatus || !apiInput || !apiKeyInput || !saveButton || !messageDiv || !ageSlider || !ageDisplay || !expertiseSlider || !expertiseDisplay || !writingStyleSelect || !creativitySlider || !creativityDisplay || !changeKeyBtn) {
    console.error('Required elements not found');
    return;
  }

  const apiIcon = apiStatus.querySelector('.api-icon');

  if (!apiIcon) {
    console.error('API icon not found');
    return;
  }

  // Test API key function
  async function testApiKey(apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a translator. Translate the following text from English to Persian.' },
            { role: 'user', content: 'Hello World' }
          ]
        })
      });

      if (response.status !== 200) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  try {
    // Load saved API key
    const result = await chrome.storage.sync.get('openaiApiKey');
    const openaiApiKey = result.openaiApiKey;
    
    if (openaiApiKey && openaiApiKey.startsWith('sk-') && openaiApiKey.length >= 20) {
      // Test existing API key
      const isValid = await testApiKey(openaiApiKey);
      if (isValid) {
        apiIcon.classList.add('has-key');
        changeKeyBtn.style.display = 'block';
        apiInput.style.display = 'none';
      } else {
        apiInput.style.display = 'block';
        changeKeyBtn.style.display = 'none';
        apiIcon.classList.remove('has-key');
        showMessage('کلید API معتبر نیست', 'error');
      }
    } else {
      apiInput.style.display = 'block';
      changeKeyBtn.style.display = 'none';
      apiIcon.classList.remove('has-key');
    }

    // Toggle API input when clicking the icon
    apiIcon.addEventListener('click', () => {
      if (openaiApiKey) {
        changeKeyBtn.style.display = changeKeyBtn.style.display === 'none' ? 'block' : 'none';
      }
    });

    // Show API input when clicking change button
    changeKeyBtn.addEventListener('click', () => {
      apiInput.style.display = 'block';
      changeKeyBtn.style.display = 'none';
      if (apiKeyInput) {
        apiKeyInput.value = '';
      }
    });

    // Save API key
    saveButton.addEventListener('click', async () => {
      const newApiKey = apiKeyInput.value.trim();
      
      if (!newApiKey) {
        showMessage('لطفاً کلید API را وارد کنید', 'error');
        return;
      }

      if (!newApiKey.startsWith('sk-') || newApiKey.length < 20) {
        showMessage('فرمت کلید API صحیح نیست', 'error');
        return;
      }

      try {
        // First test the new API key
        showMessage('در حال تست کلید API...', 'info');
        const isValid = await testApiKey(newApiKey);
        
        if (!isValid) {
          showMessage('کلید API معتبر نیست', 'error');
          return;
        }
        
        // If test passed, save the key
        await chrome.storage.sync.set({ openaiApiKey: newApiKey });
        
        showMessage('کلید API ذخیره شد', 'success');
        apiIcon.classList.add('has-key');
        
        setTimeout(() => {
          apiInput.style.display = 'none';
          changeKeyBtn.style.display = 'block';
        }, 1500);
      } catch (error) {
        showMessage('خطا در ذخیره‌سازی کلید API', 'error');
        apiIcon.classList.remove('has-key');
      }
    });

    // Load and set initial settings
    const settingsResult = await chrome.storage.sync.get([
      'targetAge',
      'expertiseLevel',
      'writingStyle',
      'creativityLevel'
    ]);

    // Set initial values with defaults
    ageSlider.value = settingsResult.targetAge || 25;
    ageDisplay.textContent = ageSlider.value;
    
    expertiseSlider.value = settingsResult.expertiseLevel || 3;
    expertiseDisplay.textContent = expertiseSlider.value;
    
    writingStyleSelect.value = settingsResult.writingStyle || 'formal';
    
    creativitySlider.value = settingsResult.creativityLevel || 3;
    creativityDisplay.textContent = creativitySlider.value;

    // Add change event listeners
    ageSlider.addEventListener('input', () => {
      ageDisplay.textContent = ageSlider.value;
      saveSettings();
    });

    expertiseSlider.addEventListener('input', () => {
      expertiseDisplay.textContent = expertiseSlider.value;
      saveSettings();
    });

    creativitySlider.addEventListener('input', () => {
      creativityDisplay.textContent = creativitySlider.value;
      saveSettings();
    });

    writingStyleSelect.addEventListener('change', saveSettings);

  } catch (error) {
    console.error('Error initializing popup:', error);
  }

  async function saveSettings() {
    try {
      await chrome.storage.sync.set({
        targetAge: parseInt(ageSlider.value),
        expertiseLevel: parseInt(expertiseSlider.value),
        writingStyle: writingStyleSelect.value,
        creativityLevel: parseInt(creativitySlider.value)
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    setTimeout(() => {
      messageDiv.className = 'message';
      messageDiv.textContent = '';
    }, 3000);
  }
});