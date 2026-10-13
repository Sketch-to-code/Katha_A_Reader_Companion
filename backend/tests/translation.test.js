const test = require('node:test');
const assert = require('node:assert/strict');
const AcademicModeFacade = require('../services/AcademicModeFacade');
const MockLLMAdapter = require('../services/aiProvider/MockLLMAdapter');
const OpenRouterAdapter = require('../services/aiProvider/OpenRouterAdapter');

const tamilText = 'வணக்கம் உலகம்';

test('translation uses OpenRouter for selected text even when other AI modes use the mock adapter', async (t) => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = 'test-key';
  let requestBody;
  global.fetch = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: tamilText }, finish_reason: 'stop' }],
      }),
    };
  };
  t.after(() => {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = originalApiKey;
  });

  const facade = new AcademicModeFacade(new MockLLMAdapter());
  const result = await facade.assist('Translate this selected sentence.', 'translate', '', 'Tamil');

  assert.equal(result.result, tamilText);
  assert.match(requestBody.messages[0].content, /Tamil/);
  assert.match(requestBody.messages[0].content, /Tamil script/);
  assert.match(requestBody.messages[1].content, /Translate this selected sentence\./);
});

test('long translations preserve chunk and paragraph order', async (t) => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = 'test-key';
  const requestedChunks = [];
  global.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    requestedChunks.push(body.messages[1].content.split('\n\n').slice(1).join('\n\n'));
    return {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: tamilText }, finish_reason: 'stop' }],
      }),
    };
  };
  t.after(() => {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = originalApiKey;
  });

  const firstParagraph = `First paragraph ${'first '.repeat(130)}`;
  const secondParagraph = `Second paragraph ${'second '.repeat(130)}`;
  const adapter = new OpenRouterAdapter();
  await adapter.translate(`${firstParagraph}\n\n${secondParagraph}`, 'Tamil');

  assert.ok(requestedChunks.length > 1);
  const allText = requestedChunks.join('\n\n');
  assert.ok(allText.indexOf('First paragraph') < allText.indexOf('Second paragraph'));
  assert.ok(allText.includes(firstParagraph.trim()));
  assert.ok(allText.includes(secondParagraph.trim()));
});

test('translation rejects empty text, malformed output, and non-Tamil output', async (t) => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = 'test-key';
  t.after(() => {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = originalApiKey;
  });

  const adapter = new OpenRouterAdapter();
  await assert.rejects(adapter.translate('  ', 'Tamil'), { status: 400 });

  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content: 'Hello world' }, finish_reason: 'stop' }] }),
  });
  await assert.rejects(adapter.translate('Hello world', 'Tamil'), {
    status: 502,
    message: /Tamil-script translation/,
  });

  await assert.rejects(adapter.translate('Hello world', 'Spanish'), {
    status: 502,
    message: /source text unchanged/,
  });

  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ choices: [] }),
  });
  await assert.rejects(adapter.translate('Hello world', 'Spanish'), {
    status: 502,
    message: /empty response/,
  });
});
