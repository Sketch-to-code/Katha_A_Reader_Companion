const { CoverFactory } = require('./factories/CoverFactory');
const progressBus = require('./events/readingProgressEmitter');
const supabase = require('./supabaseService');
const { sendActivityEmail } = require('./emailService');
const documentRagService = require('./documentRagService');

async function listLibrary(userId) {
  const rows = await supabase.select(
    'documents',
    `${supabase.eq('user_id', userId)}&order=created_at.desc`
  );
  return rows.map(mapDocumentFromSupabase).map(withPresentationFields);
}

async function createDocument(userId, { title, author, fileUrl, storagePath, pageCount }) {
  if (!storagePath || !storagePath.startsWith(`${userId}/`) || fileUrl !== storagePath) {
    const err = new Error('The uploaded PDF does not belong to this account.');
    err.status = 400;
    throw err;
  }
  const pdfMetadata = await documentRagService.getPdfMetadata(storagePath);
  const row = await supabase.insert('documents', {
    user_id: userId,
    title: title.trim(),
    author: author || 'Unknown author',
    file_url: storagePath,
    storage_path: storagePath,
    page_count: pdfMetadata.pageCount || pageCount || 1,
    last_page_read: 0,
    last_opened_at: null,
    cover_color: pickCoverColor(title),
  });
  return withPresentationFields(mapDocumentFromSupabase(row));
}

function withPresentationFields(doc) {
  return {
    ...doc,
    cover: CoverFactory.create({
      hasNativeCover: doc.hasNativeCover,
      existingCoverUrl: doc.coverUrl,
      title: doc.title,
      author: doc.author,
    }),
    progressPct: doc.pageCount ? Math.round((doc.lastPageRead / doc.pageCount) * 100) : 0,
  };
}

async function getMostRecent(userId) {
  const docs = await listLibrary(userId);
  return docs
    .filter((document) => document.lastOpenedAt)
    .sort((a, b) => new Date(b.lastOpenedAt) - new Date(a.lastOpenedAt))[0] || null;
}

async function updateProgress(userId, documentId, page) {
  const [document] = await supabase.select(
    'documents',
    `${supabase.eq('id', documentId)}&${supabase.eq('user_id', userId)}&select=id,page_count`
  );
  if (!document) return null;
  if (page > document.page_count) {
    const err = new Error('page cannot exceed the document page count.');
    err.status = 400;
    throw err;
  }

  const row = await supabase.update('documents', documentId, {
    last_page_read: page,
    last_opened_at: new Date().toISOString(),
  }, userId);
  if (!row) return null;
  progressBus.emit('progress:update', { userId, documentId, page });
  return withPresentationFields(mapDocumentFromSupabase(row));
}

async function getDocumentFileUrl(userId, documentId) {
  const [row] = await supabase.select(
    'documents',
    `${supabase.eq('id', documentId)}&${supabase.eq('user_id', userId)}&select=storage_path`
  );
  if (!row?.storage_path) return null;
  return supabase.createSignedDownloadUrl(row.storage_path);
}

async function deleteDocument(userId, documentId) {
  const [document] = await supabase.select(
    'documents',
    `${supabase.eq('id', documentId)}&${supabase.eq('user_id', userId)}&select=id,user_id,file_url,storage_path`
  );
  if (!document) return false;

  const storagePath = document.storage_path;
  if (
    typeof storagePath !== 'string' ||
    !storagePath.startsWith(`${userId}/`) ||
    document.file_url !== storagePath
  ) {
    const err = new Error('The document storage path is invalid; no data was deleted.');
    err.status = 409;
    throw err;
  }

  const contents = await supabase.downloadPdf(storagePath);
  try {
    await supabase.deletePdf(storagePath);
  } catch (deleteError) {
    try {
      await supabase.restorePdf(storagePath, contents);
    } catch (restoreError) {
      const err = new Error(
        `PDF deletion failed (${deleteError.message}), and its original copy could not be restored (${restoreError.message}).`
      );
      err.status = 500;
      throw err;
    }
    throw deleteError;
  }

  let deleted;
  try {
    deleted = await supabase.deleteOwnedDocument(documentId, userId);
  } catch (deleteError) {
    try {
      await supabase.restorePdf(storagePath, contents);
    } catch (restoreError) {
      const err = new Error(
        `Document deletion failed (${deleteError.message}), and its PDF could not be restored (${restoreError.message}).`
      );
      err.status = 500;
      throw err;
    }
    throw deleteError;
  }

  if (!deleted) {
    const [stillExists] = await supabase.select(
      'documents',
      `${supabase.eq('id', documentId)}&${supabase.eq('user_id', userId)}&select=id`
    );
    if (!stillExists) return false;
    try {
      await supabase.restorePdf(storagePath, contents);
    } catch (restoreError) {
      const err = new Error(
        `The document was not deleted and its PDF could not be restored (${restoreError.message}).`
      );
      err.status = 500;
      throw err;
    }
    return false;
  }

  documentRagService.clearPdfCache(storagePath);
  return true;
}

async function createUploadUrl(userId, { fileName }) {
  const safeName = fileName.replace(/[^a-z0-9_.-]/gi, '-').toLowerCase();
  const storagePath = `${userId}/${Date.now()}-${safeName}`;
  return supabase.createSignedUploadUrl(storagePath);
}

async function completeStudySession(userId, email, documentId, durationMinutes) {
  const [document] = await supabase.select(
    'documents',
    `${supabase.eq('id', documentId)}&${supabase.eq('user_id', userId)}&select=title`
  );
  if (!document) return false;
  await sendActivityEmail(
    email,
    'Katha study session completed',
    `You completed a ${durationMinutes}-minute study session with "${document.title}".`
  );
  return true;
}

function mapDocumentFromSupabase(row) {
  return {
    _id: row.id,
    userId: row.user_id,
    title: row.title,
    author: row.author,
    fileUrl: row.file_url,
    storagePath: row.storage_path,
    pageCount: row.page_count || 1,
    hasNativeCover: row.has_native_cover || false,
    coverUrl: row.cover_url,
    coverColor: row.cover_color || pickCoverColor(row.title),
    lastPageRead: row.last_page_read || 0,
    lastOpenedAt: row.last_opened_at,
    createdAt: row.created_at,
  };
}

function pickCoverColor(seed = '') {
  const colors = ['#7a2e2e', '#8a6d2f', '#465a48', '#5c4a72', '#7b5130'];
  const index = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

module.exports = {
  listLibrary,
  createDocument,
  getMostRecent,
  updateProgress,
  getDocumentFileUrl,
  deleteDocument,
  createUploadUrl,
  completeStudySession,
};
