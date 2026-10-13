const test = require('node:test');
const assert = require('node:assert/strict');
const { retrieveRelevantChunks } = require('../services/documentRagService');

test('retrieves chunks that match the question terms', () => {
  const irrelevant = 'The garden was quiet and the path was made of stone. '.repeat(45);
  const relevant = 'Photosynthesis allows green plants to turn sunlight into chemical energy.';
  const results = retrieveRelevantChunks(`${irrelevant}${relevant}`, 'How does photosynthesis use sunlight?');

  assert.ok(results.length > 0);
  assert.ok(results.some((chunk) => chunk.includes('Photosynthesis')));
  assert.ok(results.length <= 4);
});

test('returns no chunks for a PDF with no extractable text', () => {
  assert.deepEqual(retrieveRelevantChunks('', 'What is in the book?'), []);
});
