const EventEmitter = require('events');

// Observer pattern via Node's built-in EventEmitter, exported as a
// singleton. Whoever needs to react to a reading-position change (activity
// logging, a future "streak" service, analytics) subscribes here instead of
// bookmarkController/noteController reaching into their internals directly.
class ReadingProgressEmitter extends EventEmitter {}

module.exports = new ReadingProgressEmitter();

// Usage elsewhere:
//   const bus = require('./readingProgressEmitter');
//   bus.emit('progress:update', { userId, documentId, page });
//   bus.on('progress:update', (payload) => { ... });
