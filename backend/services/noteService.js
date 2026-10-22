const supabase = require('./supabaseService');
const { sendActivityEmail } = require('./emailService');

async function listNotes(userId, documentId) {
  const filters = [supabase.eq('user_id', userId)];
  if (documentId) filters.push(supabase.eq('document_id', documentId));
  const rows = await supabase.select('notes', `${filters.join('&')}&order=created_at.desc`);
  return rows.map(mapNoteFromSupabase);
}

async function addNote(userId, { documentId, page, highlightedText, body, userEmail }) {
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

  const row = await supabase.insert('notes', {
    user_id: userId,
    document_id: documentId,
    page,
    highlighted_text: highlightedText || null,
    body,
  });
  const note = mapNoteFromSupabase(row);

  try {
    await sendActivityEmail(userEmail, 'Katha note saved', `You saved a new note on page ${page}: ${body}`);
  } catch (err) {
    console.warn('[Katha Note Email Notice] Could not send note email:', err.message);
  }
  return note;
}

async function updateNote(userId, id, patch) {
  const [existing] = await supabase.select(
    'notes',
    `${supabase.eq('id', id)}&${supabase.eq('user_id', userId)}&select=document_id`
  );
  if (!existing) return null;
  const mapped = mapNoteToSupabase(patch);
  if (!Object.keys(mapped).length) {
    const err = new Error('Provide a page, highlightedText, or body to update.');
    err.status = 400;
    throw err;
  }
  if (mapped.page) {
    const [document] = await supabase.select(
      'documents',
      `${supabase.eq('id', existing.document_id)}&${supabase.eq('user_id', userId)}&select=page_count`
    );
    if (!document || mapped.page > document.page_count) {
      const err = new Error('page cannot exceed the document page count.');
      err.status = 400;
      throw err;
    }
  }
  const row = await supabase.update('notes', id, mapped, userId);
  return row ? mapNoteFromSupabase(row) : null;
}

async function removeNote(userId, id) {
  const rows = await supabase.select(
    'notes',
    `${supabase.eq('id', id)}&${supabase.eq('user_id', userId)}&select=id`
  );
  if (!rows.length) return false;
  await supabase.remove('notes', id, userId);
  return true;
}

function mapNoteFromSupabase(row) {
  return {
    _id: row.id,
    userId: row.user_id,
    documentId: row.document_id,
    page: row.page,
    highlightedText: row.highlighted_text,
    body: row.body,
    createdAt: row.created_at,
  };
}

function mapNoteToSupabase(patch) {
  const mapped = {};
  if ('page' in patch) {
    if (!Number.isInteger(patch.page) || patch.page < 1) {
      const err = new Error('page must be a positive integer.');
      err.status = 400;
      throw err;
    }
    mapped.page = patch.page;
  }
  if ('highlightedText' in patch) {
    if (patch.highlightedText !== null && typeof patch.highlightedText !== 'string') {
      const err = new Error('highlightedText must be a string or null.');
      err.status = 400;
      throw err;
    }
    mapped.highlighted_text = patch.highlightedText;
  }
  if ('body' in patch) {
    if (typeof patch.body !== 'string' || !patch.body.trim() || patch.body.length > 5000) {
      const err = new Error('body must contain between 1 and 5000 characters.');
      err.status = 400;
      throw err;
    }
    mapped.body = patch.body.trim();
  }
  return mapped;
}

module.exports = { listNotes, addNote, updateNote, removeNote };
