const academicMode = require('../services/AcademicModeFacade');
const documentRagService = require('../services/documentRagService');
const { sendActivityEmail } = require('../services/emailService');

async function assist(req, res, next) {
  try {
    const { text, mode, question, targetLanguage } = req.body;
    if (typeof text !== 'string' || !text.trim() || typeof mode !== 'string') {
      return res.status(400).json({
        error: 'A non-empty text value and an AI assist mode are required.',
      });
    }
    if (mode === 'translate' && !academicMode.supportedTranslationLanguages.includes(targetLanguage)) {
      return res.status(400).json({
        error: `Choose a supported target language: ${academicMode.supportedTranslationLanguages.join(', ')}.`,
      });
    }
    const result = await academicMode.assist(text, mode, question, targetLanguage);
    let notificationError;
    if (mode === 'summarize') {
      try {
        await sendActivityEmail(
          req.user.email,
          'Katha summary completed',
          'Your academic PDF summary is ready in Katha.'
        );
      } catch (err) {
        notificationError = err.message;
      }
    }
    res.json({ ...result, notificationError });
  } catch (err) {
    err.status = err.status || 400;
    next(err);
  }
}

async function documentChat(req, res, next) {
  try {
    const { documentId, question } = req.body;
    if (typeof documentId !== 'string' || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'documentId and a non-empty question are required.' });
    }
    const result = await documentRagService.answerQuestion(req.user.sub, documentId, question.trim());
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { assist, documentChat };
