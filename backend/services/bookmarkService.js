const progressBus = require('./events/readingProgressEmitter');
const supabase = require('./supabaseService');

async function listBookmarks(userId, documentId) {
  const filters = [supabase.eq('user_id', userId)];
  if (documentId) filters.push(supabase.eq('document_id', documentId));
  const rows = await supabase.select('bookmarks', `${filters.join('&')}&order=created_at.desc`);
  return rows.map(mapBookmarkFromSupabase);
}

async function addBookmark(userId, { documentId, page, thumbnailUrl }) {
  const [document] = await supabase.select(
    'documents',
    `${supabase.eq('id', documentId)}&${supabase.eq('user_id', userId)}&select=id,page_count`
  );
  if (!document) {
    const err = new Error('Document not found.');
    err.status = 404;
    throw err;
  }
  if (page > document.page_count) {
    const err = new Error('page cannot exceed the document page count.');
    err.status = 400;
    throw err;
  }

  const row = await supabase.insert('bookmarks', {
    user_id: userId,
    document_id: documentId,
    page,
    thumbnail_url: thumbnailUrl || null,
  });
  progressBus.emit('bookmark:created', { userId, documentId, page });
  return mapBookmarkFromSupabase(row);
}

async function removeBookmark(userId, id) {
  const rows = await supabase.select(
    'bookmarks',
    `${supabase.eq('id', id)}&${supabase.eq('user_id', userId)}&select=id`
  );
  if (!rows.length) return false;
  await supabase.remove('bookmarks', id, userId);
  return true;
}

function mapBookmarkFromSupabase(row) {
  return {
    _id: row.id,
    userId: row.user_id,
    documentId: row.document_id,
    page: row.page,
    thumbnailUrl: row.thumbnail_url,
    createdAt: row.created_at,
  };
}

module.exports = { listBookmarks, addBookmark, removeBookmark };
