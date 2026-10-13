// This is the contract every AI/TTS adapter must honour. JavaScript has no
// interfaces, so we document the shape here and throw if a subclass forgets
// to implement a method - it's the closest thing to Liskov substitution
// enforcement available without TypeScript.
//
//   summarize(text: string): Promise<string>
//   explain(text: string): Promise<string>
//   ask(text: string, question: string): Promise<string>
//   narrate(text: string): Promise<{ audioUrl: string, durationSec: number }>
//   translate(text: string, targetLanguage: string): Promise<string>
//
// AcademicModeFacade depends only on this contract, never on a concrete
// vendor SDK - that's what lets katha swap OpenAI/Anthropic/a local model
// in without touching a single controller.
class AIProvider {
  async summarize(_text) {
    throw new Error('summarize() not implemented');
  }

  async explain(_text) {
    throw new Error('explain() not implemented');
  }

  async ask(_text, _question) {
    throw new Error('ask() not implemented');
  }

  async narrate(_text) {
    throw new Error('narrate() not implemented');
  }

  async translate(_text, _targetLanguage) {
    throw new Error('translate() not implemented');
  }
}

module.exports = AIProvider;
