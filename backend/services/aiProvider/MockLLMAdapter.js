const AIProvider = require('./AIProvider');

// Stand-in for OpenAIAdapter / AnthropicAdapter. Same contract, so
// AcademicModeFacade cannot tell the difference - that's the whole point
// of programming to the AIProvider interface rather than a vendor SDK.
class MockLLMAdapter extends AIProvider {
  async summarize(text) {
    await delay();
    const trimmed = text.trim();
    const words = trimmed.split(/\s+/);
    const preview = words.slice(0, 24).join(' ');
    return `Summary: ${preview}${words.length > 24 ? '…' : ''} — in short, the passage explains its core idea in ${words.length} words; the key claim is in the opening sentence.`;
  }

  async explain(text) {
    await delay();
    const trimmed = text.trim();
    return `In plain terms: "${trimmed.slice(0, 60)}${trimmed.length > 60 ? '…' : ''}" is saying the same thing a friend would say over coffee - fewer clauses, everyday words, same meaning.`;
  }

  async ask(text, question) {
    await delay();
    const trimmed = text.trim();
    return `Based on the selected passage, "${question}" points to this idea: ${trimmed.slice(0, 120)}${trimmed.length > 120 ? '...' : ''}`;
  }

  async narrate(text) {
    await delay();
    const wordsPerMinute = 155;
    const wordCount = text.trim().split(/\s+/).length;
    const durationSec = Math.max(3, Math.round((wordCount / wordsPerMinute) * 60));
    return {
      audioUrl: `mock://narration/${encodeURIComponent(text.slice(0, 20))}.mp3`,
      durationSec,
    };
  }

  async translate() {
    const err = new Error('Translation requires the configured OpenRouter AI provider.');
    err.status = 503;
    throw err;
  }
}

function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = MockLLMAdapter;
