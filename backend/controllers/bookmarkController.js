const bookmarkService = require('../services/bookmarkService');

async function list(req, res, next) {
  try {
    const bookmarks = await bookmarkService.listBookmarks(req.user.sub, req.query.documentId);
    res.json({ bookmarks });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { documentId, page, thumbnailUrl } = req.body;
    if (typeof documentId !== 'string' || !documentId || !Number.isInteger(page) || page < 1) {
      return res.status(400).json({ error: 'documentId and a positive integer page number are required.' });
    }
    const bookmark = await bookmarkService.addBookmark(req.user.sub, { documentId, page, thumbnailUrl });
    res.status(201).json(bookmark);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const ok = await bookmarkService.removeBookmark(req.user.sub, req.params.id);
    if (!ok) return res.status(404).json({ error: 'Bookmark not found.' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, remove };
