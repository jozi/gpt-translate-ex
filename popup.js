document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  const result = await chrome.storage.sync.get([
    'openaiApiKey',
    'targetAge',
    'expertiseLevel',
    'writingStyle',
    'creativityLevel'
  ]);

  // API Key handling
  const apiKeyInput = document.getElementById('api-key');
  const saveKeyButton = document.getElementById('save-api-key');
  const keyStatus = document.getElementById('api-error');

  if (result.openaiApiKey) {
    // Show only first 8 characters of API key
    const key = result.openaiApiKey;
    apiKeyInput.value = key.slice(0, 8) + '•'.repeat(key.length - 8);
    apiKeyInput.setAttribute('data-masked', 'true');
  }

  // Prevent copying API key
  apiKeyInput.addEventListener('copy', (e) => {
    e.preventDefault();
  });

  // Clear input when focused if it's masked
  apiKeyInput.addEventListener('focus', () => {
    if (apiKeyInput.getAttribute('data-masked') === 'true') {
      apiKeyInput.value = '';
      apiKeyInput.setAttribute('data-masked', 'false');
    }
  });

  // Save API key
  saveKeyButton.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      keyStatus.textContent = 'لطفاً API key را وارد کنید';
      keyStatus.className = 'error';
      document.getElementById('api-success').style.display = 'none';
      keyStatus.style.display = 'block';
      return;
    }

    if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
      keyStatus.textContent = 'فرمت API key صحیح نیست';
      keyStatus.className = 'error';
      document.getElementById('api-success').style.display = 'none';
      keyStatus.style.display = 'block';
      return;
    }

    try {
      await chrome.storage.sync.set({ openaiApiKey: apiKey });
      document.getElementById('api-success').textContent = 'API key با موفقیت ذخیره شد';
      document.getElementById('api-success').className = 'success';
      document.getElementById('api-success').style.display = 'block';
      keyStatus.style.display = 'none';
      
      // Mask the API key
      setTimeout(() => {
        apiKeyInput.value = apiKey.slice(0, 8) + '•'.repeat(apiKey.length - 8);
        apiKeyInput.setAttribute('data-masked', 'true');
        document.getElementById('api-success').style.display = 'none';
      }, 3000);
    } catch (error) {
      keyStatus.textContent = 'خطا در ذخیره‌سازی API key';
      keyStatus.className = 'error';
      document.getElementById('api-success').style.display = 'none';
      keyStatus.style.display = 'block';
    }
  });

  // Other settings
  const ageSlider = document.getElementById('age-slider');
  const ageDisplay = document.getElementById('age-display');
  const expertiseSlider = document.getElementById('expertise-slider');
  const expertiseDisplay = document.getElementById('expertise-display');
  const writingStyleSelect = document.getElementById('writing-style');
  const creativitySlider = document.getElementById('creativity-slider');
  const creativityDisplay = document.getElementById('creativity-display');

  // Set initial values
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