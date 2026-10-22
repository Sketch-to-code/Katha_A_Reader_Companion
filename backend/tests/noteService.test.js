'use strict';
/**
 * Integration-style tests for noteService using manual dependency mocking.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const supabase = require('../services/supabaseService');
const noteService = require('../services/noteService');

const USER_ID = 'user-note-01';
const DOC_ID = 'doc-note-01';

function replace(object, replacements) {
  const originals = Object.fromEntries(
    Object.keys(replacements).map((key) => [key, object[key]])
  );
  Object.assign(object, replacements);
  return () => Object.assign(object, originals);
}

function fakeNoteRow(overrides = {}) {
  return {
    id: 'note-1',
    user_id: USER_ID,
    document_id: DOC_ID,
    page: 3,
    highlighted_text: 'selected text',
    body: 'My note body',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ── listNotes ─────────────────────────────────────────────────────────────────
test('noteService.listNotes returns mapped notes for the user', async (t) => {
  const restore = replace(supabase, {
    select: async () => [fakeNoteRow()],
  });
  t.after(restore);

  const notes = await noteService.listNotes(USER_ID);
  assert.equal(notes.length, 1);
  assert.equal(notes[0]._id, 'note-1');
  assert.equal(notes[0].body, 'My note body');
  assert.equal(notes[0].highlightedText, 'selected text');
});

// ── addNote ───────────────────────────────────────────────────────────────────
test('noteService.addNote creates a note successfully', async (t) => {
  const restore = replace(supabase, {
    select: async (table) => {
      if (table === 'documents') return [{ id: DOC_ID, page_count: 100 }];
      return [];
    },
    insert: async (_table, row) => fakeNoteRow({ body: row.body }),
  });
  t.after(restore);

  const note = await noteService.addNote(USER_ID, {
    documentId: DOC_ID,
    page: 3,
    highlightedText: 'selected text',
    body: 'My note body',
    userEmail: 'user@test.com',
  });
  assert.equal(note.body, 'My note body');
});

test('noteService.addNote rejects a page exceeding document page count', async (t) => {
  const restore = replace(supabase, {
    select: async () => [{ id: DOC_ID, page_count: 5 }],
  });
  t.after(restore);

  await assert.rejects(
    () => noteService.addNote(USER_ID, { documentId: DOC_ID, page: 99, body: 'x', userEmail: 'u@t.com' }),
    { status: 400 }
  );
});

test('noteService.addNote throws 404 when document is not found', async (t) => {
  const restore = replace(supabase, {
    select: async () => [],
  });
  t.after(restore);

  await assert.rejects(
    () => noteService.addNote(USER_ID, { documentId: 'ghost-doc', page: 1, body: 'hello', userEmail: 'u@t.com' }),
    { status: 404 }
  );
});

// ── updateNote ────────────────────────────────────────────────────────────────
test('noteService.updateNote returns updated note on success', async (t) => {
  const restore = replace(supabase, {
    select: async () => [{ document_id: DOC_ID }],
    update: async () => fakeNoteRow({ body: 'Updated body' }),
  });
  t.after(restore);

  const result = await noteService.updateNote(USER_ID, 'note-1', { body: 'Updated body' });
  assert.equal(result.body, 'Updated body');
});

test('noteService.updateNote returns null when the note does not exist', async (t) => {
  const restore = replace(supabase, {
    select: async () => [],
  });
  t.after(restore);

  const result = await noteService.updateNote(USER_ID, 'ghost-note', { body: 'x' });
  assert.equal(result, null);
});

test('noteService.updateNote rejects an empty patch', async (t) => {
  const restore = replace(supabase, {
    select: async () => [{ document_id: DOC_ID }],
  });
  t.after(restore);

  await assert.rejects(
    () => noteService.updateNote(USER_ID, 'note-1', {}),
    { status: 400 }
  );
});

test('noteService.updateNote rejects a non-positive page number', async (t) => {
  const restore = replace(supabase, {
    select: async () => [{ document_id: DOC_ID }],
  });
  t.after(restore);

  await assert.rejects(
    () => noteService.updateNote(USER_ID, 'note-1', { page: 0 }),
    { status: 400 }
  );
});

// ── removeNote ────────────────────────────────────────────────────────────────
test('noteService.removeNote returns true for an owned note', async (t) => {
  const restore = replace(supabase, {
    select: async () => [{ id: 'note-1' }],
    remove: async () => true,
  });
  t.after(restore);

  const result = await noteService.removeNote(USER_ID, 'note-1');
  assert.equal(result, true);
});

test('noteService.removeNote returns false when the note is not found', async (t) => {
  const restore = replace(supabase, {
    select: async () => [],
  });
  t.after(restore);

  const result = await noteService.removeNote(USER_ID, 'ghost-note');
  assert.equal(result, false);
});
