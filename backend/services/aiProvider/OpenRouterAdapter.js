const AIProvider = require('./AIProvider');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

class OpenRouterAdapter extends AIProvider {
  constructor({
    apiKey = process.env.OPENROUTER_API_KEY || process.env.LLM_API_KEY,
    model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
  } = {}) {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }

  async summarize(text) {
    return this.#complete([
      academicSystemPrompt(),
      {
        role: 'user',
        content: `Summarize this passage for a student in 4-6 concise bullet points:\n\n${text}`,
      },
    ]);
  }

  async explain(text) {
    return this.#complete([
      academicSystemPrompt(),
      {
        role: 'user',
        content: `Explain this passage in simple language. Keep the meaning accurate and define important terms:\n\n${text}`,
      },
    ]);
  }

  async ask(text, question) {
    return this.#complete([
      academicSystemPrompt(),
      {
        role: 'user',
        content: `Use the selected passage as context, then answer the student's question.\n\nPassage:\n${text}\n\nQuestion:\n${question}`,
      },
    ]);
  }

  async narrate(text) {
    const wordsPerMinute = 155;
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const durationSec = Math.max(3, Math.round((wordCount / wordsPerMinute) * 60));
    const transcript = await this.#complete([
      academicSystemPrompt(),
      {
        role: 'user',
        content: `Prepare this passage as a clear read-aloud narration. Keep all factual content intact and improve only pacing and readability:\n\n${text}`,
      },
    ]);

    return { audioUrl: null, durationSec, transcript };
  }

  async translate(text, targetLanguage) {
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

    const chunks = splitTranslationText(text, 1200);
    const translations = [];

    for (const chunk of chunks) {
      const tamilInstruction = targetLanguage === 'Tamil'
        ? ' Write the translation in Tamil script (தமிழ்), not in Latin transliteration.'
        : '';
      translations.push(await this.#complete([
        {
          role: 'system',
          content:
            `You are a professional translator. Translate the user's text into ${targetLanguage}. ` +
            `Return only the translation in ${targetLanguage}; do not summarize, explain, transliterate into English, ` +
            `or include labels. Use the normal writing system for the target language and preserve meaning and paragraph structure.${tamilInstruction}`,
        },
        {
          role: 'user',
          content: `Translate the following text into ${targetLanguage}. Return only the translation:\n\n${chunk}`,
        },
      ], 1600));
    }

    const result = translations.join('\n\n').trim();
    if (!result) {
      const err = new Error('The AI provider returned an empty translation.');
      err.status = 502;
      throw err;
    }
    if (result === text.trim()) {
      const err = new Error('The AI provider returned the source text unchanged instead of a translation.');
      err.status = 502;
      throw err;
    }
    if (targetLanguage === 'Tamil' && !/[\u0B80-\u0BFF]/u.test(result)) {
      const err = new Error('The AI provider did not return a Tamil-script translation. Please try again.');
      err.status = 502;
      throw err;
    }
    return result;
  }

  async #complete(messages, maxTokens = 700) {
    if (!this.apiKey) {
      const err = new Error('OpenRouter API key is not configured.');
      err.status = 500;
      throw err;
    }

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'Katha Academic Mode',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.35,
        max_tokens: maxTokens,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error(data.error?.message || 'The AI provider rejected the request.');
      err.status = response.status;
      throw err;
    }

    const choice = data.choices?.[0];
    if (choice?.finish_reason === 'length') {
      const err = new Error('The AI provider response was truncated. Try translating a shorter passage.');
      err.status = 502;
      throw err;
    }
    const content = choice?.message?.content?.trim();
    if (!content) {
      const err = new Error('The AI provider returned an empty response.');
      err.status = 502;
      throw err;
    }

    return content;
  }
}

function splitTranslationText(text, maxLength) {
  const paragraphs = text.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const chunks = [];
  let current = '';

  for (const paragraph of paragraphs) {
    const pieces = splitLongParagraph(paragraph, maxLength);
    for (const piece of pieces) {
      if (current && current.length + piece.length + 2 > maxLength) {
        chunks.push(current);
        current = '';
      }
      current = current ? `${current}\n\n${piece}` : piece;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function splitLongParagraph(paragraph, maxLength) {
  if (paragraph.length <= maxLength) return [paragraph];
  const pieces = [];
  let remaining = paragraph;
  while (remaining.length > maxLength) {
    let splitAt = remaining.lastIndexOf(' ', maxLength);
    if (splitAt < Math.floor(maxLength * 0.6)) splitAt = maxLength;
    pieces.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }
  if (remaining) pieces.push(remaining);
  return pieces;
}

function academicSystemPrompt() {
  return {
    role: 'system',
    content:
      'You are Katha Academic AI. Help students understand selected reading passages. Be accurate, concise, study-focused, and do not invent details beyond the passage.',
  };
}

module.exports = OpenRouterAdapter;
