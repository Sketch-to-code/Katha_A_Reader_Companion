'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const EventEmitter = require('events');
const progressBus = require('../services/events/readingProgressEmitter');

test('readingProgressEmitter is an EventEmitter singleton', () => {
  assert.ok(progressBus instanceof EventEmitter);
  // Requiring again must return the same object (singleton)
  const second = require('../services/events/readingProgressEmitter');
  assert.strictEqual(progressBus, second);
});

test('readingProgressEmitter delivers progress:update event with correct payload', (t, done) => {
  const payload = { userId: 'u-1', documentId: 'd-1', page: 7 };
  progressBus.once('progress:update', (received) => {
    try {
      assert.deepEqual(received, payload);
      done();
    } catch (err) {
      done(err);
    }
  });
  progressBus.emit('progress:update', payload);
});

test('readingProgressEmitter delivers bookmark:created event with correct payload', (t, done) => {
  const payload = { userId: 'u-2', documentId: 'd-2', page: 12 };
  progressBus.once('bookmark:created', (received) => {
    try {
      assert.deepEqual(received, payload);
      done();
    } catch (err) {
      done(err);
    }
  });
  progressBus.emit('bookmark:created', payload);
});

test('readingProgressEmitter supports multiple listeners on the same event', (t, done) => {
  let count = 0;
  const onUpdate = () => {
    count++;
    if (count === 2) done();
  };
  progressBus.once('multi:test', onUpdate);
  progressBus.once('multi:test', onUpdate);
  progressBus.emit('multi:test');
});

