'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const SoundscapeFactory = require('../services/factories/SoundscapeFactory');

test('SoundscapeFactory.create returns a track object with label, url, and loopSec', () => {
  for (const theme of ['rain', 'ocean', 'forest', 'lofi']) {
    const track = SoundscapeFactory.create(theme);
    assert.ok(track, `Expected a track for theme "${theme}"`);
    assert.ok(typeof track.label === 'string' && track.label.length > 0, `Label missing for "${theme}"`);
    assert.ok(typeof track.loopSec === 'number', `loopSec missing for "${theme}"`);
    assert.ok(track.loopSec > 0, `loopSec should be positive for "${theme}"`);
    assert.ok(typeof track.url === 'string', `url missing for "${theme}"`);
  }
});

test('SoundscapeFactory.create returns the "none" track for the none theme', () => {
  const track = SoundscapeFactory.create('none');
  assert.equal(track.url, null);
  assert.equal(track.loopSec, 0);
});

test('SoundscapeFactory.create falls back to the "none" track for an unknown theme', () => {
  const unknown = SoundscapeFactory.create('thunderstorm_99');
  const none = SoundscapeFactory.create('none');
  assert.deepEqual(unknown, none);
});

test('SoundscapeFactory.list returns an array that includes "none"', () => {
  const themes = SoundscapeFactory.list();
  assert.ok(Array.isArray(themes));
  assert.ok(themes.includes('none'));
  assert.ok(themes.length >= 2, 'Expected at least two themes (one soundscape + none)');
});

