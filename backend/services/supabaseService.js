const db = require('../db/connection');

function isConfigured() {
  return db.isReady();
}

async function select(table, query = '') {
  const params = new URLSearchParams(query);
  const columns = params.get('select') || '*';
  let request = db.getClient().from(table).select(columns);

  for (const [column, expression] of params.entries()) {
    if (column === 'select' || column === 'order') continue;
    const separator = expression.indexOf('.');
    if (separator < 0) throw new Error(`Unsupported Supabase filter "${column}".`);
    const operator = expression.slice(0, separator);
    const value = expression.slice(separator + 1);
    if (operator === 'eq') request = request.eq(column, value);
    else if (operator === 'gt') request = request.gt(column, value);
    else throw new Error(`Unsupported Supabase filter operator "${operator}".`);
  }

  const order = params.get('order');
  if (order) {
    const [column, direction] = order.split('.');
    request = request.order(column, { ascending: direction !== 'desc' });
  }

  const { data, error } = await request;
  throwIfError(error, `select from ${table}`);
  return data || [];
}

async function insert(table, row) {
  const { data, error } = await db.getClient().from(table).insert(row).select('*').maybeSingle();
  throwIfError(error, `insert into ${table}`);
  return data;
}

async function upsert(table, row) {
  const { data, error } = await db.getClient()
    .from(table)
    .upsert(row, { onConflict: 'id' })
    .select('*')
    .maybeSingle();
  throwIfError(error, `upsert into ${table}`);
  return data;
}

async function update(table, id, patch, ownerId) {
  let request = db.getClient().from(table).update(patch).eq('id', id);
  if (ownerId) request = request.eq('user_id', ownerId);
  const { data, error } = await request.select('*').maybeSingle();
  throwIfError(error, `update ${table}`);
  return data;
}

async function remove(table, id, ownerId) {
  let request = db.getClient().from(table).delete().eq('id', id);
  if (ownerId) request = request.eq('user_id', ownerId);
  const { error } = await request;
  throwIfError(error, `delete from ${table}`);
  return true;
}

async function deleteOwnedDocument(id, ownerId) {
  const { data, error } = await db.getClient()
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('user_id', ownerId)
    .select('id')
    .maybeSingle();
  throwIfError(error, 'delete document');
  return Boolean(data);
}

async function incrementLoginAttempts(email, currentAttempts, nextAttempts) {
  const { data, error } = await db.getClient()
    .from('login_challenges')
    .update({ attempts: nextAttempts })
    .eq('id', email)
    .eq('attempts', currentAttempts)
    .select('id')
    .maybeSingle();
  throwIfError(error, 'increment login challenge attempts');
  return Boolean(data);
}

async function consumeLoginChallenge(email, codeHash) {
  const { data, error } = await db.getClient()
    .from('login_challenges')
    .delete()
    .eq('id', email)
    .eq('code_hash', codeHash)
    .gt('expires_at', new Date().toISOString())
    .select('*')
    .maybeSingle();
  throwIfError(error, 'consume login challenge');
  return data;
}

async function createSignedUploadUrl(path) {
  const { data, error } = await db.getClient()
    .storage
    .from(getBucketName())
    .createSignedUploadUrl(path, { upsert: false });
  throwIfError(error, 'create PDF upload URL');
  return { path: data.path || path, signedUrl: data.signedUrl };
}

async function createSignedDownloadUrl(path) {
  const { data, error } = await db.getClient()
    .storage
    .from(getBucketName())
    .createSignedUrl(path, 3600);
  throwIfError(error, 'create PDF download URL');
  return data.signedUrl;
}

async function downloadPdf(path) {
  const { data, error } = await db.getClient()
    .storage
    .from(getBucketName())
    .download(path);
  throwIfError(error, 'download PDF before deletion');
  return Buffer.from(await data.arrayBuffer());
}

async function deletePdf(path) {
  const { data, error } = await db.getClient()
    .storage
    .from(getBucketName())
    .remove([path]);
  throwIfError(error, 'delete PDF');
  if (!data?.some((file) => file.name === path)) {
    const err = new Error('Supabase delete PDF failed: Storage did not confirm removal of the requested object.');
    err.status = 502;
    throw err;
  }
}

async function restorePdf(path, contents) {
  const { error } = await db.getClient()
    .storage
    .from(getBucketName())
    .upload(path, contents, { contentType: 'application/pdf', upsert: true });
  throwIfError(error, 'restore PDF after failed document deletion');
}

function getBucketName() {
  return process.env.PDF_BUCKET || 'pdf-documents';
}

function throwIfError(error, operation) {
  if (!error) return;
  const details = [error.details, error.hint].filter(Boolean).join(' ');
  const err = new Error(
    `Supabase ${operation} failed: ${error.message}${details ? ` (${details})` : ''}`
  );
  err.status = Number(error.status) || 500;
  err.code = error.code;
  throw err;
}

function eq(column, value) {
  return `${column}=eq.${encodeURIComponent(value)}`;
}

module.exports = {
  isConfigured,
  select,
  insert,
  upsert,
  update,
  remove,
  deleteOwnedDocument,
  incrementLoginAttempts,
  consumeLoginChallenge,
  eq,
  createSignedUploadUrl,
  createSignedDownloadUrl,
  downloadPdf,
  deletePdf,
  restorePdf,
};
