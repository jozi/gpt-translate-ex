document.addEventListener('DOMContentLoaded', async () => {
  const apiStatus = document.getElementById('api-status');
  const apiIcon = apiStatus.querySelector('.api-icon');
  const changeKeyBtn = document.getElementById('changeApiKey');
  const apiInput = document.getElementById('api-input');
  const apiKeyInput = document.getElementById('apiKey');
  const saveButton = document.getElementById('saveButton');
  const messageDiv = document.getElementById('message');
  
  // Load saved API key
  const { openaiApiKey } = await chrome.storage.sync.get('openaiApiKey');
  if (openaiApiKey) {
    apiIcon.classList.add('has-key');
    changeKeyBtn.style.display = 'block';
  } else {
    apiInput.style.display = 'block';
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
    apiKeyInput.value = '';
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
      await chrome.storage.sync.set({ openaiApiKey: newApiKey });
      showMessage('کلید API ذخیره شد', 'success');
      apiIcon.classList.add('has-key');
      
      setTimeout(() => {
        apiInput.style.display = 'none';
        changeKeyBtn.style.display = 'block';
      }, 1500);
    } catch (error) {
      showMessage('خطا در ذخیره‌سازی کلید API', 'error');
    }
  });

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    setTimeout(() => {
      messageDiv.className = 'message';
      messageDiv.textContent = '';
    }, 3000);
  }

  // Other settings
  const ageSlider = document.getElementById('age-slider');
  const ageDisplay = document.getElementById('age-display');
  const expertiseSlider = document.getElementById('expertise-slider');
  const expertiseDisplay = document.getElementById('expertise-display');
  const writingStyleSelect = document.getElementById('writing-style');
  const creativitySlider = document.getElementById('creativity-slider');
  const creativityDisplay = document.getElementById('creativity-display');

  // Set initial values
  const result = await chrome.storage.sync.get([
    'targetAge',
    'expertiseLevel',
    'writingStyle',
    'creativityLevel'
  ]);
  ageSlider.value = result.targetAge || 20;
  ageDisplay.textContent = result.targetAge || 20;
  expertiseSlider.value = result.expertiseLevel || 3;
  expertiseDisplay.textContent = ['بسیار ساده', 'ساده', 'متوسط', 'تخصصی', 'بسیار تخصصی'][result.expertiseLevel - 1] || 'متوسط';
  writingStyleSelect.value = result.writingStyle || 'formal';
  creativitySlider.value = result.creativityLevel || 3;
  creativityDisplay.textContent = ['تحت‌اللفظی', 'کمی خلاقانه', 'متوسط', 'خلاقانه', 'بسیار خلاقانه'][result.creativityLevel - 1] || 'متوسط';

  // Save settings automatically when changed
  const saveSettings = async () => {
    const settings = {
      targetAge: parseInt(ageSlider.value),
      expertiseLevel: parseInt(expertiseSlider.value),
      writingStyle: writingStyleSelect.value,
      creativityLevel: parseInt(creativitySlider.value)
    };

    try {
      await chrome.storage.sync.set(settings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  // Add change event listeners
  ageSlider.addEventListener('input', () => {
    ageDisplay.textContent = ageSlider.value;
    saveSettings();
  });
  expertiseSlider.addEventListener('input', () => {
    expertiseDisplay.textContent = ['بسیار ساده', 'ساده', 'متوسط', 'تخصصی', 'بسیار تخصصی'][expertiseSlider.value - 1];
    saveSettings();
  });
  writingStyleSelect.addEventListener('change', saveSettings);
  creativitySlider.addEventListener('input', () => {
    creativityDisplay.textContent = ['تحت‌اللفظی', 'کمی خلاقانه', 'متوسط', 'خلاقانه', 'بسیار خلاقانه'][creativitySlider.value - 1];
    saveSettings();
  });
});