const documentService = require('../services/documentService');
const SoundscapeFactory = require('../services/factories/SoundscapeFactory');

async function getLibrary(req, res, next) {
  try {
    const docs = await documentService.listLibrary(req.user.sub);
    const resume = await documentService.getMostRecent(req.user.sub);
    res.json({ documents: docs, resume });
  } catch (err) {
    next(err);
  }
}

async function updateProgress(req, res, next) {
  try {
    const { page } = req.body;
    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({ error: 'page must be a positive integer.' });
    }
    const updated = await documentService.updateProgress(req.user.sub, req.params.id, page);
    if (!updated) return res.status(404).json({ error: 'Document not found.' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function createUploadUrl(req, res, next) {
  try {
    const { fileName, contentType, size } = req.body;
    if (
      typeof fileName !== 'string' ||
      !fileName.toLowerCase().endsWith('.pdf') ||
      contentType !== 'application/pdf' ||
      !Number.isFinite(size) ||
      size <= 0 ||
      size > 50 * 1024 * 1024
    ) {
      return res.status(400).json({ error: 'Choose a PDF file smaller than 50 MB.' });
    }
    res.json(await documentService.createUploadUrl(req.user.sub, { fileName }));
  } catch (err) {
    next(err);
  }
}

async function getFileUrl(req, res, next) {
  try {
    const fileUrl = await documentService.getDocumentFileUrl(req.user.sub, req.params.id);
    if (!fileUrl) return res.status(404).json({ error: 'Document not found.' });
    res.json({ fileUrl });
  } catch (err) {
    next(err);
  }
}

async function completeStudySession(req, res, next) {
  try {
    const { durationMinutes } = req.body;
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 1440) {
      return res.status(400).json({ error: 'durationMinutes must be between 1 and 1440.' });
    }
    const completed = await documentService.completeStudySession(
      req.user.sub,
      req.user.email,
      req.params.id,
      durationMinutes
    );
    if (!completed) return res.status(404).json({ error: 'Document not found.' });
    res.json({ completed: true });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { title, author, fileUrl, storagePath, pageCount } = req.body;
    if (
      typeof title !== 'string' || !title.trim() || title.trim().length > 300 ||
      typeof fileUrl !== 'string' || !fileUrl ||
      typeof storagePath !== 'string' || !storagePath ||
      (author !== undefined && typeof author !== 'string')
    ) {
      return res.status(400).json({ error: 'A title, fileUrl, and storagePath are required.' });
    }
    const doc = await documentService.createDocument(req.user.sub, {
      title,
      author,
      fileUrl,
      storagePath,
      pageCount,
    });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const deleted = await documentService.deleteDocument(req.user.sub, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Document not found.' });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
}

function listSoundscapes(_req, res) {
  res.json({ soundscapes: SoundscapeFactory.list().map((key) => SoundscapeFactory.create(key)) });
}

module.exports = {
  getLibrary,
  create,
  remove,
  updateProgress,
  createUploadUrl,
  getFileUrl,
  completeStudySession,
  listSoundscapes,
};
