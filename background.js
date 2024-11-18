chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "translate") {
    translateParagraphs(request.paragraphs, request.targetAge, request.expertiseLevel, request.writingStyle, request.creativityLevel)
      .then(translation => sendResponse({ translation }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Indicates that the response is asynchronous
  }
});

async function translateParagraphs(paragraphs, targetAge, expertiseLevel, writingStyle, creativityLevel) {
  // Get API key from chrome.storage
  const result = await chrome.storage.sync.get('openaiApiKey');
  const apiKey = result.openaiApiKey;
  
  if (!apiKey) {
    throw new Error('لطفاً ابتدا API key خود را در تنظیمات وارد کنید');
  }

  const expertiseLevels = ['بسیار ساده', 'ساده', 'متوسط', 'تخصصی', 'بسیار تخصصی'];
  const writingStyles = {
    formal: 'رسمی',
    informal: 'غیر رسمی',
    colloquial: 'لهجه عامیانه'
  };
  const creativityLevels = ['تحت‌اللفظی', 'کمی خلاقانه', 'متوسط', 'خلاقانه', 'بسیار خلاقانه'];
  
  const translatedParagraphs = await Promise.all(paragraphs.map(async (paragraph) => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `You are a precise translator. Your task is to translate the given text from English to Persian accurately, without adding any explanations or extra information. Ensure the translation is suitable for a ${targetAge}-year-old reader, using a ${expertiseLevels[expertiseLevel - 1]} level of expertise and a ${writingStyles[writingStyle]} writing style. The creativity level should be ${creativityLevels[creativityLevel - 1]}. Strictly translate the content without providing additional context or explanations. Preserve the paragraph structure.` },
          { role: 'user', content: paragraph }
        ]
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data.choices[0].message.content;
  }));

  return translatedParagraphs;
}