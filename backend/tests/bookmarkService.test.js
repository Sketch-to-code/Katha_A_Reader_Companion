'use strict';
/**
 * Integration-style tests for bookmarkService using manual dependency mocking.
 * Only Supabase and the EventEmitter are replaced; the real service logic runs.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const supabase = require('../services/supabaseService');
const progressBus = require('../services/events/readingProgressEmitter');
const bookmarkService = require('../services/bookmarkService');

const USER_ID = 'user-bookmark-01';
const DOC_ID = 'doc-bookmark-01';

function replace(object, replacements) {
  const originals = Object.fromEntries(
    Object.keys(replacements).map((key) => [key, object[key]])
  );
  Object.assign(object, replacements);
  return () => Object.assign(object, originals);
}

// ── listBookmarks ─────────────────────────────────────────────────────────────
test('bookmarkService.listBookmarks returns mapped bookmarks for the user', async (t) => {
  const fakeRow = {
    id: 'bm-1',
    user_id: USER_ID,
    document_id: DOC_ID,
    page: 5,
    thumbnail_url: null,
    created_at: new Date().toISOString(),
  };
  const restore = replace(supabase, {
    select: async () => [fakeRow],
  });
  t.after(restore);

  const bookmarks = await bookmarkService.listBookmarks(USER_ID);
  assert.equal(bookmarks.length, 1);
  assert.equal(bookmarks[0]._id, 'bm-1');
  assert.equal(bookmarks[0].page, 5);
});

// ── addBookmark ───────────────────────────────────────────────────────────────
test('bookmarkService.addBookmark creates a bookmark and emits the event', async (t) => {
  const events = [];
  const restoreSupabase = replace(supabase, {
    select: async () => [{ id: DOC_ID, user_id: USER_ID, page_count: 100 }],
    insert: async (_table, row) => ({
      id: 'bm-new',
      user_id: row.user_id,
      document_id: row.document_id,
      page: row.page,
      thumbnail_url: null,
      created_at: new Date().toISOString(),
    }),
  });
  progressBus.once('bookmark:created', (p) => events.push(p));
  t.after(restoreSupabase);

  const bm = await bookmarkService.addBookmark(USER_ID, { documentId: DOC_ID, page: 10 });
  assert.equal(bm._id, 'bm-new');
  assert.equal(bm.page, 10);
  // Give the event loop a tick so the 'once' listener fires
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(events.length, 1);
  assert.equal(events[0].page, 10);
});

test('bookmarkService.addBookmark rejects a page that exceeds the document page count', async (t) => {
  const restore = replace(supabase, {
    select: async () => [{ id: DOC_ID, user_id: USER_ID, page_count: 10 }],
  });
  t.after(restore);

  await assert.rejects(
    () => bookmarkService.addBookmark(USER_ID, { documentId: DOC_ID, page: 99 }),
    { status: 400 }
  );
});

test('bookmarkService.addBookmark throws 404 when the document is not owned by the user', async (t) => {
  const restore = replace(supabase, {
    select: async () => [],
  });
  t.after(restore);

  await assert.rejects(
    () => bookmarkService.addBookmark(USER_ID, { documentId: 'other-doc', page: 1 }),
    { status: 404 }
  );
});

// ── removeBookmark ────────────────────────────────────────────────────────────
test('bookmarkService.removeBookmark returns true when the bookmark exists and belongs to the user', async (t) => {
  const restore = replace(supabase, {
    select: async () => [{ id: 'bm-del' }],
    remove: async () => true,
  });
  t.after(restore);

  const result = await bookmarkService.removeBookmark(USER_ID, 'bm-del');
  assert.equal(result, true);
});

test('bookmarkService.removeBookmark returns false when the bookmark does not exist', async (t) => {
  const restore = replace(supabase, {
    select: async () => [],
  });
  t.after(restore);

  const result = await bookmarkService.removeBookmark(USER_ID, 'ghost-bm');
  assert.equal(result, false);
});

