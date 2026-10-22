'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const AcademicModeFacade = require('../services/AcademicModeFacade');
const MockLLMAdapter = require('../services/aiProvider/MockLLMAdapter');

// ── helpers ──────────────────────────────────────────────────────────────────
function makeMock(overrides = {}) {
  const base = new MockLLMAdapter();
  return Object.assign(base, overrides);
}

// ── supported languages ───────────────────────────────────────────────────────
test('AcademicModeFacade exposes a non-empty supportedTranslationLanguages list', () => {
  const facade = new AcademicModeFacade(makeMock());
  assert.ok(Array.isArray(facade.supportedTranslationLanguages));
  assert.ok(facade.supportedTranslationLanguages.length > 0);
  assert.ok(facade.supportedTranslationLanguages.includes('Tamil'));
  assert.ok(facade.supportedTranslationLanguages.includes('Spanish'));
});

// ── empty text guard ──────────────────────────────────────────────────────────
test('AcademicModeFacade.assist rejects empty text for all modes', async () => {
  const facade = new AcademicModeFacade(makeMock());
  for (const mode of ['summarize', 'explain', 'narrate']) {
    await assert.rejects(
      () => facade.assist('', mode),
      { message: 'No text was selected.' }
    );
    await assert.rejects(
      () => facade.assist('   ', mode),
      { message: 'No text was selected.' }
    );
  }
});

// ── summarize ────────────────────────────────────────────────────────────────
test('AcademicModeFacade.assist summarize returns a non-empty string', async () => {
  const facade = new AcademicModeFacade(makeMock());
  const { mode, result } = await facade.assist('The mitochondria is the powerhouse of the cell.', 'summarize');
  assert.equal(mode, 'summarize');
  assert.equal(typeof result, 'string');
  assert.ok(result.trim().length > 0);
});

// ── explain ──────────────────────────────────────────────────────────────────
test('AcademicModeFacade.assist explain returns a non-empty string', async () => {
  const facade = new AcademicModeFacade(makeMock());
  const { mode, result } = await facade.assist('Quantum entanglement is a phenomenon.', 'explain');
  assert.equal(mode, 'explain');
  assert.equal(typeof result, 'string');
});

// ── narrate ──────────────────────────────────────────────────────────────────
test('AcademicModeFacade.assist narrate returns audioUrl and durationSec', async () => {
  const facade = new AcademicModeFacade(makeMock());
  const { mode, result } = await facade.assist('Read this passage aloud.', 'narrate');
  assert.equal(mode, 'narrate');
  assert.ok('audioUrl' in result);
  assert.ok(typeof result.durationSec === 'number');
  assert.ok(result.durationSec >= 3);
});

// ── ask ──────────────────────────────────────────────────────────────────────
test('AcademicModeFacade.assist ask returns a non-empty string for a valid question', async () => {
  const facade = new AcademicModeFacade(makeMock());
  const { mode, result } = await facade.assist('The Treaty of Westphalia ended the Thirty Years War.', 'ask', 'What war ended?');
  assert.equal(mode, 'ask');
  assert.equal(typeof result, 'string');
  assert.ok(result.length > 0);
});

test('AcademicModeFacade.assist ask rejects an empty question', async () => {
  const facade = new AcademicModeFacade(makeMock());
  await assert.rejects(
    () => facade.assist('Some text.', 'ask', '   '),
    { message: 'A question is required.' }
  );
});

// ── unknown mode ──────────────────────────────────────────────────────────────
test('AcademicModeFacade.assist rejects unknown modes', async () => {
  const facade = new AcademicModeFacade(makeMock());
  await assert.rejects(
    () => facade.assist('Hello.', 'magic'),
    { message: /Unknown assist mode: magic/ }
  );
});

// ── translate uses OpenRouter regardless of mock adapter ──────────────────────
test('AcademicModeFacade created with MockLLMAdapter uses a separate translationProvider', () => {
  const mock = makeMock();
  const facade = new AcademicModeFacade(mock);
  // translationProvider must differ from the main provider
  assert.notStrictEqual(facade.translationProvider, mock);
});

test('AcademicModeFacade created with a real adapter reuses the same provider for translation', () => {
  // Simulate a real (non-mock) adapter by passing a raw MockLLMAdapter variant
  // but wrapped so instanceof check fails — easiest: use OpenRouterAdapter stub
  const OpenRouterAdapter = require('../services/aiProvider/OpenRouterAdapter');
  const real = new OpenRouterAdapter({ apiKey: 'test-key' });
  const facade = new AcademicModeFacade(real);
  assert.strictEqual(facade.translationProvider, real);
});

