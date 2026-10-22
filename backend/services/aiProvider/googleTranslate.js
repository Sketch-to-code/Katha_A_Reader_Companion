/**
 * High-quality Google Neural Machine Translation provider.
 * Uses dedicated neural language models for natural, grammatically
 * accurate translations across Tamil, Hindi, Spanish, French, and Arabic.
 */

const LANGUAGE_CODES = {
  tamil: 'ta',
  hindi: 'hi',
  spanish: 'es',
  french: 'fr',
  arabic: 'ar',
  german: 'de',
  italian: 'it',
  japanese: 'ja',
  chinese: 'zh-CN',
  russian: 'ru',
  portuguese: 'pt',
};

async function translateWithGoogle(text, targetLanguage) {
  if (typeof text !== 'string' || !text.trim()) {
    const err = new Error('Enter text to translate.');
    err.status = 400;
    throw err;
  }
  if (typeof targetLanguage !== 'string' || !targetLanguage.trim()) {
    const err = new Error('Choose a target language.');
    err.status = 400;
    throw err;
  }

  const langKey = targetLanguage.trim().toLowerCase();
  const targetCode = LANGUAGE_CODES[langKey] || targetLanguage;

  // Split into paragraphs to preserve reading flow
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());
  const translatedParagraphs = [];

  for (const para of paragraphs) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetCode)}&dt=t&q=${encodeURIComponent(para)}`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = new Error(`Google Translate request failed with status ${res.status}`);
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    if (!Array.isArray(data) || !Array.isArray(data[0])) {
      const err = new Error('Invalid response received from Google Translate service.');
      err.status = 502;
      throw err;
    }
    const translatedText = data[0].map((item) => (item ? item[0] : '')).join('');
    translatedParagraphs.push(translatedText);
  }

  const result = translatedParagraphs.join('\n\n').trim();
  if (!result) {
    const err = new Error('Google Translate returned an empty translation.');
    err.status = 502;
    throw err;
  }
  return result;
}

module.exports = { translateWithGoogle, LANGUAGE_CODES };

