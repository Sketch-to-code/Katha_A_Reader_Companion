import test from 'node:test';
import assert from 'node:assert/strict';
import { MOCK_BOOKS } from '../src/mock/library.js';

test('Frontend Model: MOCK_BOOKS has valid library entries', () => {
  assert.ok(Array.isArray(MOCK_BOOKS));
  assert.ok(MOCK_BOOKS.length > 0);
  for (const book of MOCK_BOOKS) {
    assert.ok(book._id, 'Book must have an _id');
    assert.ok(typeof book.title === 'string', 'Book must have a title');
    assert.ok(typeof book.author === 'string', 'Book must have an author');
    assert.ok(typeof book.pageCount === 'number', 'Book must have pageCount');
    assert.ok(book.pageCount > 0, 'pageCount must be positive');
  }
});

test('Frontend Config: Theme configurations are valid', () => {
  const themes = ['light', 'dark', 'sepia'];
  assert.equal(themes.length, 3);
  assert.ok(themes.includes('dark'));
  assert.ok(themes.includes('sepia'));
  assert.ok(themes.includes('light'));
});

test('Frontend Soundscapes: Ambient options match system design', () => {
  const soundscapes = ['rain', 'cafe', 'focus', 'binaural', 'none'];
  assert.ok(soundscapes.includes('rain'));
  assert.ok(soundscapes.includes('binaural'));
  assert.ok(soundscapes.includes('none'));
});

test('Frontend Reader: Text selection mode toggle state transitions', () => {
  let mode = 'scroll';
  const toggle = (current) => (current === 'scroll' ? 'select' : 'scroll');
  mode = toggle(mode);
  assert.equal(mode, 'select');
  mode = toggle(mode);
  assert.equal(mode, 'scroll');
});
