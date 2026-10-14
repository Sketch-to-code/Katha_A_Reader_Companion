const express = require('express');
const { requireAuth } = require('../middleware/auth');
const documentController = require('../controllers/documentController');

const router = express.Router();

router.use(requireAuth);
router.get('/', documentController.getLibrary);
router.post('/upload-url', documentController.createUploadUrl);
router.post('/', documentController.create);
router.delete('/:id', documentController.remove);
router.get('/soundscapes', documentController.listSoundscapes);
router.post('/:id/complete-session', documentController.completeStudySession);
router.get('/:id/file-url', documentController.getFileUrl);
router.patch('/:id/progress', documentController.updateProgress);

module.exports = router;
