const test = require('node:test');
const assert = require('node:assert/strict');
const supabase = require('../services/supabaseService');
const documentRagService = require('../services/documentRagService');
const documentService = require('../services/documentService');

const userId = 'user-123';
const documentId = 'document-456';
const storagePath = `${userId}/stored-book.pdf`;

function replace(object, replacements) {
  const originals = Object.fromEntries(
    Object.keys(replacements).map((key) => [key, object[key]])
  );
  Object.assign(object, replacements);
  return () => Object.assign(object, originals);
}

function ownedDocument() {
  return {
    id: documentId,
    user_id: userId,
    file_url: storagePath,
    storage_path: storagePath,
  };
}

test('deletes only the authenticated owner document and its Katha storage object', async (t) => {
  const operations = [];
  const restoreSupabase = replace(supabase, {
    select: async (_table, query) => {
      assert.match(query, /user_id=eq\.user-123/);
      return [ownedDocument()];
    },
    downloadPdf: async (path) => {
      operations.push(`download:${path}`);
      return Buffer.from('pdf');
    },
    deletePdf: async (path) => operations.push(`delete-storage:${path}`),
    deleteOwnedDocument: async (id, owner) => {
      operations.push(`delete-record:${id}:${owner}`);
      return true;
    },
    restorePdf: async () => assert.fail('Unexpected storage restoration.'),
  });
  const restoreCache = replace(documentRagService, {
    clearPdfCache: (path) => operations.push(`clear-cache:${path}`),
  });
  t.after(() => {
    restoreSupabase();
    restoreCache();
  });

  assert.equal(await documentService.deleteDocument(userId, documentId), true);
  assert.deepEqual(operations, [
    `download:${storagePath}`,
    `delete-storage:${storagePath}`,
    `delete-record:${documentId}:${userId}`,
    `clear-cache:${storagePath}`,
  ]);
});

test('does not access storage or delete a record that the user does not own', async (t) => {
  let storageAccessed = false;
  const restoreSupabase = replace(supabase, {
    select: async (_table, query) => {
      assert.match(query, /user_id=eq\.user-123/);
      return [];
    },
    downloadPdf: async () => {
      storageAccessed = true;
      throw new Error('Must not access another user storage.');
    },
    deletePdf: async () => {
      storageAccessed = true;
    },
    deleteOwnedDocument: async () => {
      storageAccessed = true;
    },
  });
  t.after(restoreSupabase);

  assert.equal(await documentService.deleteDocument(userId, documentId), false);
  assert.equal(storageAccessed, false);
});

test('restores the stored PDF and reports failure when storage deletion fails', async (t) => {
  const operations = [];
  const restoreSupabase = replace(supabase, {
    select: async () => [ownedDocument()],
    downloadPdf: async () => Buffer.from('original-pdf'),
    deletePdf: async () => {
      operations.push('delete');
      throw new Error('storage unavailable');
    },
    restorePdf: async (_path, contents) => {
      operations.push(`restore:${contents.toString()}`);
    },
    deleteOwnedDocument: async () => {
      operations.push('delete-record');
      return true;
    },
  });
  t.after(restoreSupabase);

  await assert.rejects(documentService.deleteDocument(userId, documentId), /storage unavailable/);
  assert.deepEqual(operations, ['delete', 'restore:original-pdf']);
});

test('reports a failed deletion if the stored PDF cannot be restored', async (t) => {
  const restoreSupabase = replace(supabase, {
    select: async () => [ownedDocument()],
    downloadPdf: async () => Buffer.from('original-pdf'),
    deletePdf: async () => {
      throw new Error('storage unavailable');
    },
    restorePdf: async () => {
      throw new Error('restore unavailable');
    },
    deleteOwnedDocument: async () => assert.fail('Record must not be deleted.'),
  });
  t.after(restoreSupabase);

  await assert.rejects(documentService.deleteDocument(userId, documentId), {
    status: 500,
    message: /could not be restored/,
  });
});
