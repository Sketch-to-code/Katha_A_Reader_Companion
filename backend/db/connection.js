
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

let supabase = null;

async function connect() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.PDF_BUCKET || 'pdf-documents';

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend .env'
    );
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('Set JWT_SECRET in backend .env to a random value of at least 32 characters.');
  }

  const client = supabase || createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  await validateSchema(client);
  await validateBucket(client, bucket);
  supabase = client;
  return client;
}

async function validateSchema(client) {
  const requirements = {
    users: 'id,username,email,password_hash,email_verified,created_at,updated_at',
    documents: 'id,user_id,title,author,file_url,storage_path,page_count,has_native_cover,cover_url,cover_color,last_page_read,last_opened_at,created_at',
    notes: 'id,user_id,document_id,page,highlighted_text,body,created_at',
    bookmarks: 'id,user_id,document_id,page,thumbnail_url,created_at',
    login_challenges: 'id,email,name,code_hash,expires_at,attempts,created_at',
  };

  for (const [table, columns] of Object.entries(requirements)) {
    const { error } = await client.from(table).select(columns).limit(0);
    if (error) {
      throw new Error(
        `Supabase schema check failed for public.${table}: ${error.message}. ` +
        `Ensure the table has the required Katha columns; no existing table or data was modified.`
      );
    }
  }
}

async function validateBucket(client, bucketName) {
  const { data: bucket, error } = await client.storage.getBucket(bucketName);
  if (error) {
    throw new Error(`Supabase Storage bucket "${bucketName}" is unavailable: ${error.message}`);
  }
  if (!bucket || bucket.public) {
    throw new Error(`Supabase Storage bucket "${bucketName}" must exist and be private.`);
  }
  if (Number(bucket.file_size_limit) !== 50 * 1024 * 1024) {
    throw new Error(`Supabase Storage bucket "${bucketName}" must have a 50 MiB file size limit.`);
  }
  if (
    !Array.isArray(bucket.allowed_mime_types) ||
    bucket.allowed_mime_types.length !== 1 ||
    bucket.allowed_mime_types[0] !== 'application/pdf'
  ) {
    throw new Error(`Supabase Storage bucket "${bucketName}" must allow only application/pdf.`);
  }
}

function getClient() {
  if (!supabase) {
    throw new Error('Supabase is not initialized. Call connect() first.');
  }

  return supabase;
}

module.exports = {
  connect,
  getClient,
  isReady: () => supabase !== null,
};
