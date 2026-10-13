const pdfParse = require('pdf-parse');
const supabase = require('./supabaseService');
const academicMode = require('./AcademicModeFacade');

const textCache = new Map();
const CACHE_LIMIT = 5;
const MAX_CACHED_TEXT_LENGTH = 1_500_000;

async function answerQuestion(userId, documentId, question) {
  const [document] = await supabase.select(
    'documents',
    `${supabase.eq('id', documentId)}&${supabase.eq('user_id', userId)}&select=id,title,storage_path`
  );
  if (!document) {
    const err = new Error('Document not found.');
    err.status = 404;
    throw err;
  }

  const { text } = await getParsedPdf(document.storage_path);
  const chunks = retrieveRelevantChunks(text, question);
  if (!chunks.length) {
    const err = new Error('No readable text was found in this PDF.');
    err.status = 422;
    throw err;
  }

  const answer = await academicMode.assist(
    `Book: ${document.title}\n\nRetrieved passages:\n${chunks.join('\n\n---\n\n')}`,
    'ask',
    question
  );
  return { ...answer, documentTitle: document.title };
}

async function getPdfMetadata(storagePath) {
  const { pageCount } = await getParsedPdf(storagePath);
  return { pageCount };
}

function clearPdfCache(storagePath) {
  textCache.delete(storagePath);
}

async function getParsedPdf(storagePath) {
  if (textCache.has(storagePath)) {
    const cached = textCache.get(storagePath);
    textCache.delete(storagePath);
    textCache.set(storagePath, cached);
    return cached;
  }

  const signedUrl = await supabase.createSignedDownloadUrl(storagePath);
  const response = await fetch(signedUrl);
  if (!response.ok) {
    const err = new Error(`Could not retrieve the PDF for text search: ${response.statusText}`);
    err.status = response.status;
    throw err;
  }
  const parsed = await pdfParse(Buffer.from(await response.arrayBuffer()));
  const result = {
    text: parsed.text.replace(/\s+/g, ' ').trim(),
    pageCount: parsed.numpages || 1,
  };
  if (result.text.length <= MAX_CACHED_TEXT_LENGTH) {
    textCache.set(storagePath, result);
    if (textCache.size > CACHE_LIMIT) textCache.delete(textCache.keys().next().value);
  }
  return result;
}

function retrieveRelevantChunks(text, question) {
  if (!text) return [];
  const chunks = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = '';
  for (const sentence of sentences) {
    if (current && current.length + sentence.length > 1200) {
      chunks.push(current);
      current = '';
    }
    current += `${current ? ' ' : ''}${sentence}`;
  }
  if (current) chunks.push(current);

  const terms = [...new Set(question.toLowerCase().match(/[a-z0-9]{3,}/g) || [])];
  const ranked = chunks
    .map((chunk, index) => ({
      chunk,
      index,
      score: terms.reduce(
        (score, term) => score + (chunk.toLowerCase().match(new RegExp(`\\b${escapeRegExp(term)}\\b`, 'g')) || []).length,
        0
      ),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 4)
    .sort((a, b) => a.index - b.index);
  return ranked.map(({ chunk }) => chunk);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { answerQuestion, retrieveRelevantChunks, getPdfMetadata, clearPdfCache };
