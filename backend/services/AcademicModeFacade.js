const MockLLMAdapter = require('./aiProvider/MockLLMAdapter');
const OpenRouterAdapter = require('./aiProvider/OpenRouterAdapter');

// Facade pattern: AIController and, on the frontend, AIPanel only ever call
// academicMode.assist(selection, mode) instead of juggling three separate
// services and their individual error states. Swapping the mocked adapter
// for a real OpenAIAdapter/AnthropicAdapter later is a one-line change here
// and nowhere else.
class AcademicModeFacade {
  constructor(provider = createProvider()) {
    this.provider = provider;
    this.translationProvider = provider instanceof MockLLMAdapter
      ? new OpenRouterAdapter()
      : provider;
  }

  async assist(selectionText, mode, question = '', targetLanguage = '') {
    if (!selectionText || !selectionText.trim()) {
      throw new Error('No text was selected.');
    }

    switch (mode) {
      case 'summarize':
        return { mode, result: await this.provider.summarize(selectionText) };
      case 'explain':
        return { mode, result: await this.provider.explain(selectionText) };
      case 'ask':
        if (!question.trim()) {
          throw new Error('A question is required.');
        }
        return { mode, result: await this.provider.ask(selectionText, question) };
      case 'narrate':
        return { mode, result: await this.provider.narrate(selectionText) };
      case 'translate':
        return {
          mode,
          result: await this.translationProvider.translate(selectionText, targetLanguage),
        };
      default:
        throw new Error(`Unknown assist mode: ${mode}`);
    }
  }

  get supportedTranslationLanguages() {
    return ['Tamil', 'Spanish', 'French', 'Hindi', 'Arabic'];
  }
}

function createProvider() {
  return process.env.USE_MOCK_AI === 'false' ? new OpenRouterAdapter() : new MockLLMAdapter();
}

const defaultInstance = new AcademicModeFacade();

const facadeExport = new Proxy(AcademicModeFacade, {
  get(target, prop, receiver) {
    if (prop in target) {
      return Reflect.get(target, prop, receiver);
    }
    const val = Reflect.get(defaultInstance, prop);
    return typeof val === 'function' ? val.bind(defaultInstance) : val;
  },
  apply(target, thisArg, argList) {
    return Reflect.apply(target, thisArg, argList);
  },
});

module.exports = facadeExport;
