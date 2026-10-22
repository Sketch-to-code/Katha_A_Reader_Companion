const noteService = require('../services/noteService');

async function list(req, res, next) {
  try {
    const notes = await noteService.listNotes(req.user.sub, req.query.documentId);
    res.json({ notes });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { documentId, page, highlightedText, body } = req.body;
    if (
      typeof documentId !== 'string' ||
      !documentId ||
      !Number.isInteger(page) ||
      page < 1 ||
      typeof body !== 'string' ||
      !body.trim() ||
      body.length > 5000
    ) {
      return res.status(400).json({ error: 'documentId, a positive page number, and a note up to 5000 characters are required.' });
    }
    const note = await noteService.addNote(req.user.sub, {
      documentId,
      page,
      highlightedText,
      body: body.trim(),
      userEmail: req.user.email,
    });
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'A note update object is required.' });
    }
    const updated = await noteService.updateNote(req.user.sub, req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Note not found.' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const ok = await noteService.removeNote(req.user.sub, req.params.id);
    if (!ok) return res.status(404).json({ error: 'Note not found.' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };
