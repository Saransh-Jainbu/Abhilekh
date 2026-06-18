const sarvamClient = require('../config/sarvam');

// Supported languages for translation
const SUPPORTED_LANGUAGES = {
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  ml: 'Malayalam',
  bn: 'Bengali',
  pa: 'Punjabi',
  mr: 'Marathi',
};

async function extractText(imageBase64, mimeType = 'image/jpeg') {
  try {
    console.log('Calling Sarvam Vision API...');

    const response = await sarvamClient.post('/document-extraction/text', {
      image: imageBase64,
      mimeType,
      encoding: 'base64',
    });

    return response.data?.output?.text || '';
  } catch (error) {
    console.error('Sarvam Vision API error:', error.response?.data || error.message);
    throw new Error('Failed to extract text: ' + (error.response?.data?.error || error.message));
  }
}

async function generateInsights(text) {
  try {
    console.log('Calling Sarvam 105B for insights...');

    const prompt = `Analyze this government document and provide key insights in 2-3 sentences:

Document Text:
${text.substring(0, 1000)}...

Key Insights:`;

    const response = await sarvamClient.post('/chat/completions', {
      model: 'Sarvam-1-105B-instruct',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    return response.data?.choices?.[0]?.message?.content || 'No insights generated';
  } catch (error) {
    console.error('Sarvam 105B API error:', error.response?.data || error.message);
    throw new Error('Failed to generate insights: ' + (error.response?.data?.error || error.message));
  }
}

async function translateText(text, targetLanguage) {
  try {
    if (!SUPPORTED_LANGUAGES[targetLanguage]) {
      throw new Error(`Unsupported language: ${targetLanguage}`);
    }

    console.log(`Translating to ${SUPPORTED_LANGUAGES[targetLanguage]}...`);

    const languageName = SUPPORTED_LANGUAGES[targetLanguage];
    const prompt = `Translate the following government document text to ${languageName}. Maintain the original meaning and formatting:

${text}`;

    const response = await sarvamClient.post('/chat/completions', {
      model: 'Sarvam-1-105B-instruct',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: Math.min(4000, text.length * 2),
      temperature: 0.1,
    });

    return response.data?.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('Translation API error:', error.response?.data || error.message);
    throw new Error('Failed to translate: ' + (error.response?.data?.error || error.message));
  }
}

async function chatWithDocument(documentText, chatHistory, userMessage) {
  try {
    console.log('Chat with document via Sarvam 105B...');

    const messages = [
      {
        role: 'system',
        content: `You are a helpful assistant analyzing a government document. Use the document context to answer questions accurately and concisely.

Document Context:
${documentText.substring(0, 2000)}...`,
      },
      ...chatHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: userMessage,
      },
    ];

    const response = await sarvamClient.post('/chat/completions', {
      model: 'Sarvam-1-105B-instruct',
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.data?.choices?.[0]?.message?.content || 'No response generated';
  } catch (error) {
    console.error('Chat API error:', error.response?.data || error.message);
    throw new Error('Chat failed: ' + (error.response?.data?.error || error.message));
  }
}

module.exports = {
  extractText,
  generateInsights,
  translateText,
  chatWithDocument,
  SUPPORTED_LANGUAGES,
};
