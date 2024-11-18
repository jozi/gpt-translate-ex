document.addEventListener('DOMContentLoaded', function() {
    const ageSlider = document.getElementById('age-slider');
    const ageDisplay = document.getElementById('age-display');
    const expertiseSlider = document.getElementById('expertise-slider');
    const expertiseDisplay = document.getElementById('expertise-display');
    const writingStyleSelect = document.getElementById('writing-style');
    const creativitySlider = document.getElementById('creativity-slider');
    const creativityDisplay = document.getElementById('creativity-display');
  
    const expertiseLevels = ['بسیار ساده', 'ساده', 'متوسط', 'تخصصی', 'بسیار تخصصی'];
    const creativityLevels = ['تحت‌اللفظی', 'کمی خلاقانه', 'متوسط', 'خلاقانه', 'بسیار خلاقانه'];
  
    // Load saved settings or use defaults
    chrome.storage.sync.get(['targetAge', 'expertiseLevel', 'writingStyle', 'creativityLevel'], function(result) {
      const savedAge = result.targetAge || 20;
      const savedExpertise = result.expertiseLevel || 3;
      const savedWritingStyle = result.writingStyle || 'formal';
      const savedCreativity = result.creativityLevel || 3;
      
      ageSlider.value = savedAge;
      ageDisplay.textContent = savedAge;
      
      expertiseSlider.value = savedExpertise;
      expertiseDisplay.textContent = expertiseLevels[savedExpertise - 1];
  
      writingStyleSelect.value = savedWritingStyle;
  
      creativitySlider.value = savedCreativity;
      creativityDisplay.textContent = creativityLevels[savedCreativity - 1];
    });
  
    ageSlider.addEventListener('input', function() {
      const age = this.value;
      ageDisplay.textContent = age;
      chrome.storage.sync.set({targetAge: age});
    });
  
    expertiseSlider.addEventListener('input', function() {
      const level = this.value;
      expertiseDisplay.textContent = expertiseLevels[level - 1];
      chrome.storage.sync.set({expertiseLevel: level});
    });
  
    writingStyleSelect.addEventListener('change', function() {
      const style = this.value;
      chrome.storage.sync.set({writingStyle: style});
    });
  
    creativitySlider.addEventListener('input', function() {
      const level = this.value;
      creativityDisplay.textContent = creativityLevels[level - 1];
      chrome.storage.sync.set({creativityLevel: level});
    });
  });